#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

# ── Backend ──────────────────────────────────────────────────────────────────
echo "[backend] Setting up virtual environment..."
cd "$ROOT/backend"
if [ ! -d "venv" ]; then
  python3 -m venv venv
fi
source venv/bin/activate
pip install -q -r requirements.txt
echo "[backend] Starting Django on http://localhost:8000 ..."
python manage.py runserver 8000 &
BACKEND_PID=$!
deactivate

# ── Frontend ─────────────────────────────────────────────────────────────────
echo "[frontend] Installing dependencies..."
cd "$ROOT/frontend"
npm install --silent
echo "[frontend] Starting Vite on http://localhost:5173 ..."
npm run dev &
FRONTEND_PID=$!

# ── Cleanup on Ctrl+C ────────────────────────────────────────────────────────
trap "echo ''; echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM

echo ""
echo "  Backend  → http://localhost:8000"
echo "  Frontend → http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers."
wait
