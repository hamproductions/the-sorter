#!/usr/bin/env bash
# list     -> $T/prs.json (newest open same-repo PRs) and the cache key
# build    -> build PRs whose head changed into $STATE/<n>, drop closed ones
# assemble -> copy $STATE into the site, write the index, comment the link
set -euo pipefail

T="$RUNNER_TEMP"
STATE="$T/pr-previews"
PRS="$T/prs.json"
SECRET="${SECRET:-}"
# With a secret, previews live at <prefix>/<hmac of PR number>/ instead of <prefix>/<number>/.
slug() { if [ -n "$SECRET" ]; then printf '%s' "$1" | openssl dgst -sha256 -hmac "$SECRET" -r | cut -c1-8; else echo "$1"; fi; }

case "${1:-}" in
list)
  gh pr list --state open --limit 100 --json number,title,headRefOid,updatedAt,isCrossRepository \
    | jq --argjson max "${MAX:-5}" '[.[] | select(.isCrossRepository | not)] | sort_by(.updatedAt) | reverse | .[:$max]' > "$PRS"
  sig=$(jq -r 'map("\(.number):\(.headRefOid)") | sort | join(",")' "$PRS")
  echo "key=$(printf '%s|%s|%s' "$CONFIG" "$(printf '%s' "$SECRET" | sha256sum)" "$sig" | sha256sum | cut -c1-32)" >> "$GITHUB_OUTPUT"
  ;;

build)
  mkdir -p "$STATE"
  keep=$(jq -r '.[].number' "$PRS")
  for dir in "$STATE"/*/; do
    [ -d "$dir" ] || continue
    n=$(basename "$dir")
    grep -qx "$n" <<<"$keep" || { echo "drop closed PR $n"; rm -rf "$dir" "$STATE/$n.sha"; }
  done
  auth=$(printf 'x-access-token:%s' "$TOKEN" | base64 -w0)
  unset TOKEN
  base="${BASE_PATH_IN%/}/$PREFIX"
  while read -r n sha; do
    if [ "$(cat "$STATE/$n.sha" 2>/dev/null)" = "$sha" ] && [ -d "$STATE/$n" ]; then
      echo "PR $n unchanged, reusing cache"; continue
    fi
    echo "::group::build PR $n @ ${sha:0:7}"
    rm -rf "$STATE/$n" "$STATE/$n.sha" "$T/wt-$n"
    # Token only reaches the fetch, never the PR's build scripts.
    git -c "http.extraheader=AUTHORIZATION: basic $auth" fetch -q --depth 1 origin "pull/$n/head"
    git worktree add -q --detach "$T/wt-$n" FETCH_HEAD
    if (
      cd "$T/wt-$n"
      export PREVIEW=1 PR_NUMBER="$n" SITE_URL="${SITE_URL_IN%/}/$PREFIX/$(slug "$n")"
      export "$BASE_ENV=$base/$(slug "$n")/"
      bash -c "$INSTALL" && bash -c "$BUILD"
      mv "$OUTPUT" "$STATE/$n"
    ); then echo "$sha" > "$STATE/$n.sha"; else echo "::warning::preview for PR $n failed to build"; fi
    git worktree remove --force "$T/wt-$n" || true
    echo "::endgroup::"
  done < <(jq -r '.[] | "\(.number) \(.headRefOid)"' "$PRS")
  ;;

assemble)
  dest="$SITE_DIR/$PREFIX"
  mkdir -p "$dest"
  built=""
  used=$(du -sm "$SITE_DIR" | cut -f1)
  while read -r n; do
    [ -f "$STATE/$n.sha" ] || continue
    size=$(du -sm "$STATE/$n" | cut -f1)
    if [ $((used + size)) -gt "$MAX_MB" ]; then echo "::warning::skip PR $n, site would pass ${MAX_MB}MB"; continue; fi
    cp -r "$STATE/$n" "$dest/$(slug "$n")"
    for path in $EXCLUDE; do rm -rf "$dest/$(slug "$n")/$path"; done
    used=$((used + size)); built="$built $n"
  done < <(jq -r '.[].number' "$PRS")
  echo "built=${built# }" >> "$GITHUB_OUTPUT"

  # A hidden preview must not be discoverable, so no index page.
  if [ -z "$SECRET" ]; then
  esc() { sed -e 's/&/\&amp;/g' -e 's/</\&lt;/g' -e 's/>/\&gt;/g'; }
  {
    echo '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>PR previews</title>'
    echo '<style>body{font:16px system-ui;max-width:40rem;margin:2rem auto;padding:0 1rem}li{margin:.5rem 0}</style><h1>PR previews</h1><ul>'
    for n in $built; do
      title=$(jq -r --argjson n "$n" '.[] | select(.number == $n) | .title' "$PRS" | esc)
      echo "<li><a href=\"$n/\">#$n</a> $title</li>"
    done
    [ -n "$built" ] || echo '<li>No open PRs.</li>'
    echo '</ul>'
  } > "$dest/index.html"
  fi

  if [ -n "${COMMENT_PR:-}" ] && grep -qw "$COMMENT_PR" <<<"$built"; then
    sha=$(jq -r --argjson n "$COMMENT_PR" '.[] | select(.number == $n) | .headRefOid' "$PRS")
    body="<!-- deploy-preview -->
Preview: ${SITE_URL_IN%/}/$PREFIX/$(slug "$COMMENT_PR")/
Commit: $sha"
    id=$(gh api "repos/$GITHUB_REPOSITORY/issues/$COMMENT_PR/comments" --paginate --jq '.[] | select(.body | startswith("<!-- deploy-preview -->")) | .id' | head -1)
    if [ -n "$id" ]; then gh api -X PATCH "repos/$GITHUB_REPOSITORY/issues/comments/$id" -f body="$body" > /dev/null
    else gh pr comment "$COMMENT_PR" --body "$body"; fi
  fi
  ;;
esac
