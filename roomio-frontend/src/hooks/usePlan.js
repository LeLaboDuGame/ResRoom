import { useEffect, useState } from "react";
import { parsePlan } from "../utils/planUtils";

export function usePlan() {
  const [background, setBackground] = useState(null);
  const [walls, setWalls] = useState([]);
  const [roomPolygons, setRoomPolygons] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch("/src/assets/plan/plan.json");
        if (!res.ok) throw new Error("Failed to load plan");
        const json = await res.json();
        if (!cancelled) {
          const parsed = parsePlan(json);
          setBackground(parsed.background);
          setWalls(parsed.walls);
          setRoomPolygons(parsed.roomPolygons);
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  return { background, walls, roomPolygons, loading };
}
