from datetime import date, timedelta
from typing import List
from ..models import Transaction, ChartOfAccount

class XeroMockConnector:
    def get_chart_of_accounts(self) -> List[ChartOfAccount]:
        return [
            ChartOfAccount(code="200", name="Sales", type="INCOME"),
            ChartOfAccount(code="400", name="Office Expenses", type="EXPENSE"),
            ChartOfAccount(code="401", name="Software Subscriptions", type="EXPENSE"),
        ]

    def get_transactions(self, start: date, end: date) -> List[Transaction]:
        txs = []
        for i in range((end - start).days or 1):
            d = start + timedelta(days=i)
            txs.append(Transaction(
                id=f"sale-{i}",
                date=d,
                description="Client Payment",
                amount=1000,
                currency="AUD"
            ))
            txs.append(Transaction(
                id=f"sub-{i}",
                date=d,
                description="Xero Subscription",
                amount=-70,
                currency="AUD"
            ))
        return txs
