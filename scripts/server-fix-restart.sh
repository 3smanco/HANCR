#!/usr/bin/env bash
# Rebuild and refresh PM2 from the tracked ecosystem file without pulling code.
# Useful after editing env values or recovering a stale local PM2 definition.
set -euo pipefail

APP_ROOT="${HANCR_ROOT:-/opt/hancr}"
cd "$APP_ROOT"

SKIP_GIT_PULL=1 INSTALL_DEPS=0 RUN_MIGRATIONS=0 ./scripts/deploy-direct.sh
