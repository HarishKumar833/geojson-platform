# 🗺️ GeoJSON Platform

A full-stack geospatial web application for exploring Dutch municipalities on an interactive map, with JWT authentication and PostGIS-powered spatial queries.

![Tech Stack](https://img.shields.io/badge/Django-REST%20Framework-green?style=flat-square&logo=django)
![PostGIS](https://img.shields.io/badge/PostGIS-PostgreSQL-blue?style=flat-square&logo=postgresql)
![React](https://img.shields.io/badge/React-Vite-61DAFB?style=flat-square&logo=react)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker)

---

## ✨ Features

- **JWT Authentication** — Secure login and protected API access
- **Interactive Map** — Leaflet-powered map with GeoJSON municipality overlays
- **Spatial Filtering** — Bounding box (bbox) queries powered by PostGIS
- **GeoDjango Backend** — Full spatial data support with Shapely and GeoPandas
- **Fully Dockerized** — No local installation required beyond Docker

---

## 🧱 Tech Stack

| Layer | Technologies |
|---|---|
| **Backend** | Django, Django REST Framework, GeoDjango, Shapely, GeoPandas |
| **Database** | PostgreSQL + PostGIS |
| **Frontend** | React (Vite), Leaflet, Axios |
| **Infrastructure** | Docker, Docker Compose |

---

## 📦 Project Structure

```
geojson-platform/
├── backend/
│   ├── config/           # Django project settings
│   ├── features/         # Geospatial features app
│   ├── scripts/          # Data import scripts
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/              # React application
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## 🚀 Getting Started

> **Prerequisites:** [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/) installed on your machine.

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/geojson-platform.git
cd geojson-platform
```

### 2. Start the application

```bash
docker compose up --build
```

This starts three services:

| Service | URL |
|---|---|
| Frontend (React) | http://localhost:5173 |
| Backend (Django) | http://localhost:8000 |
| Database (PostGIS) | Internal only |

### 3. First-time setup

Run these commands once after the containers are up:

```bash
# Create a superuser account
docker exec -it geojson_platform_backend python manage.py createsuperuser

# Import Dutch municipalities into the database
docker exec -it geojson_platform_backend python scripts/import_municipalities.py
```

### 4. Open the app

Navigate to [http://localhost:5173](http://localhost:5173) and log in using the superuser credentials you just created.

---

## 🗺️ API Reference

All endpoints require JWT authentication. Include the token in the `Authorization` header:

```
Authorization: Bearer <your_token>
```

### Get features within a bounding box

```
GET /api/features/?bbox={min_lon},{min_lat},{max_lon},{max_lat}
```

**Example — query municipalities in central Netherlands:**

```
GET /api/features/?bbox=5.0,52.0,6.0,53.0
```

**Response:** GeoJSON `FeatureCollection` containing all municipalities whose geometry intersects the given bounding box.

---

## 🛠️ Development Notes

- The Django admin panel is available at [http://localhost:8000/admin](http://localhost:8000/admin)
- Static files and media are served via Django in development mode
- The PostGIS container must be healthy before the backend starts (handled automatically by Docker Compose)
- To reset the database, stop the containers and remove the named volume: `docker compose down -v`

---

## 📄 License

This project is open source. See [LICENSE](LICENSE) for details.
