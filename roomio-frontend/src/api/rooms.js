const API_URL = import.meta.env.VITE_API_URL;

export async function fetchRooms() {
  const res = await fetch(`${API_URL}/api/room/fetch/all`);
  if (!res.ok) throw new Error("Failed to fetch rooms");
  return res.json();
}
