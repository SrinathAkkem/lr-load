#!/usr/bin/env bash
# Push local lr-load to VPS and run vps-deploy-existing.sh
#
# Usage:
#   export SSHPASS='your-root-password'
#   bash scripts/push-and-deploy.sh
#
# Or with SSH key (no password):
#   DEPLOY_KEY=/path/to/key bash scripts/push-and-deploy.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VPS_HOST="${VPS_HOST:-root@195.35.22.86}"
REMOTE_DIR="${REMOTE_DIR:-/root/lr-load}"
SSH_PORT="${SSH_PORT:-22}"
DEPLOY_KEY="${DEPLOY_KEY:-$ROOT/../.deploy-keys/hostinger-vps}"

SSH_COMMON=(-p "$SSH_PORT" -o StrictHostKeyChecking=accept-new -o ConnectTimeout=15)
RSYNC_EXCLUDES=(
  --exclude node_modules
  --exclude .next
  --exclude .env
  --exclude .git
  --exclude .vercel
)

run_ssh() {
  if [[ -n "${SSHPASS:-}" ]] && command -v sshpass >/dev/null 2>&1; then
    sshpass -e ssh "${SSH_COMMON[@]}" \
      -o PreferredAuthentications=password \
      -o PubkeyAuthentication=no \
      "$VPS_HOST" "$@"
  elif [[ -f "$DEPLOY_KEY" ]]; then
    ssh -i "$DEPLOY_KEY" "${SSH_COMMON[@]}" -o BatchMode=yes "$VPS_HOST" "$@"
  else
    echo "Set SSHPASS (with sshpass installed) or DEPLOY_KEY for key-based auth." >&2
    exit 1
  fi
}

run_rsync() {
  local ssh_cmd="ssh ${SSH_COMMON[*]}"
  if [[ -n "${SSHPASS:-}" ]] && command -v sshpass >/dev/null 2>&1; then
    ssh_cmd="sshpass -e ssh ${SSH_COMMON[*]} -o PreferredAuthentications=password -o PubkeyAuthentication=no"
  elif [[ -f "$DEPLOY_KEY" ]]; then
    ssh_cmd="ssh -i $DEPLOY_KEY ${SSH_COMMON[*]} -o BatchMode=yes"
  else
    echo "Set SSHPASS or DEPLOY_KEY." >&2
    exit 1
  fi

  # shellcheck disable=SC2086
  rsync -avz --delete "${RSYNC_EXCLUDES[@]}" \
    -e "$ssh_cmd" \
    "$ROOT/" \
    "$VPS_HOST:$REMOTE_DIR/"
}

echo "==> Testing SSH to $VPS_HOST..."
if ! run_ssh 'echo connected'; then
  cat >&2 <<'EOF'

SSH failed. Common fixes:
  1. Password: export SSHPASS='your-password'  (use sshpass; brew install hudochenkov/sshpass/sshpass)
  2. Force password auth — this script already sets PubkeyAuthentication=no
  3. Wrong password — reset in Hostinger VPS panel → Root password
  4. Port 22 blocked — check Hostinger firewall / SSH service
  5. Key auth: DEPLOY_KEY=/path/to/key bash scripts/push-and-deploy.sh

EOF
  exit 1
fi

echo "==> Syncing code to $REMOTE_DIR..."
run_rsync

echo "==> Running remote deploy..."
run_ssh "/bin/bash $REMOTE_DIR/scripts/vps-deploy-existing.sh"

echo "==> Done. Site: https://ronolr.com"
