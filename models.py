from typing import List, Optional, Literal
from pydantic import BaseModel
from datetime import date

class Transaction(BaseModel):
    id: str
    date: date
    description: str
    amount: float
    currency: Literal["AUD", "CAD"]
    account_code: Optional[str] = None
    tax_code: Optional[str] = None
    category: Optional[str] = None

class ChartOfAccount(BaseModel):
    code: str
    name: str
    type: Literal["INCOME", "EXPENSE", "ASSET", "LIABILITY", "EQUITY"]

class BASDraft(BaseModel):
    period_start: date
    period_end: date
    g1_total_sales: float
    g10_capital_purchases: float
    g11_non_capital_purchases: float
    gst_on_sales_1a: float
    gst_on_purchases_1b: float
    net_gst_payable: float

class TaxDraftAUCompany(BaseModel):
    year: int
    taxable_income: float
    tax_payable: float
    notes: List[str]

class TaxDraftAUPersonal(BaseModel):
    year: int
    taxable_income: float
    tax_payable: float
    medicare_levy: float
    notes: List[str]

class TaxDraftCACorporate(BaseModel):
    year: int
    taxable_income: float
    federal_tax: float
    provincial_tax: float
    total_tax: float
    notes: List[str]

class TaxDraftCAPersonal(BaseModel):
    year: int
    taxable_income: float
    federal_tax: float
    provincial_tax: float
    total_tax: float
    notes: List[str]

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    message: str
    data: Optional[dict] = None
