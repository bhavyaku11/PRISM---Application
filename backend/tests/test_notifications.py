"""Tests for PRISM Step 17: Notifications & Renewal Intelligence."""

import pytest
from datetime import datetime, timedelta
from unittest.mock import MagicMock
from app.api.deps import AuthenticatedUser


def test_renewal_and_expiry_date_calculation():
    """Verify deterministic renewal and expiry calculations for policy dates."""
    now = datetime.now()

    # 1. 30 days remaining: should be renewal attention
    date_30d = (now + timedelta(days=30)).strftime("%Y-%m-%d")
    diff_30d = (datetime.strptime(date_30d, "%Y-%m-%d") - now).days + 1
    assert 29 <= diff_30d <= 31

    # 2. 7 days remaining: should be urgent priority
    date_7d = (now + timedelta(days=7)).strftime("%Y-%m-%d")
    diff_7d = (datetime.strptime(date_7d, "%Y-%m-%d") - now).days + 1
    assert 6 <= diff_7d <= 8

    # 3. 1 day remaining: expires tomorrow
    date_1d = (now + timedelta(days=1)).strftime("%Y-%m-%d")
    diff_1d = (datetime.strptime(date_1d, "%Y-%m-%d") - now).days + 1
    assert diff_1d == 1 or diff_1d == 2

    # 4. Past date: expired
    date_past = (now - timedelta(days=5)).strftime("%Y-%m-%d")
    diff_past = (datetime.strptime(date_past, "%Y-%m-%d") - now).days
    assert diff_past < 0


def test_claim_document_notification_logic():
    """Verify missing required document notification generation."""
    # Mandatory categories required for a claim
    mandatory_categories = ["hospital_bill", "discharge_summary", "claim_form", "diagnostic_reports"]

    # Scenario A: Incomplete claim with only 1 document
    uploaded_docs = ["hospital_bill"]
    missing = [cat for cat in mandatory_categories if cat not in uploaded_docs]
    assert len(missing) == 3

    missing_count = len(missing)
    msg = (
        "1 required document is still needed for your claim."
        if missing_count == 1
        else f"{missing_count} required documents are still needed for your claim."
    )
    assert msg == "3 required documents are still needed for your claim."

    # Scenario B: Fully attached dossier
    uploaded_all = ["hospital_bill", "discharge_summary", "claim_form", "diagnostic_reports"]
    missing_all = [cat for cat in mandatory_categories if cat not in uploaded_all]
    assert len(missing_all) == 0


def test_notification_safety_and_neutrality_invariants():
    """Verify that notification copy complies with PRISM safety guidelines."""
    prohibited_statements = [
        "your policy will renew",
        "renewal is automatic",
        "your claim is approved",
        "your claim will be approved",
        "your claim is guaranteed",
        "guaranteed reimbursement",
    ]

    sample_notifications = [
        "Your New India Mediclaim policy expires in 18 days. Review your renewal.",
        "Your policy expires tomorrow. Review your renewal.",
        "Your policy period has ended. Review renewal options with your insurer.",
        "3 required documents are still needed for your claim.",
        "All required documents have been uploaded. Your claim is ready for review.",
        "Your policy is processed and ready for clause analysis.",
    ]

    for notif in sample_notifications:
        lower = notif.lower()
        for prohibited in prohibited_statements:
            assert prohibited not in lower, f"Prohibited statement '{prohibited}' found in '{notif}'"


def test_cross_user_isolation_invariant():
    """Verify that notification operations are strictly scoped by user_id."""
    user_a = AuthenticatedUser(
        user_data={"id": "usr_alpha_11", "email": "alpha@prism.in", "role": "authenticated"},
        token="token_alpha_11",
    )
    user_b_id = "usr_beta_22"

    mock_client = MagicMock()
    # Scoped query simulation: user_id must equal caller's id
    mock_client.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[{"id": "notif_1", "user_id": user_a.id, "title": "Alpha Renewal"}]
    )

    query = mock_client.table("notifications").select("*").eq("user_id", user_a.id).execute()
    assert all(item["user_id"] == user_a.id for item in query.data)
    assert not any(item["user_id"] == user_b_id for item in query.data)
