# Deployment Guide

This guide details steps for preparing and deploying the Startup Idea Validation Platform in cloud production environments.

---

## 1. Environment Secrets Setup

In a production environment, never hardcode secret values. Manage configuration variables via cloud engine settings:

- `DATABASE_URL`: Production PostgreSQL connection string (e.g. from AWS RDS, Supabase, Neon).
- `SECRET_KEY`: Long, random string generated via `openssl rand -hex 32` for hashing JWT tokens.
- `GEMINI_API_KEY`: Active Google Gemini AI developer API token.

---

## 2. Production Build Configuration

### Frontend Build
To compile the React files into optimized assets:
1. Open the `/frontend` folder.
2. Build the output:
   ```bash
   npm run build
   ```
3. The build assets will be written to `/frontend/dist`. You can serve this static directory using Nginx, AWS S3 with CloudFront, or Cloudflare Pages.

---

## 3. Deployment Options

### Option A: Render / Railway (Easiest)

You can easily deploy using `docker-compose.yml` or separate services:
1. **Database Service**: Spin up a PostgreSQL database. Copy the connection string.
2. **Backend Service**:
   - Source: link your Git repository.
   - Root Directory: `/backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Env variables: Set `DATABASE_URL`, `SECRET_KEY`, and `GEMINI_API_KEY`.
3. **Frontend Service**:
   - Source: link your Git repository.
   - Root Directory: `/frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
   - Redirection Rule: Map all fallback page requests `/*` to `/index.html` to support React Router.

---

### Option B: Deploying to Hugging Face Spaces (Optional)

Hugging Face Spaces supports Docker templates, allowing you to deploy the application for free.

1. Create a new Space on [Hugging Face](https://huggingface.co/new-space).
2. Choose **Docker** as the SDK/Template and select **Blank** or **FastAPI**.
3. Set the Space to public or private.
4. Clone the space repository locally, or push your code directly.
5. Create a `Dockerfile` at the root of the space repo to launch both backend and frontend, or run a single-image setup using a shell script:
   ```dockerfile
   # Example Hugging Face root Dockerfile
   FROM python:3.11-slim

   # Install Node.js
   RUN apt-get update && apt-get install -y curl && \
       curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
       apt-get install -y nodejs && \
       rm -rf /var/lib/apt/lists/*

   WORKDIR /app

   COPY backend/requirements.txt ./backend/
   RUN pip install --no-cache-dir -r ./backend/requirements.txt

   COPY frontend/package*.json ./frontend/
   RUN cd frontend && npm install

   COPY . .

   # Build frontend
   RUN cd frontend && npm run build

   # Install Nginx to reverse proxy or run a python script to multiplex
   # Alternatively, expose FastAPI to serve compiled frontend static files
   ```
6. Set the `GEMINI_API_KEY` as a Space Secret in the Hugging Face Settings tab to keep it private.

---

## 4. Production Database Migrations

For schema migrations in production, install and initialize **Alembic**:
1. Install Alembic in backend:
   ```bash
   pip install alembic
   ```
2. Initialize migration directory:
   ```bash
   alembic init migrations
   ```
3. Update `migrations/env.py` to import `Base` metadata from `app.models`.
4. Generate migrations:
   ```bash
   alembic revision --autogenerate -m "Initial schema setup"
   ```
5. Apply migrations inside your CI/CD pipeline or deployment container start script:
   ```bash
   alembic upgrade head
   ```
