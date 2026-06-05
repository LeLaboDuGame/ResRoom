const API_URL = import.meta.env.VITE_API_URL;

/**
 * Fetch all rooms.
 * @return {Promise<{rooms: Array}>} Object containing rooms array
 */
export async function fetchRooms() {
  const res = await fetch(`${API_URL}/api/room/fetch/all`);
  if (!res.ok) throw new Error("Failed to fetch rooms");
  return res.json();
}

/**
 * Fetch a single room by name.
 * @param {string} name Room name
 * @return {Promise<{room: Object}>} Room object
 */
export async function fetchRoom(name) {
  const res = await fetch(`${API_URL}/api/room/fetch/name/${encodeURIComponent(name)}`);
  if (!res.ok) throw new Error("Failed to fetch room");
  return res.json();
}

/**
 * Create a reservation in a room.
 * @param {string} roomName Target room name
 * @param {{start: string, end: string, title: string, reserved_by: string}} reservation Reservation details
 * @return {Promise<{message: string, reservation: Object}>} Created reservation
 */
export async function createReservation(roomName, reservation) {
  const res = await fetch(`${API_URL}/api/reservation/create/${encodeURIComponent(roomName)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(reservation),
  });
  if (!res.ok) throw new Error("Failed to create reservation");
  return res.json();
}

/**
 * Delete a reservation by its UID.
 * @param {string} roomName Room containing the reservation
 * @param {string} reservationUid Unique identifier of the reservation
 * @return {Promise<{message: string}>} Confirmation message
 */
export async function deleteReservation(roomName, reservationUid) {
  const res = await fetch(
    `${API_URL}/api/reservation/remove/${encodeURIComponent(roomName)}/${encodeURIComponent(reservationUid)}`,
    { method: "POST" },
  );
  if (!res.ok) throw new Error("Failed to delete reservation");
  return res.json();
}

/**
 * Update room metadata (name, capacity, equipment).
 * @param {string} name Current room name
 * @param {{name?: string, capacity?: number, tv?: boolean, whiteboard?: boolean, computer?: boolean}} data Fields to update
 * @return {Promise<{message: string, room: Object}>} Updated room
 */
export async function updateRoom(name, data) {
  const res = await fetch(`${API_URL}/api/room/update/${encodeURIComponent(name)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update room");
  return res.json();
}

/**
 * Upload a photo for a room.
 * @param {string} name Room name
 * @param {File} file Image file (JPEG or PNG)
 * @return {Promise<{message: string, filename: string}>} Upload confirmation
 */
export async function uploadPhoto(name, file) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_URL}/api/room/upload-photo/${encodeURIComponent(name)}`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Failed to upload photo");
  return res.json();
}

/**
 * Fetch all reservations history.
 * @return {Promise<{reservations: Array}>} Array of reservations with room name attached
 */
export async function fetchHistory() {
  const res = await fetch(`${API_URL}/api/reservations/history`);
  if (!res.ok) throw new Error("Failed to fetch history");
  return res.json();
}

/**
 * Fetch current application settings.
 * @return {Promise<{settings: Object}>} Settings object
 */
export async function fetchSettings() {
  const res = await fetch(`${API_URL}/api/settings`);
  if (!res.ok) throw new Error("Failed to fetch settings");
  return res.json();
}

/**
 * Update application settings.
 * @param {{dayStart?: number, dayEnd?: number, startingSoonBefore?: number, finishingSoonBefore?: number}} settings Settings to update
 * @return {Promise<{message: string, settings: Object}>} Updated settings
 */
export async function updateSettings(settings) {
  const res = await fetch(`${API_URL}/api/settings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error("Failed to update settings");
  return res.json();
}
