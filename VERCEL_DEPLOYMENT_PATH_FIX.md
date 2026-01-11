# Vercel Deployment Path Fix

## Problem
```
npm error path /vercel/path0/client/package.json
npm error errno -2
npm error enoent Could not read package.json
Error: Command "cd client && npm install" exited with 254
```

## Root Cause
Vercel cannot find the `client/package.json` file because:
1. The root directory setting in Vercel dashboard may be incorrect
2. The build commands are using `cd client` which may not work in Vercel's build environment

## Solution

### Option 1: Set Root Directory to `client` (Recommended)

1. Go to Vercel Dashboard → Your Project → Settings → General
2. Set **Root Directory** to `client`
3. Vercel will automatically use `client/vercel.json`
4. The `client/vercel.json` is already configured correctly

### Option 2: Keep Root Directory as `.` (Root)

If you want to keep the root directory as `.` (root), ensure:

1. The root `vercel.json` uses `--prefix` commands (already updated)
2. Verify the `client` directory exists in the repository
3. The build commands should work with the updated configuration

## Updated Configuration

The root `vercel.json` has been updated to use:
```json
{
  "buildCommand": "npm install --prefix ./client && npm run build --prefix ./client",
  "installCommand": "npm install --prefix ./client",
  "outputDirectory": "client/dist"
}
```

## Verification Steps

1. **Check Root Directory Setting:**
   - Vercel Dashboard → Settings → General
   - Verify Root Directory matches your chosen option

2. **Verify File Structure:**
   ```bash
   ls -la client/package.json  # Should exist
   ```

3. **Test Build Locally:**
   ```bash
   cd client
   npm install
   npm run build
   ls -la dist/index.html  # Should exist after build
   ```

4. **Redeploy:**
   - Push changes to trigger auto-deploy, OR
   - Use Vercel CLI: `vercel --prod`

## If Still Not Working

1. **Check Vercel Build Logs:**
   - Look for the exact path where it's trying to find files
   - Verify the root directory setting

2. **Try Alternative:**
   - Delete root `vercel.json`
   - Set Root Directory to `client` in dashboard
   - Use only `client/vercel.json`

3. **Verify Git Repository:**
   - Ensure `client/` directory is committed to git
   - Check `.gitignore` doesn't exclude `client/`

## Expected Behavior

After fix:
- ✅ Build command finds `client/package.json`
- ✅ Dependencies install successfully
- ✅ Build completes and outputs to `client/dist`
- ✅ Deployment serves the built files correctly
