import { useEffect, useState } from "react";
import { fetchRoom, fetchRooms } from "../api/rooms";
import { SETTINGS } from "../config/settings";

/**
 * Hook: fetch all rooms with polling.
 * @return {{rooms: Array, loading: boolean, error: string|null}} Rooms state
 */
export function useRooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await fetchRooms();
        if (!cancelled) {
          setRooms(data.rooms);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    const interval = setInterval(load, SETTINGS.POLL_INTERVAL);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return { rooms, loading, error };
}

/**
 * Hook: fetch a single room by name with polling.
 * @param {string} name Room name
 * @return {{room: Object|null, loading: boolean, error: string|null}} Room state
 */
export function useRoom(name) {
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const { room } = await fetchRoom(name);
        if (!cancelled) {
          setRoom(room ?? null);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    const interval = setInterval(load, SETTINGS.POLL_INTERVAL);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [name]);

  return { room, loading, error };
}
