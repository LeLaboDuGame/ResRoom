import { useEffect, useState } from "react";

/**
 * Hook that returns the current local time as a formatted string (HH:MM:SS).
 * Updates every second.
 *
 * @returns {string} Current time formatted for fr-FR locale (e.g. "14:05:32")
 */
export function useClock() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () => {
      const now = new Date();

      setTime(
        now.toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };

    update();
    const interval = setInterval(update, 1000);

    return () => clearInterval(interval);
  }, []);

  return time;
}