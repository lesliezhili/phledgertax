import csv
from pathlib import Path
from datetime import datetime
from typing import List
from ..models import Transaction

class CsvRbcConnector:
    def __init__(self, path="rbc_transactions.csv"):
        self.path = Path(path)

    def get_transactions(self) -> List[Transaction]:
        if not self.path.exists():
            return []
        txs = []
        with self.path.open() as f:
            reader = csv.DictReader(f)
            for i, row in enumerate(reader):
                txs.append(Transaction(
                    id=f"rbc-{i}",
                    date=datetime.strptime(row["date"], "%Y-%m-%d").date(),
                    description=row["description"],
                    amount=float(row["amount"]),
                    currency="CAD"
                ))
        return txs
