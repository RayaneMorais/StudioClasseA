#!/bin/bash
set -e

# Install pnpm to a writable temp location (Render has read-only /usr)
npm install --prefix=/tmp/pnpm-setup pnpm

PNPM=/tmp/pnpm-setup/node_modules/.bin/pnpm

# Install all workspace dependencies
$PNPM install --frozen-lockfile

# Build frontend (static files served by the API in production)
BASE_PATH=/ PORT=3000 $PNPM --filter @workspace/classe-a run build

# Build API server
$PNPM --filter @workspace/api-server run build
