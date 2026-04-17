# LayoutMind AI Platform
**(Formerly LayoutMind X)**

LayoutMind is a proprietary, AI-powered interior layout generation studio. It leverages Natural Language Processing, a deterministic collision-aware spatial engine, and WebGL to instantly transform text descriptions into fully interactive 3D rooms.

## 🚀 Key Features

* **Cinematic Interface**: A split-panel glassmorphic workspace powered by Framer Motion, GSAP, and smooth scrolling (Lenis).
* **🧠 Artificial Intelligence & Soft Computing**:
  * **Natural Language Processing (NLP)**: Utilizes `spaCy` and advanced heuristics to extract precise constraints (dimensions, budgets, items) and semantic styling from natural user prompts.
  * **Fuzzy Inference System (Neuro-Fuzzy AI)**: Uses `scikit-fuzzy` to map ambiguous, qualitative style concepts ("cozy", "minimal") into strict numerical variables like layout density, openness gradients, and budget sensitivities.
  * **Evolutionary Genetic Algorithms**: Powered by `DEAP`, the AI engine simulates natural evolution. It rapidly mates, mutates, and evaluates hundreds of layout coordinates in real-time acting as a virtual interior designer, optimizing for a strict fitness score based on collision avoidance, clearance, and style alignment.
* **Deterministic Spatial Anchor (Collision AI)**: Operates alongside the GA to ensure mathematically perfect bounding-box constraints, preventing any 3D models from overlapping or breaching walls.
* **Real-time 3D Rendering**: High-fidelity shadows and materials using React-Three-Fiber and Drei.

## 🛠 Tech Stack

* **Frontend:** React 19, Vite, TypeScript, TailwindCSS v4, Zustand, Framer Motion, GSAP, Three.js (@react-three/fiber).
* **AI & Spatial Engine:** Python, FastAPI, DEAP (Genetic Algorithm), scikit-fuzzy, SpaCy.
* **Architecture Base:** Node.js Express proxy (Legacy support).

## 💻 Local Development

### 1) Run the Engine (Python)

```bash
cd softcomputing-service
pip install -r requirements.txt
uvicorn main_fixed:app --reload --port 8000
```
Health check: `http://127.0.0.1:8000/health`

### 2) Run the Frontend (Vite)

```bash
cd frontend
npm install
npm run dev
```
Open **http://localhost:5173**.

> Note: The frontend is configured to communicate directly with the local Python engine in development. Production deployments can connect to hosted engine URLs using the `VITE_API_URL` environment variable.

## ©️ License

**Copyright © 2026 AHMED SINAAN. All Rights Reserved.** 
Unauthorized copying, modification, or distribution is strictly prohibited.
