from fastapi import FastAPI, HTTPException
import logging
from datetime import datetime, timedelta
from uuid import uuid4
from pydantic import BaseModel
from rich import status

from config import DB_FILE, LOG_FILE, STARTING_SOON_STATUS_BEFORE, FINISHING_SOON_STATUS_BEFORE, DATE_FORMAT
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
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- DATA BASE ----
database = Database(DB_FILE)
database.load()  # Load database


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
    - -    room_type: str[small, medium, large]
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


from fastapi import HTTPException, status


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

    initial_count = len(room_res["reservations"])

    # Filter out the reservation matching the given UID
    room_res["reservations"] = [
        r for r in room_res["reservations"] if r["uid"] != reservation_uid
    ]

    # If the list size did not change, the UID was not found
    if len(room_res["reservations"]) == initial_count:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reservation UID not found"
        )

    # Maintain the sorted order by start date (descending)
    room_res["reservations"].sort(
        key=lambda r: datetime.strptime(r["start"], DATE_FORMAT),
        reverse=True
    )

    logging.info(f"Reservation {reservation_uid} removed from room: {room_name}!")
    database.save()
    return {"message": "Reservation removed successfully!"}


database.save()
