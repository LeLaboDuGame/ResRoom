"""REST API for the RoomIO room-reservation application.

Provides endpoints for managing rooms, reservations, settings, and room
photos.  All persistent data is delegated to the :mod:`db` module.
"""

import os

from azure.identity import ClientSecretCredential
from fastapi import FastAPI, HTTPException, UploadFile, File
import logging
from datetime import datetime, timedelta
from uuid import uuid4

from msgraph import GraphServiceClient
from msgraph.generated.users.item.events.events_request_builder import EventsRequestBuilder
from msgraph.generated.models.event import Event
from msgraph.generated.models.date_time_time_zone import DateTimeTimeZone
from kiota_abstractions.base_request_configuration import RequestConfiguration
from pydantic import BaseModel
from rich import status

from config import Config
import dotenv
import asyncio

# ---- LOG ----
LOG_FILE: str = 'log.txt'

# ---- Config ----
CONFIG_FILE: str = 'config.json'
DATE_FORMAT: str = '%Y-%m-%d %H:%M'

dotenv.load_dotenv()
if os.getenv("ALLOW_ORIGINS"):
    ALLOW_ORIGINS = str(os.getenv("ALLOW_ORIGINS")).split(",")
else:
    raise Exception("No ALLOW_ORIGINS environment variable")

TENANT_ID: str = os.getenv("TENANT_ID")
CLIENT_ID: str = os.getenv("CLIENT_ID")
CLIENT_SECRET: str = os.getenv("CLIENT_SECRET")
USER_ID: str = os.getenv("USER_ID")

# Initialisation of MS Graph
credential = ClientSecretCredential(
    tenant_id=TENANT_ID,
    client_id=CLIENT_ID,
    client_secret=CLIENT_SECRET
)
client = GraphServiceClient(credentials=credential, scopes=['https://graph.microsoft.com/.default'])

# ---- GRAPH HELPERS ----
async def graph_get_users() -> list[dict]:
    """Fetch all users from Microsoft Graph."""
    users = await client.users.get()
    if not users or not users.value:
        return []
    return [
        {
            "id": user.id,
            "displayName": user.display_name,
            "mail": user.mail,
            "userPrincipalName": user.user_principal_name,
        }
        for user in users.value
    ]


async def graph_get_events_for_room(room_email: str) -> list[dict]:
    """Fetch calendar events for a room mailbox from Microsoft Graph."""
    query_params = EventsRequestBuilder.EventsRequestBuilderGetQueryParameters(
        select=["subject", "start", "end"],
    )
    request_configuration = RequestConfiguration(query_parameters=query_params)
    result = await client.users.by_user_id(room_email).events.get(
        request_configuration=request_configuration
    )
    if not result or not result.value:
        return []
    return [
        {
            "id": event.id,
            "subject": event.subject,
            "start": event.start.date_time if event.start else None,
            "end": event.end.date_time if event.end else None,
        }
        for event in result.value
    ]


async def graph_create_event_for_room(room_email: str, subject: str, start: str, end: str) -> str | None:
    """Create a calendar event on a room's mailbox. Returns the event ID."""
    event = Event(
        subject=subject,
        start=DateTimeTimeZone(date_time=start, time_zone="Europe/Paris"),
        end=DateTimeTimeZone(date_time=end, time_zone="Europe/Paris"),
    )
    try:
        result = await client.users.by_user_id(room_email).events.post(event)
        return result.id if result else None
    except Exception as e:
        logging.warning(f"Could not create Graph event on {room_email}: {e}")
        return None


async def graph_delete_event_for_room(room_email: str, event_id: str) -> bool:
    """Delete a calendar event from a room's mailbox."""
    try:
        await client.users.by_user_id(room_email).events.by_event_id(event_id).delete()
        return True
    except Exception as e:
        logging.warning(f"Could not delete Graph event {event_id} on {room_email}: {e}")
        return False



