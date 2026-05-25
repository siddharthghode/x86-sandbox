# ASM & RE Playground

A beginner-friendly systems programming web app for learning x86-64 assembly and reverse engineering.

## Stack

| Layer    | Tech                              |
|----------|-----------------------------------|
| Frontend | React 18 + Vite + Tailwind CSS    |
| Backend  | Python 3 + Django + Django REST Framework |

## Features

- **NASM Panel** — Write x86-64 assembly, assemble it, see hex encoding + register simulation
- **ELF Inspector** — Upload or demo-load an ELF binary, inspect header / segments / sections / symbols
- **Opcode Reference** — Searchable x86-64 instruction reference with encodings, flags, and latency
- **Hex Dump** — Upload any binary, view hex dump with byte-level analysis and entropy stats
- **CFG Visualizer** — Control flow graph canvas for factorial, fibonacci, loops, switch, shellcode
- **Calling Conventions** — System V AMD64, Windows x64, cdecl, Linux syscall reference

---

## Project Structure

```
x86-sandbox/
├── backend/
│   ├── api/
│   │   ├── urls.py           # URL routing for all API endpoints
│   │   └── views.py          # Django views (AssembleView, ParseElfView, …)
│   ├── services/
│   │   ├── assembler_service.py  # NASM subprocess + fallback encoding table
│   │   ├── elf_service.py        # ELF binary parser (struct)
│   │   ├── binary_service.py     # Entropy, hex rows, byte info
│   │   └── cfg_service.py        # CFG node/edge data
│   ├── manage.py
│   ├── settings.py
│   ├── urls.py
│   ├── wsgi.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/       # One file per panel + shared UI
│   │   │   ├── Navbar.jsx
│   │   │   ├── Tabs.jsx
│   │   │   ├── NasmPanel.jsx
│   │   │   ├── ElfPanel.jsx
│   │   │   ├── OpcodePanel.jsx
│   │   │   ├── HexDumpPanel.jsx
│   │   │   ├── CFGPanel.jsx
│   │   │   ├── RegisterPanel.jsx
│   │   │   └── CallingConventionPanel.jsx
│   │   ├── services/
│   │   │   └── api.js        # All fetch() calls to Django
│   │   ├── utils/
│   │   │   └── data.js       # Static data (ISET, EXAMPLES, DEMO_ELF, DEMO_BINARY)
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js        # Proxies /api → localhost:8000
│   ├── tailwind.config.js
│   └── package.json
│
├── start.sh                  # One-command launcher for both servers
└── README.md
```

---

## Quick Start

### One command (recommended)

```bash
chmod +x start.sh
./start.sh
```

This will:
1. Create a Python virtual environment inside `backend/venv/` (first run only)
2. Install Python dependencies
3. Start Django on **http://localhost:8000**
4. Install Node dependencies (first run only)
5. Start Vite on **http://localhost:5173**

Press `Ctrl+C` to stop both servers.

---

### Manual setup

#### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py runserver 8000
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
# Vite runs on http://localhost:5173
# /api/* is automatically proxied to Django
```

Open **http://localhost:5173**

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Python | 3.10+ | |
| Node.js | 18+ | |
| nasm | any | Optional — enables real assembly; falls back to encoding table if absent |

Install nasm (optional):
```bash
# Ubuntu/Debian
sudo apt install nasm

# macOS
brew install nasm
```

---

## API Reference

| Method | Endpoint | Body / Params | Returns |
|--------|----------|---------------|---------|
| POST | `/api/assemble` | `{ source: "..." }` | `{ lines, total_bytes, error }` |
| POST | `/api/parse-elf` | multipart `file` | `{ header, segments, sections, symbols }` |
| POST | `/api/analyze-binary` | multipart `file` | `{ rows, stats, opcode_hints }` |
| POST | `/api/byte-info` | `{ data: "<b64>", offset: 0 }` | byte details |
| GET  | `/api/cfg` | `?name=fact` | `{ title, nodes, edges }` |

---

## Architecture Notes

**Why Django?**
Minimal config, built-in file upload handling, and clean URL routing. No database is used — `DATABASES = {}` in settings.

**Why Vite proxy?**
`vite.config.js` proxies `/api/*` → `localhost:8000` during development so the frontend never deals with CORS. In production, put Nginx in front of both.

**Why keep static data on the frontend?**
`ISET`, `EXAMPLES`, and `CFG_DATA` are pure reference data. Keeping them client-side means instant load with no round-trip.

**Data flow:**
```
User types NASM → NasmPanel → api.js → POST /api/assemble → assembler_service.py
                                                              ↓ (tries real nasm, falls back to table)
                            ← JSON { lines, total_bytes } ←
NasmPanel renders disassembly + simulates registers client-side
```
