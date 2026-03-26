# 🗺️ GeoJSON Platform

A full-stack geospatial web application for exploring Dutch municipalities on an interactive map, with JWT authentication, PostGIS-powered spatial queries, and smart frontend rendering.

![Tech Stack](https://img.shields.io/badge/Django-REST%20Framework-green?style=flat-square&logo=django)
![PostGIS](https://img.shields.io/badge/PostGIS-PostgreSQL-blue?style=flat-square&logo=postgresql)
![React](https://img.shields.io/badge/React-Vite-61DAFB?style=flat-square&logo=react)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker)

---

## ✨ Features

- **JWT Authentication** — Secure login and protected API access
- **Interactive Map** — Leaflet-powered map with GeoJSON municipality overlays
- **Spatial Filtering** — Bounding box (bbox) queries using PostGIS
- **Pagination** — Backend returns 100 features per request
- **Smart Map Rendering** — Frontend dynamically aggregates paginated results for smooth UX
- **GeoDjango Backend** — Full spatial data support
- **Fully Dockerized** — Runs consistently across macOS, Windows, and Linux

---

## 🧱 Tech Stack

| Layer | Technologies |
|---|---|
| **Backend** | Django, Django REST Framework, GeoDjango |
| **Database** | PostgreSQL + PostGIS |
| **Frontend** | React (Vite), Leaflet |
| **Infrastructure** | Docker, Docker Compose |

---

## 📦 Project Structure

```
geojson-platform/
├── backend/
│   ├── config/
│   ├── features/
│   ├── scripts/
│   │   └── import_via_api.py
│   ├── data/
│   │   └── municipalities_nl.geojson
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   ├── public/
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── README.md
```

---

## 🚀 Getting Started

> **Prerequisites:** [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/geojson-platform.git
cd geojson-platform
```

### 2. Start the application

```bash
docker compose up --build
```

### 3. First-time setup

```bash
# Create a superuser account
docker exec -it geojson_platform_backend python manage.py createsuperuser

# Import municipality data via API
docker exec -it geojson_platform_backend python scripts/import_via_api.py
```

---

## 🌐 Access

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| Admin Panel | http://localhost:8000/admin |

---

## 🔐 Authentication

Obtain a JWT token:

```bash
curl -X POST http://127.0.0.1:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"username":"<username>","password":"<password>"}'
```

Include the token in subsequent requests:

```
Authorization: Bearer <your_token>
```

---

## 🗺️ API Usage

**Get paginated features**

```
GET /api/features/
```

**Filter by bounding box**

```
GET /api/features/?bbox=minx,miny,maxx,maxy
```

Example:

```
GET /api/features/?bbox=5.0,52.0,6.0,53.0
```

---

## 🧠 Design Decisions

### Pagination + UX Balance

- Backend strictly enforces pagination (100 features per request)
- Frontend dynamically fetches multiple pages based on the current map extent
- Prevents empty map views while maintaining performance

### Bounding Box Filtering

- Implemented using PostGIS `intersects`
- Automatically updated as the user moves or zooms the map

### Docker-first Architecture

- No local dependencies required beyond Docker
- No hardcoded system paths
- Portable across macOS, Windows, and Linux

---

## 📥 Data Import

```bash
python backend/scripts/import_via_api.py
```

- Reads GeoJSON using GeoPandas
- Sends data through the REST API (not direct DB insertion)
- Matches assignment requirements

---

## 🛠️ Development Notes

- **Reset the database:** `docker compose down -v`
- Backend auto-migrates on startup
- Frontend uses live bbox updates tied to map movement events

---

## 📄 License

Open source. See [LICENSE](LICENSE) for details.
