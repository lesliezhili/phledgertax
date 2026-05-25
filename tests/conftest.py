import pytest
from datetime import date
from models import Transaction


@pytest.fixture
def au_transactions():
    return [
        Transaction(id="au1", date=date(2025, 7, 15), description="Client Invoice 001", amount=5000.0, currency="AUD", bank="anz"),
        Transaction(id="au2", date=date(2025, 7, 20), description="Woolworths Groceries", amount=-120.0, currency="AUD", bank="anz"),
        Transaction(id="au3", date=date(2025, 8, 1),  description="Telstra Mobile Bill", amount=-89.0, currency="AUD", bank="nab"),
        Transaction(id="au4", date=date(2025, 8, 10), description="Uber Eats", amount=-45.0, currency="AUD", bank="anz"),
        Transaction(id="au5", date=date(2025, 9, 1),  description="Office Rent", amount=-2000.0, currency="AUD", bank="cba"),
        Transaction(id="au6", date=date(2025, 9, 15), description="Service Revenue", amount=3000.0, currency="AUD", bank="westpac"),
        Transaction(id="au7", date=date(2025, 10, 5), description="Fuel - BP", amount=-80.0, currency="AUD", bank="anz"),
        Transaction(id="au8", date=date(2025, 10, 20), description="Bank Fee", amount=-15.0, currency="AUD", bank="anz"),
        Transaction(id="au9", date=date(2025, 11, 1), description="Client Invoice 002", amount=7500.0, currency="AUD", bank="anz"),
    ]


@pytest.fixture
def ca_transactions():
    return [
        Transaction(id="ca1", date=date(2025, 1, 10), description="Client Payment", amount=4000.0, currency="CAD", bank="rbc"),
        Transaction(id="ca2", date=date(2025, 1, 15), description="Loblaws Grocery", amount=-200.0, currency="CAD", bank="rbc"),
        Transaction(id="ca3", date=date(2025, 2, 1),  description="Rogers Internet", amount=-95.0, currency="CAD", bank="td"),
        Transaction(id="ca4", date=date(2025, 2, 14), description="Tim Hortons", amount=-15.0, currency="CAD", bank="bmo"),
        Transaction(id="ca5", date=date(2025, 3, 1),  description="Office Rent", amount=-1800.0, currency="CAD", bank="rbc"),
        Transaction(id="ca6", date=date(2025, 3, 15), description="Service Invoice", amount=2500.0, currency="CAD", bank="rbc"),
        Transaction(id="ca7", date=date(2025, 4, 5),  description="Bank Fee", amount=-12.0, currency="CAD", bank="rbc"),
        Transaction(id="ca8", date=date(2025, 4, 20), description="Contractor Payment", amount=-500.0, currency="CAD", bank="scotiabank"),
    ]


@pytest.fixture
def anz_csv():
    return """Date,Details,Debit,Credit,Balance
15/07/2025,Client Invoice 001,,5000.00,5000.00
20/07/2025,Woolworths Groceries,120.00,,4880.00
01/08/2025,Telstra Mobile Bill,89.00,,4791.00
"""

@pytest.fixture
def rbc_csv():
    return """Transaction Date,Description 1,Description 2,CAD$,USD$
01/10/2025,Client Payment,,4000.00,
15/10/2025,Loblaws Grocery,,-200.00,
"""

@pytest.fixture
def td_csv():
    return """Date,Description,DEBIT,CREDIT
2025-01-10,Client Payment,,4000.00
2025-01-15,Loblaws Grocery,200.00,
"""

@pytest.fixture
def anz_native_csv():
    return """Date,Details,Debit,Credit,Balance
01/11/2025,Uber Eats,45.00,,9955.00
10/11/2025,Woolworths,120.00,,9835.00
"""

@pytest.fixture(autouse=True)
def no_supabase(monkeypatch):
    monkeypatch.delenv("SUPABASE_URL", raising=False)
    monkeypatch.delenv("SUPABASE_KEY", raising=False)


@pytest.fixture
def temp_bank_dir(tmp_path, anz_csv, rbc_csv):
    anz_dir = tmp_path / "anz" / "2025" / "07"
    anz_dir.mkdir(parents=True)
    (anz_dir / "transactions.csv").write_text(anz_csv)
    rbc_dir = tmp_path / "rbc" / "2025" / "10"
    rbc_dir.mkdir(parents=True)
    (rbc_dir / "transactions.csv").write_text(rbc_csv)
    return tmp_path
