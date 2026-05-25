import pytest
from connectors.csv_ingestion import _detect_format, parse_csv_file, CSVIngestionManager
from models import Transaction


class TestFormatDetection:
    def test_anz(self):
        assert _detect_format(["Date", "Details", "Debit", "Credit", "Balance"]) == "anz"

    def test_td(self):
        assert _detect_format(["Date", "Description", "DEBIT", "CREDIT"]) == "td"

    def test_rbc(self):
        assert _detect_format(["Transaction Date", "Description 1", "CAD$"]) == "rbc"

    def test_phledger(self):
        assert _detect_format(["date", "description", "amount", "currency"]) == "phledger"

    def test_cba_fallback(self):
        assert _detect_format(["Date", "Description", "Amount"]) == "cba"


class TestParsePhledger:
    def test_basic_parse(self):
        csv = "date,description,amount,currency\n2025-07-01,Client Payment,5000.00,AUD\n"
        txs = parse_csv_file(csv, bank="anz")
        assert len(txs) == 1
        assert txs[0].amount == 5000.0
        assert txs[0].currency == "AUD"

    def test_negative_amount(self):
        csv = "date,description,amount,currency\n2025-07-01,Woolworths,-120.00,AUD\n"
        txs = parse_csv_file(csv, bank="anz")
        assert txs[0].amount == -120.0


class TestParseRBC:
    def test_rbc_positive(self, rbc_csv):
        txs = parse_csv_file(rbc_csv, bank="rbc")
        assert len(txs) == 2
        assert txs[0].currency == "CAD"
        assert txs[0].amount == 4000.0

    def test_rbc_negative(self, rbc_csv):
        txs = parse_csv_file(rbc_csv, bank="rbc")
        assert txs[1].amount == -200.0


class TestParseTD:
    def test_td_debit_credit(self, td_csv):
        txs = parse_csv_file(td_csv, bank="td")
        assert len(txs) == 2
        assert txs[0].amount == 4000.0   # credit
        assert txs[1].amount == -200.0   # debit

    def test_td_currency(self, td_csv):
        txs = parse_csv_file(td_csv, bank="td")
        assert all(tx.currency == "CAD" for tx in txs)


class TestParseANZNative:
    def test_anz_debit_credit(self, anz_native_csv):
        txs = parse_csv_file(anz_native_csv, bank="anz")
        assert txs[0].amount == -45.0
        assert txs[1].amount == -120.0

    def test_anz_currency(self, anz_csv):
        txs = parse_csv_file(anz_csv, bank="anz")
        assert all(tx.currency == "AUD" for tx in txs)


class TestEdgeCases:
    def test_empty_file(self):
        assert parse_csv_file("", bank="anz") == []

    def test_headers_only(self):
        assert parse_csv_file("date,description,amount,currency\n", bank="anz") == []

    def test_bank_set_on_tx(self, anz_csv):
        txs = parse_csv_file(anz_csv, bank="anz")
        assert all(tx.bank == "anz" for tx in txs)


class TestCSVIngestionManager:
    def test_load_bank(self, temp_bank_dir):
        mgr = CSVIngestionManager(str(temp_bank_dir))
        txs = mgr.load_bank("anz")
        assert len(txs) > 0
        assert all(tx.bank == "anz" for tx in txs)

    def test_load_all(self, temp_bank_dir):
        mgr = CSVIngestionManager(str(temp_bank_dir))
        txs = mgr.load_all()
        banks = {tx.bank for tx in txs}
        assert "anz" in banks
        assert "rbc" in banks

    def test_deduplication(self, tmp_path, anz_csv):
        d = tmp_path / "anz" / "2025" / "07"
        d.mkdir(parents=True)
        (d / "a.csv").write_text(anz_csv)
        (d / "b.csv").write_text(anz_csv)
        mgr = CSVIngestionManager(str(tmp_path))
        txs = mgr.load_bank("anz")
        ids = [tx.id for tx in txs]
        assert len(ids) == len(set(ids))

    def test_missing_bank_returns_empty(self, tmp_path):
        mgr = CSVIngestionManager(str(tmp_path))
        assert mgr.load_bank("nonexistent") == []
