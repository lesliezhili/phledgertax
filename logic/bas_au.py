from datetime import date
from typing import List
from ..models import Transaction, BASDraft

def generate_bas_draft(txs: List[Transaction], start: date, end: date):
    gst_rate = 0.10
    sales = 0
    purchases = 0
    gst_sales = 0
    gst_purchases = 0

    for tx in txs:
        if not (start <= tx.date <= end):
            continue
        if tx.amount > 0:
            sales += tx.amount
            gst_sales += tx.amount * gst_rate / 1.1
        else:
            purchases += abs(tx.amount)
            gst_purchases += abs(tx.amount) * gst_rate / 1.1

    return BASDraft(
        period_start=start,
        period_end=end,
        g1_total_sales=round(sales, 2),
        g10_capital_purchases=0,
        g11_non_capital_purchases=round(purchases, 2),
        gst_on_sales_1a=round(gst_sales, 2),
        gst_on_purchases_1b=round(gst_purchases, 2),
        net_gst_payable=round(gst_sales - gst_purchases, 2),
    )
