#!/usr/bin/env bash
# Batch orchestration lives outside GRAIL: one CLI pursuit per request.
set -uo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.." || exit 1

request_dir="${1:-requests}"
if [[ ! -d "$request_dir" ]]; then
  printf 'Request directory not found: %s\n' "$request_dir" >&2
  exit 2
fi

shopt -s nullglob
requests=("$request_dir"/*.json)
if (( ${#requests[@]} == 0 )); then
  printf 'No JSON request files found in %s\n' "$request_dir" >&2
  exit 2
fi

grail_bin="${GRAIL_BIN:-./node_modules/.bin/grail}"
if [[ ! -x "$grail_bin" ]]; then grail_bin="grail"; fi

passed=0
failed=0
for request in "${requests[@]}"; do
  printf '\n=== Processing %s ===\n' "$request"
  # The CLI starts a fresh pursuit; queueResponse writes a unique outbox file.
  if "$grail_bin" run --config ./config --inputs-file "$request" --output=summary; then
    ((passed+=1))
  else
    ((failed+=1))
    printf 'FAILED: %s\n' "$request" >&2
  fi
done

printf '\nBatch complete: %d succeeded, %d failed, %d total\n' "$passed" "$failed" "${#requests[@]}"
printf 'Outbox directory: %s\n' "$(pwd)/data/outbox"
(( failed == 0 ))
