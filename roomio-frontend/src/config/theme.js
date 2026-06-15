/**
 * Chakra UI v3 theme configuration for the Roomio application.
 *
 * Defines a custom dark colour palette, border radii, shadows,
 * semantic colour tokens, and responsive breakpoints.
 *
 * @module config/theme
 */

import { createSystem, defaultConfig, mergeConfigs } from "@chakra-ui/react";

const customConfig = {
  theme: {
    tokens: {
      colors: {
        rawBg: {
          primary:  { value: "#0a0a0b" },
          secondary:{ value: "#141416" },
          elevated: { value: "#1c1c1f" },
        },
        rawBorder: {
          default:  { value: "#2c2c30" },
          hover:    { value: "#3d3d44" },
        },
        rawText: {
          primary:  { value: "#f5f5f7" },
          secondary:{ value: "#a0a0ab" },
          muted:    { value: "#6b6b76" },
        },
        rawAccent: {
          default:  { value: "#4f8cff" },
          hover:    { value: "#3b72e3" },
          muted:    { value: "#1a3366" },
          text:     { value: "#ffffff" },
        },
        rawStatus: {
          free:          { value: "#34d399" },
          startingSoon:  { value: "#fbbf24" },
          meeting:       { value: "#f87171" },
          finishingSoon: { value: "#fb923c" },
        },
        rawDanger:  { value: "#f87171" },
        rawOverlay: { value: "rgba(0,0,0,0.6)" },
        rawSuccess: { value: "#34d399" },
        rawWarning: { value: "#fbbf24" },
      },
      radii: {
        sm:  { value: "4px" },
        md:  { value: "8px" },
        lg:  { value: "12px" },
        xl:  { value: "16px" },
        full:{ value: "9999px" },
      },
      shadows: {
        sm: { value: "0 1px 2px rgba(0,0,0,0.3)" },
        md: { value: "0 4px 12px rgba(0,0,0,0.4)" },
        lg: { value: "0 8px 24px rgba(0,0,0,0.5)" },
        xl: { value: "0 12px 40px rgba(0,0,0,0.6)" },
      },
    },
    semanticTokens: {
      colors: {
        bg: {
          primary:  { value: "{colors.rawBg.primary}" },
          secondary:{ value: "{colors.rawBg.secondary}" },
          elevated: { value: "{colors.rawBg.elevated}" },
        },
        border: {
          default:  { value: "{colors.rawBorder.default}" },
          hover:    { value: "{colors.rawBorder.hover}" },
        },
        text: {
          primary:  { value: "{colors.rawText.primary}" },
          secondary:{ value: "{colors.rawText.secondary}" },
          muted:    { value: "{colors.rawText.muted}" },
        },
        accent: {
          default:  { value: "{colors.rawAccent.default}" },
          hover:    { value: "{colors.rawAccent.hover}" },
          muted:    { value: "{colors.rawAccent.muted}" },
          text:     { value: "{colors.rawAccent.text}" },
        },
        status: {
          free:          { value: "{colors.rawStatus.free}" },
          startingSoon:  { value: "{colors.rawStatus.startingSoon}" },
          meeting:       { value: "{colors.rawStatus.meeting}" },
          finishingSoon: { value: "{colors.rawStatus.finishingSoon}" },
        },
        danger:  { value: "{colors.rawDanger}" },
        overlay: { value: "{colors.rawOverlay}" },
        success: { value: "{colors.rawSuccess}" },
        warning: { value: "{colors.rawWarning}" },
      },
    },
    breakpoints: {
      sm: "640px",
      md: "1024px",
      lg: "1200px",
    },
  },
};

const config = mergeConfigs(defaultConfig, customConfig);
export const system = createSystem(config);
