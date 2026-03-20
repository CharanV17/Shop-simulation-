# NEXUS VR Shopping Platform

NEXUS VR is a full-stack virtual shopping platform with a 3D storefront experience built using Three.js on the client and Node.js + Express + MongoDB on the server.

## Live Demo

- https://shop-simulation.onrender.com

## Features

- 3D shop environments with category-specific styling
- Product browsing in immersive VR-like scenes
- User authentication and role-based access (user/admin)
- Cart and checkout flow
- Order history (user) and system orders (admin)
- MongoDB persistence with Atlas-ready configuration
- Docker support for local and production-like runs

## Tech Stack

- Frontend: HTML, CSS, JavaScript, Three.js
- Backend: Node.js, Express
- Database: MongoDB (local or Atlas)
- Auth: JWT
- Deployment-ready: Docker, Render

## Project Structure

- client: Frontend pages and Three.js logic
- server: API, auth, models, routes, DB config
- Dockerfile: App image build instructions
- docker-compose.yml: Local app orchestration

## Prerequisites

- Node.js 18+ (recommended: 20)
- npm
- MongoDB local instance OR MongoDB Atlas cluster
- Docker Desktop (optional, for containerized run)

## Environment Variables

Set these values in server/.env for local non-Docker development:

- MONGO_URI: MongoDB connection string
- MONGO_DB_NAME: Database name (recommended: nexus-vr)
- JWT_SECRET: Strong random secret for token signing
- PORT: API port (default: 3000)

Example values:

MONGO_URI=mongodb+srv://<username>:<password>@<cluster-url>/?appName=<app>
MONGO_DB_NAME=nexus-vr
JWT_SECRET=replace-with-a-strong-secret
PORT=3000

## Local Development (Node)

1. Install dependencies:
   - cd server
   - npm install

2. Configure environment:
   - Create server/.env with the variables above

3. Start server:
   - npm start

4. Open app:
   - http://localhost:3000

## Docker Run

From project root:

- docker compose up --build

App will be available at:

- http://localhost:3001

Notes:

- docker-compose.yml currently maps host port 3001 to container port 3000.
- By default, the app container is configured to use MONGO_URI from compose.
- The mongo service is available under profile local-db.

To run with local Mongo service profile:

- docker compose --profile local-db up --build

To stop:

- docker compose down

To remove volume data too:

- docker compose down -v

## MongoDB Atlas Migration

If you already have data in local Mongo and want to copy to Atlas:

1. Connect to both local and Atlas.
2. Copy collections from local database nexus-vr to Atlas database nexus-vr.
3. Verify collections: users, shops, products, orders.

## Deploy on Render

Set these environment variables in Render service settings:

- MONGO_URI
- MONGO_DB_NAME=nexus-vr
- JWT_SECRET

Build and start:

- Build Command: npm install
- Start Command: npm start
- Root Directory: server

If deploying with Docker on Render:

- Use the repo root Dockerfile
- Ensure environment variables are set in Render dashboard

## Security Notes

- Never commit real credentials in source files.
- Keep .env files out of Git.
- Rotate MongoDB passwords if they are exposed.
- Use a strong JWT secret in production.

## Troubleshooting

- If login or shop loading fails, verify MONGO_URI and JWT_SECRET.
- If Docker app cannot connect to DB, verify MONGO_URI target and network reachability.
- If Atlas connection fails, ensure IP access list allows Render or your current IP.

## License

This project is for educational and development use unless otherwise specified.
