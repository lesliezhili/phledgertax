from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from .models import ChatRequest, ChatResponse
from .chat_agent import PHLedgerAgent
from pathlib import Path

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
