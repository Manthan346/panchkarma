# ⚡ Quick Reference Card

## 🚀 Deploy in 3 Commands

```bash
# 1. Deploy
npx supabase functions deploy server --project-ref YOUR_PROJECT_REF

# 2. Set secrets
npx supabase secrets set SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co && \
npx supabase secrets set SUPABASE_ANON_KEY=YOUR_ANON_KEY && \
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY

# 3. Verify
npx supabase functions list && npx supabase secrets list
```

---

## 🔑 Get Your Keys

**Dashboard URL:** https://supabase.com/dashboard/project/YOUR_PROJECT_REF/settings/api

Copy:
- Project URL
- anon/public key
- service_role key

---

## 👥 Default Logins

| Email | Password | Role |
|-------|----------|------|
| admin@panchakarma.com | admin123 | Admin |
| patient@example.com | patient123 | Patient |
| sharma@panchakarma.com | doctor123 | Doctor |

---

## 🧪 Test Connection

**Browser:** Open `test-database-connection.html`

**Console:**
```javascript
databaseService.connection.testConnection().then(console.log)
```

**curl:**
```bash
curl https://YOUR_PROJECT_REF.supabase.co/functions/v1/make-server-a3cc576e/users \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

---

## ✅ Success Indicators

- ✅ No toast saying "demo mode"
- ✅ No CORS errors in console
- ✅ Data persists after refresh
- ✅ `npx supabase functions list` shows "server"
- ✅ `npx supabase secrets list` shows 3 secrets

---

## ❌ Troubleshooting

**Still in demo mode?**
```bash
npx supabase functions deploy server --project-ref YOUR_PROJECT_REF
# Then hard refresh browser (Ctrl+Shift+R)
```

**CORS errors?**
```bash
# Redeploy with CORS fix
npx supabase functions deploy server --project-ref YOUR_PROJECT_REF
# Clear browser cache
```

**Deployment failed?**
```bash
npx supabase login
npx supabase functions deploy server --project-ref YOUR_PROJECT_REF
```

---

## 📊 View Data

**Dashboard:** https://supabase.com/dashboard/project/YOUR_PROJECT_REF/editor

**Table:** `kv_store_a3cc576e`

**SQL:**
```sql
SELECT * FROM kv_store_a3cc576e WHERE key LIKE 'user_%';
```

---

## 🔧 Useful Commands

```bash
# View logs (live)
npx supabase functions logs server --tail

# View logs (last 50)
npx supabase functions logs server --limit 50

# List functions
npx supabase functions list

# List secrets
npx supabase secrets list

# Login
npx supabase login

# List projects
npx supabase projects list
```

---

## 📚 Documentation

- **Full Setup:** `COMPLETE_SETUP_GUIDE.md`
- **Quick Setup:** `FIX_CORS_NOW.md`
- **Database:** `DATABASE_CONNECTION_GUIDE.md`
- **CORS Fix:** `CORS_FIX_SUMMARY.md`
- **Troubleshooting:** `TROUBLESHOOTING.md`

---

## 🌐 URLs

Replace `YOUR_PROJECT_REF` with your project ID (e.g., `zojbxdrvqtnyskpaslri`):

- **Dashboard:** `https://supabase.com/dashboard/project/YOUR_PROJECT_REF`
- **Database:** `https://supabase.com/dashboard/project/YOUR_PROJECT_REF/editor`
- **Functions:** `https://supabase.com/dashboard/project/YOUR_PROJECT_REF/functions`
- **API Keys:** `https://supabase.com/dashboard/project/YOUR_PROJECT_REF/settings/api`
- **Edge URL:** `https://YOUR_PROJECT_REF.supabase.co/functions/v1/make-server-a3cc576e`

---

## 🔐 Security Checklist

**Development:** ✅ Current setup is fine

**Production:**
- [ ] Enable RLS on tables
- [ ] Restrict CORS to specific domain
- [ ] Rotate service role key
- [ ] Add rate limiting
- [ ] Use JWT authentication
- [ ] Regular security audits

---

## 💾 Data Persistence Check

```bash
# 1. Create a patient in the UI
# 2. Note the patient name
# 3. Hard refresh (Ctrl+Shift+R)
# 4. Check if patient still exists

# ✅ If yes → Connected to database
# ❌ If no → Still in demo mode
```

---

## 🎯 Current Project

**Project ID:** `zojbxdrvqtnyskpaslri`  
**Edge URL:** `https://zojbxdrvqtnyskpaslri.supabase.co/functions/v1/make-server-a3cc576e`  
**Database Table:** `kv_store_a3cc576e`

---

## ⏱️ Time Estimates

- **Initial Setup:** 5-10 minutes
- **CORS Fix:** 2 minutes
- **Testing:** 2 minutes
- **Total:** Under 15 minutes

---

## 📱 Browser Shortcuts

- **Open Console:** F12
- **Hard Refresh:** Ctrl+Shift+R (Win) / Cmd+Shift+R (Mac)
- **Clear Cache:** Ctrl+Shift+Delete
- **Network Tab:** F12 → Network

---

## 🎨 Project Features

- ✅ Patient Management
- ✅ Doctor Management
- ✅ Therapy Scheduling
- ✅ Progress Tracking
- ✅ Analytics Dashboard
- ✅ Notification System
- ✅ Multi-user Roles
- ✅ Responsive Design

---

## 💡 Pro Tips

1. **Always hard refresh** after deployment
2. **Check logs** if something fails
3. **Use test tools** to verify connection
4. **Keep service role key secret**
5. **Monitor Edge Function usage**

---

**Need detailed help?** → See `COMPLETE_SETUP_GUIDE.md`  
**Quick fix?** → See `FIX_CORS_NOW.md`  
**Test connection?** → Open `test-database-connection.html`