## LayoutMind X — AI Interior Optimization Studio

Production-grade full-stack demo:

- **Frontend**: React (Vite) + TypeScript + TailwindCSS + Framer Motion + React Three Fiber + Drei + Zustand + React Router
- **Backend**: Node.js (Express) proxy API
- **Soft Computing Engine**: Python (FastAPI) + scikit-fuzzy + DEAP (Genetic Algorithm)

### 1) Run the Soft Computing Engine (Python)

```bash
cd softcomputing-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Health check: `http://127.0.0.1:8000/health`

### 2) Run the Backend (Node/Express)

```bash
cd backend
npm install
npm run dev
```

Health check: `http://localhost:3001/api/health`

### 3) Run the Frontend (Vite)

```bash
cd frontend
npm install
npm run dev
```

Open the app shown by Vite (usually `http://localhost:5173`).

### Notes

- **3D furniture is loaded from real GLTF/GLB URLs** (GitHub raw CC0/OSS assets).
- **Currency is Indian Rupees (₹)** and formatted using `en-IN` locale grouping.
- Layouts + metrics are persisted in **LocalStorage** (`layoutmindx-studio`).

