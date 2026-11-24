
from rest_framework import serializers
from .models import Report, ItemMatch, Handover


class ReportSerializer(serializers.ModelSerializer):

    driver_id = serializers.CharField(
        required=False,
        allow_blank=True,
        write_only=True
    )

    class Meta:
        model = Report
        fields = [
            "id",
            "item_name",
            "description",
            "category",
            "report_type",
            "location",
            "date_of_incident",
            "contact_name",
            "contact_phone",
            "image",
            "driver_id",
            "status",
            "created_at",
            "expires_at",
        ]

        read_only_fields = [
            "id",
            "status",
            "created_at",
            "expires_at",
        ]


class ItemMatchSerializer(serializers.ModelSerializer):

    lost_item_name = serializers.CharField(
        source="lost_report.item_name",
        read_only=True
    )

    found_item_name = serializers.CharField(
        source="found_report.item_name",
        read_only=True
    )

    class Meta:
        model = ItemMatch
        fields = [
            "id",
            "lost_report",
            "found_report",
            "lost_item_name",
            "found_item_name",
            "similarity_score",
            "status",
            "admin_notes",
            "created_at",
        ]


class HandoverSerializer(serializers.ModelSerializer):

    class Meta:
        model = Handover
        fields = [
            "id",
            "match",
            "receiver_name",
            "receiver_phone",
            "handover_date",
            "verified_by",
            "notes",
        ]

        read_only_fields = ["id", "handover_date"]
