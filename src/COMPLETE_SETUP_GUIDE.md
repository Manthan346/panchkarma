# 🚀 Complete Setup Guide - Panchakarma Patient Management System

## Welcome! 👋

This guide will help you set up your Panchakarma Patient Management System with full database connectivity in **under 10 minutes**.

---

## 📋 What You're Setting Up

A complete patient management system with:
- ✅ **Patient Management** - Track patients, medical history, appointments
- ✅ **Therapy Scheduling** - Schedule and manage Panchakarma treatments
- ✅ **Progress Tracking** - Monitor patient improvement with graphs
- ✅ **Multi-User Roles** - Admin, Doctor, and Patient dashboards
- ✅ **Real-time Notifications** - Pre and post-procedure instructions
- ✅ **Persistent Database** - All data saved to Supabase cloud

---

## 🎯 Quick Start (Choose Your Path)

### Path 1: I Just Want It Working (5 minutes) ⚡

1. **Deploy Edge Function:**
   ```bash
   npx supabase functions deploy server --project-ref zojbxdrvqtnyskpaslri
   ```

2. **Set Secrets** (get keys from [Supabase Dashboard](https://supabase.com/dashboard/project/zojbxdrvqtnyskpaslri/settings/api)):
   ```bash
   npx supabase secrets set SUPABASE_URL=https://zojbxdrvqtnyskpaslri.supabase.co
   npx supabase secrets set SUPABASE_ANON_KEY=YOUR_ANON_KEY
   npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
   ```

3. **Open the app** - You're done! 🎉

### Path 2: I Want to Understand Everything (10 minutes) 📚

Continue reading this guide for detailed explanations.

---

## 🔧 Prerequisites

### Required
- ✅ **Node.js** (v18 or later) - [Download](https://nodejs.org)
- ✅ **Supabase Account** - [Sign up free](https://supabase.com)
- ✅ **Modern Browser** - Chrome, Firefox, Safari, or Edge

### Check Your Setup
```bash
# Verify Node.js is installed
node --version
# Should show v18.0.0 or higher

# Verify npm is installed
npm --version
# Should show 8.0.0 or higher
```

---

## 📦 Step 1: Get Your Supabase Credentials

### 1.1 Find Your Project Reference

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Your URL looks like: `https://supabase.com/dashboard/project/[YOUR_PROJECT_REF]/...`
3. Copy the project reference (e.g., `zojbxdrvqtnyskpaslri`)

### 1.2 Get Your API Keys

1. Go to: `https://supabase.com/dashboard/project/YOUR_PROJECT_REF/settings/api`
2. Copy these values:
   - **Project URL** (e.g., `https://zojbxdrvqtnyskpaslri.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)
   - **service_role** key (another long string - keep this secret!)

> **Note:** The default configuration already uses project `zojbxdrvqtnyskpaslri`. If this is your project, you can skip customization!

---

## 🚀 Step 2: Deploy the Edge Function

### 2.1 Install Supabase CLI (if needed)

```bash
npm install -g supabase
```

Verify installation:
```bash
supabase --version
```

### 2.2 Login to Supabase

```bash
npx supabase login
```

This opens a browser for authentication.

### 2.3 Deploy the Function

```bash
npx supabase functions deploy server --project-ref YOUR_PROJECT_REF
```

**Replace `YOUR_PROJECT_REF`** with your actual project reference.

**Expected output:**
```
Deploying function server...
✓ Deployed function server successfully
```

---

## 🔐 Step 3: Set Environment Secrets

Set three required environment variables:

```bash
# 1. Supabase URL
npx supabase secrets set SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co

# 2. Anon Key (from Dashboard > Settings > API)
npx supabase secrets set SUPABASE_ANON_KEY=YOUR_ANON_KEY

# 3. Service Role Key (from Dashboard > Settings > API)
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

**Verify secrets are set:**
```bash
npx supabase secrets list
```

Should show:
```
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

---

## ✅ Step 4: Verify the Connection

### Method 1: Browser Test Tool

1. Open `test-database-connection.html` in your browser
2. Enter your Project Ref and Anon Key
3. Click "Run All Tests"
4. Should show: **"All Tests Passed!"** ✅

### Method 2: Your Application

1. Open your app in the browser
2. Try logging in:
   - **Admin:** admin@panchakarma.com / admin123
   - **Patient:** patient@example.com / patient123
   - **Doctor:** sharma@panchakarma.com / doctor123

3. **Success indicators:**
   - ✅ No toast saying "demo mode"
   - ✅ No CORS errors in console (F12)
   - ✅ Data persists after page refresh

### Method 3: Check Browser Console

1. Open DevTools (F12)
2. Go to Console tab
3. Paste this:
   ```javascript
   databaseService.connection.testConnection().then(console.log)
   ```
4. Should show: `{ success: true, edgeFunctionAvailable: true, ... }`

---

## 🎨 Step 5: Explore Your App

### Default Users

Your database comes pre-loaded with demo users:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@panchakarma.com | admin123 |
| Patient | patient@example.com | patient123 |
| Doctor | sharma@panchakarma.com | doctor123 |
| Doctor | patel@panchakarma.com | doctor123 |
| Doctor | kumar@panchakarma.com | doctor123 |

### Features to Try

#### As Admin:
- 👥 **Patient Management** - View all patients
- 🏥 **Doctor Management** - Manage doctor profiles
- 📊 **Analytics Dashboard** - System-wide statistics
- 📅 **Therapy Scheduling** - Schedule treatments
- 📈 **Progress Tracking** - View patient progress

#### As Patient:
- 🗓️ **My Appointments** - View upcoming therapies
- 📊 **My Progress** - Track improvement over time
- 💊 **Treatment History** - See completed sessions
- 🔔 **Notifications** - Pre/post-procedure instructions
- 📝 **Feedback** - Submit progress updates

#### As Doctor:
- 🏥 **Patient List** - View all patients
- 📅 **Today's Schedule** - See appointments
- 📊 **Patient Progress** - Monitor improvements
- 📝 **Session Notes** - Add treatment notes

---

## 🗄️ Understanding Your Database

### Data Storage

Your data is stored in Supabase PostgreSQL in a key-value table:

**Table:** `kv_store_a3cc576e`

| Key Pattern | Stores |
|-------------|--------|
| `user_*` | User accounts |
| `patient_*` | Patient profiles |
| `doctor_*` | Doctor profiles |
| `therapy_session_*` | Therapy appointments |
| `progress_*` | Patient progress data |
| `notification_*` | Notifications |

### Viewing Your Data

1. Go to [Database Editor](https://supabase.com/dashboard/project/YOUR_PROJECT_REF/editor)
2. Find table: `kv_store_a3cc576e`
3. Click to view all data

### Querying Data (SQL)

```sql
-- Get all users
SELECT * FROM kv_store_a3cc576e WHERE key LIKE 'user_%';

-- Get all therapy sessions
SELECT * FROM kv_store_a3cc576e WHERE key LIKE 'therapy_session_%';

-- Get patient #2's data
SELECT * FROM kv_store_a3cc576e WHERE key LIKE '%_2';
```

---

## 🔧 Troubleshooting

### Issue: "Still showing demo mode"

**Solutions:**

1. **Check deployment:**
   ```bash
   npx supabase functions list
   ```
   Should show `server` function

2. **Check secrets:**
   ```bash
   npx supabase secrets list
   ```
   Should show all 3 secrets

3. **Hard refresh browser:**
   - Windows: Ctrl+Shift+R
   - Mac: Cmd+Shift+R

4. **Clear browser cache:**
   - Open DevTools (F12)
   - Application/Storage tab
   - Clear Site Data

### Issue: "CORS errors in console"

**Solutions:**

1. **Verify deployment:**
   ```bash
   npx supabase functions deploy server --project-ref YOUR_PROJECT_REF
   ```

2. **Check Edge Function logs:**
   ```bash
   npx supabase functions logs server
   ```

3. **Hard refresh browser** (important!)

### Issue: "Function deployment failed"

**Solutions:**

1. **Login again:**
   ```bash
   npx supabase login
   ```

2. **Check project access:**
   ```bash
   npx supabase projects list
   ```

3. **Try with debug:**
   ```bash
   npx supabase functions deploy server --project-ref YOUR_PROJECT_REF --debug
   ```

### Issue: "Data not persisting"

**Indicators you're in demo mode:**
- Toast says "demo mode"
- Data lost after refresh
- Console shows fetch errors

**Solution:**
Follow all steps above to deploy Edge Function and set secrets.

---

## 📊 Monitoring Your System

### View Logs

```bash
# Live tail of Edge Function logs
npx supabase functions logs server --tail

# View last 100 lines
npx supabase functions logs server --limit 100
```

### Check Function Status

```bash
# List all functions
npx supabase functions list

# Get function details
npx supabase functions inspect server
```

### Monitor Database

- **Dashboard:** https://supabase.com/dashboard/project/YOUR_PROJECT_REF
- **Database:** https://supabase.com/dashboard/project/YOUR_PROJECT_REF/editor
- **API Logs:** https://supabase.com/dashboard/project/YOUR_PROJECT_REF/logs/explorer

---

## 🔒 Security Considerations

### For Development

Current setup is fine for development and testing.

### For Production

Before going live, implement these security measures:

1. **Enable Row Level Security (RLS):**
   ```sql
   ALTER TABLE kv_store_a3cc576e ENABLE ROW LEVEL SECURITY;
   ```

2. **Restrict CORS:**
   Update `/supabase/functions/server/index.tsx`:
   ```typescript
   app.use('*', cors({
     origin: ['https://yourproductiondomain.com'],
     // ... rest of config
   }));
   ```

3. **Add Rate Limiting:**
   Implement rate limiting in Edge Function

4. **Use JWT Tokens:**
   Replace simple password auth with proper JWT

5. **Rotate Secrets:**
   Regularly rotate service role keys

---

## 📚 Additional Resources

### Documentation Files

- **`DATABASE_CONNECTION_GUIDE.md`** - Detailed database setup
- **`CORS_FIX_SUMMARY.md`** - CORS configuration explained
- **`FIX_CORS_NOW.md`** - Quick CORS fix guide
- **`DEPLOY_COMMANDS.md`** - Command reference
- **`TROUBLESHOOTING.md`** - Common issues and fixes

### Test Files

- **`test-database-connection.html`** - Database connection tester
- **`test-cors.html`** - CORS configuration tester

### External Links

- [Supabase Documentation](https://supabase.com/docs)
- [Edge Functions Guide](https://supabase.com/docs/guides/functions)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

## 🎯 Quick Command Reference

```bash
# Deploy Edge Function
npx supabase functions deploy server --project-ref YOUR_PROJECT_REF

# Set secrets
npx supabase secrets set SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
npx supabase secrets set SUPABASE_ANON_KEY=YOUR_KEY
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=YOUR_KEY

# Verify deployment
npx supabase functions list
npx supabase secrets list

# View logs
npx supabase functions logs server --tail

# Login to Supabase
npx supabase login

# List projects
npx supabase projects list
```

---

## ✅ Success Checklist

Use this to verify everything is working:

- [ ] Node.js installed (v18+)
- [ ] Supabase account created
- [ ] Project reference obtained
- [ ] API keys copied
- [ ] Supabase CLI installed
- [ ] Logged into Supabase
- [ ] Edge Function deployed
- [ ] All 3 secrets set
- [ ] Database connection tested
- [ ] Can login to app
- [ ] Data persists after refresh
- [ ] No CORS errors in console
- [ ] No "demo mode" toast

**All checked?** 🎉 **You're ready to go!**

---

## 🆘 Need Help?

### Self-Service

1. Check the troubleshooting section above
2. Review Edge Function logs
3. Test with provided HTML tools
4. Verify all secrets are set

### Debugging Commands

```bash
# Check everything at once
npx supabase functions list && \
npx supabase secrets list && \
npx supabase functions logs server --limit 20
```

### Common Commands

```bash
# Redeploy function
npx supabase functions deploy server --project-ref YOUR_PROJECT_REF

# View recent errors
npx supabase functions logs server | grep -i error

# Test connection
curl https://YOUR_PROJECT_REF.supabase.co/functions/v1/make-server-a3cc576e/users \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

---

## 🎉 You're All Set!

Your Panchakarma Patient Management System is now fully configured with:

✅ **Persistent Database** - All data saved to Supabase  
✅ **Multi-User Support** - Admin, Doctor, Patient roles  
✅ **Real-Time Updates** - Instant data synchronization  
✅ **CORS Fixed** - No more browser blocking  
✅ **Production Ready** - Scalable cloud infrastructure  

### Next Steps

1. **Customize the system** - Add your own therapy types
2. **Add real patients** - Start using it for actual patient management
3. **Configure security** - Implement RLS and proper authentication
4. **Deploy frontend** - Host on Vercel, Netlify, or any static host
5. **Monitor usage** - Check Supabase dashboard regularly

---

**Total Setup Time:** 5-10 minutes  
**Difficulty:** Easy  
**Result:** Fully functional patient management system! 🎊

**Happy managing! 🏥💚**