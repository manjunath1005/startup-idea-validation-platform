import os
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

from sqlalchemy import text
from app.config import settings
from app.database import engine, Base
from app.routes import auth, startup, analysis, reports

# Create all database tables (if they don't already exist)
# In production, alembic migrations would manage this.
try:
    Base.metadata.create_all(bind=engine)
    print("Database tables initialized successfully.")
    
    # Dynamic SQLite/PostgreSQL schema alterations to support startup concept versioning
    with engine.begin() as conn:
        try:
            conn.execute(text("ALTER TABLE startup_ideas ADD COLUMN parent_id UUID REFERENCES startup_ideas(id) ON DELETE CASCADE"))
            print("Database migrated: Added parent_id column to startup_ideas table.")
        except Exception:
            pass  # Column already exists
        try:
            conn.execute(text("ALTER TABLE startup_ideas ADD COLUMN version INTEGER DEFAULT 1"))
            print("Database migrated: Added version column to startup_ideas table.")
        except Exception:
            pass  # Column already exists
        try:
            conn.execute(text("ALTER TABLE startup_ideas ADD COLUMN iteration_note TEXT"))
            print("Database migrated: Added iteration_note column to startup_ideas table.")
        except Exception:
            pass  # Column already exists
        try:
            conn.execute(text("ALTER TABLE startup_scores ADD COLUMN key_changes TEXT"))
            print("Database migrated: Added key_changes column to startup_scores table.")
        except Exception:
            pass  # Column already exists
except Exception as e:
    print(f"Warning: Database connection or initialization failed: {str(e)}")

app = FastAPI(
    title="Startup Idea Validation Platform API",
    description="Backend API powered by FastAPI and Google Gemini AI for validating startup ideas.",
    version="1.0.0"
)

# CORS configuration to allow connections from Vite frontend
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://startup-idea-validation-platform-gamma.vercel.app",
    "https://startup-idea-validation-platform-git-main-startup-validator.vercel.app",
]

frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    origins.append(frontend_url.rstrip("/"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Register routers
app.include_router(auth.router, prefix="/api")
app.include_router(startup.router, prefix="/api")
app.include_router(analysis.router, prefix="/api")
app.include_router(reports.router, prefix="/api")

@app.get("/")
def read_root():
    # Trigger reload to load updated .env configuration
    return {
        "status": "healthy",
        "service": "Startup Idea Validation Platform API",
        "version": "1.0.0"
    }
