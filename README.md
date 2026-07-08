
A next-generation interactive calendar built with a multi-language stack:

- **Frontend** — Svelte 5 + Vite + Threlte (Three.js) — 3D WebGL calendar with per-vertex paper-curl physics
- **Backend** — Go 1.21 + Fiber — hardened REST API, WebSockets, rate limiting
- **Physics** — Rust → WebAssembly — 192-point spring mesh for realistic page bending

## Features

- Interactive 3D calendar with physics-driven page flip
- Natural language event scheduling ("Dentist next Thursday at 3pm")
- Per-month colour palettes and editorial quotes
- Full keyboard navigation (←→ months, Home/End to jump)
- localStorage event persistence
- Real-time WebSocket event sync
- ARIA-compliant grid with today/selected/event-pip states

## Running locally

### Frontend
```bash
cd frontend
npm install
npm run dev         # http://localhost:5173
```

### Backend (requires Go 1.21+)
```bash
cd backend
go mod tidy
go run main.go      # http://127.0.0.1:4000
```

### Wasm physics build (requires wasm-pack)
```bash
cd physics
wasm-pack build --target web
```
