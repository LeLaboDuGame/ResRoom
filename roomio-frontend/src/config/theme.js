import { createSystem, defaultConfig, mergeConfigs } from "@chakra-ui/react";

const customConfig = {
  theme: {
    tokens: {
      colors: {
        bg: {
          primary:   { value: "#0a0a0b" },
          secondary: { value: "#141416" },
          elevated:  { value: "#1c1c1f" },
        },
        border: {
          default: { value: "#2c2c30" },
          hover:   { value: "#3d3d44" },
        },
        text: {
          primary:   { value: "#f5f5f7" },
          secondary: { value: "#a0a0ab" },
          muted:     { value: "#6b6b76" },
        },
        accent: {
          default: { value: "#4f8cff" },
          hover:   { value: "#3b72e3" },
          muted:   { value: "#1a3366" },
          text:    { value: "#ffffff" },
        },
        status: {
          free:          { value: "#34d399" },
          startingSoon:  { value: "#fbbf24" },
          meeting:       { value: "#f87171" },
          finishingSoon: { value: "#fb923c" },
        },
        danger:  { value: "#f87171" },
        overlay: { value: "rgba(0,0,0,0.6)" },
        success: { value: "#34d399" },
        warning: { value: "#fbbf24" },
      },
      radii: {
        sm:  { value: "4px" },
        md:  { value: "8px" },
        lg:  { value: "12px" },
        xl:  { value: "16px" },
        full: { value: "9999px" },
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
          primary:   { value: "{colors.bg.primary}" },
          secondary: { value: "{colors.bg.secondary}" },
          elevated:  { value: "{colors.bg.elevated}" },
        },
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
