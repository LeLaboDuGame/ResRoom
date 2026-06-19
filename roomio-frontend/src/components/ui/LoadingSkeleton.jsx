/** Animated skeleton placeholder for loading states.
* @param {string} [variant] Skeleton shape: "text", "circle", or "card"
* @returns {JSX.Element} The loading skeleton
*/
export function LoadingSkeleton({ variant = "text", ...props }) {
  useEffect(() => {
    const id = "skeleton-keyframes";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = `
      @keyframes skeleton-pulse {
        0%, 100% { opacity: 0.3; }
        50% { opacity: 0.6; }
      }
    `;
    document.head.appendChild(style);
  }, []);

  const style = variants[variant] || variants.text;

  return (
    <Box
      bg="border.default"
      animation="skeleton-pulse 1.5s ease-in-out infinite"
      {...style}
      {...props}
    />
  );
}
