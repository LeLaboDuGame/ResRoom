import { useEffect, useState } from "react";
import { parsePlan } from "../utils/planUtils";
import planData from "../assets/plan/plan.json";

export function usePlan() {
  const [background, setBackground] = useState(null);
  const [walls, setWalls] = useState([]);
  const [roomPolygons, setRoomPolygons] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const parsed = parsePlan(planData);
    setBackground(parsed.background);
    setWalls(parsed.walls);
    setRoomPolygons(parsed.roomPolygons);
    setLoading(false);
  }, []);

  return { background, walls, roomPolygons, loading };
}
