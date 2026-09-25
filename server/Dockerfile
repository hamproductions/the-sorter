FROM oven/bun:1-alpine AS builder
WORKDIR /app

COPY server/package.json server/bun.lock ./server/
RUN cd server && bun install --frozen-lockfile

COPY tsconfig.json ./
COPY src ./src
COPY data ./data
COPY server ./server
RUN cd server && bun run build

FROM oven/bun:1-alpine
WORKDIR /app

COPY --from=builder /app/server/build/server ./server
COPY server/drizzle ./drizzle

ENV NODE_ENV=production
EXPOSE 3000

CMD ["./server"]
