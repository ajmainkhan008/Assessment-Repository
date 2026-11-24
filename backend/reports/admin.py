
from django.contrib import admin
from .models import Report, ItemMatch, Handover


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "item_name",
        "report_type",
        "category",
        "location",
        "contact_name",
        "status",
        "created_at",
    )

    list_filter = (
        "report_type",
        "category",
        "status",
        "created_at",
    )

    search_fields = (
        "item_name",
        "description",
        "contact_name",
        "contact_phone",
        "location",
    )

    readonly_fields = ("created_at",)


@admin.register(ItemMatch)
class ItemMatchAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "lost_report",
        "found_report",
        "similarity_score",
        "status",
        "created_at",
    )

    list_filter = ("status", "created_at")

    search_fields = (
        "lost_report__item_name",
        "found_report__item_name",
    )

    readonly_fields = ("created_at",)


@admin.register(Handover)
class HandoverAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "match",
        "receiver_name",
        "receiver_phone",
        "handover_date",
        "verified_by",
    )

    search_fields = (
        "receiver_name",
        "receiver_phone",
        "verified_by",
    )

    readonly_fields = ("handover_date",)
