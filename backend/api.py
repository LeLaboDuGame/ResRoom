"""REST API for the RoomIO room-reservation application.

Provides endpoints for managing rooms, reservations, settings, and room
photos.  All persistent data is delegated to the :mod:`db` module.
"""

import os

from azure.identity import ClientSecretCredential
from fastapi import FastAPI, HTTPException, UploadFile, File
import logging
from datetime import datetime, timezone
from dateutil import tz, parser
from uuid import uuid4
import re

from msgraph import GraphServiceClient
from msgraph.generated.models.location import Location
from msgraph.generated.users.item.events.events_request_builder import EventsRequestBuilder
from msgraph.generated.models.event import Event
from msgraph.generated.models.date_time_time_zone import DateTimeTimeZone
from msgraph.generated.models.attendee import Attendee
from msgraph.generated.models.email_address import EmailAddress
from msgraph.generated.models.attendee_type import AttendeeType
from msgraph.generated.models.location_type import LocationType
from kiota_abstractions.base_request_configuration import RequestConfiguration
from pydantic import BaseModel
from rich import status

from config import Config
import dotenv

# ---- LOG ----
LOG_FILE: str = 'log.txt'

LEVEL_COLORS = {
    "DEBUG":    "\033[44m DEBUG \033[0m",     # blue bg
    "INFO":     "\033[42m INFO \033[0m",      # green bg
    "WARNING":  "\033[43m WARNING \033[0m",   # yellow bg
    "ERROR":    "\033[41m ERROR \033[0m",     # red bg
    "CRITICAL": "\033[45m CRIT \033[0m",      # magenta bg
}


class ColorFormatter(logging.Formatter):
    def format(self, record):
        record.colored_level = LEVEL_COLORS.get(record.levelname, record.levelname)
        return super().format(record)

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

# Logging
_color_fmt = ColorFormatter(
    fmt='%(asctime)s, %(name)s %(colored_level)s %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
)
_file_fmt = logging.Formatter(
    fmt='%(asctime)s, %(name)s %(levelname)s %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
)

_stream_handler = logging.StreamHandler()
_stream_handler.setFormatter(_color_fmt)

_file_handler = logging.FileHandler(LOG_FILE, mode='a')
_file_handler.setFormatter(_file_fmt)

logging.basicConfig(
    level=logging.WARNING,
    handlers=[_file_handler, _stream_handler],
)
logging.getLogger(__name__).setLevel(logging.DEBUG)

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


# ---- GRAPH HELPERS ----
def email_to_display_name(email: str | None) -> str | None:
    """Convert an email like 'adrien.dumontet@ecm-crit.com' to 'Adrien DUMONTET'.
    and from salle-paris-youri.gagarine@ecm-crit.com' to 'Salle Paris Youri"""
    if not email:
        return None
    local = email.split("@")[0]
    parts = re.split(r'[._\-]', local)
    if len(parts) >= 2:
        first = parts[0].capitalize()
        last = parts[-1].upper()
        return f"{first} {last}"
    return local.capitalize()


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


def _format_dt(dt_str: str | None, tz_name: str | None = None) -> str | None:
    """Convertit une date ISO en heure de Paris et retourne 'YYYY-MM-DD HH:MM'."""
    if not dt_str:
        return None

    try:
        dt = parser.isoparse(dt_str)
    except (ValueError, TypeError):
        return dt_str

    paris_tz = tz.gettz("Europe/Paris")

    # Si la date n'a pas de fuseau, on considère qu'elle est en UTC
    if dt.tzinfo is None:
        if tz_name and tz_name.upper() != "UTC":
            dt = dt.replace(tzinfo=paris_tz)
        else:
            dt = dt.replace(tzinfo=timezone.utc)

    return dt.astimezone(paris_tz).strftime(DATE_FORMAT)

async def graph_get_events_for_room(room_email: str) -> list[dict]:
    """Fetch calendar events for a room mailbox from Microsoft Graph, converted to Europe/Paris."""
    query_params = EventsRequestBuilder.EventsRequestBuilderGetQueryParameters(
        select=["start", "end", "organizer"],
    )
    request_configuration = RequestConfiguration(query_parameters=query_params)
    result = await client.users.by_user_id(room_email).events.get(
        request_configuration=request_configuration,
    )
    if not result or not result.value:
        return []
    e = result.value[0]
    return [
        {
            "id": event.id,
            "start": _format_dt(event.start.date_time, event.start.time_zone) if event.start else None,
            "end": _format_dt(event.end.date_time, event.end.time_zone) if event.end else None,
            "organizer": email_to_display_name(
                event.organizer.email_address.address) if event.organizer and event.organizer.email_address else None,
        }
        for event in result.value
    ]


async def graph_create_event_for_room(organizer_email: str, attendees_emails: list[str], room_email: str, subject: str,
                                      start: str, end: str) -> str | None:
    """Create a calendar event on the organizer's mailbox and invite the room as required attendee. Returns the event ID."""
    attendees = [
        Attendee(
            email_address=EmailAddress(address=email),
            type=AttendeeType.Required,
        ) for email in attendees_emails
    ]

    try:
        room_user = await client.users.by_user_id(room_email).get()
        if room_user and room_user.display_name:
            room_display_name = room_user.display_name
            logging.info(f"Room display name: {room_display_name}")
        else:
            logging.warning(f"Could not fetch display name for room {room_email}: {room_user}")
            return None
    except Exception as e:
        logging.warning(f"Could not fetch display name for room {room_email}: {e}")
        return None

    all_attendees = attendees + [
        Attendee(
            email_address=EmailAddress(address=room_email),
            type=AttendeeType.Resource,
        )
    ]

    event = Event(
        subject=subject,
        start=DateTimeTimeZone(date_time=start, time_zone="Europe/Paris"),
        end=DateTimeTimeZone(date_time=end, time_zone="Europe/Paris"),
        attendees=all_attendees,
    )
    try:
        result = await client.users.by_user_id(organizer_email).events.post(event)
        logging.info(f"Reservation created by Graph in room {room_email} by {organizer_email}")
        return result.id if result else None
    except Exception as e:
        logging.warning(f"Could not create Graph event for {organizer_email}: {e}")
        return None

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
                #TODO: Un-comment: logging.warning(f"Could not fetch events for {room['name']}: {e}")
                pass
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

    # Create event on organizer's Outlook calendar with room as attendee
    organizer_email = reservation.reserved_by.split(",")[0].strip() if reservation.reserved_by else None
    if room_res.get("email") and organizer_email:
        graph_event_id = await graph_create_event_for_room(
            organizer_email, reservation.reserved_by.split(","), room_res["email"], reservation.title, graph_start, graph_end
        )

        if graph_event_id is None:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                                detail="Graph Event can't be created! Try later or refresh the page")

    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Email of the room or organizer doesn't exist.")
    new_reservation = {
        "start": reservation.start,
        "end": reservation.end,
        "title": reservation.title,
        "reserved_by": reservation.reserved_by,
        "organizer": organizer_email,
        "uid": str(uuid4()),
        "graph_event_id": graph_event_id,
    }

    logging.info(f"Reservation created in room: {room_name}! ->\n{new_reservation}")
    config.save()

    updated_events = []
    if room_res.get("email"):
        try:
            updated_events = await graph_get_events_for_room(room_res["email"])
        except Exception as e:
            logging.warning(f"Could not refetch events for {room_name}: {e}")

    return {"message": "Reservation created!", "reservation": new_reservation, "reservations": updated_events}


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
