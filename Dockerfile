FROM node:24-alpine AS frontend-build
WORKDIR /app
# Public Supabase config is inlined at build time (VITE_ vars). These are safe to
# expose (protected by RLS). Pass with: --build-arg VITE_SUPABASE_URL=... etc.
ARG VITE_SUPABASE_URL=""
ARG VITE_SUPABASE_ANON_KEY=""
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:24-alpine AS server-build
WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev

FROM node:24-alpine
RUN apk add --no-cache nginx

ENV NODE_ENV=production

WORKDIR /app

COPY --from=server-build /app/server/node_modules ./server/node_modules
COPY server/ ./server/
COPY --from=frontend-build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/http.d/default.conf

RUN mkdir -p /app/server/data

RUN cat <<'EOF' > /app/start.sh
#!/bin/sh
set -e

cd /app/server && node src/index.js &
nginx -g 'daemon off;'
EOF

RUN chmod +x /app/start.sh

EXPOSE 8080

CMD ["/app/start.sh"]
