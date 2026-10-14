# SmartWay — single-container production image (frontend + API)
# Stage 1: build the Vite frontend
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# VITE_* vars are baked into the frontend at build time.
# Provide them as build args (see docker-compose / CI workflow).
ARG VITE_SUPABASE_URL=""
ARG VITE_SUPABASE_ANON_KEY=""
ARG VITE_SUPABASE_BUCKET="uploads"
ARG VITE_API_BASE_URL=""
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY \
    VITE_SUPABASE_BUCKET=$VITE_SUPABASE_BUCKET \
    VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# Stage 2: slim runtime — dist + api + server.js only
FROM node:20-alpine AS run
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY api ./api
COPY server.cjs ./
# Non-root user for free hosts that require it
RUN addgroup -S app && adduser -S app -G app && chown -R app:app /app
USER app
EXPOSE 8080
ENV PORT=8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/api/health | grep -q healthy || exit 1
CMD ["node", "server.cjs"]
