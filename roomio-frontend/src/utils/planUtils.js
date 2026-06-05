/**
 * Index walls by their ID for fast lookup.
 * @param {Array} walls Array of wall objects with id property
 * @return {Object} Map of wall id -> wall object
 */
function wallsById(walls) {
  const map = {};
  walls.forEach(w => map[w.id] = w);
  return map;
}

/**
 * Build a room polygon from referenced wall IDs.
 * Walks walls in order, takes start then end of each, deduplicates consecutive points.
 * @param {Array<string>} wallIds Ordered wall ID references
 * @param {Object} wallMap Map of wall id -> wall object
 * @return {Array<{x: number, y: number}>} Polygon vertices
 */
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

/**
 * Parse floor plan JSON.
 * Extracts walls, computes room polygons, captures SVG background.
 * @param {Object} json Raw plan.json data
 * @return {{background: Object|null, walls: Array, roomPolygons: Object}} Parsed plan
 */
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
