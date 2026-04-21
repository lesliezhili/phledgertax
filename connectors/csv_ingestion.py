import csv
from pathlib import Path
from datetime import datetime
from typing import List, Dict
from models import Transaction

class CSVIngestionManager:
    def __init__(self, base_path: Path):
        self.base_path = base_path

    def load_bank(self, bank: str) -> List[Transaction]:
        """
        Load all CSVs from bank_data/{bank}/year/month/ folders,
        deduplicate by transaction id, return list of Transaction objects.
        """
        bank_path = self.base_path / bank
        if not bank_path.exists():
            return []

        transactions: Dict[str, Transaction] = {}

        # Walk through all year/month folders
        for year_dir in bank_path.iterdir():
            if not year_dir.is_dir():
                continue
            for month_dir in year_dir.iterdir():
                if not month_dir.is_dir():
                    continue
                for csv_file in month_dir.glob("*.csv"):
                    txs = self._parse_csv(csv_file, bank)
                    for tx in txs:
                        transactions[tx.id] = tx  # Deduplicate by id

        return list(transactions.values())

    def _parse_csv(self, csv_path: Path, bank: str) -> List[Transaction]:
        """
        Parse a single CSV file into Transaction objects.
        Assumes format: date,description,amount,currency,id
        """
        transactions = []
        try:
            with csv_path.open() as f:
                reader = csv.DictReader(f)
                for row in reader:
                    try:
                        tx_date = datetime.strptime(row["date"], "%Y-%m-%d").date()
                        amount = float(row["amount"])
                        currency = row.get("currency", "AUD" if bank == "anz" else "CAD")
                        tx_id = row["id"]
                        description = row["description"]

                        tx = Transaction(
                            id=tx_id,
                            date=tx_date,
                            description=description,
                            amount=amount,
                            currency=currency
                        )
                        transactions.append(tx)
                    except (ValueError, KeyError) as e:
                        # Skip invalid rows
                        continue
        except Exception as e:
            # Skip unparseable files
            pass
        return transactions