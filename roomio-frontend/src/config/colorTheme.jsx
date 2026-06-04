// ──────────────────────────────────────────────
// Palette de couleurs centralisée — RoomIO
// Modifie les valeurs ici pour changer le thème
// ──────────────────────────────────────────────

const colors = {

  // ── Général ────────────────────────────────
  PAGE_BG: "#547D54",
  CARD_BG: "#fefaeb",
  CARD_BORDER: "#9EAD84",
  DIVIDER: "#38573F",

  // ── Texte ─────────────FEF9DCFF─────────────────────
  TEXT_PRIMARY: "#324C40",
  TEXT_SECONDARY: "#38573F",
  TEXT_ON_DARK: "#D5D1C6",
  TEXT_MUTED: "#547D54",

  // ── Accent (vert) ──────────────────────────
  ACCENT: "#547D54",
  ACCENT_LIGHT: "#9EAD84",
  ACCENT_HOVER: "#38573F",

  // ── Statuts des salles ─────────────────────
  STATUS_FREE: "#c2ff9d",
  STATUS_STARTING_SOON: "#f8d6ad",
  STATUS_MEETING: "#eb7272",
  STATUS_FINISHING_SOON: "#ffa1a1",
  STATUS_DEFAULT: "#547D54",

  // ── Plan d'étage ───────────────────────────
  FLOORPLAN_FILL: "#324C40",
  FLOORPLAN_SELECTED: "#9EAD84",
  FLOORPLAN_HIGHLIGHTED: "#547D54",
  FLOORPLAN_LABEL_BG: "#324C40",
  FLOORPLAN_TEXT: "#D5D1C6",

  // ── Danger / Suppression ───────────────────
  DANGER: "#38573F",
  DANGER_HOVER: "#324C40",
  DANGER_FOCUS: "#38573F",
  OVERLAY: "rgba(50, 76, 64, 0.4)",

  // ── Timeline ───────────────────────────────
  TIMELINE_TRACK_BG: "#B8C9A0",
  TIMELINE_TRACK_BORDER: "green.800",
  TIMELINE_TRACK_HOVER_BG: "#9EAD84",
  TIMELINE_TRACK_HOVER_BORDER: "#547D54",
  TIMELINE_GRID_LINE: "black",
  TIMELINE_NOW_DOT_BG: "red",
  TIMELINE_NOW_LINE_BG: "red",
  TIMELINE_NOW_GLOW: "red",
  TIMELINE_LINE_GLOW: "red",

  // ── Boutons ────────────────────────────────
  BUTTON_PRIMARY_BG: "#547D54",
  BUTTON_PRIMARY_COLOR: "#D5D1C6",
  BUTTON_PRIMARY_HOVER: "#38573F",
  BUTTON_OUTLINE_BORDER: "#9EAD84",
  BUTTON_OUTLINE_COLOR: "#324C40",
  BUTTON_BACK_BG: "#9EAD84",
  BUTTON_BACK_COLOR: "#D5D1C6",
  BUTTON_BACK_HOVER: "#547D54",

  // ── Inputs ─────────────────────────────────
  INPUT_BG: "#D5D1C6",
  INPUT_BORDER: "#9EAD84",
  INPUT_COLOR: "#324C40",
  INPUT_FOCUS_BORDER: "#547D54",
  INPUT_PLACEHOLDER: "#38573F",

  // ── Badges ─────────────────────────────────
  BADGE_TEXT: "black",

  // ── Loader ─────────────────────────────────
  SPINNER_COLOR: "#547D54",
  LOADING_TEXT: "#D5D1C6",

  // ── Palette des réservations (7 paires) ───
  RESERVATION_PALETTE: [
    { border: "#9B6A6C", bg: "#E2B4BD" },
    { border: "#2B6CB0", bg: "#BEE3F8" },
    { border: "#B7791F", bg: "#FEFCBF" },
    { border: "#276749", bg: "#C6F6D5" },
    { border: "#805AD5", bg: "#E9D8FD" },
    { border: "#C05621", bg: "#FEEBCB" },
    { border: "#319795", bg: "#B2F5EA" },
  ],

  // ── Jours ──────────────────────────────────
  DAY_PILL_SELECTED: "#547D54",
  DAY_PILL_DEFAULT: "#9EAD84",
  DAY_PILL_HOVER: "#547D54",
  DAY_PILL_TEXT: "#D5D1C6",

};

export default colors;
