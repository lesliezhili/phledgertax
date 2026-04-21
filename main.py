from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import HTMLResponse
from models import ChatRequest, ChatResponse, Transaction
from chat_agent import PHLedgerAgent
from pathlib import Path
import csv
from datetime import datetime
from typing import List

app = FastAPI(title="PHLedger Working Agent")
agent = PHLedgerAgent()

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/readme")
def readme():
    return {"readme": Path(__file__).with_name("README.md").read_text()}

@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    return agent.handle(req.message)

@app.get("/ui", response_class=HTMLResponse)
def ui():
    html = Path(__file__).with_name("ui.html").read_text(encoding="utf-8")
    return HTMLResponse(content=html)

@app.post("/upload")
def upload_csv(bank: str = Form(...), file: UploadFile = File(...)):
    """
    Upload CSV for ANZ or RBC, auto-detect year/month from dates, save to folder.
    """
    content = file.file.read().decode("utf-8")
    lines = content.splitlines()
    if not lines:
        return {"error": "Empty file"}

    reader = csv.DictReader(lines)
    rows = list(reader)
    if not rows:
        return {"error": "No data rows"}

    # Detect year/month from first row's date
    first_date = datetime.strptime(rows[0]["date"], "%Y-%m-%d").date()
    year = str(first_date.year)
    month = f"{first_date.month:02d}"

    # Folder
    base = Path(__file__).parent / "bank_data" / bank / year / month
    base.mkdir(parents=True, exist_ok=True)

    # Save CSV
    csv_path = base / f"{file.filename}"
    with csv_path.open("w") as f:
        f.write(content)

    return {"message": f"Uploaded {file.filename} to {bank}/{year}/{month}"}

@app.get("/transactions", response_model=List[Transaction])
def get_transactions():
    """
    Get all transactions from ANZ and RBC.
    """
    anz = agent.ingestor.load_bank("anz")
    rbc = agent.ingestor.load_bank("rbc")
    return anz + rbc

@app.get("/analytics")
def get_analytics():
    """
    Get basic analytics on transactions.
    """
    anz = agent.ingestor.load_bank("anz")
    rbc = agent.ingestor.load_bank("rbc")
    all_tx = anz + rbc
    income = sum(t.amount for t in all_tx if t.amount > 0)
    expenses = sum(abs(t.amount) for t in all_tx if t.amount < 0)
    return {
        "total_transactions": len(all_tx),
        "total_income": round(income, 2),
        "total_expenses": round(expenses, 2),
        "net": round(income - expenses, 2)
    }
