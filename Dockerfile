FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json pnpm-lock.yaml ./
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY . .
RUN pnpm install --frozen-lockfile

RUN pnpm build

FROM node:20-alpine AS runner

WORKDIR /app

RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/tsconfig.json ./

USER appuser

ENV NODE_ENV=production

EXPOSE 8080

CMD ["node", "dist/main.js"]