# Smart Medical Store — Deployment Guide

This repository contains a simple pharmacy inventory app with a `backend/` (Express + Mongoose) and a static frontend in `frontend/public`.

This README explains an easy, reliable deployment approach.

## Recommended deployment (separate services)

1. Deploy frontend to Vercel (static):
   - In Vercel, create a new project from this GitHub repo.
   - Set the **Root Directory** to the project root (or leave default), and configure the **Output Directory** to `frontend/public`.
   - Framework Preset: `Other` / Static.

2. Deploy backend to a Node host (Render / Railway / Heroku / Fly):
   - Create a new Web Service and set the Root Directory to `backend`.
   - Build Command: `npm install`
   - Start Command: `node server.js` (or `npm start`)
   - Add environment variable `MONGODB_URI` with your MongoDB Atlas connection string.
   - Ensure CORS is allowed (the backend already uses `cors()` by default).

3. Use MongoDB Atlas for database:
   - Create a free cluster at https://www.mongodb.com/cloud/atlas.
   - Create a database user and network access (allow your host IP or 0.0.0.0/0 for testing).
   - Copy the connection string and set it as `MONGODB_URI` on your backend host and locally in a `.env` file.

4. Update frontend API base URL (optional):
   - If frontend and backend are on different domains, replace fetch calls or set a base constant to the backend URL (e.g., `https://api.example.com`).

## Quick local start

1. Install dependencies and run MongoDB (local or Atlas):

```bash
cd backend
npm install
# set MONGODB_URI in .env or use local mongodb
node server.js
```

## Why separate deployments

- Vercel is optimized for static sites and serverless functions. Your current backend expects a long‑running Node server and a persistent MongoDB connection, which is better hosted on Render, Railway, or a cloud VM.
- Splitting responsibilities makes configuration and scaling easier.

## Small fixes applied
- Removed an incorrect dependency (`mongod`) from `backend/package.json`.

---
If you want, I can:
- add a `vercel.json` to deploy only the frontend automatically,
- refactor the backend into Vercel serverless functions (more work), or
- add a small `deploy.md` with Render / Railway step‑by‑step UI screenshots.

Tell me which option you prefer and I’ll continue.
