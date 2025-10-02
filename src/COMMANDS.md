# Quick Command Reference - Supabase Setup

## 📋 Prerequisites
- Supabase CLI installed: `npm install -g supabase`
- Your Supabase project ID: `zojbxdrvqtnyskpaslri`

## 🚀 Deploy to Supabase (Step by Step)

### Step 1: Login to Supabase
```bash
supabase login
```

### Step 2: Link Your Project
```bash
supabase link --project-ref zojbxdrvqtnyskpaslri
```

### Step 3: Deploy Edge Function
```bash
supabase functions deploy make-server-a3cc576e --project-ref zojbxdrvqtnyskpaslri
```

### Step 4: Set Environment Variables

First, get your service role key from:
https://supabase.com/dashboard/project/zojbxdrvqtnyskpaslri/settings/api

Then run these commands:

```bash
# Set Supabase URL
supabase secrets set SUPABASE_URL=https://zojbxdrvqtnyskpaslri.supabase.co --project-ref zojbxdrvqtnyskpaslri

# Set Anon Key (already configured in your app)
supabase secrets set SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvamJ4ZHJ2cXRueXNrcGFzbHJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwNjAxNTEsImV4cCI6MjA3NDYzNjE1MX0.ijm8c0TUFei0HKlPTbxaAxxs0Pfvj-Tp2Lu-lCoqgYc --project-ref zojbxdrvqtnyskpaslri

# Set Service Role Key (replace <YOUR_SERVICE_ROLE_KEY> with actual key)
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<YOUR_SERVICE_ROLE_KEY> --project-ref zojbxdrvqtnyskpaslri
```

### Step 5: Verify Deployment
```bash
# Check if function is deployed
supabase functions list --project-ref zojbxdrvqtnyskpaslri

# View logs
supabase functions logs make-server-a3cc576e --project-ref zojbxdrvqtnyskpaslri

# Test API endpoint
curl https://zojbxdrvqtnyskpaslri.supabase.co/functions/v1/make-server-a3cc576e/users \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvamJ4ZHJ2cXRueXNrcGFzbHJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwNjAxNTEsImV4cCI6MjA3NDYzNjE1MX0.ijm8c0TUFei0HKlPTbxaAxxs0Pfvj-Tp2Lu-lCoqgYc"
```

## 🔍 Troubleshooting Commands

### Check secrets
```bash
supabase secrets list --project-ref zojbxdrvqtnyskpaslri
```

### View function logs (real-time)
```bash
supabase functions logs make-server-a3cc576e --project-ref zojbxdrvqtnyskpaslri --follow
```

### Redeploy after changes
```bash
supabase functions deploy make-server-a3cc576e --project-ref zojbxdrvqtnyskpaslri --no-verify-jwt
```

### Delete and recreate function (if needed)
```bash
supabase functions delete make-server-a3cc576e --project-ref zojbxdrvqtnyskpaslri
supabase functions deploy make-server-a3cc576e --project-ref zojbxdrvqtnyskpaslri
```

## ✅ Success Indicators

After successful deployment, you should see:

1. **In Terminal:**
   - ✅ "Function deployed successfully"
   - ✅ Curl command returns JSON data

2. **In Browser Console:**
   - ✅ "Connected to API" (not "Demo mode")
   - ✅ No 403 errors in Network tab

3. **In Your App:**
   - ✅ Admin Dashboard → Settings → Diagnostic Panel shows all green
   - ✅ Data loads from Supabase (not demo data)
   - ✅ CRUD operations persist across page refreshes

## 📱 Check Live Website

1. Visit your Vercel URL
2. Open DevTools (F12)
3. Check Console tab for connection status
4. Login as admin: `admin@panchakarma.com` / `admin123`
5. Go to Settings tab and click "Run Diagnostics"

## 🔗 Useful Links

- **Supabase Dashboard**: https://supabase.com/dashboard/project/zojbxdrvqtnyskpaslri
- **API Settings**: https://supabase.com/dashboard/project/zojbxdrvqtnyskpaslri/settings/api
- **Function Logs**: https://supabase.com/dashboard/project/zojbxdrvqtnyskpaslri/functions/make-server-a3cc576e/logs
- **Edge Functions Docs**: https://supabase.com/docs/guides/functions

## 🆘 Common Issues

### Issue: "Function not found" or 404
**Solution**: Deploy the function first (Step 3)

### Issue: "Unauthorized" or 403
**Solution**: Set environment variables (Step 4)

### Issue: Data shows in console but not UI
**Solution**: 
1. Check if Edge Function is deployed
2. Run diagnostics in Admin → Settings
3. Check browser console for errors

### Issue: "Demo mode" still showing
**Solution**:
1. Verify Edge Function is deployed
2. Hard refresh browser (Ctrl+Shift+R)
3. Clear browser cache

## 💡 Tips

- **Always view logs when debugging**: `supabase functions logs make-server-a3cc576e --project-ref zojbxdrvqtnyskpaslri --follow`
- **Test API directly with curl** before checking the UI
- **Use the Diagnostic Panel** in Admin Dashboard → Settings
- **Service Role Key is sensitive** - never commit it to git
