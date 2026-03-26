from rest_framework import serializers

from .models import Feature


class FeatureSerializer(serializers.ModelSerializer):
    type = serializers.SerializerMethodField()
    id = serializers.IntegerField(read_only=True)
    geometry = serializers.JSONField()
    properties = serializers.JSONField()

    class Meta:
        model = Feature
        fields = [
            "type",
            "id",
            "geometry",
            "properties",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def get_type(self, obj):
        return "Feature"

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["geometry"] = instance.geometry.json if instance.geometry else None
        if isinstance(data["geometry"], str):
            import json
            data["geometry"] = json.loads(data["geometry"])
        return data