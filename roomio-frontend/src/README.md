# src/

Application source code for the ResRoom frontend (React 19, Chakra UI v3, Vite 8).

## Directory layout

| Path | Purpose |
|---|---|
| `api/` | HTTP client functions for the backend REST API |
| `config/` | App configuration (theme, settings) |
| `components/` | Reusable UI components, organized by domain (admin, booking, floorplan, layout, room, ui) |
| `hooks/` | Custom React hooks (useRooms, useClock) |
| `pages/` | Page-level components, one per route |
| `utils/` | Pure utility functions (SVG shapes, timeline math) |
| `assets/` | Static assets (SVG, PNG, floor plan data) |

## Key files

- **`main.jsx`** — React entry point, renders `<App />` inside `<ChakraProvider>`
- **`App.jsx`** — Root component with React Router route definitions
- **`App.css`** — App-level styles
- **`index.css`** — Global styles (CSS reset, fonts)
