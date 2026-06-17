# Startup Idea Validation Platform

An AI-powered, production-ready full stack platform that helps founders evaluate and validate startup concepts before launching. Utilizing FastAPI, React.js, Tailwind CSS, PostgreSQL, and the Google Gemini API, it runs deep viability audits, generates SWOT quadrants, compiles competitive feature matrices, drafts Business Model Canvases, structures 10-slide pitch decks, and exports publication-ready PDF reports.

---

## Technical Stack

- **Frontend**: React.js (Vite), Tailwind CSS, Recharts (Radar/Bar score graphics), Axios, Lucide Icons
- **Backend**: FastAPI (Python), SQLAlchemy ORM, Uvicorn ASGI server, JWT-based security (Passlib/Bcrypt)
- **Database**: PostgreSQL (fallback support for SQLite)
- **AI Engine**: Google Gemini API via structured JSON schemas (`gemini-1.5-flash`)
- **PDF Export**: Native PDF compilation via ReportLab
- **Containerization**: Docker & Docker Compose

---

## Folder Structure

```
Startup-Validation-Platform/
├── backend/                  # FastAPI Application
│   ├── app/
│   │   ├── config.py         # Pydantic Settings
│   │   ├── database.py       # Session manager
│   │   ├── models.py         # SQLAlchemy schemas
│   │   ├── schemas.py        # Pydantic validation schemas
│   │   ├── auth.py           # Password hashing & JWT guards
│   │   ├── services/
│   │   │   └── gemini.py     # AI service layer (Gemini SDK)
│   │   └── routes/
│   │       ├── auth.py       # User register/login
│   │       ├── startup.py    # Startup ideas CRUD
│   │       ├── analysis.py   # AI triggers (Scores, SWOT, Canvas, Deck)
│   │       └── reports.py    # Report retrieval & PDF generation
│   ├── requirements.txt      # Python packages
│   └── Dockerfile            # Backend image configuration
│
├── frontend/                 # Vite React Application
│   ├── src/
│   │   ├── components/       # Layout wrapper, navigation
│   │   ├── context/          # Auth Context provider
│   │   ├── pages/            # Dashboard, Login, Submit, Tabs view
│   │   ├── services/         # Axios API client wrapper
│   │   ├── App.jsx           # Protected routes orchestrator
│   │   ├── index.css         # Tailwind & custom glass classes
│   │   └── main.jsx
│   ├── tailwind.config.js    # Design tokens
│   ├── postcss.config.js
│   ├── vite.config.js        # Port 3000 & file watch configurations
│   └── Dockerfile            # Frontend image configuration
│
├── docs/
│   └── deployment_guide.md   # Setup and cloud deployment tips
├── docker-compose.yml        # Multi-container conductor
└── README.md                 # Project handbook
```

---

## Local Setup (Without Docker)

### 1. Prerequisites
- **Python**: 3.10+ installed
- **Node.js**: 18+ installed
- **PostgreSQL**: Running instance (or the app defaults to local SQLite if db connection fails)

### 2. Configure Backend
1. Open a terminal inside the `/backend` directory.
2. Create a `.env` file:
   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/startup_db
   SECRET_KEY=use_your_own_secure_key_here_for_signatures
   GEMINI_API_KEY=your_google_gemini_api_key
   ```
3. Install dependencies & launch:
   ```bash
   pip install -r requirements.txt
   uvicorn app.main:app --reload --port 8000
   ```

### 3. Configure Frontend
1. Open a terminal inside the `/frontend` directory.
2. Install npm packages:
   ```bash
   npm install
   ```
3. Launch development server:
   ```bash
   npm run dev
   ```
4. Access the web interface at `http://localhost:3000`.

---

## Docker Compose Setup (Recommended)

1. Ensure Docker Desktop is installed and running.
2. Set your Gemini API Key in your shell context or paste it inside the root `docker-compose.yml`:
   - On Windows PowerShell: `$env:GEMINI_API_KEY="your_api_key_here"`
   - On Windows CMD: `set GEMINI_API_KEY=your_api_key_here`
3. Launch all services:
   ```bash
   docker-compose up --build
   ```
4. Access the React Frontend at `http://localhost:3000`. The Swagger API docs are accessible at `http://localhost:8000/docs`.

---

## Core API Catalog

| Method | Endpoint | Description | Scope |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/register` | Register a new user | Public |
| **POST** | `/api/auth/login` | Login and obtain JWT token | Public |
| **GET** | `/api/auth/me` | Retrieve active user profile | Protected (JWT) |
| **POST** | `/api/startup/submit` | Submit a new startup concept | Protected (JWT) |
| **GET** | `/api/startup/list` | List ideas submitted by active user | Protected (JWT) |
| **POST** | `/api/analysis/all` | Trigger all Gemini AI calculations at once | Protected (JWT) |
| **GET** | `/api/reports/{id}` | Get full structural report for an idea | Protected (JWT) |
| **GET** | `/api/reports/{id}/pdf` | Download formatted validation PDF | Protected (JWT) |

---

## Fallback Design Strategy

If no `GEMINI_API_KEY` is supplied, the backend's AI engine automatically falls back to generating highly structured mock startup analyses. This allows founders and developers to explore all features, tabs, Recharts diagrams, and PDF generators without needing an active API token immediately.
