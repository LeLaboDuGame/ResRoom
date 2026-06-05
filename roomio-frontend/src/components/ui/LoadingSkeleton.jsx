import { useEffect } from "react";
import { Box } from "@chakra-ui/react";

const variants = {
  text: { h: 4, w: "full", borderRadius: "sm" },
  circle: { w: 10, h: 10, borderRadius: "full" },
  card: { h: 32, w: "full", borderRadius: "lg" },
};

/**
 * Loading skeleton with pulse animation.
 * @param {string} [variant="text"] Skeleton shape variant
 * @return {JSX.Element} Skeleton element
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
