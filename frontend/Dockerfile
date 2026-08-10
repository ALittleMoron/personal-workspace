FROM node:26.7.0-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginxinc/nginx-unprivileged:1.31.2-alpine AS runtime
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=builder --chown=nginx:nginx /app/dist/personal-workspace-frontend/browser /usr/share/nginx/html
USER nginx
EXPOSE 4000
