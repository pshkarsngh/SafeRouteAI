# SafeRouteAI

AI-powered route safety analysis platform that evaluates road conditions, detects hazards, and provides real-time safety scoring for routes using computer vision, LLM integration, and incident data.

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Three.js, GSAP, Framer Motion |
| Backend | FastAPI, Python 3.12+, Pydantic v2 |
| Database | MongoDB + Motor (async) + Beanie ODM |
| Maps | Google Maps API / Mapbox |
| AI/ML | LangChain, OpenAI GPT / Gemini, PyTorch, TorchVision, OpenCV |
| DevOps | Docker, Docker Compose |

## Features

- **Safety Scoring** — Routes rated 0–100 based on hazard density, incident history, and user preferences
- **Hazard Detection** — CV pipeline for potholes, waterlogging, and road damage classification
- **Incident Search** — Real-time news scraping and caching for route-related accidents
- **Route Alternatives** — Up to 3 route suggestions with side-by-side safety comparison
- **LLM Integration** — Natural language preference parsing and route explanation generation
- **3D Landing Page** — Interactive Three.js particles and GSAP animations

## Project Structure

```
SafeRouteAI/
├── frontend/
│   ├── src/
│   │   ├── app/              # Next.js App Router pages
│   │   ├── components/       # React components
│   │   ├── services/         # API client
│   │   └── types/            # TypeScript types
│   └── Dockerfile
├── backend/
│   ├── app/
│   │   ├── routes/           # FastAPI endpoints
│   │   ├── services/         # Business logic
│   │   ├── models/           # Pydantic models
│   │   ├── database/         # MongoDB connection
│   │   └── utils/            # Helpers
│   └── Dockerfile
├── data/                     # Image datasets
├── notebooks/                # Jupyter notebooks
├── docker-compose.yml
└── plan.txt
```

## Getting Started

### Prerequisites

- Docker & Docker Compose
- Python 3.12+
- Node.js 18+
- Google Maps API key
- OpenAI or Gemini API key

### Environment Setup

Create environment files:

**`backend/.env`**
```
MONGODB_URL=mongodb://mongodb:27017
DATABASE_NAME=saferoute
GOOGLE_MAPS_API_KEY=your_key
OPENAI_API_KEY=your_key
```

**`frontend/.env.local`**
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key
```

### Run with Docker

```bash
docker compose up --build
```

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- MongoDB: `mongodb://localhost:27017`

### Run Locally

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Safety Scoring Formula

```
Base Score = 100
Final Score = Base - Hazard Penalty - Incident Penalty + Preference Bonus
            (clamped to 0–100)
```

| Factor | Weight |
|--------|--------|
| Critical hazard | 25 pts |
| Warning hazard | 12 pts |
| Info hazard | 5 pts |
| Incident (< 1 day) | 1.0x |
| Incident (< 1 week) | 0.7x |
| Incident (< 1 month) | 0.4x |
| Incident (> 1 month) | 0.1x |

## Roadmap

- [x] Project scaffolding & Docker setup
- [x] Landing page (Three.js + GSAP)
- [x] Route planner UI
- [x] FastAPI backend + MongoDB layer
- [ ] Google Maps route integration
- [ ] Safety scoring algorithm
- [ ] Incident search module
- [ ] LLM integration
- [ ] CV hazard detection pipeline
- [ ] User feedback & reporting
- [ ] Authentication (NextAuth)
- [ ] PWA & mobile support

## License

MIT
