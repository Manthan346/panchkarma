# CORS Fix - Deployment Guide

## What Was Fixed

The CORS error you were experiencing on the live server has been fixed by enhancing the Edge Function's CORS configuration. The changes include:

1. **Enhanced CORS middleware** with explicit headers
2. **Explicit OPTIONS preflight handling** to handle browser preflight requests
3. **Additional CORS headers** set directly in middleware
4. **Proper credentials and max-age configuration**

## Changes Made

The `/supabase/functions/server/index.tsx` file now includes:

- More comprehensive `allowHeaders` list
- Added PATCH method support
- Explicit `Access-Control-Allow-Origin: *` header
- Dedicated OPTIONS request handler that returns 204 No Content
- `credentials: true` and `maxAge: 600` for better caching

## How to Deploy the Fix

### Option 1: Using Supabase CLI (Recommended)

```bash
# Navigate to your project directory
cd /path/to/your/project

# Deploy the updated Edge Function
npx supabase functions deploy server --project-ref YOUR_PROJECT_REF

# Or if you have the CLI installed globally:
supabase functions deploy server --project-ref YOUR_PROJECT_REF
```

### Option 2: Set Secrets (If Not Already Done)

If you haven't set your Edge Function secrets yet, you need to do this:

```bash
# Set the Supabase URL
npx supabase secrets set SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co

# Set the Anon Key
npx supabase secrets set SUPABASE_ANON_KEY=YOUR_ANON_KEY

# Set the Service Role Key
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

**Find these values in your Supabase Dashboard:**
- Go to: https://supabase.com/dashboard/project/YOUR_PROJECT_REF/settings/api
- Copy the Project URL, anon/public key, and service_role key

### Option 3: Manual Deployment via Dashboard

If CLI deployment doesn't work:

1. Go to your Supabase Dashboard
2. Navigate to **Edge Functions**
3. Find the `server` function
4. Click **Deploy new version**
5. Copy the entire contents of `/supabase/functions/server/index.tsx`
6. Paste it into the editor
7. Click **Deploy**

## Testing the Fix

After deployment, test your application:

1. **Clear your browser cache** (important!)
2. **Hard refresh** the page (Ctrl+Shift+R or Cmd+Shift+R)
3. Log in to your application
4. Check the browser console - CORS errors should be gone
5. The app should now connect to the live database instead of using demo mode

## Verifying Connection

Look for these indicators that the fix worked:

- ✅ No CORS errors in browser console
- ✅ Toast notification says "Connected to API" instead of "Using demo mode"
- ✅ Data persists after page refresh
- ✅ Network tab shows successful requests to your Edge Function URL

## Troubleshooting

### If CORS errors persist:

1. **Check deployment succeeded:**
   ```bash
   npx supabase functions list
   ```

2. **Check Edge Function logs:**
   - Go to Supabase Dashboard > Edge Functions > server > Logs
   - Look for any deployment or runtime errors

3. **Verify the URL is correct** in `/utils/supabase/info.tsx`:
   - Should be: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/make-server-a3cc576e`

4. **Clear ALL browser data:**
   - Go to DevTools > Application/Storage
   - Clear all site data
   - Hard refresh

5. **Check network requests:**
   - Open DevTools > Network tab
   - Filter by "Fetch/XHR"
   - Look at the request headers and response headers
   - Verify `Access-Control-Allow-Origin` is in the response

### If secrets are missing:

```bash
# List current secrets
npx supabase secrets list

# Set any missing secrets
npx supabase secrets set SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
npx supabase secrets set SUPABASE_ANON_KEY=YOUR_ANON_KEY
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

## Additional Notes

- The enhanced CORS configuration allows requests from any origin (`*`)
- In production, you may want to restrict this to specific domains
- The OPTIONS handler returns a 204 status code (No Content) which is standard for preflight requests
- The `maxAge: 600` means browsers will cache the preflight response for 10 minutes

## Next Steps

Once CORS is fixed and the connection is working:

1. ✅ Test all CRUD operations (Create, Read, Update, Delete)
2. ✅ Verify data persistence across page reloads
3. ✅ Test with different user roles (admin, patient, doctor)
4. ✅ Consider restricting CORS origin in production for security

## Need Help?

If you're still experiencing issues:

1. Check the Edge Function logs in Supabase Dashboard
2. Verify all environment variables are set correctly
3. Ensure the database table `kv_store_a3cc576e` exists
4. Test the Edge Function URL directly in a tool like Postman or curl

Example curl test:
```bash
curl -X GET "https://YOUR_PROJECT_REF.supabase.co/functions/v1/make-server-a3cc576e/users" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -v
```

Look for the CORS headers in the response!