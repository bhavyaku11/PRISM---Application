from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health():
    """Verify that GET /health returns status ok."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_root():
    """Verify that GET / returns API metadata."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "operational"
    assert data["name"] == "PRISM Backend API"


def test_pdf_dependencies_importable():
    """Verify that PyMuPDF (fitz) and pdfplumber are installed and importable."""
    import fitz
    import pdfplumber

    assert fitz.__version__ is not None
    assert pdfplumber.__version__ is not None
