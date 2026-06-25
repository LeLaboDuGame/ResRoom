import {useState, useMemo, useRef, useCallback, useEffect} from "react";
import {Box, Flex, Circle, Text} from "@chakra-ui/react";
import planData from "../../assets/plan/plan.json";
import bureauShapeSvg from "../../assets/BureauShape.svg";
const VB_SIZE = 2048;
const MIN_ZOOM = 300;
const MAX_ZOOM = 4096;

const FREE_COLOR = "var(--chakra-colors-status-free)"
const STARTING_SOON_COLOR = "var(--chakra-colors-status-starting-soon)"
const MEETING_COLOR = "var(--chakra-colors-status-meeting)"

const STATUS_COLORS = {
    "Free": {fill: FREE_COLOR, stroke: FREE_COLOR},
    "Starting Soon": {fill: STARTING_SOON_COLOR, stroke: STARTING_SOON_COLOR},
    "Meeting": {fill: MEETING_COLOR, stroke: MEETING_COLOR},
};

function lerpColor(c1, c2, t) {
    const r1 = parseInt(c1.slice(1,3), 16), g1 = parseInt(c1.slice(3,5), 16), b1 = parseInt(c1.slice(5,7), 16);
    const r2 = parseInt(c2.slice(1,3), 16), g2 = parseInt(c2.slice(3,5), 16), b2 = parseInt(c2.slice(5,7), 16);
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}

function getStartingSoonColor(reservations) {
    const now = new Date();
    const parsed = reservations
        .map(r => ({...r, startDate: new Date(r.start?.replace(" ", "T"))}))
        .filter(r => !isNaN(r.startDate?.getTime()));
    const next = parsed.filter(r => r.startDate > now).sort((a, b) => a.startDate - b.startDate)[0];
    if (!next) return STARTING_SOON_COLOR;
    const diffMs = next.startDate - now;
    const progress = 1 - diffMs / (15 * 60000); // 0 at threshold, 1 at start time
    const t = Math.max(0, Math.min(1, progress));
    return lerpColor("#fbbf24", "#ff0000", t);
}

/**
 * Determines the occupancy status of a room from its reservations.
 * @param {Array} reservations List of reservation objects with start/end
 * @returns {"Free"|"Starting Soon"|"Meeting"} Status string
 */
function getRoomStatus(reservations) {
    const now = new Date();
    if (!reservations?.length) return "Free";
    const parsed = reservations
        .map(r => ({
            ...r,
            startDate: new Date(r.start?.replace(" ", "T")),
            endDate: new Date(r.end?.replace(" ", "T"))
        }))
        .filter(r => !isNaN(r.startDate.getTime()) && !isNaN(r.endDate.getTime()));
    const active = parsed.find(r => r.startDate <= now && now <= r.endDate);
    if (active) return "Meeting";
    const next = parsed.filter(r => r.startDate > now).sort((a, b) => a.startDate - b.startDate)[0];
    if (next && (next.startDate - now) / 60000 <= 15) return "Starting Soon";
    return "Free";
}

/**
 * Traces a closed polygon from an ordered list of wall segments.
 * Walls are connected end-to-end by matching coordinates.
 * @param {Array} walls Wall objects with start/end coordinates
 * @returns {Array<{x: number, y: number}>} Polygon vertices in order
 */
function traceRoomPolygon(walls) {
    if (walls.length < 3) return [];
    const key = p => `${+p.x.toFixed(4)},${+p.y.toFixed(4)}`;
    const result = [{x: walls[0].start.x, y: walls[0].start.y}];
    const resultSet = new Set([key(result[0])]);
    let current = {x: walls[0].end.x, y: walls[0].end.y};
    result.push(current);
    resultSet.add(key(current));
    const used = new Set([0]);
    while (used.size < walls.length) {
        let found = false;
        for (let i = 0; i < walls.length; i++) {
            if (used.has(i)) continue;
            const w = walls[i];
            if (key(w.start) === key(current)) {
                current = {x: w.end.x, y: w.end.y};
            } else if (key(w.end) === key(current)) {
                current = {x: w.start.x, y: w.start.y};
            } else continue;
            const k = key(current);
            if (!resultSet.has(k)) {
                result.push(current);
                resultSet.add(k);
            }
            used.add(i);
            found = true;
            break;
        }
        if (!found) break;
    }
    return result;
}

