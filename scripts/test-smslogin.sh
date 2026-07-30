#!/usr/bin/env bash
# Test SMSLogin DLT OTP delivery before production deploy.
#
# Usage:
#   cd lr-load
#   ./scripts/test-smslogin.sh --dry-run
#   TEST_MOBILE=9849765477 ./scripts/test-smslogin.sh
#   TEST_MOBILE=9849765477 ./scripts/test-smslogin.sh --try-senders RAYUDU,RONOLR
#
# SMSLogin HTTP API uses username + apikey (from Developers → HTTP API in panel).

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

load_env_file() {
  local file="$1"
  [[ -f "$file" ]] || return 0
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%$'\r'}"
    [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
    [[ "$line" =~ ^[A-Za-z_][A-Za-z0-9_]*= ]] || continue
    local key="${line%%=*}"
    local val="${line#*=}"
    val="${val%\"}"
    val="${val#\"}"
    printf -v "$key" '%s' "$val"
    export "$key"
  done < "$file"
}

load_env_file ".env.local"
load_env_file ".env.production"
load_env_file ".env"

DRY_RUN=false
TRY_SENDERS="${SMSLOGIN_SENDER_ID:-RONOLR}"
TEST_OTP="${TEST_OTP:-654321}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) DRY_RUN=true; shift ;;
    --try-senders) TRY_SENDERS="$2"; shift 2 ;;
    --otp) TEST_OTP="$2"; shift 2 ;;
    -h|--help)
      sed -n '2,12p' "$0"
      exit 0
      ;;
    *) echo "Unknown arg: $1" >&2; exit 1 ;;
  esac
done

require_var() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "Missing env: $name (set in .env.local)" >&2
    exit 1
  fi
}

require_var SMSLOGIN_USERNAME
require_var SMSLOGIN_API_KEY
require_var SMSLOGIN_DLT_TEMPLATE_ID

TEMPLATE_ID="${SMSLOGIN_DLT_TEMPLATE_ID}"
MSG_TEMPLATE="${SMSLOGIN_OTP_MESSAGE:-'{code} is your OTP to access RonoLR. It is valid for 2 minutes. Do not share this code with anyone,'}"
MESSAGE="${MSG_TEMPLATE//\{code\}/$TEST_OTP}"
MESSAGE="${MESSAGE//\{#var#\}/$TEST_OTP}"

if [[ -z "${TEST_MOBILE:-}" ]]; then
  echo "Set TEST_MOBILE=10-digit-number to send a real test SMS." >&2
  echo "Example: TEST_MOBILE=9849765477 ./scripts/test-smslogin.sh" >&2
  DRY_RUN=true
fi

IFS=',' read -r -a SENDERS <<< "$TRY_SENDERS"

echo "=== SMSLogin pre-deploy test ==="
echo "Template ID : $TEMPLATE_ID"
echo "OTP used    : $TEST_OTP"
echo "Message     : $MESSAGE"
echo "Mobile      : ${TEST_MOBILE:-<dry-run>}"
echo

api_call() {
  local sender="$1"
  local url="https://smslogin.co/v3/api.php"

  if $DRY_RUN; then
    echo "--- DRY RUN: sender=${sender} ---"
    echo "curl -G '${url}' \\"
    echo "  --data-urlencode 'username=${SMSLOGIN_USERNAME}' \\"
    echo "  --data-urlencode 'apikey=***' \\"
    echo "  --data-urlencode 'senderid=${sender}' \\"
    echo "  --data-urlencode 'mobile=${TEST_MOBILE:-XXXXXXXXXX}' \\"
    echo "  --data-urlencode 'message=${MESSAGE}' \\"
    echo "  --data-urlencode 'templateid=${TEMPLATE_ID}'"
    echo
    return 0
  fi

  echo "--- LIVE: sender=${sender} → +91${TEST_MOBILE} ---"
  local response
  response=$(curl -sS -G "$url" \
    --data-urlencode "username=${SMSLOGIN_USERNAME}" \
    --data-urlencode "apikey=${SMSLOGIN_API_KEY}" \
    --data-urlencode "senderid=${sender}" \
    --data-urlencode "mobile=${TEST_MOBILE}" \
    --data-urlencode "message=${MESSAGE}" \
    --data-urlencode "templateid=${TEMPLATE_ID}" \
    || echo "CURL_ERROR")

  echo "Response: $response"
  local lower
  lower=$(echo "$response" | tr '[:upper:]' '[:lower:]')
  if [[ "$lower" != *campid* ]]; then
    echo "RESULT: FAILED for sender=${sender} (no campid)"
    return 1
  fi

  local campid
  campid=$(echo "$response" | sed -n "s/.*'campid':'\\([^']*\\)'.*/\\1/p")
  if [[ -n "$campid" ]]; then
    sleep 2
    local report
    report=$(curl -sS -G "$url" \
      --data-urlencode "username=${SMSLOGIN_USERNAME}" \
      --data-urlencode "apikey=${SMSLOGIN_API_KEY}" \
      --data-urlencode "campid=${campid}" || echo "CURL_ERROR")
    echo "Delivery: $report"
    if [[ "$report" == *Failed* ]] || [[ "$report" == *failed* ]]; then
      echo "RESULT: QUEUED but carrier FAILED — check SMSLogin Templates + DLT approval"
      return 1
    fi
    if [[ "$report" == *Delivery* ]] || [[ "$report" == *Delivered* ]] || [[ "$report" == *Submitted* ]]; then
      echo "RESULT: OK (use SMSLOGIN_SENDER_ID=${sender})"
      return 0
    fi
  fi

  if [[ "$lower" == *success* ]] || [[ "$lower" == *sent* ]]; then
    echo "RESULT: OK (use SMSLOGIN_SENDER_ID=${sender})"
    return 0
  fi
  echo "RESULT: UNKNOWN for sender=${sender}"
  return 1
}

echo "--- Balance check ---"
if $DRY_RUN; then
  echo "curl -G 'https://smslogin.co/v3/api.php' --data-urlencode 'username=...' --data-urlencode 'apikey=***'"
else
  curl -sS -G "https://smslogin.co/v3/api.php" \
    --data-urlencode "username=${SMSLOGIN_USERNAME}" \
    --data-urlencode "apikey=${SMSLOGIN_API_KEY}"
  echo
fi
echo

failed=0
for sender in "${SENDERS[@]}"; do
  sender="$(echo "$sender" | xargs)"
  [[ -z "$sender" ]] && continue
  if ! api_call "$sender"; then
    failed=$((failed + 1))
  fi
  echo
done

if $DRY_RUN; then
  echo "Dry run only. To send: TEST_MOBILE=9XXXXXXXXX ./scripts/test-smslogin.sh"
  exit 0
fi

if [[ "$failed" -gt 0 ]]; then
  echo "Some sender tests failed. Fix template/sender/message before enabling OTP_SMS_ENABLED=true."
  exit 1
fi

echo "All sender tests passed. Safe to set OTP_SMS_ENABLED=true on production."
