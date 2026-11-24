
from django.urls import path

from .views import (
    PublicReportCreateView,
    AdminReportListView,
    AdminMatchListView,
    GenerateMatchesView,
    MatchDecisionView,
    HandoverCreateView,
    AdminHandoverListView,
    CSRFTokenView,
    AdminLoginView,
)

urlpatterns = [
    # Public endpoints
    path("reports/", PublicReportCreateView.as_view(), name="create-report"),

    # Custom admin login
    path("csrf/", CSRFTokenView.as_view(), name="csrf-token"),
    path("login/", AdminLoginView.as_view(), name="admin-login"),

    # Admin report management
    path("admin/reports/", AdminReportListView.as_view(), name="admin-reports"),

    # Admin matching management
    path("admin/matches/", AdminMatchListView.as_view(), name="admin-matches"),
    path("admin/matches/generate/", GenerateMatchesView.as_view(), name="generate-matches"),
    path("admin/matches/<int:match_id>/decision/", MatchDecisionView.as_view(), name="match-decision"),

    # Admin handover management
    path("admin/handovers/", AdminHandoverListView.as_view(), name="admin-handovers"),
    path("admin/handovers/create/", HandoverCreateView.as_view(), name="create-handover"),
]
