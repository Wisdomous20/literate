# ─── Stage 1: Dependencies ────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

RUN apk add --no-cache python3 make g++
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ─── Stage 2: Build Next.js ──────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN DIRECT_URL="postgresql://dummy:dummy@localhost:5432/dummy" pnpm prisma generate

# Build Next.js (requires output: 'standalone' in next.config)
ENV NEXT_TELEMETRY_DISABLED=1
ENV XENDIT_SECRET_KEY=build-placeholder
ENV XENDIT_PUBLIC_KEY=build-placeholder
ENV XENDIT_WEBHOOK_TOKEN=build-placeholder
RUN pnpm build

# ─── Stage 3: Production Runtime ─────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Next.js standalone output
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]