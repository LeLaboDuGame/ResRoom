/**
 * SVG circular progress indicator showing elapsed meeting time proportionally.
 * Displays remaining time (in min or h+min) at the center.
 * @param {string} start Reservation start datetime ("YYYY-MM-DD HH:mm")
 * @param {string} end Reservation end datetime ("YYYY-MM-DD HH:mm")
 * @param {number} [size=120] Circle diameter in pixels
 * @returns {JSX.Element} The rendered meeting progress circle
 */
export function MeetingProgress({start, end, size = 120}) {
    const now = new Date();
    const startDt = new Date(start.replace(" ", "T"));
    const endDt = new Date(end.replace(" ", "T"));
    const total = endDt - startDt;
    const elapsed = now - startDt;
    const ratio = total > 0 ? Math.min(Math.max(elapsed / total, 0), 1) : 0;

    const remainingMs = Math.max(endDt - now, 0);
    const remainingMin = Math.ceil(remainingMs / 60000);
    const label = remainingMin >= 60
        ? `${Math.floor(remainingMin / 60)}h${remainingMin % 60}`
        : `${remainingMin}min`;

    const r = 45;
    const circ = 2 * Math.PI * r;
    const offset = circ * (1 - ratio)

    return (
        <svg width={size} height={size} viewBox="0 0 100 100">
            <circle
                cx="50" cy="50" r={r}
                fill="none"
                stroke="#2c2c30"
                strokeWidth="6"
            />
            <circle
                cx="50" cy="50" r={r}
                fill="none"
                stroke="#f87171"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={offset}
                transform="rotate(-90 50 50)"
                style={{transition: "stroke-dashoffset 1s linear"}}
            />
            <text
                x="50" y="50"
                textAnchor="middle"
                dominantBaseline="central"
                fill="#f5f5f7"
                fontSize="14"
                fontWeight="bold"
            >
                {label}
            </text>
        </svg>
    );
}