# Logging
logging.basicConfig(filename=LOG_FILE,
                    filemode='a',
                    format='%(asctime)s,%(msecs)03d %(name)s %(levelname)s %(message)s',
                    datefmt='%Y-%m-%d %H:%M:%S',
                    level=logging.DEBUG)

# Load the api framework
app = FastAPI()

# Allow the front end to communicate with the API
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOW_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- DATA BASE ----
config = Config(CONFIG_FILE)
config.load()  # Load Config


def get_settings() -> dict:
    """Return the current application settings from the Config."""
    return config.data.get("settings", {
        "dayStart": 8,
        "dayEnd": 20,
        "startingSoonBefore": 15,
        "finishingSoonBefore": 15,
    })


@app.get("/api")
def root() -> dict:
    """Return a simple welcome message for the API root.

    :return: A greeting message.
    """
    return {"msg": "Welcome to the api of RoomIO!"}


def get_room(room_name: str) -> dict | None:
    """Look up a room by its name.

    :param room_name: The name of the room to find.
    :return: The room dictionary if found, otherwise ``None``.
    """
    room_res: dict | None = None
    for room in config.data["rooms"]:
        if room["name"] == room_name:
            room_res = room

    return room_res


@app.get("/api/emails")
async def get_emails() -> dict:
    """Return the full list of email addresses from Microsoft Graph.

    :return: A dictionary containing the list of emails.
    """
    users = await graph_get_users()
    emails = [u["mail"] or u["userPrincipalName"] for u in users if u["mail"] or u["userPrincipalName"]]
    return {"emails": emails}


@app.get("/api/room/fetch/all")
async def get_all_rooms() -> dict:
    """Return all rooms with their calendar events from Microsoft Graph.

    :return: A dictionary containing the list of all rooms with events.
    """
    rooms = []
    for room in config.data["rooms"]:
        room_data = {**room, "reservations": []}
        if room.get("email"):
            try:
                events = await graph_get_events_for_room(room["email"])
                room_data["reservations"] = events
            except Exception as e:
                logging.warning(f"Could not fetch events for {room['name']}: {e}")
        rooms.append(room_data)
    return {"rooms": rooms}


@app.get("/api/room/fetch/name/{room_name}")
async def get_room_by_name(room_name: str) -> dict:
    """
    Fetch a room's information with its calendar events from Microsoft Graph.

    :param room_name: room name
    :return: Room information with events. If the room doesn't exist return an error message
    """
    room_res: dict | None = get_room(room_name)

    if not room_res:
        return {"error": "Room doesn't exist"}

    room_data = {**room_res, "reservations": []}
    if room_res.get("email"):
        try:
            events = await graph_get_events_for_room(room_res["email"])
            room_data["reservations"] = events
        except Exception as e:
            logging.warning(f"Could not fetch events for {room_name}: {e}")

    return {"room": room_data}


class Reservation(BaseModel):
    start: str
    end: str
    title: str
    reserved_by: str


class RoomUpdate(BaseModel):
    """Payload for updating a room's metadata."""
    name: str | None = None
    capacity: int | None = None
    tv: bool | None = None
    whiteboard: bool | None = None
    computer: bool | None = None


from fastapi import status


