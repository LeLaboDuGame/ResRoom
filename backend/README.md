# ResRoom Backend

REST API for a room reservation system. Handles rooms, reservations, settings, and photo uploads. Data is persisted in a local JSON file.

## Tech Stack

- Python 3
- FastAPI
- Uvicorn (development server)

## Files

| File | Purpose |
|---|---|
| `config.py` | App-wide constants: database file path, log file path, date format string |
| `db.py` | Thread-safe `Database` class that reads/writes the JSON file |
| `api.py` | FastAPI application with all REST endpoints (rooms CRUD, reservations, settings, photo upload) |
| `database.json` | JSON file storing rooms, reservations, and settings |
| `test_api.http` | IntelliJ HTTP client requests for manual API testing |
| `log.txt` | Runtime log output from the uvicorn server |

## Running

```bash
cd backend
uvicorn api:app --reload
```

The API is served at `http://localhost:8000`.
