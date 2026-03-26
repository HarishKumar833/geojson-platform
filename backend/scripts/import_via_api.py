import json
import os
import sys
from pathlib import Path

import requests
import geopandas as gpd
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

load_dotenv(BASE_DIR / ".env")

DATA_PATH = BASE_DIR / "data" / "municipalities_nl.geojson"
API_BASE_URL = os.getenv("FEATURES_API_URL", "http://127.0.0.1:8000/api/features/")
TOKEN_URL = os.getenv("TOKEN_API_URL", "http://127.0.0.1:8000/api/token/")


def get_access_token(username: str, password: str) -> str:
    response = requests.post(
        TOKEN_URL,
        headers={"Content-Type": "application/json"},
        json={"username": username, "password": password},
        timeout=30,
    )
    response.raise_for_status()
    data = response.json()
    return data["access"]


def run(username: str, password: str):
    print("Loading GeoJSON...")
    gdf = gpd.read_file(DATA_PATH)
    print(f"Total features found: {len(gdf)}")

    access_token = get_access_token(username, password)
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }

    created = 0
    skipped = 0

    for _, row in gdf.iterrows():
        geom = row.geometry

        if geom is None:
            skipped += 1
            continue

        try:
            payload = {
                "geometry": geom.__geo_interface__,
                "properties": row.drop(labels=["geometry"]).to_dict(),
            }

            response = requests.post(
                API_BASE_URL,
                headers=headers,
                data=json.dumps(payload),
                timeout=30,
            )

            if response.status_code == 201:
                created += 1
            else:
                skipped += 1
                print(
                    f"Skipped feature. Status: {response.status_code}, "
                    f"Response: {response.text[:300]}"
                )

        except Exception as exc:
            skipped += 1
            print(f"Skipping feature due to error: {exc}")

    print("\nImport complete")
    print(f"Created: {created}")
    print(f"Skipped: {skipped}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python scripts/import_via_api.py <username> <password>")
        sys.exit(1)

    run(sys.argv[1], sys.argv[2])