/**
 * Computes the centroid of a polygon.
 * @param {Array<{x: number, y: number}>} points Polygon vertices
 * @returns {{x: number, y: number}} Centroid coordinates
 */
function getPolygonCentroid(points) {
    if (!points.length) return {x: 0, y: 0};
    const sum = points.reduce((a, p) => ({x: a.x + p.x, y: a.y + p.y}), {x: 0, y: 0});
    return {x: sum.x / points.length, y: sum.y / points.length};
}

/**
 * Interactive SVG floor plan with pan, zoom, room selection, and status-based coloring.
 * @param {Array} rooms Room data with reservations
 * @param {string|null} selectedRoom Currently selected room name
 * @param {string[]} dimmedRooms Rooms to keep lit; others are dimmed
 * @param {Function} onRoomClick Click/Enter handler with room name
 * @returns {JSX.Element} FloorPlan component
 */
export function FloorPlan({rooms, selectedRoom, dimmedRooms, onRoomClick}) {
    const [hovered, setHovered] = useState(null);
    const [isPanning, setIsPanning] = useState(false);
    const svgRef = useRef(null);
    const panRef = useRef(null);

    const floor = planData.floors?.[0];
    const allWalls = floor?.walls || [];

    const defaultVb = useMemo(() => {
        if (!allWalls.length) return {x: 0, y: 0, w: VB_SIZE, h: VB_SIZE};
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        allWalls.forEach(w => {
            minX = Math.min(minX, w.start.x, w.end.x);
            maxX = Math.max(maxX, w.start.x, w.end.x);
            minY = Math.min(minY, w.start.y, w.end.y);
            maxY = Math.max(maxY, w.start.y, w.end.y);
        });
        const pad = 100;
        return {
            x: minX - pad,
            y: minY - pad,
            w: maxX - minX + 2 * pad,
            h: maxY - minY + 2 * pad,
        };
    }, [allWalls]);

    const [vb, setVb] = useState(defaultVb);
    const vbRef = useRef(vb);
    vbRef.current = vb;

    const pointersRef = useRef(new Map());
    const pinchRef = useRef(null);

    const wallMap = useMemo(() => {
        const m = {};
        allWalls.forEach(w => m[w.id] = w);
        return m;
    }, [allWalls]);

    const roomMap = useMemo(() => {
        const m = {};
        (rooms || []).forEach(r => m[r.name] = r);
        return m;
    }, [rooms]);

    const sorted = useMemo(() => {
        if (!floor) return [];
        return (floor.rooms || [])
            .map(r => ({
                name: r.name,
                walls: r.walls.map(id => wallMap[id]).filter(Boolean),
            }))
            .filter(r => r.walls.length >= 3)
            .map(r => ({
                name: r.name,
                points: traceRoomPolygon(r.walls),
            }))
            .filter(r => r.points.length >= 3);
    }, [floor, wallMap]);

    // Wheel zoom via raw addEventListener with { passive: false }
    useEffect(() => {
        const el = svgRef.current;
        if (!el) return;
        const handler = (e) => {
            e.preventDefault();
            const rect = el.getBoundingClientRect();
            const mx = (e.clientX - rect.left) / rect.width;
            const my = (e.clientY - rect.top) / rect.height;
            const cur = vbRef.current;
            const vx = cur.x + mx * cur.w;
            const vy = cur.y + my * cur.h;
            const factor = e.deltaY > 0 ? 1.15 : 0.85;
            const newW = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, cur.w * factor));
            const newH = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, cur.h * factor));
            setVb({x: vx - mx * newW, y: vy - my * newH, w: newW, h: newH});
        };
        el.addEventListener("wheel", handler, {passive: false});
        return () => el.removeEventListener("wheel", handler, {passive: false});
    }, []);



    // Pointer panning (mouse + touch) with pinch-to-zoom support
    const handlePointerDown = useCallback(e => {
        pointersRef.current.set(e.pointerId, {x: e.clientX, y: e.clientY});
        if (pointersRef.current.size === 1) {
            panRef.current = {
                mx: e.clientX, my: e.clientY,
                vbX: vb.x, vbY: vb.y,
                started: false,
            };
        }
        if (pointersRef.current.size === 2) {
            const p = Array.from(pointersRef.current.values());
            pinchRef.current = {
                dist: Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y),
                vb: {...vb},
            };
            panRef.current = null;
            setIsPanning(true);
        }
    }, [vb]);

    const handlePointerMove = useCallback(e => {
        if (!pointersRef.current.has(e.pointerId)) return;
        pointersRef.current.set(e.pointerId, {x: e.clientX, y: e.clientY});
        if (pinchRef.current) {
            const p = Array.from(pointersRef.current.values());
            if (p.length !== 2) return;
            const rect = svgRef.current?.getBoundingClientRect();
            if (!rect) return;
            const mx = ((p[0].x + p[1].x) / 2 - rect.left) / rect.width;
            const my = ((p[0].y + p[1].y) / 2 - rect.top) / rect.height;
            const dist = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
            const factor = pinchRef.current.dist / dist;
            const cur = pinchRef.current.vb;
            const vx = cur.x + mx * cur.w;
            const vy = cur.y + my * cur.h;
            const newW = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, cur.w * factor));
            const newH = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, cur.h * factor));
            setVb({x: vx - mx * newW, y: vy - my * newH, w: newW, h: newH});
            return;
        }
        const pr = panRef.current;
        if (!pr) return;
        const dx = Math.abs(e.clientX - pr.mx);
        const dy = Math.abs(e.clientY - pr.my);
        if (dx < 5 && dy < 5) return;
        if (!pr.started) {
            pr.started = true;
            setIsPanning(true);
            pr.mx = e.clientX;
            pr.my = e.clientY;
            pr.vbX = vb.x;
            pr.vbY = vb.y;
        }
        const rect = svgRef.current?.getBoundingClientRect();
        if (!rect) return;
        const scale = vb.w / rect.width;
        const {vbX, vbY, mx, my} = pr;
        setVb(prev => ({
            ...prev,
            x: vbX - (e.clientX - mx) * scale,
            y: vbY - (e.clientY - my) * scale,
        }));
    }, [vb]);

    const handlePointerUp = useCallback(e => {
        pointersRef.current.delete(e.pointerId);
        if (pointersRef.current.size < 2) pinchRef.current = null;
        if (pointersRef.current.size === 0) {
            panRef.current = null;
            setIsPanning(false);
        }
    }, []);

    /**
     * Resets the viewBox to the full floor plan on double-click.
     */
    const handleDblClick = useCallback(() => {
        setVb(defaultVb);
    }, [defaultVb]);

    const vbStr = `${vb.x} ${vb.y} ${vb.w} ${vb.h}`;

    const legendItems = [
        {color: "status.free", label: "Free"},
        {color: "status.startingSoon", label: "Starting Soon"},
        {color: "status.meeting", label: "Meeting"},
    ];

    const WALL_COLOR = "#555";
    const WALL_STROKE_WIDTH = 15;
    const BG_SCALE = planData.floors?.[0]?.backgroundImage?.scale || 1.95;
    const BG_CENTER = 1024;
    const BG_LEFT = -BG_CENTER * BG_SCALE;
    const BG_TOP = -BG_CENTER * BG_SCALE;

    /**
     * Determines fill/stroke colors and opacity for a room based on its status and selection state.
     * @param {Object} room Room object with name
     * @returns {{fill: string, stroke: string, fillOpacity: number, strokeOpacity: number, strokeWidth: number, isDimmed: boolean}} Style values
     */
    function getRoomColors(room) {
        const roomData = roomMap[room.name];
        const status = roomData ? getRoomStatus(roomData.reservations) : "Free";
        const colors = STATUS_COLORS[status] || STATUS_COLORS.Free;
        const isSelected = selectedRoom && room.name === selectedRoom;
        const isDimmed = dimmedRooms?.length > 0 && !dimmedRooms.includes(room.name);

        let fill = status === "Starting Soon" && roomData ? getStartingSoonColor(roomData.reservations) : colors.fill;
        let stroke = fill;
        let fillOpacity = 0.6;
        let strokeOpacity = 0.8;
        let strokeWidth = 10;

        if (isDimmed) {
            fillOpacity = 0.04;
            strokeOpacity = 0.15;
        }
        if (isSelected) {
            fill = "#4f8cff";
            stroke = "#4f8cff";
            fillOpacity = 0.3;
            strokeWidth = 2.5;
        }

        return {fill, stroke, fillOpacity, strokeOpacity, strokeWidth, isDimmed};
    }

    return (
        <Box position="relative" w="100%" h="100%">
            <svg
                ref={svgRef}
                viewBox={vbStr}
                width="100%"
                height="100%"
                preserveAspectRatio="xMidYMid meet"
                draggable={false}
                style={{
                    display: "block",
                    cursor: isPanning ? "grabbing" : "grab",
                    userSelect: "none",
                    WebkitUserSelect: "none",
                    touchAction: "none",
                }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onDoubleClick={handleDblClick}
            >
                <rect
                    x={Math.min(defaultVb.x, BG_LEFT)}
                    y={Math.min(defaultVb.y, BG_TOP)}
                    width={Math.max(defaultVb.w, -BG_LEFT * 2)}
                    height={Math.max(defaultVb.h, -BG_TOP * 2)}
                    fill="#151518"
                />

                <g transform={`translate(${BG_LEFT}, ${BG_TOP}) scale(${BG_SCALE})`}>
                    <image
                        href={bureauShapeSvg}
                        x="0" y="0" width="2048" height="2048"
                        preserveAspectRatio="xMidYMid meet"
                        draggable={false}
                        style={{
                            filter: "invert(0.92)",
                            pointerEvents: "none",
                            userSelect: "none",
                            WebkitUserSelect: "none",
                        }}
                    />
                </g>

                {allWalls.map(w => (
                    <line
                        key={w.id}
                        x1={w.start.x}
                        y1={w.start.y}
                        x2={w.end.x}
                        y2={w.end.y}
                        stroke={w.color || WALL_COLOR}
                        strokeWidth={w.thickness || WALL_STROKE_WIDTH}
                        strokeLinecap="round"
                        pointerEvents="none"
                    />
                ))}

                {sorted.map(room => {
                    const {fill, stroke, fillOpacity, strokeOpacity, strokeWidth, isDimmed} = getRoomColors(room);
                    const centroid = getPolygonCentroid(room.points);
                    const pts = room.points.map(p => `${p.x.toFixed(3)},${p.y.toFixed(3)}`).join(" ");

                    return (
                        <g key={room.name}>
                            <polygon
                                points={pts}
                                fill={fill}
                                fillOpacity={fillOpacity}
                                stroke={stroke}
                                strokeWidth={strokeWidth}
                                strokeOpacity={strokeOpacity}
                                strokeLinejoin="round"
                                cursor="pointer"
                                role="button"
                                aria-label={room.name}
                                onClick={() => onRoomClick?.(room.name)}
                                onKeyDown={e => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        onRoomClick?.(room.name);
                                    }
                                }}
                                onMouseEnter={() => setHovered(room.name)}
                                onMouseLeave={() => setHovered(null)}
                            />
                            <text
                                x={centroid.x}
                                y={centroid.y}
                                fill="#f5f5f7"
                                textAnchor="middle"
                                dominantBaseline="central"
                                pointerEvents="none"
                                style={{fontSize: 35, fontWeight: 500, textShadow: "0 1px 3px rgba(0,0,0,0.8)"}}
                            >
                                {room.name}
                            </text>
                        </g>
                    );
                })}
            </svg>

            <Box
                position="absolute"
                bottom={{ base: "64px", md: 3 }}
                right={3}
                zIndex={10}
                bg="rgba(21,21,24,0.85)"
                borderRadius="md"
                px={3}
                py={2}
                pointerEvents="none"
                userSelect="none"
            >
                <Flex direction="column" gap={1.5}>
                    {legendItems.map(item => (
                        <Flex key={item.color} align="center" gap={2}>
                            <Circle size={3} bg={item.color} />
                            <Text fontSize="xs" color="#f5f5f7" lineHeight="1">
                                {item.label}
                            </Text>
                        </Flex>
                    ))}
                </Flex>
            </Box>
        </Box>
    );
}
