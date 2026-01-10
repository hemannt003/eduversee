# Vercel Deployment Guide for EDUverse

## Overview

This guide explains how to deploy the EDUverse frontend to Vercel. The backend should be deployed separately to a service like Railway, Render, or Heroku.

## Prerequisites

1. A Vercel account (sign up at [vercel.com](https://vercel.com))
2. The backend API deployed and accessible via URL
3. GitHub repository (recommended) or other Git provider

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Import Project**
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "Add New Project"
   - Import your GitHub repository

2. **Configure Project Settings**
   - **Root Directory**: Set to `client` (or leave as root if using root vercel.json)
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

3. **Environment Variables**
   Add the following environment variable:
   - `VITE_API_URL`: Your backend API base URL **including** `/api` path
     - Example: `https://your-api.railway.app/api`
     - Example: `https://your-api.render.com/api`
     - Example: `https://eduverse-api.herokuapp.com/api`
   
   **Important**: The URL must include the `/api` suffix as the frontend expects the full API path.

4. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Navigate to Client Directory**
   ```bash
   cd client
   ```

4. **Deploy**
   ```bash
   vercel
   ```
   Follow the prompts:
   - Link to existing project or create new
   - Set environment variables when prompted

5. **Set Environment Variables**
   ```bash
   vercel env add VITE_API_URL
   ```
   Enter your backend API URL when prompted.

6. **Production Deploy**
   ```bash
   vercel --prod
   ```

## Configuration Files

### Root `vercel.json`
This file configures Vercel to build from the `client` directory. If you set the root directory to `client` in Vercel dashboard, this file may not be needed.

### Client `vercel.json`
This file is used when the root directory is set to `client`. It configures:
- Build settings
- SPA routing (rewrites)
- Framework detection

## Environment Variables

### Required
- `VITE_API_URL`: Your backend API base URL **including** `/api` suffix
  - Example: `https://eduverse-api.railway.app/api`
  - Example: `https://eduverse-api.render.com/api`
  - **Note**: Must include `/api` as the frontend uses this directly

### Optional
- `VITE_SOCKET_URL`: WebSocket URL for real-time features (if different from API URL)

## Backend Deployment

Since the backend is a full Express server, deploy it separately:

### Railway (Recommended)
1. Connect your GitHub repo
2. Select the root directory (not `client`)
3. Set environment variables:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `CLIENT_URL` (your Vercel frontend URL)
   - `REDIS_HOST`, `REDIS_PORT` (if using Redis)
4. Railway will auto-detect Node.js and deploy

### Render
1. Create a new Web Service
2. Connect your GitHub repo
3. Set:
   - Build Command: `npm install`
   - Start Command: `npm run dev:server` or `node dist/server.js`
4. Add environment variables

### Heroku
1. Create a new app
2. Connect GitHub
3. Set buildpacks and environment variables
4. Deploy

## Post-Deployment

1. **Update CORS on Backend**
   - Ensure `CLIENT_URL` in backend includes your Vercel URL
   - Example: `https://eduverse.vercel.app`

2. **Test the Application**
   - Visit your Vercel deployment URL
   - Test authentication
   - Verify API calls work

3. **Set Up Custom Domain** (Optional)
   - In Vercel dashboard, go to Settings > Domains
   - Add your custom domain
   - Configure DNS as instructed

## Troubleshooting

### Build Fails
- Check that all dependencies are in `client/package.json`
- Verify Node.js version (Vercel uses Node 18.x by default)
- Check build logs in Vercel dashboard

### API Calls Fail
- Verify `VITE_API_URL` is set correctly
- Check CORS configuration on backend
- Ensure backend is accessible from the internet

### Routing Issues (404 on refresh)
- Verify `vercel.json` has the SPA rewrite rule
- Check that `outputDirectory` is set to `dist`

### Environment Variables Not Working
- Ensure variables are prefixed with `VITE_` for Vite
- Redeploy after adding/changing environment variables
- Check variable names match exactly

## Continuous Deployment

Vercel automatically deploys on:
- Push to main/master branch (production)
- Push to other branches (preview deployments)
- Pull requests (preview deployments)

## Preview Deployments

Every branch and PR gets a unique preview URL, perfect for:
- Testing before merging
- Sharing with team members
- Staging environments

## Performance

Vercel automatically:
- Optimizes images
- Caches static assets
- Uses CDN for global distribution
- Enables compression

## Monitoring

- Check deployment logs in Vercel dashboard
- Monitor function execution times
- Set up error tracking (Sentry integration available)

## Next Steps

1. Set up backend deployment
2. Configure environment variables
3. Test end-to-end functionality
4. Set up custom domain
5. Enable analytics (optional)
