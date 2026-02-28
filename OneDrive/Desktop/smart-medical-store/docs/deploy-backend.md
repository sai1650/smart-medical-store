# Deploying the backend (Render / Heroku / Railway)

This document walks through deploying the `backend/` service to a host that supports long‑running Node apps.

Recommended: Render (free tier), Railway, or Heroku.

## Prepare

1. Create a MongoDB Atlas cluster and obtain the connection string. Fill in `MONGODB_URI`.
2. In your repo root add a `.env` (locally) using `.env.example` as template (do NOT commit secrets).

## Render (quick)

1. Go to https://dashboard.render.com and create a new **Web Service**.
2. Connect your GitHub repository and select the `smart-medical-store` repo.
3. Set the **Root Directory** to `backend`.
4. Set the Build Command to `npm install` and Start Command to `node server.js` (or `npm start`).
5. Under Environment, add an environment variable named `MONGODB_URI` with your Atlas URI.
6. Create the service — Render will build and start the server. Note the HTTPS endpoint it provides.

## Heroku (quick)

1. Create a new app on Heroku.
2. Connect GitHub repo and choose the `backend` folder as root (if using pipelines, choose the repo and set build pack to Node.js).
3. Set Config Var `MONGODB_URI` to your Atlas URI.
4. Deploy.

## After deployment

- Update your frontend fetch calls to point to the backend URL (if different origin). Example, in `frontend/public/script.js` change fetch('/analytics') to fetch('https://api.example.com/analytics') or set a `BASE_URL` constant.
- Make sure CORS is allowed — `backend/server.js` already uses `cors()`.
