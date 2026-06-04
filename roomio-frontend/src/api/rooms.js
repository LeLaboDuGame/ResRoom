const API_URL = import.meta.env.VITE_API_URL;

export async function fetchRooms() {
  const res = await fetch(`${API_URL}/api/room/fetch/all`);
  if (!res.ok) throw new Error("Failed to fetch rooms");
  return res.json();
}

export async function fetchRoom(name) {
  const res = await fetch(`${API_URL}/api/room/fetch/name/${encodeURIComponent(name)}`);
  if (!res.ok) throw new Error("Failed to fetch room");
  return res.json();
}

export async function createReservation(roomName, reservation) {
  const res = await fetch(`${API_URL}/api/reservation/create/${encodeURIComponent(roomName)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(reservation),
  });
  if (!res.ok) throw new Error("Failed to create reservation");
  return res.json();
}

export async function deleteReservation(roomName, reservationUid) {
  const res = await fetch(
    `${API_URL}/api/reservation/remove/${encodeURIComponent(roomName)}/${encodeURIComponent(reservationUid)}`,
    { method: "POST" },
  );
  if (!res.ok) throw new Error("Failed to delete reservation");
  return res.json();
}

export async function updateRoom(name, data) {
  const res = await fetch(`${API_URL}/api/room/update/${encodeURIComponent(name)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update room");
  return res.json();
}

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
