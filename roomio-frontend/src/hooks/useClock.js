import { useEffect, useState } from "react";

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