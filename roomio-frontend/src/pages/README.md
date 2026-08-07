# pages

Page-level components, one per route.

## `Dashboard.jsx`
Main landing page. Shows an overview of all rooms with filtering controls and an interactive floor plan. The primary entry point for most users.

## `FleetRoom.jsx`
Detail page for a single room. Includes a booking timeline, reservation controls, and room metadata. Accessed via `/rooms/:roomName`.

## `Admin.jsx`
Admin panel. Lets authorized users manage room definitions, update settings, and browse historical booking data.

## `Debug.jsx`
Developer-only debug panel. Provides raw access to test API endpoints, inspect responses, and troubleshoot connectivity issues. Not exposed in production builds.
