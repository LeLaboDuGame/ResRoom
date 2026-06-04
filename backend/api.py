import os
from fastapi import FastAPI, HTTPException, UploadFile, File
import logging
from datetime import datetime, timedelta
from uuid import uuid4
from pydantic import BaseModel
from rich import status

from config import DB_FILE, LOG_FILE, DATE_FORMAT
from db import Database




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
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://10.233.31.200:4173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- DATA BASE ----
database = Database(DB_FILE)
database.load()  # Load database


def get_settings() -> dict:
    """Return the current application settings from the database."""
    return database.data.get("settings", {
        "dayStart": 8,
        "dayEnd": 20,
        "startingSoonBefore": 15,
        "finishingSoonBefore": 15,
    })


@app.get("/api")
def root():
    """
    root
    :return: simple message
    """
    return {"msg": "Welcome to the api of RoomIO!"}


def get_room(room_name: str):
    room_res: dict | None = None
    for room in database.data["rooms"]:
        if room["name"] == room_name:
            room_res = room

    return room_res


@app.get("/api/room/fetch/all")
def get_all_rooms():
    return {"rooms": database.data["rooms"]}


@app.get("/api/room/fetch/name/{room_name}")
def get_room_by_name(room_name: str):
    """
    Fetch a room information.

    - Room: dict[
    - -    name: str
    - -    elements: dict
    - -    status: str[FREE, STARTING_SOON, OCCUPIED, FINISHING_SOON]
    - -     reservations: list[dict[
                id: int,
                date: str,
                for: str,
                by: str]]]
    - -    description: str


    :param room_name: room name
    :return: Room information. If the room doesn't exist return an error message
    """

    # Get info of the room
    room_res: dict | None = get_room(room_name)

    if room_res:
        return {"room": room_res}
    else:
        return {"error": "Room doesn't exist"}


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
def create_a_reservation(room_name: str, reservation: Reservation):
    """
    Create a reservation for a specific room.

    :param room_name: The name of the target room
    :param reservation: The reservation data from the request body
    :return: A success message and the created reservation object
    """
    room_res = get_room(room_name)

    # Check if the room exists
    if not room_res:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room doesn't exist"
        )

    # Validate date string formats
    try:
        start_dt = datetime.strptime(reservation.start, DATE_FORMAT)
        end_dt = datetime.strptime(reservation.end, DATE_FORMAT)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format"
        )

    # Prevent reservation in the past
    now = datetime.now()
    if start_dt < now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot create a reservation in the past"
        )

    # Prevent reservation where end is not after start
    if end_dt <= start_dt:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End time must be after start time"
        )

    # Check for any overlapping reservations in the same room
    for r in room_res["reservations"]:
        r_start_dt = datetime.strptime(r["start"], DATE_FORMAT)
        r_end_dt = datetime.strptime(r["end"], DATE_FORMAT)

        # Robust overlap detection formula
        if start_dt < r_end_dt and end_dt > r_start_dt:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You are placing a reservation over an existing one!"
            )

    # Create the new reservation payload
    new_reservation = {
        "start": reservation.start,
        "end": reservation.end,
        "title": reservation.title,
        "reserved_by": reservation.reserved_by,
        "uid": str(uuid4())
    }

    # Append and sort reservations by start date (descending)
    room_res["reservations"].append(new_reservation)
    room_res["reservations"].sort(
        key=lambda r: datetime.strptime(r["start"], DATE_FORMAT),
        reverse=True
    )

    logging.info(f"Reservation created in room: {room_name}! ->\n{new_reservation}")
    database.save()
    return {"message": "Reservation created!", "reservation": new_reservation}


@app.post("/api/reservation/remove/{room_name}/{reservation_uid}")
def remove_a_reservation(room_name: str, reservation_uid: str):
    """
    Remove a reservation from a specific room using its unique identifier (UID).

    :param room_name: The name of the room
    :param reservation_uid: The unique ID of the reservation to delete
    :return: A success confirmation message
    """
    room_res = get_room(room_name)

    # Check if the room exists
    if not room_res:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room doesn't exist"
        )

    # Find the reservation matching the given UID
    target = next(
        (r for r in room_res["reservations"] if r["uid"] == reservation_uid),
        None,
    )

    if not target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reservation UID not found",
        )

    # Prevent deletion if the reservation has already started or is in the past
    now = datetime.now()
    r_start = datetime.strptime(target["start"], DATE_FORMAT)
    if now >= r_start:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete a reservation that is already in progress or past",
        )

    # Filter out the reservation matching the given UID
    room_res["reservations"] = [
        r for r in room_res["reservations"] if r["uid"] != reservation_uid
    ]

    # Maintain the sorted order by start date (descending)
    room_res["reservations"].sort(
        key=lambda r: datetime.strptime(r["start"], DATE_FORMAT),
        reverse=True
    )

    logging.info(f"Reservation {reservation_uid} removed from room: {room_name}!")
    database.save()
    return {"message": "Reservation removed successfully!"}


@app.put("/api/room/update/{room_name}")
def update_room(room_name: str, update: RoomUpdate):
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
    database.save()
    return {"message": "Room updated!", "room": room_res}


@app.get("/api/reservations/history")
def get_reservations_history(room: str | None = None):
    """
    Return all reservations across all rooms, sorted by start date (descending).

    :param room: Optional room name filter.
    :return: List of all reservations with room name attached.
    """
    all_reservations = []
    for r in database.data["rooms"]:
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


@app.get("/api/settings")
def get_app_settings():
    """Return the current application settings."""
    return {"settings": get_settings()}


@app.post("/api/settings")
def update_app_settings(settings: dict):
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

    database.data["settings"] = current
    logging.info(f"Settings updated: {current}")
    database.save()
    return {"message": "Settings updated!", "settings": current}


@app.post("/api/room/upload-photo/{room_name}")
async def upload_room_photo(room_name: str, file: UploadFile = File(...)):
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
    assets_dir = os.path.join(os.path.dirname(__file__), "..", "roomio-frontend", "src", "assets", "rooms")
    os.makedirs(assets_dir, exist_ok=True)
    filepath = os.path.join(assets_dir, filename)

    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)

    logging.info(f"Photo uploaded for room {room_name}: {filename}")
    return {"message": "Photo uploaded!", "filename": filename}


database.save()
