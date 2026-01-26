#!/bin/bash
# Deploy Backend to Hetzner Server
# Run this after pushing changes to GitHub

echo "🚀 Deploying backend to Hetzner server..."
echo "=========================================="

ssh root@116.203.243.125 << 'ENDSSH'
  cd ~/backend
  
  echo "📥 Pulling latest changes from GitHub..."
  git stash  # Save any local changes
  git pull origin main
  
  echo "📦 Installing dependencies (if needed)..."
  npm install
  
  echo "🔨 Building application..."
  npm run build
  
  echo "🔄 Restarting PM2 process..."
  pm2 restart bid-manager-backend
  
  echo "✅ Deployment complete!"
  echo ""
  echo "📊 Backend status:"
  pm2 status bid-manager-backend
ENDSSH

echo ""
echo "🎉 Backend deployed successfully!"
