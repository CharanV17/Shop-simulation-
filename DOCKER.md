# Docker Setup

## Run with Docker Compose (App + MongoDB)

From the project root:

```powershell
docker compose up --build
```

App URL:

- http://localhost:3000

MongoDB URL (from host):

- mongodb://localhost:27017/nexus-vr

## Stop containers

```powershell
docker compose down
```

To also delete MongoDB data volume:

```powershell
docker compose down -v
```

## Build and run app image only

If you are using external MongoDB (for example MongoDB Atlas):

```powershell
docker build -t nexus-vr .
docker run --rm -p 3000:3000 -e MONGO_URI="<your-mongo-uri>" -e JWT_SECRET="<your-jwt-secret>" nexus-vr
```

## Production notes

- Replace `JWT_SECRET` in compose/environment with a strong secret.
- Prefer managed MongoDB for production.
- Run behind HTTPS reverse proxy (Nginx/Caddy/cloud load balancer).
