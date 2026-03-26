import os
import sys
import json
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

load_dotenv(BASE_DIR / ".env")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

import django
django.setup()

import geopandas as gpd
from django.contrib.gis.geos import GEOSGeometry

from features.models import Feature


DATA_PATH = BASE_DIR / "data" / "municipalities_nl.geojson"


def run():
    print("Loading GeoJSON...")
    gdf = gpd.read_file(DATA_PATH)

    print(f"Total features found: {len(gdf)}")

    created = 0
    skipped = 0

    for _, row in gdf.iterrows():
        geom = row.geometry

        if geom is None:
            skipped += 1
            continue

        try:
            geojson_geom = json.dumps(geom.__geo_interface__)
            geometry = GEOSGeometry(geojson_geom)
            geometry.srid = 4326

            properties = row.drop(labels=["geometry"]).to_dict()

            Feature.objects.create(
                geometry=geometry,
                properties=properties,
            )
            created += 1

        except Exception as exc:
            skipped += 1
            print(f"Skipping feature due to error: {exc}")

    print("\nImport complete")
    print(f"Created: {created}")
    print(f"Skipped: {skipped}")


if __name__ == "__main__":
    run()