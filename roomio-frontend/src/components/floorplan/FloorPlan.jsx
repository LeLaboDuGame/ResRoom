import {useState, useMemo, useRef, useCallback, useEffect} from "react";
import {Box, Flex, Circle, Text} from "@chakra-ui/react";
import {getShapePolygon, shapePointsToAttr} from "../../utils/shapes";
import bureauShapeSvg from "../../assets/BureauShape.svg";
import planData from "../../assets/plan/plan.json";

const VB_SIZE = 2048;
const MIN_ZOOM = 300;
const MAX_ZOOM = 4096;

const STATUS_COLORS = {
    "Free": {fill: "#ffffff", stroke: "#ffffff"},
    "Starting Soon": {fill: "#4f8cff", stroke: "#4f8cff"},
    "Meeting": {fill: "#e74c3c", stroke: "#e74c3c"},
    "Finishing Soon": {fill: "#ff6b9d", stroke: "#ff6b9d"},
};

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

function centroidOffset(zone) {
    const {centroid} = getShapePolygon(zone.shape);
    const rad = (zone.rot || 0) * Math.PI / 180;
    return {
        x: (centroid.x * Math.cos(rad) - centroid.y * Math.sin(rad)) * zone.size,
        y: (centroid.x * Math.sin(rad) + centroid.y * Math.cos(rad)) * zone.size,
    };
}

export function FloorPlan({rooms, selectedRoom, dimmedRooms, onRoomClick}) {
    const [vb, setVb] = useState({x: 0, y: 0, w: VB_SIZE, h: VB_SIZE});
    const [hovered, setHovered] = useState(null);
    const [isPanning, setIsPanning] = useState(false);
    const svgRef = useRef(null);
    const panRef = useRef(null);
    const vbRef = useRef(vb);
    vbRef.current = vb;

    const roomMap = useMemo(() => {
        const m = {};
        (rooms || []).forEach(r => m[r.name] = r);
        return m;
    }, [rooms]);

    const sorted = useMemo(() => {
        const floor = planData.floors?.[0];
        if (!floor) return [];
        return (floor.rooms || [])
            .filter(r => r.zone)
            .map(r => ({
                name: r.name,
                shape: r.zone.shape,
                x: r.zone.x,
                y: r.zone.y,
                size: r.zone.size,
                rot: r.zone.rot || 0,
                z: r.zone.z || 0,
            }))
            .sort((a, b) => (a.z || 0) - (b.z || 0));
    }, []);

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
            setVb({x: 0, y: 0, w: VB_SIZE, h: VB_SIZE});
            return;
        }
        const zone = sorted.find(z => z.name === selectedRoom);
        if (!zone) return;
        const zw = zone.size * 3.5;
        const zh = zone.size * 3.5;
        setVb({
            x: zone.x - zw / 2,
            y: zone.y - zh / 2,
            w: Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zw)),
            h: Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zh)),
        });
    }, [selectedRoom, sorted]);

    // Pointer panning (mouse + touch) with 5 px movement threshold
    const handlePointerDown = useCallback(e => {
        if (!e.isPrimary) return;
        panRef.current = {
            mx: e.clientX, my: e.clientY,
            vbX: vb.x, vbY: vb.y,
            started: false,
        };
    }, [vb]);

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

    const handlePointerUp = useCallback(e => {
        if (!e.isPrimary) return;
        panRef.current = null;
        setIsPanning(false);
    }, []);

    const handleDblClick = useCallback(() => {
        setVb({x: 0, y: 0, w: VB_SIZE, h: VB_SIZE});
    }, []);

    const vbStr = `${vb.x} ${vb.y} ${vb.w} ${vb.h}`;

    const legendItems = [
        {color: "#ffffff", label: "Libre / Free"},
        {color: "#4f8cff", label: "Bientôt libre / Starting Soon"},
        {color: "#74394d", label: "En réunion / Meeting"},
        {color: "#ff6b9d", label: "Termine / Finishing Soon"},
    ];

    function getZoneColors(zone) {
        const room = roomMap[zone.name];
        const status = room ? getRoomStatus(room.reservations) : "Free";
        const colors = STATUS_COLORS[status] || STATUS_COLORS.Free;
        const isSelected = selectedRoom && zone.name === selectedRoom;
        const isDimmed = dimmedRooms?.length > 0 && !dimmedRooms.includes(zone.name);
        const isHovered = hovered === zone.name;

        let fill = colors.fill;
        let stroke = colors.stroke;
        let fillOpacity = 0.12;
        let strokeOpacity = 0.5;
        let strokeWidth = 1;

        if (isDimmed) {
            fillOpacity = 0.04;
            strokeOpacity = 0.15;
        }
        if (isSelected) {
            fill = "#4f8cff";
            stroke = "#4f8cff";
            fillOpacity = 0.25;
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
                    x="0"
                    y="0"
                    width={VB_SIZE}
                    height={VB_SIZE}
                    fill="#151518"
                    rx="4"
                />

                <image
                    href={bureauShapeSvg}
                    x="0"
                    y="0"
                    width={VB_SIZE}
                    height={VB_SIZE}
                    preserveAspectRatio="xMidYMid meet"
                    draggable={false}
                    style={{
                        filter: "invert(0.92)",
                        pointerEvents: "none",
                        userSelect: "none",
                        WebkitUserSelect: "none",
                    }}
                />

                {sorted.map(zone => {
                    const {points} = getShapePolygon(zone.shape);
                    if (points.length === 0) return null;
                    const {fill, stroke, fillOpacity, strokeOpacity, strokeWidth, isDimmed} = getZoneColors(zone);
                    const off = centroidOffset(zone);

                    return (
                        <g key={zone.name}>
                            <g
                                transform={`translate(${zone.x}, ${zone.y}) rotate(${zone.rot || 0}) scale(${zone.size})`}
                            >
                                <g>
                                    <polygon
                                        points={shapePointsToAttr(points)}
                                        fill={fill}
                                        fillOpacity={fillOpacity}
                                        stroke={stroke}
                                        strokeWidth={strokeWidth}
                                        strokeOpacity={strokeOpacity}
                                        strokeLinejoin="round"
                                        vectorEffect="non-scaling-stroke"
                                        cursor="pointer"
                                        role="button"
                                        aria-label={zone.name}
                                        onClick={() => onRoomClick?.(zone.name)}
                                        onKeyDown={e => {
                                            if (e.key === "Enter" || e.key === " ") {
                                                e.preventDefault();
                                                onRoomClick?.(zone.name);
                                            }
                                        }}
                                        onMouseEnter={() => setHovered(zone.name)}
                                        onMouseLeave={() => setHovered(null)}
                                    />
                                </g>
                            </g>
                            <text
                                x={zone.x + off.x}
                                y={zone.y + off.y}
                                fill="#f5f5f7"
                                fontSize={Math.max(8, Math.min(16, zone.size / 5))}
                                textAnchor="middle"
                                dominantBaseline="central"
                                pointerEvents="none"
                                style={{textShadow: "0 1px 3px rgba(0,0,0,0.8)"}}
                            >
                                {zone.name}
                            </text>
                        </g>
                    );
                })}
            </svg>

            <Box
                position="absolute"
                bottom={3}
                right={3}
                bg="#46464b"
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
