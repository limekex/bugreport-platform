#!/bin/bash

# Deploy updated API to production server
# This script helps deploy the bug report API to gitreport.betait.no

echo "🚀 Deploying bugreport-api to production..."
echo ""

# SSH connection details (update if needed)
SERVER="betait.no"
DEPLOY_PATH="/var/www/gitreport"

echo "📦 Step 1: Pull latest changes on server"
ssh $SERVER "cd $DEPLOY_PATH && git pull origin main"

echo ""
echo "🔨 Step 2: Install dependencies"
ssh $SERVER "cd $DEPLOY_PATH && pnpm install --frozen-lockfile"

echo ""
echo "🏗️  Step 3: Build backend (with static files)"
ssh $SERVER "cd $DEPLOY_PATH/apps/bugreport-api && pnpm build"

echo ""
echo "🔄 Step 4: Restart API service"
ssh $SERVER "pm2 restart bugreport-api"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🔗 Admin UI should now be available at:"
echo "   https://gitreport.betait.no/admin"
echo "   https://gitreport.betait.no/admin/testers.html"
echo ""
echo "📊 Check logs: ssh $SERVER 'pm2 logs bugreport-api'"
