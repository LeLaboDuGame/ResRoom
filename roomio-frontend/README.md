# ResRoom — Roomio Frontend

Room booking dashboard for the ResRoom ecosystem. Built with **React 19**, **Chakra UI v3**, and **Vite 8**.

## Quick start

```bash
npm install
npm run dev        # development server with HMR
npm run build      # production build
npm run preview    # preview production build locally
```

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 |
| UI library | Chakra UI v3 |
| Build tool | Vite 8 |
| Language | JavaScript (JSX) |
| Routing | react-router-dom |
| HTTP | fetch-based client in `src/api/` |
| Icons | lucide-react |

## Project structure

```
roomio-frontend/
├── public/            Static assets served as-is
├── src/
│   ├── api/           HTTP client for the backend REST API
│   ├── assets/        Static assets (SVGs, floor plan JSON)
│   ├── components/    Reusable UI components by domain
│   │   ├── admin/     Admin panel (rooms, settings, history)
│   │   ├── booking/   Booking form, button, delete modal
│   │   ├── floorplan/ Interactive SVG floor plan
│   │   ├── layout/    App shell and header
│   │   ├── room/      Calendar, room card, info panel, progress
│   │   └── ui/        Generic primitives (Clock, StatusBadge, …)
│   ├── config/        Theme tokens and app settings
│   ├── hooks/         Custom React hooks (useRooms, useSettings, …)
│   ├── pages/         Page components, one per route
│   └── utils/         Pure utility functions (SVG shapes, timeline)
├── index.html         Entry HTML
├── vite.config.js     Vite configuration
└── package.json       Dependencies and scripts
```

## Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/` | `Dashboard` | Floor plan + side panel with daily calendar and booking form |
| `/admin` | `Admin` | Admin panel (rooms, settings, history) |
| `/debug` | `Debug` | Dev/testing page for UI components and API calls |
| `/fleet/:roomName` | `FleetRoom` | Kiosk-style single-room page with split layout and booking |

## Available scripts

- `npm run dev` — Start Vite dev server with HMR
- `npm run build` — Build for production
- `npm run preview` — Preview the production build
- `npm run lint` — Run ESLint
