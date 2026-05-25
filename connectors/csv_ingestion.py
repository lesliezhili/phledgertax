import csv
import hashlib
from datetime import datetime
from pathlib import Path
from typing import List
from models import Transaction

BANK_FORMATS = {
    "phledger": {"date_col": "date", "desc_col": "description", "amount_col": "amount", "currency": None, "date_fmt": "%Y-%m-%d"},
    "anz":      {"date_col": "Date", "desc_col": "Details", "debit_col": "Debit", "credit_col": "Credit", "currency": "AUD", "date_fmt": "%d/%m/%Y"},
    "nab":      {"date_col": "Date", "desc_col": "Description", "amount_col": "Amount", "currency": "AUD", "date_fmt": "%d-%b-%y"},
    "cba":      {"date_col": "Date", "desc_col": "Description", "amount_col": "Amount", "currency": "AUD", "date_fmt": "%d/%m/%Y"},
    "westpac":  {"date_col": "Date", "desc_col": "Description", "amount_col": "Amount", "currency": "AUD", "date_fmt": "%d/%m/%Y"},
    "rbc":      {"date_col": "Transaction Date", "desc_col": "Description 1", "amount_col": "CAD$", "currency": "CAD", "date_fmt": "%m/%d/%Y"},
    "td":       {"date_col": "Date", "desc_col": "Description", "debit_col": "DEBIT", "credit_col": "CREDIT", "currency": "CAD", "date_fmt": "%m/%d/%Y"},
    "bmo":      {"date_col": "Date", "desc_col": "Description", "amount_col": "Amount", "currency": "CAD", "date_fmt": "%Y-%m-%d"},
    "scotiabank": {"date_col": "Date", "desc_col": "Description", "amount_col": "Amount", "currency": "CAD", "date_fmt": "%m/%d/%Y"},
    "cibc":     {"date_col": "Date", "desc_col": "Description", "amount_col": "Debit/Credit", "currency": "CAD", "date_fmt": "%Y-%m-%d"},
}

AU_BANKS = {"anz", "nab", "cba", "westpac"}
CA_BANKS = {"rbc", "td", "bmo", "scotiabank", "cibc"}


def _detect_format(headers: List[str]) -> str:
    h = set(h.strip() for h in headers)
    if "Transaction Date" in h and "CAD$" in h:
        return "rbc"
    if "DEBIT" in h and "CREDIT" in h and "Date" in h:
        return "td"
    if "Details" in h and "Debit" in h and "Credit" in h:
        return "anz"
    if "date" in h and "description" in h and "amount" in h:
        return "phledger"
    return "cba"


def _make_id(bank: str, row_date: str, description: str, amount: str) -> str:
    raw = f"{bank}|{row_date}|{description}|{amount}"
    return hashlib.md5(raw.encode()).hexdigest()[:16]


def _parse_amount(val: str) -> float:
    if not val or not val.strip():
        return 0.0
    try:
        return float(val.replace(",", "").replace("$", "").strip())
    except ValueError:
        return 0.0


def parse_csv_file(content: str, bank: str = "phledger") -> List[Transaction]:
    lines = content.strip().splitlines()
    if not lines:
        return []
    reader = csv.DictReader(lines)
    headers = list(reader.fieldnames or [])
    detected = _detect_format(headers)
    fmt = BANK_FORMATS.get(detected, BANK_FORMATS["phledger"])

    bank_lower = bank.lower()
    if bank_lower in AU_BANKS:
        currency = "AUD"
    elif bank_lower in CA_BANKS:
        currency = "CAD"
    else:
        currency = fmt.get("currency") or "AUD"

    txs = []
    for row in reader:
        try:
            date_str = row.get(fmt["date_col"], "").strip()
            if not date_str:
                continue
            try:
                tx_date = datetime.strptime(date_str, fmt["date_fmt"]).date()
            except (ValueError, KeyError):
                tx_date = datetime.strptime(date_str, "%Y-%m-%d").date()

            description = row.get(fmt["desc_col"], "").strip()

            if "debit_col" in fmt:
                debit = _parse_amount(row.get(fmt["debit_col"], ""))
                credit = _parse_amount(row.get(fmt["credit_col"], ""))
                amount = credit - debit
            else:
                amount = _parse_amount(row.get(fmt.get("amount_col", "amount"), ""))

            if amount == 0.0 and not description:
                continue

            if detected == "phledger" and "currency" in row:
                currency = row["currency"].strip()

            tx_id = _make_id(bank_lower, str(tx_date), description, str(amount))
            txs.append(Transaction(
                id=tx_id, date=tx_date, description=description,
                amount=amount, currency=currency, bank=bank_lower,
            ))
        except Exception:
            continue
    return txs


class CSVIngestionManager:
    def __init__(self, base_dir: str = "bank_data"):
        self.base_dir = Path(base_dir)

    def load_bank(self, bank: str) -> List[Transaction]:
        bank_path = self.base_dir / bank
        if not bank_path.exists():
            return []
        all_txs: dict = {}
        for csv_file in sorted(bank_path.rglob("*.csv")):
            content = csv_file.read_text(encoding="utf-8", errors="ignore")
            for tx in parse_csv_file(content, bank=bank):
                all_txs[tx.id] = tx
        return sorted(all_txs.values(), key=lambda t: t.date)

    def load_all(self) -> List[Transaction]:
        if not self.base_dir.exists():
            return []
        all_txs: dict = {}
        for bank_dir in sorted(self.base_dir.iterdir()):
            if bank_dir.is_dir():
                for tx in self.load_bank(bank_dir.name):
                    all_txs[tx.id] = tx
        return sorted(all_txs.values(), key=lambda t: t.date)
