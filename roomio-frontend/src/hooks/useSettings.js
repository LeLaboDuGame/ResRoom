import { useEffect, useState } from "react";
import { fetchSettings } from "../api/apiCall.js";
import { SETTINGS } from "../config/settings";

/**
 * Fetch global settings (day start/end, notification thresholds) once on mount.
 * Falls back to SETTINGS defaults when the API call fails.
 * @returns {{ dayStart: number, dayEnd: number, startingSoonBefore: number, finishingSoonBefore: number, loading: boolean }}
 */
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
