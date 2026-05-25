import pytest
from pathlib import Path
import json


@pytest.fixture
def bank_dir(tmp_path):
    anz = tmp_path / "anz" / "2025" / "07"
    anz.mkdir(parents=True)
    (anz / "tx.csv").write_text("Date,Details,Debit,Credit,Balance\n15/07/2025,Client,0,5000.00,5000.00\n20/07/2025,Woolworths,120.00,,4880.00\n")
    rbc = tmp_path / "rbc" / "2025" / "10"
    rbc.mkdir(parents=True)
    (rbc / "tx.csv").write_text("Transaction Date,Description 1,Description 2,CAD$,USD$\n10/01/2025,Client,,4000.00,\n15/01/2025,Loblaws,,-200.00,\n")
    return tmp_path


class TestMigrateLive:
    def test_all_outputs_created(self, bank_dir, tmp_path):
        import migrate
        orig = migrate.OUTPUT_DIR
        migrate.OUTPUT_DIR = tmp_path / "out"
        try:
            migrate.run(str(bank_dir))
            for fname in ["historical_ledger.csv", "monthly_summary.csv", "yearly_summary.csv", "category_summary.csv", "migration_report.json"]:
                assert (tmp_path / "out" / fname).exists(), f"Missing {fname}"
        finally:
            migrate.OUTPUT_DIR = orig

    def test_transaction_count(self, bank_dir, tmp_path):
        import migrate
        orig = migrate.OUTPUT_DIR
        migrate.OUTPUT_DIR = tmp_path / "out2"
        try:
            txs = migrate.run(str(bank_dir))
            assert len(txs) == 4
        finally:
            migrate.OUTPUT_DIR = orig

    def test_coa_seeded(self, bank_dir, tmp_path, monkeypatch):
        import migrate
        monkeypatch.chdir(tmp_path)
        orig = migrate.OUTPUT_DIR
        migrate.OUTPUT_DIR = tmp_path / "out3"
        try:
            migrate.seed_config()
            assert (tmp_path / "chart_of_accounts.json").exists()
            assert (tmp_path / "classification_rules.json").exists()
        finally:
            migrate.OUTPUT_DIR = orig

    def test_report_fields(self, bank_dir, tmp_path):
        import migrate
        orig = migrate.OUTPUT_DIR
        migrate.OUTPUT_DIR = tmp_path / "out4"
        try:
            migrate.run(str(bank_dir))
            report = json.loads((tmp_path / "out4" / "migration_report.json").read_text())
            assert "total_transactions" in report
            assert "by_bank" in report
            assert "by_currency" in report
        finally:
            migrate.OUTPUT_DIR = orig
