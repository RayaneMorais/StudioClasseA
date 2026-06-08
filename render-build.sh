#!/bin/bash
set -e

# Install pnpm v9 to a writable temp location (Render has read-only /usr)
npm install --prefix=/tmp/pnpm-setup pnpm@9

PNPM=/tmp/pnpm-setup/node_modules/.bin/pnpm

# shamefully-hoist puts all bins in root node_modules/.bin (needed on Render)
echo 'shamefully-hoist=true' >> .npmrc

# Install all workspace dependencies
$PNPM install --no-frozen-lockfile

# Build frontend (static files served by the API in production)
BASE_PATH=/ PORT=3000 $PNPM --filter @workspace/classe-a run build

# Build API server
$PNPM --filter @workspace/api-server run build
