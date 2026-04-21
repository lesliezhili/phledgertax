from models import TaxDraftCACorporate, TaxDraftCAPersonal, Transaction

def draft_ca_corporate_tax(year: int, txs: list[Transaction]):
    income = sum(tx.amount for tx in txs if tx.amount > 0)
    expenses = sum(abs(tx.amount) for tx in txs if tx.amount < 0)
    taxable = max(0, income - expenses)
    fed = taxable * 0.09
    prov = taxable * 0.03
    return TaxDraftCACorporate(
        year=year,
        taxable_income=round(taxable, 2),
        federal_tax=round(fed, 2),
        provincial_tax=round(prov, 2),
        total_tax=round(fed + prov, 2),
        notes=["Simplified CA corporate tax"]
    )

def draft_ca_personal_tax(year: int, txs: list[Transaction]):
    income = sum(tx.amount for tx in txs if tx.amount > 0)
    fed = income * 0.15
    prov = income * 0.05
    return TaxDraftCAPersonal(
        year=year,
        taxable_income=round(income, 2),
        federal_tax=round(fed, 2),
        provincial_tax=round(prov, 2),
        total_tax=round(fed + prov, 2),
        notes=["Simplified CA personal tax"]
    )
