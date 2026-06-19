import { useEffect, useState } from "react";
import { fetchSettings } from "../api/apiCall.js";
import { SETTINGS } from "../config/settings";

export function useSettings() {
  const [settings, setSettings] = useState({
    dayStart: SETTINGS.DAY_START,
    dayEnd: SETTINGS.DAY_END,
    startingSoonBefore: SETTINGS.STATUS_BEFORE,
    finishingSoonBefore: SETTINGS.STATUS_BEFORE,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await fetchSettings();
        if (!cancelled) setSettings(data.settings);
      } catch {
        // keep defaults
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return { ...settings, loading };
}
