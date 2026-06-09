import { useNavigate } from "react-router-dom";
import { Box } from "@chakra-ui/react";
import { useRef, useState, useEffect } from "react";
import floorPlanZones from "../config/floorPlanZones";
import { getStatusBg, getRoomStatus } from "./timelineUtils";
import { getShapePolygon, shapePointsToAttr } from "./shapes";
import colors from "../config/colorTheme";
import bureauShapeSvg from "../assets/BureauShape.svg";

const SVG_VIEWBOX = { w: 2048, h: 2048 };

function darkenColor(hex, amount = 30) {
    const num = parseInt(hex.replace("#", ""), 16);
    const r = Math.max(0, (num >> 16) - amount);
    const g = Math.max(0, ((num >> 8) & 0xff) - amount);
    const b = Math.max(0, (num & 0xff) - amount);
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}



function floorPlanSvgContent() {
    return <image href={bureauShapeSvg} x="0" y="0" width="2048" height="2048" preserveAspectRatio="xMidYMid meet" />;
}

function RoomShape({ shape, fill, opacity }) {
    const { points } = getShapePolygon(shape);
    if (points.length === 0) return null;
    return <polygon points={shapePointsToAttr(points)} fill={fill || "none"} opacity={opacity ?? 1} />;
}

function RoomLabel({ x, y, text, color, bgColor, fontSize, onClick }) {
    const textRef = useRef(null);
    const [rect, setRect] = useState(null);

    useEffect(() => {
        if (textRef.current) {
            const bbox = textRef.current.getBBox();
            setRect({
                x: bbox.x - 2,
                y: bbox.y,
                w: bbox.width + 4,
                h: bbox.height,
            });
        }
    }, [text, fontSize]);

    return (
        <g style={{ cursor: "pointer" }} onClick={onClick}>
            {rect && (
                <rect
                    x={rect.x}
                    y={rect.y}
                    width={rect.w}
                    height={rect.h}
                    rx={2}
                    fill={bgColor || "black"}
                />
            )}
            <text
                ref={textRef}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={color}
                fontWeight="bold"
                style={{ pointerEvents: "none", fontSize: `${fontSize}` }}
            >
                {text}
            </text>
        </g>
    );
}

export function FloorPlan({ rooms, selectedRoom, highlightedRooms }) {
    const navigate = useNavigate();
    const [hoveredZone, setHoveredZone] = useState(null);
    const roomMap = {};
    (rooms || []).forEach(r => {
        roomMap[r.name] = r;
    });

    const sorted = [...floorPlanZones].sort((a, b) => (a.z || 0) - (b.z || 0));

    function centroidOffset(zone) {
        const { centroid } = getShapePolygon(zone.shape);
        const rad = (zone.rot || 0) * Math.PI / 180;
        const rx = centroid.x * Math.cos(rad) - centroid.y * Math.sin(rad);
        const ry = centroid.x * Math.sin(rad) + centroid.y * Math.cos(rad);
        return {
            x: rx * zone.size,
            y: ry * zone.size,
        };
    }

    return (
        <Box w="100%" maxW="1800px" mx="auto">
        <svg
            viewBox={`0 0 ${SVG_VIEWBOX.w} ${SVG_VIEWBOX.h}`}
            style={{ width: "100%", display: "block" }}
        >
            {floorPlanSvgContent()}

            {sorted.map((zone, i) => {
                const room = roomMap[zone.name];
                const statusBg = room ? getStatusBg(getRoomStatus(room.reservations)) : colors.FLOORPLAN_FILL;
                const textColor = room ? statusBg : colors.ACCENT_LIGHT;
                const off = centroidOffset(zone);
                const isHere = selectedRoom && zone.name === selectedRoom;
                const hovered = hoveredZone === zone.name;
                const isHighlighted = highlightedRooms && highlightedRooms.has(zone.name);
                const outOfFilter = highlightedRooms && !isHighlighted;

                let fill = colors.FLOORPLAN_FILL;
                if (isHere) fill = colors.FLOORPLAN_SELECTED;
                else if (isHighlighted) fill = colors.FLOORPLAN_HIGHLIGHTED;
                const labelBg = darkenColor(fill);

                return (
                    <g
                        key={zone.name}
                        style={{ cursor: "pointer" }}
                        onClick={() => navigate(`/rooms/${encodeURIComponent(zone.name)}`)}
                        onMouseEnter={() => setHoveredZone(zone.name)}
                        onMouseLeave={() => setHoveredZone(null)}
                    >
                        <g
                            transform={`translate(${zone.x}, ${zone.y}) rotate(${zone.rot || 0}) scale(${zone.size})`}
                        >
                            <g
                                style={{
                                    transition: "transform 0.2s ease",
                                    transformBox: "fill-box",
                                    transformOrigin: "center",
                                    transform: hovered ? "scale(1.15)" : "scale(1)",
                                }}
                            >
                                <RoomShape shape={zone.shape} fill={fill} opacity={outOfFilter ? 0.15 : 1} />
                            </g>
                        </g>

                        <RoomLabel
                            x={zone.x + off.x}
                            y={zone.y + off.y}
                            text={zone.name}
                            color={textColor}
                            bgColor={labelBg}
                            fontSize={zone.size / 5}
                            onClick={() => navigate(`/rooms/${encodeURIComponent(zone.name)}`)}
                        />
                    </g>
                );
            })}
        </svg>
        </Box>
    );
}

export function renderFloorPlan(rooms, selectedRoom, highlightedRooms) {
    return <FloorPlan rooms={rooms} selectedRoom={selectedRoom} highlightedRooms={highlightedRooms} />;
}
