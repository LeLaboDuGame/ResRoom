# utils

Utility functions and reusable components that don't fit neatly elsewhere.

## `shapes.js`

Generates SVG polygon coordinate arrays for rendering room shapes on the floor plan. Each function takes dimensions/parameters and returns a string of `x,y` pairs suitable for an SVG `<polygon points="...">` attribute. Keeps the floor plan logic decoupled from the SVG markup.

## `timelineUtils.jsx`

Mixed bag of timeline helpers and a companion React component:

- Utility functions for calculating event positions, durations, and overlaps on a time axis.
- **`RoomTimeline`** — A React component that renders the interactive booking timeline used on the room detail page.

Consider splitting the pure calculation functions into a separate file if the component keeps growing.
