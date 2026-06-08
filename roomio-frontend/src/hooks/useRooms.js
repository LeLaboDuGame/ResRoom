import { useEffect, useState, useCallback } from "react";
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

  const load = useCallback(async () => {
    try {
      const data = await fetchRooms();
      setRooms(data.rooms);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const safeLoad = async () => {
      if (!cancelled) await load();
    };

    safeLoad();
    const interval = setInterval(safeLoad, SETTINGS.POLL_INTERVAL);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [load]);

  return { rooms, loading, error, refetchRooms: load };
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

  const load = useCallback(async () => {
    try {
      const { room: fetched } = await fetchRoom(name);
      setRoom(fetched ?? null);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [name]);

  useEffect(() => {
    let cancelled = false;

    const safeLoad = async () => {
      if (!cancelled) await load();
    };

    safeLoad();
    const interval = setInterval(safeLoad, SETTINGS.POLL_INTERVAL);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [load]);

  return { room, loading, error, refetchRoom: load };
}
