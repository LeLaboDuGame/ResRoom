# ResRoom

ResRoom is a web application for managing meeting room reservations across a fleet of rooms. It provides real-time room  
status display, floor plan views, and a full booking workflow (create, edit, cancel reservations) plus an admin panel.  
The backend uses FastAPI with JSON file persistence (no database), and the frontend is built with React 19 and Chakra UI  
v3, bundled with Vite 8. Room data is refreshed via polling.

## Summary

1.  [Tech Stack](http://openproject.ecm-be.local/#tech-stack)
    
2.  [Project Structure &amp; Readme Redirection](http://openproject.ecm-be.local/#project-structure--readme-redirection)
    
3.  [Project Architecture](http://openproject.ecm-be.local/#project-architecture)
    
    *   [Backend](http://openproject.ecm-be.local/#backend-1)
        
    *   [Frontend](http://openproject.ecm-be.local/#frontend-1)
        
4.  [Personalization](http://openproject.ecm-be.local/#personalization)
    
    *   [How to add/edit an existing room?](http://openproject.ecm-be.local/#how-to-addedit-an-existing-room)
        
    *   [How to edit the interactive plan?](http://openproject.ecm-be.local/#how-to-edit-the-interactive-plan)
        
    *   [Global Settings](http://openproject.ecm-be.local/#global-settings)
        

## Tech Stack

<figure class="table op-uc-figure_align-center op-uc-figure"><table class="op-uc-table"><thead class="op-uc-table--head"><tr class="op-uc-table--row"><th class="op-uc-table--cell op-uc-table--cell_head"><p class="op-uc-p">Side</p></th><th class="op-uc-table--cell op-uc-table--cell_head"><p class="op-uc-p">Tech</p></th></tr></thead><tbody><tr class="op-uc-table--row"><td class="op-uc-table--cell"><p class="op-uc-p"><strong>Backend</strong></p></td><td class="op-uc-table--cell"><p class="op-uc-p">- Python 3.14- FastAPI (API)- JSON file storage(provisional) (Database)</p></td></tr><tr class="op-uc-table--row"><td class="op-uc-table--cell"><p class="op-uc-p"><strong>Frontend</strong></p></td><td class="op-uc-table--cell"><p class="op-uc-p">- React 19- ChakraUI v3 (Style)- React Router v7(Web Rootage)- Vite 8- Lucide (Icons)</p></td></tr><tr class="op-uc-table--row"><td class="op-uc-table--cell"><p class="op-uc-p"><strong>Communication</strong></p></td><td class="op-uc-table--cell"><p class="op-uc-p">REST API over HTTP, polling-based updates (no WebSocket)</p></td></tr></tbody></table></figure>

## Project Structure &amp; Readme Redirection

#### Backend

*   [`backend/`](http://openproject.ecm-be.local/backend/README.md) — API server (FastAPI)
    

#### Frontend

*   [`roomio-frontend/src/`](http://openproject.ecm-be.local/roomio-frontend/src/README.md) — Entry point
    
    *   [`api/`](http://openproject.ecm-be.local/roomio-frontend/src/api/README.md) — API client functions
        
    *   [`components/`](http://openproject.ecm-be.local/roomio-frontend/src/components/README.md)
        
        *   [`admin/`](http://openproject.ecm-be.local/roomio-frontend/src/components/admin/README.md) — Admin panel components
            
        *   [`booking/`](http://openproject.ecm-be.local/roomio-frontend/src/components/booking/README.md) — Booking form &amp; modal
            
        *   [`floorplan/`](http://openproject.ecm-be.local/roomio-frontend/src/components/floorplan/README.md) — Floor plan view
            
        *   [`layout/`](http://openproject.ecm-be.local/roomio-frontend/src/components/layout/README.md) — App shell &amp; header
            
        *   [`room/`](http://openproject.ecm-be.local/roomio-frontend/src/components/room/README.md) — Room cards &amp; details
            
        *   [`ui/`](http://openproject.ecm-be.local/roomio-frontend/src/components/ui/README.md) — Reusable UI primitives
            
    *   [`config/`](http://openproject.ecm-be.local/roomio-frontend/src/config/README.md) — Settings &amp; theme
        
    *   [`hooks/`](http://openproject.ecm-be.local/roomio-frontend/src/hooks/README.md) — Custom React hooks
        
    *   [`pages/`](http://openproject.ecm-be.local/roomio-frontend/src/pages/README.md) — Page-level components
        
    *   [`utils/`](http://openproject.ecm-be.local/roomio-frontend/src/utils/README.md) — Utility functions
        

## Project Architecture

### Backend

> The webserver is considered to be in the same part as the frontend and will not be discussed here.

*   The backend is essentially just an api that is used to call end-point.
    
    <br>
    
    The api is only able to be called locally meaning that the webserver has to call for the client the
    
    <br>
    
    api. This ensures security and avoid direct call to the api.
    
*   The backend is split between two parts: the database and the api itself. Of course,
    
    <br>
    
    they are intrinsically linked.
    

#### Database:

*   For the moment, the database is only a json file but will be moved to a sql one later in the development
    
    <br>
    
    process
    
*   The file `db.py` has the role of making an interface between the physical database and the api.
    

#### Api:

*   The api run under fastapi and fastapi use uvicorn a low level web server using ASGI specification.
    
*   Purposes of using fastapi are:
    
*   <br>
    
    *   Easy to build and understand
        
*   <br>
    
    *   Professional solution
        
*   <br>
    
    *   Security: the repository is often updated
        
*   <br>
    
    *   Able to parse easily url and bodys
        

### Frontend

> In the project, we can see the front end as a user interface.&nbsp;
> 
> The backend and the webserver are two different entity running on two different server.
> 
> Meaning that two ports are used. One for the backend and the other for the webserver disscused in this section.

#### Web server:

*   The web server is build under `Vite` enabling fast reload when changes (faster development), compile files to static
    
    <br>
    
    ones (HTML/CSS/JS).
    
*   `React Router` is used to access multiple page: single-page(without) -&gt; multiple-page(with)
    
*   Runtime: `Node.js`
    

#### UI and Framework

*   The project use `React` as UI Framework.
    
*   As React is just a library that don&#39;t contain &quot;style components&quot;, ResRoom use `ChakraUI` giving multiple, customizable
    
    <br>
    
    and powerful component like: Box, Text, Image, Form, Menu, ...
    
*   Some icons are used inside some UI components, so we use `Lucide` that give a SVG image pack as `React` component.
    

## Personalization

> Here is explained how to configure the project manually. You have also a web interface on `{URL}/admin` that allow you  
> to edit most of the settings. However, some of the settings need to be change manually in the files.

### How to add/edit an existing room?

> In this section you will be able to change:
> 
> *   Room name
>     
> *   Capacity
>     
> *   Does the room have a TV?
>     
> *   Does the room have a whiteboard?
>     
> *   Does the room have a computer?
>     

*   Go to the file `~/backend/database.json`.
    

> As python reformat the json to be fit in one line, the content can be hard to read. The solution is to use an ide that  
> will reformat the code or an online reformater of json file.

*   In the section `"rooms"` are exposed all information about every room.
    
*   To add a new one you simply need to put a new dictionary respecting the same format as other rooms inside the list
    
    <br>
    
    `"rooms"`
    
*   Save the `database.json` and restart `FastAPI`
    

### How to edit the interactive plan?

> The interactive plan is a bit hard to edit manually. This is why this section will explain how to edit the plan with  
> https://app.openplan3d.com/

#### Why you want to edit the interactive plan?

*   To place a new room previously add in the `database.json`
    
*   Edit the name of a room on the plan
    
*   Resize a room
    
*   Remove a room on the plan
    
*   etc.
    

#### What is OpenPlan3D?

OpenPlan3D is an opensource web app designed to create home plan. It is simple to use and available online.

For those reasons OpenPlan3D is the perfect choice.

#### How to use OpenPlan3D to edit our plan?

1.  First of all, you need to download/have access to the file `plan.json` found at
    
    `roomio-frontend/src/assets/plan/plan.json`
    
2.  Then go to https://app.openplan3d.com/.
    
3.  Click on the blue button `New Project` at top right of the page. This will open a new tab with the editor.
    
4.  Then we want to import our plan.json. Click on the button `Export` at top right of the page. Then click on
    
    `Import JSON`.
    
5.  Everything should be there:
    
    *   the background plan
        
    *   every room with their names
        
6.  You now want to edit. You can add walls by clicking on the button `Draw Wall` on the left side menu.
    
    <br>
    
    <br>
    
    Edit the name of a room or maybe change her shape.
    

> **Warning:** Remember that a correct room need to have a close shape and a correct name matching the one in the  
> `database.json`.

> The editor don&#39;t allow spaces in the name. To counter that, either you put a &quot;\_&quot; or you copi-past a space directly

1.  Next, when edit are done, you can click again on the `Export` button and press the `Download JSON` button.
    

> It is recommended sometimes to manually adjust the scale of the background plan. For that edit the JSON file. At the  
> end you gonna find `backgroundImage` then `scale`. Edit the scale parameter to fit the backgroundImage with rooms. For  
> the default svg image `BureauShape.svg` it is recommended to put the scale value to `1.9`

1.  Then replace the existing `plan.json` with the new one. Make sure that the name of the file is `plan.json`
    
2.  Reload the server.
    

### Global Settings

> Global settings are settings that rule the whole system such as: when the day start or when it ends.

To edit global settings, go to the `database.json`. At the bottom of the file, the section `"settings"` regroup every  
global settings.

```json
// config.json
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