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
const FINISHING_SOON_COLOR = "var(--chakra-colors-status-finishing-soon)"

const STATUS_COLORS = {
    "Free": {fill: FREE_COLOR, stroke: FREE_COLOR},
    "Starting Soon": {fill: STARTING_SOON_COLOR, stroke: STARTING_SOON_COLOR},
    "Meeting": {fill: MEETING_COLOR, stroke: MEETING_COLOR},
    "Finishing Soon": {fill: FINISHING_SOON_COLOR, stroke: FINISHING_SOON_COLOR},
};

/**
 * Determines the occupancy status of a room from its reservations.
 * @param {Array} reservations List of reservation objects with start/end
 * @returns {"Free"|"Starting Soon"|"Meeting"|"Finishing Soon"} Status string
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
    if (active) {
        return (active.endDate - now) / 60000 <= 15 ? "Finishing Soon" : "Meeting";
    }
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

    // Zoom to selected room
    useEffect(() => {
        if (!selectedRoom) {
            setVb(defaultVb);
            return;
        }
        const room = sorted.find(z => z.name === selectedRoom);
        if (!room || room.points.length < 3) return;
        const xs = room.points.map(p => p.x);
        const ys = room.points.map(p => p.y);
        const minX = Math.min(...xs), maxX = Math.max(...xs);
        const minY = Math.min(...ys), maxY = Math.max(...ys);
        const rw = maxX - minX || 1;
        const rh = maxY - minY || 1;
        const cx = (minX + maxX) / 2;
        const cy = (minY + maxY) / 2;
        const size = Math.max(rw, rh) * 3.5;
        setVb({
            x: cx - size / 2,
            y: cy - size / 2,
            w: Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, size)),
            h: Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, size)),
        });
    }, [selectedRoom, sorted, defaultVb]);

    // Pointer panning (mouse + touch) with 5 px movement threshold
    /**
     * Starts tracking a pan gesture on primary pointer down.
     * @param {React.PointerEvent} e Pointer event
     */
    const handlePointerDown = useCallback(e => {
        if (!e.isPrimary) return;
        panRef.current = {
            mx: e.clientX, my: e.clientY,
            vbX: vb.x, vbY: vb.y,
            started: false,
        };
    }, [vb]);

    /**
     * Updates the viewBox offset while panning after a 5px movement threshold.
     * @param {React.PointerEvent} e Pointer event
     */
    const handlePointerMove = useCallback(e => {
        if (!panRef.current || !e.isPrimary) return;
        const dx = Math.abs(e.clientX - panRef.current.mx);
        const dy = Math.abs(e.clientY - panRef.current.my);
        if (dx < 5 && dy < 5) return;
        if (!panRef.current.started) {
            panRef.current.started = true;
            setIsPanning(true);
            panRef.current.mx = e.clientX;
            panRef.current.my = e.clientY;
            panRef.current.vbX = vb.x;
            panRef.current.vbY = vb.y;
        }
        const rect = svgRef.current?.getBoundingClientRect();
        if (!rect) return;
        const scale = vb.w / rect.width;
        const {vbX, vbY, mx, my} = panRef.current;
        setVb(prev => ({
            ...prev,
            x: vbX - (e.clientX - mx) * scale,
            y: vbY - (e.clientY - my) * scale,
        }));
    }, [vb]);

    /**
     * Ends a pan gesture on primary pointer up or cancel.
     * @param {React.PointerEvent} e Pointer event
     */
    const handlePointerUp = useCallback(e => {
        if (!e.isPrimary) return;
        panRef.current = null;
        setIsPanning(false);
    }, []);

    /**
     * Resets the viewBox to the full floor plan on double-click.
     */
    const handleDblClick = useCallback(() => {
        setVb(defaultVb);
    }, [defaultVb]);

    const vbStr = `${vb.x} ${vb.y} ${vb.w} ${vb.h}`;

    const legendItems = [
        {color: "#43957c", label: "Libre / Free"},
        {color: "#cdac5f", label: "Bientôt occupée / Starting Soon"},
        {color: "#74394d", label: "En réunion / Meeting"},
        {color: "#ff6b9d", label: "Termine / Finishing Soon"},
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

        let fill = colors.fill;
        let stroke = colors.stroke;
        let fillOpacity = 0.25;
        let strokeOpacity = 0.5;
        let strokeWidth = 1.5;

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
                                fontSize={Math.max(8, Math.min(16, (defaultVb.w + defaultVb.h) / 60))}
                                textAnchor="middle"
                                dominantBaseline="central"
                                pointerEvents="none"
                                style={{textShadow: "0 1px 3px rgba(0,0,0,0.8)"}}
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
