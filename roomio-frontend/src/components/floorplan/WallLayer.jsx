/**
 * SVG layer rendering floor plan walls.
 * Each wall is a line between its start and end points.
 * @param {Array} walls Array of wall objects with {id, start, end, color?, thickness?}
 * @param {string} [stroke="#444444"] Default stroke color
 * @param {number} [strokeWidth=2] Default stroke width
 * @return {JSX.Element} SVG group of wall lines
 */
export function WallLayer({ walls, stroke = "#444444", strokeWidth = 2 }) {
  return (
    <g>
      {walls.map(w => (
        <line
          key={w.id}
          x1={w.start.x}
          y1={w.start.y}
          x2={w.end.x}
          y2={w.end.y}
          stroke={w.color || stroke}
          strokeWidth={w.thickness ? w.thickness * 0.15 : strokeWidth}
          strokeLinecap="round"
        />
      ))}
    </g>
  );
}
