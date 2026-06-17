from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base
from app.routes import auth, startup, analysis, reports

# Create all database tables (if they don't already exist)
# In production, alembic migrations would manage this.
try:
    Base.metadata.create_all(bind=engine)
    print("Database tables initialized successfully.")
except Exception as e:
    print(f"Warning: Database connection or initialization failed: {str(e)}")

app = FastAPI(
    title="Startup Idea Validation Platform API",
    description="Backend API powered by FastAPI and Google Gemini AI for validating startup ideas.",
    version="1.0.0"
)

# CORS configuration to allow connections from Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
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
