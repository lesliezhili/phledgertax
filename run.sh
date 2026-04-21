#!/bin/bash
cd "$(dirname "$0")"
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
sleep 2
open http://localhost:8000/ui