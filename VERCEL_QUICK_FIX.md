# Quick Fix for Vercel NOT_FOUND Error

## Immediate Action Required

### Step 1: Check Your Vercel Dashboard Settings

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **General**
3. Check the **Root Directory** setting:
   - If it says `client` → Use `client/vercel.json` ✅
   - If it says `.` (root) → Use root `vercel.json` ✅

### Step 2: Verify Build Output

Run locally to verify build works:
```bash
cd client
npm install
npm run build
ls -la dist/  # Should show index.html
```

### Step 3: Redeploy

- Push a commit to trigger auto-deploy, OR
- Use Vercel CLI: `vercel --prod`

## Most Common Cause

**Root Directory Mismatch:**
- Root Directory = `client` but using root `vercel.json` ❌
- Root Directory = `.` but using `client/vercel.json` ❌

**Solution:** Ensure Root Directory matches which vercel.json you want to use.

## Configuration Files Status

✅ Both `vercel.json` files are correctly configured
✅ Standard SPA rewrite rule is in place
✅ Output directories are correct

The issue is likely in the Vercel dashboard Root Directory setting.

## Still Not Working?

1. Check Vercel build logs for errors
2. Verify `VITE_API_URL` environment variable is set
3. Test local preview: `npm run preview`
4. Check browser console on deployed site for specific errors

See `VERCEL_NOT_FOUND_FIX.md` for detailed explanation.
