from django.contrib.gis.db import models


class Feature(models.Model):
    geometry = models.GeometryField(srid=4326)
    properties = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["id"]

    def __str__(self):
        name = self.properties.get("name")
        return name or f"Feature {self.id}"
