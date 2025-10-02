# Quick Deployment Commands

## Fix CORS Issue - Deploy Updated Edge Function

### Step 1: Deploy the Fixed Edge Function

```bash
# Make sure you're in the project directory
cd /path/to/your/panchakarma-project

# Deploy the server function with CORS fix
npx supabase functions deploy server --project-ref YOUR_PROJECT_REF
```

Replace `YOUR_PROJECT_REF` with your actual project reference (e.g., `zojbxdrvqtnyskpaslri`)

### Step 2: Set Environment Secrets (if not already done)

```bash
# Set Supabase URL
npx supabase secrets set SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co

# Set Anon Key (from Supabase Dashboard > Settings > API)
npx supabase secrets set SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE

# Set Service Role Key (from Supabase Dashboard > Settings > API)
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY_HERE
```

### Step 3: Verify Deployment

```bash
# List all functions
npx supabase functions list

# Check secrets are set
npx supabase secrets list

# View function logs (optional)
npx supabase functions logs server
```

## Alternative: Login First (if needed)

If you get authentication errors:

```bash
# Login to Supabase
npx supabase login

# Then retry deployment
npx supabase functions deploy server --project-ref YOUR_PROJECT_REF
```

## Find Your Project Reference

Your project reference is in your Supabase dashboard URL:
```
https://supabase.com/dashboard/project/[YOUR_PROJECT_REF]/...
```

Or use this command:
```bash
npx supabase projects list
```

## Test the CORS Fix

After deployment:

1. Open the test file in your browser: `test-cors.html`
2. Or test directly in your app - it should no longer show CORS errors
3. Check browser console (F12) - should see successful API calls

## Common Issues

### "Function not found"
- Make sure you're deploying to the correct project
- Verify the function name is `server`
- Check you're in the correct directory

### "Authentication required"
```bash
npx supabase login
```

### "Secrets not set"
```bash
npx supabase secrets list
# If empty, set them as shown in Step 2
```

### "Still getting CORS errors"
1. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
2. Clear browser cache
3. Check Edge Function logs for errors
4. Verify deployment succeeded

## Quick Complete Setup

Copy and paste this entire block (replace YOUR_* values):

```bash
# Deploy function
npx supabase functions deploy server --project-ref YOUR_PROJECT_REF

# Set secrets
npx supabase secrets set SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
npx supabase secrets set SUPABASE_ANON_KEY=YOUR_ANON_KEY
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY

# Verify
npx supabase functions list
npx supabase secrets list
```

## Success Indicators

✅ Deployment shows "Deployed successfully"  
✅ `npx supabase secrets list` shows all 3 secrets  
✅ App shows "Connected to API" toast instead of "Using demo mode"  
✅ No CORS errors in browser console  
✅ Data persists after page refresh  

## Need More Help?

See the full guide: `CORS_FIX_DEPLOYMENT.md`