#!/bin/sh
set -eu
cd "$(dirname "$0")"

git pull --ff-only
docker compose build api
docker compose up -d api
docker image prune -f

for _ in 1 2 3 4 5 6 7 8 9 10; do
  if docker compose exec -T api wget -qO- http://127.0.0.1:3000/health >/dev/null 2>&1; then
    echo "the-sorter-server is up"
    exit 0
  fi
  sleep 2
done

docker compose logs --tail 50 api
exit 1
