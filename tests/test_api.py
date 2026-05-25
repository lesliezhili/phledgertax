import pytest
from fastapi.testclient import TestClient
import os


@pytest.fixture(autouse=True)
def patch_bank_dir(tmp_path, anz_csv, rbc_csv, monkeypatch):
    anz = tmp_path / "anz" / "2025" / "07"
    anz.mkdir(parents=True)
    (anz / "tx.csv").write_text(anz_csv)
    rbc = tmp_path / "rbc" / "2025" / "10"
    rbc.mkdir(parents=True)
    (rbc / "tx.csv").write_text(rbc_csv)
    monkeypatch.setenv("BANK_DATA_PATH", str(tmp_path))
    return tmp_path


@pytest.fixture
def client():
    from main import app
    return TestClient(app)


class TestHealth:
    def test_status_ok(self, client):
        r = client.get("/health")
        assert r.status_code == 200
        assert r.json()["status"] == "ok"

    def test_backend_csv(self, client):
        r = client.get("/health")
        assert r.json()["backend"] == "csv"

    def test_bank_lists(self, client):
        r = client.get("/health")
        assert "anz" in r.json()["au_banks"]
        assert "rbc" in r.json()["ca_banks"]


class TestUI:
    def test_ui(self, client):
        r = client.get("/ui")
        assert r.status_code == 200
        assert "PHLedger" in r.text

    def test_root(self, client):
        r = client.get("/")
        assert r.status_code == 200

    def test_readme(self, client):
        r = client.get("/readme")
        assert r.status_code == 200


class TestTransactions:
    def test_all_transactions(self, client):
        r = client.get("/transactions")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_bank_filter(self, client):
        r = client.get("/transactions?bank=anz")
        assert r.status_code == 200
        txs = r.json()
        assert all(tx["bank"] == "anz" for tx in txs)

    def test_country_au(self, client):
        r = client.get("/transactions?country=AU")
        assert r.status_code == 200
        assert all(tx["currency"] == "AUD" for tx in r.json())

    def test_country_ca(self, client):
        r = client.get("/transactions?country=CA")
        assert r.status_code == 200
        assert all(tx["currency"] == "CAD" for tx in r.json())

    def test_limit(self, client):
        r = client.get("/transactions?limit=1")
        assert len(r.json()) <= 1


class TestAnalytics:
    def test_combined(self, client):
        r = client.get("/analytics")
        assert r.status_code == 200
        assert "total_income" in r.json()

    def test_au(self, client):
        r = client.get("/analytics?country=AU")
        assert r.json()["country"] == "AU"

    def test_ca(self, client):
        r = client.get("/analytics?country=CA")
        assert r.json()["country"] == "CA"


class TestUpload:
    def test_upload_anz(self, client, anz_csv, tmp_path):
        from io import BytesIO
        r = client.post("/upload", data={"bank": "anz"},
                        files={"file": ("test.csv", BytesIO(anz_csv.encode()), "text/csv")})
        assert r.status_code == 200
        assert r.json()["count"] > 0

    def test_upload_rbc(self, client, rbc_csv):
        from io import BytesIO
        r = client.post("/upload", data={"bank": "rbc"},
                        files={"file": ("test.csv", BytesIO(rbc_csv.encode()), "text/csv")})
        assert r.status_code == 200

    def test_upload_empty(self, client):
        from io import BytesIO
        r = client.post("/upload", data={"bank": "anz"},
                        files={"file": ("empty.csv", BytesIO(b""), "text/csv")})
        # Empty file returns error in response body
        assert "error" in r.json()


class TestBAS:
    def test_bas(self, client):
        r = client.get("/bas")
        assert r.status_code == 200
        assert "g1_total_sales" in r.json()

    def test_bas_quarterly(self, client):
        r = client.get("/bas/quarterly?year=2025")
        assert r.status_code == 200
        assert len(r.json()["quarters"]) == 4


class TestGST:
    def test_gst_quarterly(self, client):
        r = client.get("/gst?year=2025&quarter=4")
        assert r.status_code == 200
        assert "gst_collected" in r.json()

    def test_gst_annual(self, client):
        r = client.get("/gst/annual?year=2025")
        assert r.status_code == 200
        assert "annual_gst_collected" in r.json()


class TestTaxEndpoints:
    def test_au_company(self, client):
        r = client.get("/tax/au/company")
        assert r.status_code == 200
        assert "tax_payable" in r.json()

    def test_au_personal(self, client):
        r = client.get("/tax/au/personal")
        assert r.status_code == 200
        assert "medicare_levy" in r.json()

    def test_ca_corporate(self, client):
        r = client.get("/tax/ca/corporate")
        assert r.status_code == 200
        assert "federal_tax" in r.json()

    def test_ca_personal(self, client):
        r = client.get("/tax/ca/personal")
        assert r.status_code == 200
        assert "provincial_tax" in r.json()


class TestFinancialStatements:
    def test_combined(self, client):
        r = client.get("/financial-statements")
        assert r.status_code == 200
        fs = r.json()
        assert "balance_sheet" in fs
        assert "profit_loss" in fs
        assert "cash_flow" in fs

    def test_au_only(self, client):
        r = client.get("/financial-statements?country=AU")
        assert r.status_code == 200

    def test_ca_only(self, client):
        r = client.get("/financial-statements?country=CA")
        assert r.status_code == 200


class TestChat:
    def test_help(self, client):
        r = client.post("/chat", json={"message": "help"})
        assert r.status_code == 200
        assert "Commands" in r.json()["message"]

    def test_status(self, client):
        r = client.post("/chat", json={"message": "status"})
        assert r.status_code == 200
        assert "AU:" in r.json()["message"]

    def test_bas(self, client):
        r = client.post("/chat", json={"message": "bas"})
        assert r.status_code == 200

    def test_unknown_command(self, client):
        r = client.post("/chat", json={"message": "blah blah"})
        assert "Unknown command" in r.json()["message"]
