# 🚀 DEPLOY NOW - One Command!

## Good News! You Don't Need to Set Any Secrets! ✨

Supabase automatically provides all environment variables to your Edge Function.

---

## THE ONLY COMMAND YOU NEED

```bash
npx supabase functions deploy server --project-ref zojbxdrvqtnyskpaslri
```

**That's it!** No secrets. No complex setup. Just deploy! 🎉

---

## First Time? Install Supabase CLI

```bash
npm install -g supabase
```

Then login:

```bash
npx supabase login
```

---

## Verify It Worked

```bash
npx supabase functions list
```

Should show:
```
NAME       VERSION  CREATED AT
server     1        [timestamp]
```

---

## Test in Your App

1. Open your app
2. Login with: `admin@panchakarma.com` / `admin123`
3. Create a patient
4. Refresh browser (Ctrl+Shift+R)
5. Patient still there? ✅ **YOU'RE CONNECTED!**

---

## Still in Demo Mode?

**Hard refresh your browser:**
- Windows: `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`

**Clear cache:**
- Press F12
- Right-click refresh button
- "Empty Cache and Hard Reload"

---

## View Logs

```bash
npx supabase functions logs server --tail
```

---

## View Your Data

**Dashboard:** https://supabase.com/dashboard/project/zojbxdrvqtnyskpaslri/editor

**Table:** `kv_store_a3cc576e`

---

## Why No Secrets Needed?

Supabase **automatically injects** these into your Edge Function:
- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `SUPABASE_ANON_KEY`

You don't need to set them manually!

---

## Need Help?

**Full guide:** `FINAL_DEPLOYMENT_GUIDE.md`

**Test connection:** Open `test-database-connection.html`

**Check logs:**
```bash
npx supabase functions logs server
```

---

## Complete Flow

```bash
# 1. Login (first time only)
npx supabase login

# 2. Deploy
npx supabase functions deploy server --project-ref zojbxdrvqtnyskpaslri

# 3. Verify
npx supabase functions list

# 4. Open your app and test!
```

**Total time:** 2 minutes ⏱️

---

## 🎯 Ready? Copy and paste:

```bash
npx supabase functions deploy server --project-ref zojbxdrvqtnyskpaslri
```

**Then refresh your browser and you're done!** 🎊