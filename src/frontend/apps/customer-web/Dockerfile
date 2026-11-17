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

RUN npm run build -w @car-service-center/customer-web

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/customer-web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/customer-web/.next/static ./apps/customer-web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/customer-web/public ./apps/customer-web/public

USER nextjs

EXPOSE 3000

CMD ["node", "apps/customer-web/server.js"]
