from db.store import TransactionStore, AU_BANKS, CA_BANKS, country_of, COUNTRY_BANKS


class TestCountryConstants:
    def test_au_banks(self):
        assert "anz" in AU_BANKS
        assert "nab" in AU_BANKS
        assert "cba" in AU_BANKS
        assert "westpac" in AU_BANKS

    def test_ca_banks(self):
        assert "rbc" in CA_BANKS
        assert "td" in CA_BANKS
        assert "bmo" in CA_BANKS

    def test_country_of_au(self):
        assert country_of("anz") == "AU"
        assert country_of("westpac") == "AU"

    def test_country_of_ca(self):
        assert country_of("rbc") == "CA"
        assert country_of("td") == "CA"

    def test_country_banks_mapping(self):
        assert COUNTRY_BANKS["AU"] == AU_BANKS
        assert COUNTRY_BANKS["CA"] == CA_BANKS


class TestTransactionStoreCSV:
    def test_load_bank(self, temp_bank_dir):
        store = TransactionStore(str(temp_bank_dir))
        txs = store.load_bank("anz")
        assert len(txs) > 0

    def test_load_country_au(self, temp_bank_dir):
        store = TransactionStore(str(temp_bank_dir))
        txs = store.load_country("AU")
        assert all(tx.currency == "AUD" for tx in txs)

    def test_load_country_ca(self, temp_bank_dir):
        store = TransactionStore(str(temp_bank_dir))
        txs = store.load_country("CA")
        assert all(tx.currency == "CAD" for tx in txs)

    def test_load_all(self, temp_bank_dir):
        store = TransactionStore(str(temp_bank_dir))
        txs = store.load_all()
        currencies = {tx.currency for tx in txs}
        assert "AUD" in currencies
        assert "CAD" in currencies

    def test_deduplication(self, temp_bank_dir, anz_csv):
        extra = temp_bank_dir / "anz" / "2025" / "07" / "dup.csv"
        extra.write_text(anz_csv)
        store = TransactionStore(str(temp_bank_dir))
        txs = store.load_bank("anz")
        ids = [tx.id for tx in txs]
        assert len(ids) == len(set(ids))

    def test_sorted_by_date(self, temp_bank_dir):
        store = TransactionStore(str(temp_bank_dir))
        txs = store.load_all()
        dates = [tx.date for tx in txs]
        assert dates == sorted(dates)
