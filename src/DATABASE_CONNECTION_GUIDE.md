# 🔌 Complete Database Connection Guide

## Overview

Your Panchakarma app can work in **3 modes**:

1. **Demo Mode** - Uses hardcoded sample data (no persistence)
2. **Edge Function Mode** - Uses Supabase Edge Function with KV store (persistent)
3. **Direct Supabase Mode** - Direct connection to Supabase PostgreSQL (future enhancement)

Currently, the app is set up for **Edge Function Mode** which provides full persistence through Supabase.

---

## Current Status

✅ **Database service fixed** - Proper error handling and connection logic  
✅ **Edge Function ready** - Just needs deployment  
✅ **CORS headers fixed** - No more browser blocking  
⏳ **Needs deployment** - Follow steps below  

---

## Quick Setup (3 Steps)

### Step 1: Deploy the Edge Function

```bash
npx supabase functions deploy server --project-ref YOUR_PROJECT_REF
```

**Find YOUR_PROJECT_REF:**
- Go to https://supabase.com/dashboard
- Your URL looks like: `https://supabase.com/dashboard/project/[THIS-IS-IT]/...`
- Example: `zojbxdrvqtnyskpaslri`

### Step 2: Set Environment Secrets

```bash
# Set the Supabase URL
npx supabase secrets set SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co

# Set the Anon Key (from Dashboard > Settings > API)
npx supabase secrets set SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE

# Set the Service Role Key (from Dashboard > Settings > API)
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY_HERE
```

**Find your keys:**
1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT_REF/settings/api
2. Copy:
   - Project URL
   - anon/public key
   - service_role key (keep this secret!)

### Step 3: Test the Connection

```bash
# Open your app in the browser
# Check the browser console (F12)
# You should see: "Connected to Edge Function" in the toast notification
```

---

## Detailed Setup Guide

### Prerequisites

1. **Node.js installed** (v18 or later)
   - Check: `node --version`
   - Download: https://nodejs.org

2. **Supabase project created**
   - If not: https://supabase.com/dashboard

3. **Project files ready**
   - All files from this directory

### Installation Steps

#### 1. Install Supabase CLI (if not installed)

**Windows:**
```powershell
npm install -g supabase
```

**Mac/Linux:**
```bash
npm install -g supabase
```

**Verify installation:**
```bash
supabase --version
```

#### 2. Login to Supabase

```bash
npx supabase login
```

This will open a browser window for authentication.

#### 3. Link Your Project

```bash
npx supabase link --project-ref YOUR_PROJECT_REF
```

#### 4. Deploy Edge Function

```bash
cd /path/to/your/project
npx supabase functions deploy server --project-ref YOUR_PROJECT_REF
```

**Expected output:**
```
Deploying function server...
✓ Deployed function server
```

#### 5. Set Secrets

```bash
npx supabase secrets set SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
npx supabase secrets set SUPABASE_ANON_KEY=YOUR_ANON_KEY
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

**Expected output:**
```
✓ Set secret SUPABASE_URL
✓ Set secret SUPABASE_ANON_KEY
✓ Set secret SUPABASE_SERVICE_ROLE_KEY
```

#### 6. Verify Setup

```bash
# Check function is deployed
npx supabase functions list

# Check secrets are set
npx supabase secrets list

# View function logs
npx supabase functions logs server
```

---

## Testing the Connection

### Method 1: Browser Console

1. Open your app
2. Press F12 to open DevTools
3. Go to Console tab
4. Look for:
   - ✅ "Connected to Edge Function" toast
   - ✅ No CORS errors
   - ✅ Successful API calls in Network tab

### Method 2: Test File

Open `test-cors.html` in your browser:
1. Enter your Project Ref and Anon Key
2. Click "Test Connection"
3. Should show: ✅ "Connection Successful!"

### Method 3: Login Test

1. Open your app
2. Try logging in with:
   - **Admin:** admin@panchakarma.com / admin123
   - **Patient:** patient@example.com / patient123
   - **Doctor:** sharma@panchakarma.com / doctor123
3. If successful, you're connected!

---

## Understanding the Connection Flow

### How It Works

```
┌──────────────┐
│   Your App   │
│  (Browser)   │
└──────┬───────┘
       │
       │ 1. Makes API call
       ↓
