import pytest
from logic.categoriser import auto_categorise, load_coa, load_rules, DEFAULT_COA, DEFAULT_RULES
from models import Transaction
from datetime import date


def make_tx(desc, amount=100.0, currency="AUD"):
    return Transaction(id="t1", date=date(2025, 7, 1), description=desc, amount=amount, currency=currency)


class TestAutoCategoirse:
    def test_client_invoice(self):
        txs = auto_categorise([make_tx("Client Invoice 001", 5000.0)])
        assert txs[0].account_code == "200"

    def test_subscription_netflix(self):
        txs = auto_categorise([make_tx("Netflix subscription", -15.0)])
        assert txs[0].account_code == "401"

    def test_travel_uber(self):
        txs = auto_categorise([make_tx("Uber trip", -30.0)])
        assert txs[0].account_code == "402"

    def test_uber_meals(self):
        txs = auto_categorise([make_tx("Uber Eats delivery", -45.0)])
        assert txs[0].account_code == "407"

    def test_ubereats_nospace(self):
        txs = auto_categorise([make_tx("UBEREATS order", -25.0)])
        assert txs[0].account_code == "407"

    def test_grocery_woolworths(self):
        txs = auto_categorise([make_tx("Woolworths", -120.0)])
        assert txs[0].account_code == "407"

    def test_telco_telstra(self):
        txs = auto_categorise([make_tx("Telstra Mobile", -89.0)])
        assert txs[0].account_code == "404"

    def test_bank_fee(self):
        txs = auto_categorise([make_tx("Monthly Account Fee", -15.0)])
        assert txs[0].account_code == "406"

    def test_rent(self):
        txs = auto_categorise([make_tx("Office Rent Payment", -2000.0)])
        assert txs[0].account_code == "409"

    def test_fuel_bp(self):
        txs = auto_categorise([make_tx("BP Fuel", -80.0)])
        assert txs[0].account_code == "414"

    def test_fallback_income(self):
        txs = auto_categorise([make_tx("Mystery Deposit", 500.0)])
        assert txs[0].account_code == "202"

    def test_fallback_expense(self):
        txs = auto_categorise([make_tx("Unknown Expense", -100.0)])
        assert txs[0].account_code == "499"

    def test_batch(self, au_transactions):
        result = auto_categorise(au_transactions)
        assert all(tx.account_code is not None for tx in result)

    def test_category_name_set(self):
        txs = auto_categorise([make_tx("Uber Eats", -30.0)])
        assert txs[0].category == "Meals & Entertainment"


class TestLoadCOA:
    def test_default_count(self):
        coa = load_coa("nonexistent.json")
        assert len(coa) == 26

    def test_income_accounts(self):
        coa = load_coa("nonexistent.json")
        income = [a for a in coa if a.type == "INCOME"]
        assert len(income) == 3


class TestLoadRules:
    def test_default_count(self):
        rules = load_rules("nonexistent.json")
        assert len(rules) == 16

    def test_uber_eats_first(self):
        rules = load_rules("nonexistent.json")
        uber_eats = next((r for r in rules if "eats" in r["pattern"]), None)
        uber_generic = next((r for r in rules if r["pattern"] == r"(?i)uber|lyft|taxi|cab\b"), None)
        assert uber_eats is not None
        assert rules.index(uber_eats) < rules.index(uber_generic)
