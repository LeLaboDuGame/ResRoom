# ResRoom

ResRoom is a web application for managing meeting room reservations across a fleet of rooms. It provides real-time room
status display, floor plan views, and a full booking workflow (create, edit, cancel reservations) plus an admin panel.
The backend uses FastAPI with JSON file persistence (no database), and the frontend is built with React 19 and Chakra UI
v3, bundled with Vite 8. Room data is refreshed via polling.

---

## Summary

1. [Tech Stack](#tech-stack)
2. [Project Structure & Readme Redirection](#project-structure--readme-redirection)
3. [Project Architecture](#project-architecture)
    - [Backend](#backend-1)
    - [Frontend](#frontend-1)
4. [Personalization](#personalization)
    - [How to add/edit an existing room?](#how-to-addedit-an-existing-room)
    - [How to edit the interactive plan?](#how-to-edit-the-interactive-plan)
    - [Global Settings](#global-settings)

---

## Tech Stack

| Side              | Tech                                                                                  |
|-------------------|---------------------------------------------------------------------------------------|
| **Backend**       | - Python 3.14- FastAPI (API)- JSON file storage(provisional) (Database)               |
| **Frontend**      | - React 19- ChakraUI v3 (Style)- React Router v7(Web Rootage)- Vite 8- Lucide (Icons) |
| **Communication** | REST API over HTTP, polling-based updates (no WebSocket)                              |

---

## Project Structure & Readme Redirection

#### Backend

- [`backend/`](backend/README.md) — API server (FastAPI)

#### Frontend

- [`roomio-frontend/src/`](roomio-frontend/src/README.md) — Entry point
    - [`api/`](roomio-frontend/src/api/README.md) — API client functions
    - [`components/`](roomio-frontend/src/components/README.md)
        - [`admin/`](roomio-frontend/src/components/admin/README.md) — Admin panel components
        - [`booking/`](roomio-frontend/src/components/booking/README.md) — Booking form & modal
        - [`floorplan/`](roomio-frontend/src/components/floorplan/README.md) — Floor plan view
        - [`layout/`](roomio-frontend/src/components/layout/README.md) — App shell & header
        - [`room/`](roomio-frontend/src/components/room/README.md) — Room cards & details
        - [`ui/`](roomio-frontend/src/components/ui/README.md) — Reusable UI primitives
    - [`config/`](roomio-frontend/src/config/README.md) — Settings & theme
    - [`hooks/`](roomio-frontend/src/hooks/README.md) — Custom React hooks
    - [`pages/`](roomio-frontend/src/pages/README.md) — Page-level components
    - [`utils/`](roomio-frontend/src/utils/README.md) — Utility functions

---

## Project Architecture

### Backend

> The webserver is considered to be in the same part as the frontend and will not be discussed here.

- The backend is essentially just an api that is used to call end-point.
  The api is only able to be called locally meaning that the webserver has to call for the client the
  api. This ensures security and avoid direct call to the api.
- The backend is split between two parts: the database and the api itself. Of course,
  they are intrinsically linked.

#### Database:

- For the moment, the database is only a json file but will be moved to a sql one later in the development
  process
- The file `db.py` has the role of making an interface between the physical database and the api.

#### Api:

- The api run under fastapi and fastapi use uvicorn a low level web server using ASGI specification.
- Purposes of using fastapi are:
-
    - Easy to build and understand
-
    - Professional solution
-
    - Security: the repository is often updated
-
    - Able to parse easily url and bodys

### Frontend

> In the project, we can see the front end as a user interface. <br>
> The backend and the webserver are two different entity running on two different server. <br>
> Meaning that two ports are used. One for the backend and the other for the webserver disscused in this section.

#### Web server:

- The web server is build under `Vite` enabling fast reload when changes (faster development), compile files to static
  ones (HTML/CSS/JS).
- `React Router` is used to access multiple page: single-page(without) -> multiple-page(with)
- Runtime: `Node.js`

#### UI and Framework

- The project use `React` as UI Framework.
- As React is just a library that don't contain "style components", ResRoom use `ChakraUI` giving multiple, customizable
  and powerful component like: Box, Text, Image, Form, Menu, ...
- Some icons are used inside some UI components, so we use `Lucide` that give a SVG image pack as `React` component.

---

## Personalization

> Here is explained how to configure the project manually. You have also a web interface on `{URL}/admin` that allow you
> to edit most of the settings. However, some of the settings need to be change manually in the files.
---

### How to add/edit an existing room?

> In this section you will be able to change:
> - Room name
> - Capacity
> - Does the room have a TV?
> - Does the room have a whiteboard?
> - Does the room have a computer?

- Go to the file `~/backend/database.json`.

> As python reformat the json to be fit in one line, the content can be hard to read. The solution is to use an ide that
> will reformat the code or an online reformater of json file.

- In the section `"rooms"` are exposed all information about every room.
- To add a new one you simply need to put a new dictionary respecting the same format as other rooms inside the list
  `"rooms"`
- Save the `database.json` and restart `FastAPI`

---

### How to edit the interactive plan?

> The interactive plan is a bit hard to edit manually. This is why this section will explain how to edit the plan with
> https://app.openplan3d.com/

#### Why you want to edit the interactive plan?

- To place a new room previously add in the `database.json`
- Edit the name of a room on the plan
- Resize a room
- Remove a room on the plan
- etc.

#### What is OpenPlan3D?

OpenPlan3D is an opensource web app designed to create home plan. It is simple to used and available online. <br>
For those reasons OpenPlan3D is the perfect choice.

#### How to use OpenPlan3D to edit our plan?

1. First of all, you need to download/have access to the file `plan.json` found at <br>
   `roomio-frontend/src/assets/plan/plan.json`
2. Then go to https://app.openplan3d.com/.
3. Click on the blue button `New Project` at top right of the page. This will open a new tab with the editor.
4. Then we want to import our plan.json. Click on the button `Export` at top right of the page. Then click on
   `Import JSON`.
5. Everything should be there: t
    - the background plan
    - every room with their names
6. You now want to edit. You can add wall by clicking on the button `Draw Wall` on the left side menu.<br>
   Edit the name of a room or maybe change her shape.

> **Warning:** Remember that a correct room need to have a close shape and a correct name matching the one in the
`database.json`.

> The editor don't allow spaces in the name. To counter that, either you put a "_" or you copi-past a space directly

7. Next, when edit are done, you can click again on the `Export` button and press the `Download JSON` button.

> It is recommended sometimes to manually adjust the scale of the background plan. For that edit the JSON file. At the
> end you gonna find `backgroundImage` then `scale`. Edit the scale parameter to fit the backgroundImage with rooms. For
> the default svg image `BureauShape.svg` it is recommended to put the scale value to `1.9`

9. Then replace the existing `plan.json` with the new one. Make sure that the name of the file is `plan.json`
10. Reload the server.

---

### Global Settings

> Global settings are settings that rule the whole system as when the day start or when it ends.

To edit global settings, go to the `database.json`. At the bottom of the file, the section `"settings"` regroup every
global settings.

```json
// database.json
{
  ...,
  "settings": {
    // in hours, the time when the day starts.
    "dayStart": 7,
    // in hours, the time when the day ends
    "dayEnd": 22,
    // in minutes, the time before saying that a meeting will starting soon
    "startingSoonBefore": 15,
    // in minutes, the time before saying that a meeting will end soon
    "finishingSoonBefore": 15
  }
}
```