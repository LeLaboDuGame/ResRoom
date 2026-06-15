# hooks

Custom React hooks for the roomio frontend.

## `useRooms.js`

- **`useRooms()`** — Fetches and returns the list of all rooms. Polls the API on an interval so data stays fresh without manual refresh.
- **`useRoom(roomName)`** — Fetches a single room by its name. Also polls on an interval. Returns the room object (or `null` while loading / if not found).

Polling intervals are defined inside each hook — check the source for the current value.

## `useClock.js`

- **`useClock()`** — Returns the current time as a formatted string (e.g. `"14:32:05"`). Updates every second via `setInterval`. Useful for UI clocks and timestamps.
