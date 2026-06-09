#!/bin/bash
set -e

# Render sets NODE_ENV=production which skips devDependencies.
# We need devDependencies (vite, typescript, etc.) to build, so override here.
# The production value is set via Render's environment variables at runtime.
export NODE_ENV=development

# Install pnpm v9 to a writable temp location (Render has read-only /usr)
npm install --prefix=/tmp/pnpm-setup pnpm@9

PNPM=/tmp/pnpm-setup/node_modules/.bin/pnpm

# shamefully-hoist puts all bins in root node_modules/.bin
echo 'shamefully-hoist=true' >> .npmrc

# Install all workspace dependencies (including devDependencies for build)
$PNPM install --no-frozen-lockfile

# Build frontend (static files served by the API in production)
BASE_PATH=/ PORT=3000 $PNPM --filter @workspace/classe-a run build

# Build API server
$PNPM --filter @workspace/api-server run build
