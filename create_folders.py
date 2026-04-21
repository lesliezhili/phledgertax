from pathlib import Path

def create_bank_folders():
    base = Path(__file__).resolve().parent / "bank_data"
    banks = ["anz", "rbc"]

    start_year = 2019
    end_year = 2032

    for bank in banks:
        for year in range(start_year, end_year + 1):
            for month in range(1, 13):
                folder = base / bank / str(year) / f"{month:02d}"
                folder.mkdir(parents=True, exist_ok=True)

    print("Bank folder structure created successfully.")

if __name__ == "__main__":
    create_bank_folders()
