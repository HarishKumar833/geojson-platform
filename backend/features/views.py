from django.contrib.gis.geos import GEOSGeometry, Polygon
from rest_framework import status, viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Feature
from .serializers import FeatureSerializer


class FeatureViewSet(viewsets.ModelViewSet):
    queryset = Feature.objects.all().order_by("id")
    serializer_class = FeatureSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        bbox = self.request.query_params.get("bbox")

        if bbox:
            try:
                minx, miny, maxx, maxy = map(float, bbox.split(","))

                if minx >= maxx or miny >= maxy:
                    raise ValidationError("Invalid bbox coordinates.")

                bbox_polygon = Polygon.from_bbox((minx, miny, maxx, maxy))
                bbox_polygon.srid = 4326

                queryset = queryset.filter(geometry__intersects=bbox_polygon)

            except ValueError:
                raise ValidationError("bbox must be in the format minx,miny,maxx,maxy")

        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        bbox = request.query_params.get("bbox")

        if bbox:
            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data)

        return super().list(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        geometry_data = request.data.get("geometry")
        properties = request.data.get("properties", {})

        if not geometry_data:
            return Response(
                {"detail": "Geometry is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            geometry = GEOSGeometry(str(geometry_data))
            geometry.srid = 4326
        except Exception:
            return Response(
                {"detail": "Invalid geometry."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        feature = Feature.objects.create(
            geometry=geometry,
            properties=properties,
        )

        serializer = self.get_serializer(feature)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        geometry_data = request.data.get("geometry")
        properties = request.data.get("properties", instance.properties)

        if geometry_data:
            try:
                geometry = GEOSGeometry(str(geometry_data))
                geometry.srid = 4326
                instance.geometry = geometry
            except Exception:
                return Response(
                    {"detail": "Invalid geometry."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        instance.properties = properties
        instance.save()

        serializer = self.get_serializer(instance)
        return Response(serializer.data)