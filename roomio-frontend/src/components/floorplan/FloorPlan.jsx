import { useMemo } from "react";
import { WallLayer } from "./WallLayer";
import { RoomShape } from "./RoomShape";

/**
 * Compute plan bounding box from walls.
 * @param {Array} walls Array of wall objects with start/end coordinates
 * @return {{minX: number, minY: number, maxX: number, maxY: number}} Bounding box
 */
function computeBounds(walls) {
  if (!walls.length) return { minX: 0, minY: 0, maxX: 100, maxY: 100 };
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  walls.forEach(w => {
    minX = Math.min(minX, w.start.x, w.end.x);
    maxX = Math.max(maxX, w.start.x, w.end.x);
    minY = Math.min(minY, w.start.y, w.end.y);
    maxY = Math.max(maxY, w.start.y, w.end.y);
  });
  return { minX, minY, maxX, maxY };
}

/**
 * Full floor plan SVG container.
 * Renders walls, room polygons, handles selection and dimming.
 * @param {Array} walls Wall objects from usePlan
 * @param {Object} roomPolygons Room polygons from usePlan, keyed by name
 * @param {string} [selectedRoom] Currently selected room name.
 * @param {Array<string>} [dimmedRooms] Rooms to keep at full opacity (others dimmed)
 * @param {Function} [onRoomClick] Callback when a room polygon is clicked
 * @return {JSX.Element} SVG element
 */
export function FloorPlan({ walls, roomPolygons, selectedRoom, dimmedRooms, onRoomClick }) {
  const bounds = useMemo(() => computeBounds(walls), [walls]);
  const pad = 40;
  const vb = `${bounds.minX - pad} ${bounds.minY - pad} ${bounds.maxX - bounds.minX + pad * 2} ${bounds.maxY - bounds.minY + pad * 2}`;

  // Replace all 'space' of `selectedRoom` by a '_'
  selectedRoom = selectedRoom.replaceAll(" ", "_")

  return (
    <svg
      viewBox={vb}
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
      style={{ display: "block" }}
    >
      <WallLayer walls={walls} />
      {Object.entries(roomPolygons).map(([name, data]) => (
        <RoomShape
          key={name}
          polygon={data.polygon}
          name={name.replace("_", " ")}
          color={data.color}
          selected={selectedRoom === name}
          dimmed={dimmedRooms?.length > 0 && !dimmedRooms.includes(name)}
          onClick={onRoomClick}
        />
      ))}
    </svg>
  );
}
