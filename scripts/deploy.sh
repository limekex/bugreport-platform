#!/bin/bash
set -e

echo "🚀 Deploying bugreport-platform..."

# Pull latest code
echo "📥 Pulling latest changes..."
git pull origin main

# Install dependencies (only if package.json changed)
if git diff HEAD@{1} --name-only | grep -q "package.json\|pnpm-lock.yaml"; then
  echo "📦 Installing dependencies..."
  pnpm install --frozen-lockfile --prod
fi

# Build
echo "🔨 Building..."
pnpm --filter bugreport-api build

# Restart
echo "♻️  Restarting server..."
pm2 restart bugreport-api

echo "✅ Deployment complete!"
pm2 status