@app.post("/api/reservation/create/{room_name}", status_code=status.HTTP_201_CREATED)
async def create_a_reservation(room_name: str, reservation: Reservation) -> dict:
    """
    Create a reservation for a specific room and sync it to Outlook via Microsoft Graph.

    :param room_name: The name of the target room
    :param reservation: The reservation data from the request body
    :return: A success message and the created reservation object
    """
    room_res = get_room(room_name)

    if not room_res:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room doesn't exist"
        )

    try:
        start_dt = datetime.strptime(reservation.start, DATE_FORMAT)
        end_dt = datetime.strptime(reservation.end, DATE_FORMAT)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format"
        )

    now = datetime.now()
    if start_dt < now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot create a reservation in the past"
        )

    if end_dt <= start_dt:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End time must be after start time"
        )

    for r in room_res.get("reservations", []):
        r_start_dt = datetime.strptime(r["start"], DATE_FORMAT)
        r_end_dt = datetime.strptime(r["end"], DATE_FORMAT)

        if start_dt < r_end_dt and end_dt > r_start_dt:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You are placing a reservation over an existing one!"
            )

    # Format dates for Graph API (ISO format)
    graph_start = start_dt.strftime("%Y-%m-%dT%H:%M:%S")
    graph_end = end_dt.strftime("%Y-%m-%dT%H:%M:%S")

    # Create event on room's Outlook calendar
    graph_event_id = None
    if room_res.get("email"):
        graph_event_id = await graph_create_event_for_room(
            room_res["email"], reservation.title, graph_start, graph_end
        )

    new_reservation = {
        "start": reservation.start,
        "end": reservation.end,
        "title": reservation.title,
        "reserved_by": reservation.reserved_by,
        "uid": str(uuid4()),
        "graph_event_id": graph_event_id,
    }

    room_res.setdefault("reservations", []).append(new_reservation)
    room_res["reservations"].sort(
        key=lambda r: datetime.strptime(r["start"], DATE_FORMAT),
        reverse=True
    )

    logging.info(f"Reservation created in room: {room_name}! ->\n{new_reservation}")
    config.save()
    return {"message": "Reservation created!", "reservation": new_reservation}


@app.post("/api/reservation/remove/{room_name}/{reservation_uid}")
async def remove_a_reservation(room_name: str, reservation_uid: str) -> dict:
    """
    Remove a reservation and its corresponding Outlook event via Microsoft Graph.

    :param room_name: The name of the room
    :param reservation_uid: The unique ID of the reservation to delete
    :return: A success confirmation message
    """
    room_res = get_room(room_name)

    if not room_res:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room doesn't exist"
        )

    target = next(
        (r for r in room_res.get("reservations", []) if r.get("uid") == reservation_uid),
        None,
    )

    if not target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reservation UID not found",
        )

    now = datetime.now()
    r_start = datetime.strptime(target["start"], DATE_FORMAT)
    if now >= r_start:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete a reservation that is already in progress or past",
        )

    # Delete the corresponding Graph event if it exists
    graph_event_id = target.get("graph_event_id")
    if graph_event_id and room_res.get("email"):
        await graph_delete_event_for_room(room_res["email"], graph_event_id)

    room_res["reservations"] = [
        r for r in room_res["reservations"] if r.get("uid") != reservation_uid
    ]

    room_res["reservations"].sort(
        key=lambda r: datetime.strptime(r["start"], DATE_FORMAT),
        reverse=True
    )

    logging.info(f"Reservation {reservation_uid} removed from room: {room_name}!")
    config.save()
    return {"message": "Reservation removed successfully!"}


@app.put("/api/room/update/{room_name}")
def update_room(room_name: str, update: RoomUpdate) -> dict:
    """
    Update a room's metadata (name, capacity, equipment).

    :param room_name: Current name of the room to update.
    :param update: Fields to update (name, capacity, tv, whiteboard, computer).
    :return: The updated room object.
    """
    room_res = get_room(room_name)

    if not room_res:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room doesn't exist"
        )

    if update.name is not None:
        # Check that the new name does not already exist
        existing = get_room(update.name)
        if existing and existing is not room_res:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A room with this name already exists"
            )
        room_res["name"] = update.name

    if update.capacity is not None:
        room_res.setdefault("elements", {})["capacity"] = update.capacity

    if update.tv is not None:
        room_res.setdefault("elements", {})["tv"] = update.tv

    if update.whiteboard is not None:
        room_res.setdefault("elements", {})["whiteboard"] = update.whiteboard

    if update.computer is not None:
        room_res.setdefault("elements", {})["computer"] = update.computer

    logging.info(f"Room updated: {room_name} -> {room_res}")
    config.save()
    return {"message": "Room updated!", "room": room_res}


