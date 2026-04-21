from models import Transaction, ChartOfAccount
from typing import List

def auto_categorise(txs: List[Transaction], chart: List[ChartOfAccount]):
    for tx in txs:
        desc = tx.description.lower()
        if "client" in desc:
            tx.category = "Sales"
            tx.account_code = "200"
            tx.tax_code = "GST_ON_INCOME"
        elif "subscription" in desc:
            tx.category = "Software Subscriptions"
            tx.account_code = "401"
            tx.tax_code = "GST_ON_EXPENSE"
        else:
            tx.category = "Office Expenses"
            tx.account_code = "400"
            tx.tax_code = "GST_ON_EXPENSE"
    return txs
