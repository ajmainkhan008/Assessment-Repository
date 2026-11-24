
from django.db import models
from django.utils import timezone
from datetime import timedelta


def get_expiry_date():
    return timezone.now() + timedelta(days=30)


class Report(models.Model):

    REPORT_TYPES = [
        ("LOST", "Lost Item"),
        ("FOUND", "Found Item"),
    ]

    STATUS_CHOICES = [
        ("PENDING", "Pending"),
        ("MATCHED", "Matched"),
        ("RETURNED", "Returned"),
        ("EXPIRED", "Expired"),
    ]

    item_name = models.CharField(max_length=200)
    description = models.TextField()
    category = models.CharField(max_length=100)

    report_type = models.CharField(
        max_length=10,
        choices=REPORT_TYPES
    )

    location = models.CharField(max_length=200)
    date_of_incident = models.DateField()
    contact_name = models.CharField(max_length=150)
    contact_phone = models.CharField(max_length=20)

    image = models.ImageField(
        upload_to="item_images/",
        blank=True,
        null=True
    )

    driver_id = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="PENDING"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    expires_at = models.DateTimeField(
        default=get_expiry_date
    )

    def __str__(self):
        return f"{self.report_type} - {self.item_name}"


class ItemMatch(models.Model):

    MATCH_STATUS = [
        ("PENDING", "Pending Review"),
        ("APPROVED", "Approved"),
        ("REJECTED", "Rejected"),
    ]

    lost_report = models.ForeignKey(
        Report,
        on_delete=models.CASCADE,
        related_name="lost_matches"
    )

    found_report = models.ForeignKey(
        Report,
        on_delete=models.CASCADE,
        related_name="found_matches"
    )

    similarity_score = models.FloatField(default=0)

    status = models.CharField(
        max_length=20,
        choices=MATCH_STATUS,
        default="PENDING"
    )

    admin_notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return (
            f"Match: {self.lost_report.item_name} - "
            f"{self.found_report.item_name}"
        )


class Handover(models.Model):

    match = models.OneToOneField(
        ItemMatch,
        on_delete=models.CASCADE,
        related_name="handover"
    )

    receiver_name = models.CharField(max_length=150)
    receiver_phone = models.CharField(max_length=20)

    handover_date = models.DateTimeField(default=timezone.now)

    verified_by = models.CharField(max_length=150)

    notes = models.TextField(blank=True)

    def __str__(self):
        return f"Handover - {self.receiver_name}"
