FROM node:20-alpine

# Install server dependencies first for better layer caching.
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --omit=dev

# Copy application source (server + static client served by Express).
WORKDIR /app
COPY server ./server
COPY client ./client

WORKDIR /app/server
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "index.js"]
