function wallsById(walls) {
  const map = {};
  walls.forEach(w => map[w.id] = w);
  return map;
}

function roomPolygon(wallIds, wallMap) {
  const points = [];
  wallIds.forEach(id => {
    const w = wallMap[id];
    if (!w) return;
    points.push({ x: w.start.x, y: w.start.y });
    points.push({ x: w.end.x, y: w.end.y });
  });

  const deduped = [];
  for (const p of points) {
    if (
      deduped.length === 0 ||
      p.x !== deduped[deduped.length - 1].x ||
      p.y !== deduped[deduped.length - 1].y
    ) {
      deduped.push(p);
    }
  }

  return deduped;
}

export function parsePlan(json) {
  const floor = json.floors?.[0];
  if (!floor) return { background: null, walls: [], roomPolygons: {} };

  const wallMap = wallsById(floor.walls || []);
  const roomPolygons = {};

  (floor.rooms || []).forEach(room => {
    const name = room.name || room.id;
    if (!name) return;
    roomPolygons[name] = {
      polygon: roomPolygon(room.walls || [], wallMap),
      color: room.color || "#ffffff",
      area: room.area || 0,
    };
  });

  return {
    background: floor.backgroundImage || null,
    walls: floor.walls || [],
    roomPolygons,
  };
}