@app.post("/api/room/create/{room_name}")
def create_room(room_name: str) -> dict:
    """
    Create a new room with default equipment.

    :param room_name: Name of the new room.
    :return: The created room object.
    """
    existing = get_room(room_name)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A room with this name already exists"
        )

    new_room = {
        "name": room_name,
        "elements": {"capacity": 1, "tv": False, "whiteboard": False, "computer": False},
        "status": "free",
        "reservations": [],
    }
    config.data["rooms"].append(new_room)
    config.save()
    logging.info(f"Room created: {room_name}")
    return {"message": "Room created!", "room": new_room}


@app.delete("/api/room/delete/{room_name}")
def delete_room(room_name: str) -> dict:
    """
    Delete a room by name.

    :param room_name: Name of the room to delete.
    :return: Confirmation message.
    """
    room_res = get_room(room_name)
    if not room_res:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room doesn't exist"
        )

    config.data["rooms"] = [r for r in config.data["rooms"] if r["name"] != room_name]
    config.save()
    logging.info(f"Room deleted: {room_name}")
    return {"message": "Room deleted!"}


@app.get("/api/reservations/history")
def get_reservations_history(room: str | None = None) -> dict:
    """
    Return all reservations across all rooms, sorted by start date (descending).

    :param room: Optional room name filter.
    :return: List of all reservations with room name attached.
    """
    all_reservations = []
    for r in config.data["rooms"]:
        if room and r["name"] != room:
            continue
        for res in r["reservations"]:
            all_reservations.append({
                **res,
                "room": r["name"],
            })

    all_reservations.sort(
        key=lambda r: datetime.strptime(r["start"], DATE_FORMAT),
        reverse=True
    )

    return {"reservations": all_reservations}

@app.post("/api/settings")
def update_app_settings(settings: dict) -> dict:
    """
    Update application settings.

    Body expects one or more of: dayStart, dayEnd, startingSoonBefore, finishingSoonBefore.
    :param settings: Dict with setting fields to update.
    :return: The updated settings object.
    """
    current = get_settings()
    allowed_keys = {"dayStart", "dayEnd", "startingSoonBefore", "finishingSoonBefore"}

    for key, value in settings.items():
        if key in allowed_keys:
            current[key] = value

    config.data["settings"] = current
    logging.info(f"Settings updated: {current}")
    config.save()
    return {"message": "Settings updated!", "settings": current}

@app.get("/api/fetch/settings")
def fetch_app_settings() -> dict:
    """
    Fetch application settings.

    :return: The settings object.
    """
    return {"settings": get_settings()}

@app.post("/api/room/upload-photo/{room_name}")
async def upload_room_photo(room_name: str, file: UploadFile = File(...)) -> dict:
    """
    Upload a photo for a specific room.

    :param room_name: The name of the room.
    :param file: The image file to upload (JPEG or PNG).
    :return: Success message with the photo filename.
    """
    room_res = get_room(room_name)

    if not room_res:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room doesn't exist"
        )

    # Validate file type
    if file.content_type not in {"image/jpeg", "image/png"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPEG and PNG files are allowed"
        )

    # Save to assets/rooms/{name}.jpeg (or .png)
    ext = "jpeg" if file.content_type == "image/jpeg" else "png"
    filename = f"{room_name}.{ext}"
    assets_dir = os.path.join(os.path.dirname(__file__), "..", "roomio-frontend", "public", "rooms")
    os.makedirs(assets_dir, exist_ok=True)
    filepath = os.path.join(assets_dir, filename)

    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)

    logging.info(f"Photo uploaded for room {room_name}: {filename}")
    return {"message": "Photo uploaded!", "filename": filename}


config.save()
