FROM oven/bun:1-alpine AS builder
WORKDIR /app

COPY server/package.json server/bun.lock ./server/
RUN cd server && bun install --frozen-lockfile

COPY tsconfig.json ./
COPY src ./src
COPY data ./data
COPY server ./server
RUN cd server && bun run build

FROM alpine:3.22
RUN apk add --no-cache libstdc++ libgcc && adduser -D -H -u 10001 sorter
WORKDIR /app

COPY --from=builder /app/server/build/server ./server
COPY server/drizzle ./drizzle

ENV NODE_ENV=production
USER sorter
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s CMD wget -qO- http://127.0.0.1:${PORT:-3000}/health || exit 1

CMD ["./server"]
