# syntax=docker/dockerfile:1

FROM node:20-alpine AS deps
WORKDIR /app

COPY package*.json ./
COPY apps/customer-web/package.json ./apps/customer-web/package.json
COPY apps/internal-web/package.json ./apps/internal-web/package.json
COPY packages/shared/lib/package.json ./packages/shared/lib/package.json
COPY packages/shared/ui/package.json ./packages/shared/ui/package.json

RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_API_URL=http://localhost:5000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build -w @car-service-center/internal-web

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001
ENV HOSTNAME=0.0.0.0

RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/internal-web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/internal-web/.next/static ./apps/internal-web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/internal-web/public ./apps/internal-web/public

USER nextjs

EXPOSE 3001

CMD ["node", "apps/internal-web/server.js"]
