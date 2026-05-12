# ─── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# Prune dev dependencies so the final image only carries production deps
RUN pnpm prune --prod

# ─── Stage 2: Production runner ──────────────────────────────────────────────
FROM node:20-alpine AS runner

RUN apk add --no-cache wget tini

WORKDIR /app

# Non-root user for security
RUN addgroup -g 1001 -S appgroup && \
    adduser  -u 1001 -S appuser -G appgroup

COPY --from=builder --chown=appuser:appgroup /app/dist        ./dist
COPY --from=builder --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:appgroup /app/package.json ./

RUN mkdir -p logs && chown appuser:appgroup logs

USER appuser

ENV NODE_ENV=production

EXPOSE 8080

# tini as PID 1 for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/main.js"]