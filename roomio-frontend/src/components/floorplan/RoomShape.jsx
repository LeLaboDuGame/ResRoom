/**
 * Clickable SVG polygon representing a room.
 * Supports selected (blue highlight) and dimmed (low opacity) states.
 * @param {Array<{x: number, y: number}>} polygon Room polygon vertices
 * @param {string} name Room name (displayed as label)
 * @param {string} [color="#ffffff"] Fill/stroke color
 * @param {Function} [onClick] Click handler, receives room name
 * @param {boolean} [selected] Highlight with blue accent
 * @param {boolean} [dimmed] Reduce opacity
 * @return {JSX.Element} SVG group with polygon and label
 */
export function RoomShape({ polygon, name, color, onClick, selected, dimmed }) {
  const points = polygon.map(p => `${p.x},${p.y}`).join(" ");

  const cx = polygon.reduce((s, p) => s + p.x, 0) / polygon.length;
  const cy = polygon.reduce((s, p) => s + p.y, 0) / polygon.length;

  return (
    <g>
      <polygon
        points={points}
        fill={color || "#ffffff"}
        fillOpacity={dimmed ? 0.08 : selected ? 0.25 : 0.12}
        stroke={selected ? "#4f8cff" : color || "#ffffff"}
        strokeWidth={selected ? 2.5 : 1}
        strokeOpacity={dimmed ? 0.3 : 0.5}
        cursor="pointer"
        role="button"
        tabIndex={0}
        aria-label={`Room ${name}`}
        onClick={() => onClick?.(name)}
        onKeyDown={e => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick?.(name);
          }
        }}
        transition="all 0.2s"
        style={{ outline: "none" }}
      />
      {name && (
        <text
          x={cx}
          y={cy}
          fill="#f5f5f7"
          fontSize="10"
          textAnchor="middle"
          dominantBaseline="central"
          pointerEvents="none"
        >
          {name}
        </text>
      )}
    </g>
  );
}