┌──────────────────────────────────┐
│  Database Service                │
│  (/utils/database.tsx)           │
│                                  │
│  Tries in order:                 │
│  1. Edge Function (if available) │
│  2. Demo Mode (fallback)         │
└──────┬───────────────────────────┘
       │
       │ 2. Calls Edge Function
       ↓
┌──────────────────────────────────┐
│  Supabase Edge Function          │
│  (Deno runtime)                  │
│                                  │
│  - Handles CORS                  │
│  - Routes requests               │
│  - Returns data                  │
└──────┬───────────────────────────┘
       │
       │ 3. Queries database
       ↓
┌──────────────────────────────────┐
│  PostgreSQL Database             │
│  (kv_store_a3cc576e table)       │
│                                  │
│  - Stores all data persistently  │
└──────────────────────────────────┘
```

### Connection Modes

#### 🟢 **Edge Function Mode** (Persistent)
- ✅ Data saved to Supabase
- ✅ Survives page refresh
- ✅ Shared across devices
- ✅ Production-ready

**How to enable:** Deploy Edge Function + Set secrets

#### 🟡 **Demo Mode** (Temporary)
- ⚠️ Data in browser memory only
- ⚠️ Lost on page refresh
- ⚠️ Not shared
- ✅ Good for testing UI

**How to enable:** Don't deploy Edge Function (automatic fallback)

---

## Checking Current Mode

### In Browser Console

```javascript
// Check connection status
const status = await databaseService.connection.testConnection();
console.log(status);

// Output if connected:
{
  success: true,
  message: "Connected to Edge Function",
  usingFallback: false,
  edgeFunctionAvailable: true,
  supabaseAvailable: true
}

// Output if in demo mode:
{
  success: true,
  message: "Using demo mode",
  usingFallback: true,
  edgeFunctionAvailable: false,
  supabaseAvailable: false
}
```

### Toast Notifications

- **"Connected to Edge Function"** → ✅ Live database
- **"Using demo mode with sample data"** → ⚠️ Temporary data

---

## Verifying Data Persistence

### Test Scenario

1. **Create a patient:**
   - Login as admin
   - Add a new patient
   - Note the patient name

2. **Refresh the page:**
   - Hard refresh (Ctrl+Shift+R)

3. **Check if patient still exists:**
   - ✅ **Edge Function Mode:** Patient is still there
   - ❌ **Demo Mode:** Patient disappeared

---

## Viewing Data in Supabase

### Access the Database

1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT_REF/editor
2. Find table: `kv_store_a3cc576e`
3. Click to view data

### Understanding the KV Store

The data is stored as key-value pairs:

| key | value (JSONB) |
|-----|---------------|
| `user_1` | `{"id": "1", "name": "Dr. Admin", ...}` |
| `user_2` | `{"id": "2", "name": "John Patient", ...}` |
| `therapy_session_1` | `{"id": "1", "patient_id": "2", ...}` |

### Querying Data

```sql
-- Get all users
SELECT * FROM kv_store_a3cc576e WHERE key LIKE 'user_%';

-- Get all therapy sessions
SELECT * FROM kv_store_a3cc576e WHERE key LIKE 'therapy_session_%';

