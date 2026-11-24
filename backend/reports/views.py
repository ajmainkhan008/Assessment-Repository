
import os
from difflib import SequenceMatcher

from django.utils import timezone
from django.contrib.auth import authenticate, login
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_protect
from django.utils.decorators import method_decorator

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.authentication import SessionAuthentication

from .models import Report, ItemMatch, Handover
from .serializers import (
    ReportSerializer,
    ItemMatchSerializer,
    HandoverSerializer,
)


def expire_old_reports():
    Report.objects.filter(
        expires_at__lte=timezone.now()
    ).exclude(
        status="EXPIRED"
    ).update(status="EXPIRED")


# --------------------------------------------------
# PUBLIC REPORT SUBMISSION
# --------------------------------------------------

class PublicReportCreateView(APIView):
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        serializer = ReportSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        report_type = serializer.validated_data.get("report_type")
        driver_id = serializer.validated_data.get("driver_id", "").strip()

        if report_type == "FOUND":
            valid_ids = [
                item.strip()
                for item in os.getenv("VALID_DRIVER_IDS", "").split(",")
                if item.strip()
            ]

            if not driver_id or driver_id not in valid_ids:
                return Response(
                    {"error": "Invalid driver ID. Found report was not saved."},
                    status=status.HTTP_403_FORBIDDEN
                )

        elif report_type == "LOST" and driver_id:
            return Response(
                {"error": "Driver ID is not required for lost-item reports."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer.save()

        return Response(
            {
                "message": "Report submitted successfully.",
                "report": serializer.data
            },
            status=status.HTTP_201_CREATED
        )


# --------------------------------------------------
# CUSTOM ADMIN LOGIN AND CSRF
# --------------------------------------------------

@method_decorator(ensure_csrf_cookie, name="dispatch")
class CSRFTokenView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        return Response({"message": "CSRF cookie set"})


@method_decorator(csrf_protect, name="dispatch")
class AdminLoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        username = request.data.get("username", "")
        password = request.data.get("password", "")

        user = authenticate(
            request,
            username=username,
            password=password
        )

        if user is None:
            return Response(
                {"error": "Invalid username or password."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user.is_active or not user.is_staff:
            return Response(
                {"error": "You are not authorized to access the admin panel."},
                status=status.HTTP_403_FORBIDDEN
            )

        login(request, user)

        return Response({"message": "Login successful."})


# --------------------------------------------------
# ADMIN REPORT MANAGEMENT
# --------------------------------------------------

class AdminReportListView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAdminUser]

    def get(self, request):
        expire_old_reports()

        reports = Report.objects.all().order_by("-created_at")
        serializer = ReportSerializer(reports, many=True)

        return Response(serializer.data)


# --------------------------------------------------
# MATCH SUGGESTIONS
# --------------------------------------------------

class AdminMatchListView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAdminUser]

    def get(self, request):
        matches = ItemMatch.objects.all().order_by("-created_at")
        serializer = ItemMatchSerializer(matches, many=True)

        return Response(serializer.data)


class GenerateMatchesView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAdminUser]

    def post(self, request):
        expire_old_reports()

        lost_reports = Report.objects.filter(
            report_type="LOST",
            status="PENDING",
            expires_at__gt=timezone.now()
        )

        found_reports = Report.objects.filter(
            report_type="FOUND",
            status="PENDING",
            expires_at__gt=timezone.now()
        )

        created_count = 0

        for lost in lost_reports:
            for found in found_reports:
                if lost.category.lower() != found.category.lower():
                    continue

                name_score = SequenceMatcher(
                    None,
                    lost.item_name.lower(),
                    found.item_name.lower()
                ).ratio()

                description_score = SequenceMatcher(
                    None,
                    lost.description.lower(),
                    found.description.lower()
                ).ratio()

                score = (
                    name_score * 0.7 +
                    description_score * 0.3
                )

                if score >= 0.35:
                    match, created = ItemMatch.objects.get_or_create(
                        lost_report=lost,
                        found_report=found,
                        defaults={
                            "similarity_score": round(score * 100, 2)
                        }
                    )

                    if created:
                        created_count += 1

        return Response({
            "message": "Matching process completed.",
            "new_matches": created_count
        })


class MatchDecisionView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAdminUser]

    def post(self, request, match_id):
        try:
            match = ItemMatch.objects.get(id=match_id)
        except ItemMatch.DoesNotExist:
            return Response(
                {"error": "Match not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        decision = request.data.get("decision")
        notes = request.data.get("admin_notes", "")

        if decision not in ["APPROVED", "REJECTED"]:
            return Response(
                {"error": "Decision must be APPROVED or REJECTED."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if match.status != "PENDING":
            return Response(
                {"error": "This match has already been reviewed."},
                status=status.HTTP_400_BAD_REQUEST
            )

        match.status = decision
        match.admin_notes = notes
        match.save()

        return Response({
            "message": f"Match {decision.lower()} successfully.",
            "match": ItemMatchSerializer(match).data
        })


# --------------------------------------------------
# HANDOVER MANAGEMENT
# --------------------------------------------------

class HandoverCreateView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAdminUser]

    def post(self, request):
        serializer = HandoverSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        match = serializer.validated_data["match"]

        if match.status != "APPROVED":
            return Response(
                {"error": "Only approved matches can be handed over."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if Handover.objects.filter(match=match).exists():
            return Response(
                {"error": "A handover already exists for this match."},
                status=status.HTTP_400_BAD_REQUEST
            )

        handover = serializer.save()

        match.lost_report.status = "RETURNED"
        match.lost_report.save(update_fields=["status"])

        match.found_report.status = "RETURNED"
        match.found_report.save(update_fields=["status"])

        return Response(
            {
                "message": "Handover recorded successfully.",
                "handover": HandoverSerializer(handover).data
            },
            status=status.HTTP_201_CREATED
        )


class AdminHandoverListView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAdminUser]

    def get(self, request):
        handovers = Handover.objects.all().order_by("-handover_date")
        serializer = HandoverSerializer(handovers, many=True)

        return Response(serializer.data)
