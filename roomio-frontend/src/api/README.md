# api

`apiCall.js` — API client wrapping `fetch()` calls to the backend. Exports:
fetchRooms, fetchRoom, createRoom, createReservation, deleteReservation,
updateRoom, deleteRoom, uploadPhoto, fetchHistory, fetchSettings, updateSettings.

All functions return parsed JSON and throw on non-OK responses.
