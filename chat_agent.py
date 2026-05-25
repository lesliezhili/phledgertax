from models import ChatResponse, Transaction
from connectors.csv_ingestion import CSVIngestionManager
from db.store import TransactionStore, AU_BANKS, CA_BANKS
from logic.bas_au import generate_bas_draft, generate_quarterly_bas
from logic.tax_au import draft_au_company_tax, draft_au_personal_tax
from logic.tax_ca import draft_ca_corporate_tax, draft_ca_personal_tax, generate_quarterly_gst, generate_annual_hst
from logic.financial_statements import generate_financial_statements
from datetime import date
from typing import List
import os


class PHLedgerAgent:
    def __init__(self):
        base = os.environ.get("BANK_DATA_PATH", "bank_data")
        self.store = TransactionStore(base)
        self.ingestor = self.store._ingestor

    def _au(self) -> List[Transaction]:
        return self.store.load_country("AU")

    def _ca(self) -> List[Transaction]:
        return self.store.load_country("CA")

    def _all(self) -> List[Transaction]:
        return self.store.load_all()

    def handle(self, message: str) -> ChatResponse:
        msg = message.lower().strip()

        if msg in ("help", "?", "commands"):
            return ChatResponse(message=(
                "PHLedger Commands:\n"
                "  help                — this list\n"
                "  status              — transaction counts by country\n"
                "AU (🇦🇺):\n"
                "  au transactions     — list AU transactions\n"
                "  au p&l              — AU profit & loss\n"
                "  au financials       — AU financial statements\n"
                "  bas                 — AU BAS draft (current period)\n"
                "  quarterly bas       — 4 ATO quarters\n"
                "  au company tax      — AU company tax estimate\n"
                "  au personal tax     — AU personal tax estimate\n"
                "CA (🇨🇦):\n"
                "  ca transactions     — list CA transactions\n"
                "  ca p&l              — CA profit & loss\n"
                "  ca financials       — CA financial statements\n"
                "  gst                 — CA quarterly GST\n"
                "  annual hst          — CA annual HST summary\n"
                "  ca corporate tax    — CA corporate tax estimate\n"
                "  ca personal tax     — CA personal tax estimate\n"
            ))

        if msg == "status":
            au = self._au()
            ca = self._ca()
            return ChatResponse(message=f"AU: {len(au)} transactions | CA: {len(ca)} transactions | Total: {len(au) + len(ca)}")

        if "au transactions" in msg:
            txs = self._au()
            return ChatResponse(message=f"AU transactions: {len(txs)}", data={"transactions": [t.model_dump() for t in txs[:20]]})

        if "ca transactions" in msg:
            txs = self._ca()
            return ChatResponse(message=f"CA transactions: {len(txs)}", data={"transactions": [t.model_dump() for t in txs[:20]]})

        if "au p&l" in msg or "au profit" in msg:
            txs = self._au()
            fs = generate_financial_statements(date.today(), txs)
            return ChatResponse(message="AU P&L", data={"profit_loss": fs.profit_loss, "banks": AU_BANKS})

        if "ca p&l" in msg or "ca profit" in msg:
            txs = self._ca()
            fs = generate_financial_statements(date.today(), txs)
            return ChatResponse(message="CA P&L", data={"profit_loss": fs.profit_loss, "banks": CA_BANKS})

        if "au financials" in msg:
            txs = self._au()
            fs = generate_financial_statements(date.today(), txs)
            return ChatResponse(message="AU Financial Statements", data=fs.model_dump())

        if "ca financials" in msg:
            txs = self._ca()
            fs = generate_financial_statements(date.today(), txs)
            return ChatResponse(message="CA Financial Statements", data=fs.model_dump())

        if "quarterly bas" in msg:
            txs = self._au()
            fy = date.today().year if date.today().month >= 7 else date.today().year - 1
            return ChatResponse(message=f"AU BAS — FY{fy}", data={"quarters": generate_quarterly_bas(txs, fy)})

        if "bas" in msg:
            txs = self._au()
            dates = [tx.date for tx in txs]
            start = min(dates) if dates else date(date.today().year, 7, 1)
            bas = generate_bas_draft(txs, start, date.today())
            return ChatResponse(message="AU BAS Draft", data=bas.model_dump())

        if "annual hst" in msg:
            txs = self._ca()
            return ChatResponse(message=f"CA Annual HST {date.today().year}", data=generate_annual_hst(date.today().year, txs))

        if "gst" in msg:
            txs = self._ca()
            q = (date.today().month - 1) // 3 + 1
            gst = generate_quarterly_gst(date.today().year, q, txs)
            return ChatResponse(message=f"CA GST Q{q} {date.today().year}", data=gst.model_dump())

        if "au company tax" in msg:
            txs = self._au()
            return ChatResponse(message="AU Company Tax", data=draft_au_company_tax(date.today().year, txs).model_dump())

        if "au personal tax" in msg:
            txs = self._au()
            return ChatResponse(message="AU Personal Tax", data=draft_au_personal_tax(date.today().year, txs).model_dump())

        if "ca corporate tax" in msg:
            txs = self._ca()
            return ChatResponse(message="CA Corporate Tax", data=draft_ca_corporate_tax(date.today().year, txs).model_dump())

        if "ca personal tax" in msg:
            txs = self._ca()
            return ChatResponse(message="CA Personal Tax", data=draft_ca_personal_tax(date.today().year, txs).model_dump())

        return ChatResponse(message=f"Unknown command: '{message}'. Type 'help' for available commands.")
