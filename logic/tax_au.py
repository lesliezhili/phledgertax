from models import TaxDraftAUCompany, TaxDraftAUPersonal, Transaction

def draft_au_company_tax(year: int, txs: list[Transaction]):
    income = sum(tx.amount for tx in txs if tx.amount > 0)
    expenses = sum(abs(tx.amount) for tx in txs if tx.amount < 0)
    taxable = max(0, income - expenses)
    tax = taxable * 0.25
    return TaxDraftAUCompany(
        year=year,
        taxable_income=round(taxable, 2),
        tax_payable=round(tax, 2),
        notes=["Simplified 25% company tax"]
    )

def draft_au_personal_tax(year: int, txs: list[Transaction]):
    income = sum(tx.amount for tx in txs if tx.amount > 0)
    tax = max(0, (income - 18200) * 0.19) if income > 18200 else 0
    medicare = income * 0.02
    return TaxDraftAUPersonal(
        year=year,
        taxable_income=round(income, 2),
        tax_payable=round(tax, 2),
        medicare_levy=round(medicare, 2),
        notes=["Simplified stepped tax"]
    )
