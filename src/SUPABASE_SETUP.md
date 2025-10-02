# Supabase Connection Setup Guide

## Your Current Status
✅ **Supabase credentials are already configured!**
- Project ID: `zojbxdrvqtnyskpaslri`
- Anon Key: Already set in `/utils/supabase/info.tsx`

## Steps to Connect Your Live Website to Supabase

### 1. Deploy the Edge Function

Run these commands in your terminal (from your project root):

```bash
# Install Supabase CLI if you haven't already
npm install -g supabase

# Login to Supabase
supabase login

# Link to your Supabase project
supabase link --project-ref zojbxdrvqtnyskpaslri

# Deploy the Edge Function
supabase functions deploy make-server-a3cc576e --project-ref zojbxdrvqtnyskpaslri
```

### 2. Verify Edge Function Environment Variables

The Edge Function needs three environment variables. Check if they're set:

```bash
# List current secrets
supabase secrets list --project-ref zojbxdrvqtnyskpaslri
```

You should see:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

If any are missing, set them:

```bash
# Get your keys from https://supabase.com/dashboard/project/zojbxdrvqtnyskpaslri/settings/api

# Set the secrets
supabase secrets set SUPABASE_URL=https://zojbxdrvqtnyskpaslri.supabase.co --project-ref zojbxdrvqtnyskpaslri

supabase secrets set SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvamJ4ZHJ2cXRueXNrcGFzbHJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwNjAxNTEsImV4cCI6MjA3NDYzNjE1MX0.ijm8c0TUFei0HKlPTbxaAxxs0Pfvj-Tp2Lu-lCoqgYc --project-ref zojbxdrvqtnyskpaslri

# Get the service role key from Supabase dashboard
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key> --project-ref zojbxdrvqtnyskpaslri
```

### 3. Test the Connection

After deployment, test if the Edge Function is working:

```bash
# Test the API endpoint
curl https://zojbxdrvqtnyskpaslri.supabase.co/functions/v1/make-server-a3cc576e/users \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvamJ4ZHJ2cXRueXNrcGFzbHJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwNjAxNTEsImV4cCI6MjA3NDYzNjE1MX0.ijm8c0TUFei0HKlPTbxaAxxs0Pfvj-Tp2Lu-lCoqgYc"
```

If successful, you should see a JSON response with users.

### 4. Verify on Your Live Website

1. Visit your Vercel deployment
2. Open browser DevTools (F12)
3. Go to Console tab
4. You should see:
   - ✅ `Connected to API` instead of `Demo mode`
   - ✅ Data being fetched from Supabase
   - ✅ No 403 errors

### 5. Check Edge Function Logs

If something goes wrong:

```bash
# View real-time logs
supabase functions logs make-server-a3cc576e --project-ref zojbxdrvqtnyskpaslri
```

Or view logs in Supabase Dashboard:
https://supabase.com/dashboard/project/zojbxdrvqtnyskpaslri/functions/make-server-a3cc576e/logs

## Troubleshooting Data Not Showing in UI

### Check Browser Console

If data is showing in console but not in UI, check for:

1. **Console Output**:
   ```
   Fetching patients...
   Patients loaded: 3
   ```
   
2. **React State Issues**: Data might be loading but not triggering re-renders

3. **Conditional Rendering**: Check if components are waiting for loading states

### Common Issues

**Issue 1: Data logs in console but UI is empty**
- **Cause**: Loading states not properly cleared
- **Fix**: Check `isLoading` state in components

**Issue 2: "Demo mode" toast appears**
- **Cause**: Edge Function not deployed or not accessible
- **Fix**: Deploy Edge Function (Step 1 above)

**Issue 3: 403 Forbidden errors**
- **Cause**: Edge Function not found or CORS issue
- **Fix**: Verify deployment and check CORS headers in Edge Function

## Quick Verification Checklist

- [ ] Edge Function deployed to Supabase
- [ ] Environment variables set in Supabase
- [ ] Test curl command returns data
- [ ] Browser console shows "Connected to API"
- [ ] No 403 errors in Network tab
- [ ] Data appears in UI components

## Getting Your Service Role Key

1. Go to https://supabase.com/dashboard/project/zojbxdrvqtnyskpaslri/settings/api
2. Scroll to "Project API keys"
3. Copy the `service_role` key (NOT the anon key)
4. Keep this secret - never commit to git!

## Alternative: Manual API Testing

You can also test your API using Postman or browser:

**GET Users**:
```
GET https://zojbxdrvqtnyskpaslri.supabase.co/functions/v1/make-server-a3cc576e/users
Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvamJ4ZHJ2cXRueXNrcGFzbHJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwNjAxNTEsImV4cCI6MjA3NDYzNjE1MX0.ijm8c0TUFei0HKlPTbxaAxxs0Pfvj-Tp2Lu-lCoqgYc
```

## Need Help?

If you're still having issues:

1. Share the browser console output
2. Share the Edge Function logs
3. Share any error messages from deployment
