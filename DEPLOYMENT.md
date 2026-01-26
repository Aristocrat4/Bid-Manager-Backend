# Backend Deployment Guide

## Quick Deployment

After making changes locally and pushing to GitHub, run:

```bash
./deploy.sh
```

This will automatically:
1. Pull latest changes from GitHub
2. Install dependencies (if needed)
3. Build the application
4. Restart the server

---

## Manual Deployment Steps

If you prefer to deploy manually or need more control:

### 1. Push Your Changes

```bash
git add .
git commit -m "Your commit message"
git push
```

### 2. SSH into Server

```bash
ssh root@116.203.243.125
```

### 3. Update Code

```bash
cd ~/backend
git stash              # Save any local changes
git pull origin main   # Pull latest from GitHub
```

### 4. Install Dependencies (if package.json changed)

```bash
npm install
```

### 5. Build Application

```bash
npm run build
```

### 6. Restart Application

```bash
pm2 restart bid-manager-backend
```

### 7. Verify Deployment

```bash
pm2 status
pm2 logs bid-manager-backend --lines 50
```

---

## Checking Logs

### View Live Logs
```bash
ssh root@116.203.243.125 "pm2 logs bid-manager-backend"
```

### View Last 100 Lines
```bash
ssh root@116.203.243.125 "pm2 logs bid-manager-backend --lines 100"
```

### Check Application Status
```bash
ssh root@116.203.243.125 "pm2 status"
```

---

## Testing Deployment

After deployment, test the API:

```bash
curl https://autobidmanager.bid/api/auth/company/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123456"}'
```

Expected response (if credentials invalid):
```json
{"message":"Invalid credentials","error":"Unauthorized","statusCode":401}
```

---

## Troubleshooting

### Backend Not Starting
```bash
ssh root@116.203.243.125 "pm2 logs bid-manager-backend --err --lines 50"
```

### Check Build Errors
```bash
ssh root@116.203.243.125 "cd ~/backend && npm run build"
```

### Restart MongoDB
```bash
ssh root@116.203.243.125 "systemctl restart mongod"
```

### Restart Nginx
```bash
ssh root@116.203.243.125 "systemctl restart nginx"
```

---

## Automatic Deployment (Optional - Future)

To set up automatic deployment with GitHub Actions, we would need to:

1. Create `.github/workflows/deploy.yml` in your repo
2. Add SSH keys to GitHub Secrets
3. Configure workflow to run on push to main

**Note**: Manual deployment is currently used for better control and security.

---

## Environment Variables

Environment variables are stored in `/root/backend/.env` on the server.

To update environment variables:

```bash
ssh root@116.203.243.125
cd ~/backend
nano .env              # Edit variables
pm2 restart bid-manager-backend
```

**Never commit `.env` to GitHub!**

---

## Deployment Checklist

Before each deployment:

- [ ] Code compiles locally (`npm run build`)
- [ ] Tests pass (`npm test`)
- [ ] Changes committed and pushed to GitHub
- [ ] Run `./deploy.sh` or follow manual steps
- [ ] Check PM2 logs for errors
- [ ] Test API endpoints
- [ ] Verify frontend can connect

---

## Server Information

- **Server IP**: 116.203.243.125
- **Domain**: https://autobidmanager.bid
- **SSH User**: root
- **Backend Path**: `/root/backend`
- **PM2 Process**: `bid-manager-backend`
- **Port**: 3000 (internal)
- **External Port**: 80 (HTTP) / 443 (HTTPS via Cloudflare)

---

## Support

For issues or questions:
1. Check PM2 logs first
2. Review this guide
3. Check MongoDB and Nginx status
4. Contact server administrator