-- Get a specific patient
SELECT * FROM kv_store_a3cc576e WHERE key = 'patient_2';
```

---

## Troubleshooting

### Issue: "Still in demo mode after deployment"

**Solution:**
1. Check Edge Function deployed:
   ```bash
   npx supabase functions list
   ```

2. Check secrets are set:
   ```bash
   npx supabase secrets list
   ```

3. Hard refresh browser:
   - Ctrl+Shift+R (Windows)
   - Cmd+Shift+R (Mac)

4. Check browser console for errors

### Issue: "CORS errors"

**Solution:**
1. Verify Edge Function deployed with CORS fix
2. Clear browser cache
3. Check Network tab for response headers

### Issue: "Function deployment failed"

**Solution:**
1. Login again:
   ```bash
   npx supabase login
   ```

2. Check project access:
   ```bash
   npx supabase projects list
   ```

3. Try deploying again with verbose output:
   ```bash
   npx supabase functions deploy server --project-ref YOUR_PROJECT_REF --debug
   ```

### Issue: "Cannot find module '@supabase/supabase-js'"

**Solution:**
The Supabase client is imported automatically in the Edge Function. For local development:
```bash
npm install @supabase/supabase-js
```

---

## Configuration Files

### `/utils/supabase/info.tsx`

This file contains your Supabase configuration:

```typescript
export const projectId = "YOUR_PROJECT_REF";
export const publicAnonKey = "YOUR_ANON_KEY";
export const supabaseUrl = "https://YOUR_PROJECT_REF.supabase.co";
export const edgeFunctionUrl = "https://YOUR_PROJECT_REF.supabase.co/functions/v1/make-server-a3cc576e";
```

**These are already set with your project defaults!**

### Environment Variables (Optional)

You can override defaults with a `.env` file:

```env
VITE_PROJECT_ID=your_project_ref
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_SUPABASE_URL=https://your_project_ref.supabase.co
VITE_EDGE_FUNCTION_URL=https://your_project_ref.supabase.co/functions/v1/make-server-a3cc576e
VITE_FORCE_DEMO_MODE=false
```

---

## Next Steps

1. ✅ **Deploy Edge Function** (see Step 1 above)
2. ✅ **Set secrets** (see Step 2 above)
3. ✅ **Test connection** (see Step 3 above)
4. ✅ **Start using the app!**

---

## Demo Data

When you first deploy, the Edge Function automatically creates:

### Users
- **Admin:** admin@panchakarma.com / admin123
- **Patient:** patient@example.com / patient123
- **Doctors:** sharma@panchakarma.com, patel@panchakarma.com, kumar@panchakarma.com / doctor123

### Sample Data
- 3 therapy sessions for the patient
- 2 progress entries
- 4 notifications
- 6 therapy types
- 5 practitioners

**This data is created once and persists in your database!**

---

## Security Notes

### Important

- ✅ **Anon key is safe** to use in frontend (read-only access)
- ⚠️ **Service role key is sensitive** - only use in Edge Function
- 🔒 **Never commit** service role key to git
- 🔐 **Use RLS policies** in production for security

### Recommended for Production

1. Enable Row Level Security (RLS) on tables
2. Restrict CORS to specific domains
3. Add rate limiting
4. Use proper authentication (JWT tokens)

---

## Support

### Useful Commands

```bash
# View function logs (live tail)
npx supabase functions logs server --tail

# List all functions
npx supabase functions list

# List all secrets
npx supabase secrets list

# Delete a function
npx supabase functions delete server

# Redeploy function
npx supabase functions deploy server --project-ref YOUR_PROJECT_REF
```

### Useful Links

- **Supabase Dashboard:** https://supabase.com/dashboard
- **Edge Function Docs:** https://supabase.com/docs/guides/functions
- **Edge Function Logs:** https://supabase.com/dashboard/project/YOUR_PROJECT_REF/functions
- **Database Editor:** https://supabase.com/dashboard/project/YOUR_PROJECT_REF/editor

---

## Summary

Your database connection is now **properly configured**! Follow the 3 deployment steps and you'll have:

✅ Full data persistence  
✅ Real-time updates  
✅ Multi-user support  
✅ Production-ready backend  
✅ Automatic fallback to demo mode if needed  

**Time to deploy:** 5 minutes  
**Difficulty:** Easy  
**Result:** Fully functional persistent database! 🎉