# 🌍 Environment Configuration Guide

## 📁 Environment Files Created

- **`.env`** - Main environment file with your actual Supabase credentials
- **`.env.example`** - Template file for sharing/deployment 
- **`.gitignore`** - Ensures sensitive files aren't committed

## 🚀 **Immediate Next Steps**

### 1. **Your Edge Function Environment Variables**

You still need to set these secrets for your deployed Edge Function:

```bash
# Set environment variables for your Edge Function
npx supabase@latest secrets set SUPABASE_URL=https://zojbxdrvqtnyskpaslri.supabase.co --project-ref zojbxdrvqtnyskpaslri

npx supabase@latest secrets set SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvamJ4ZHJ2cXRueXNrcGFzbHJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwNjAxNTEsImV4cCI6MjA3NDYzNjE1MX0.ijm8c0TUFei0HKlPTbxaAxxs0Pfvj-Tp2Lu-lCoqgYc --project-ref zojbxdrvqtnyskpaslri
```

**Get your Service Role Key:**
1. Go to: https://supabase.com/dashboard/project/zojbxdrvqtnyskpaslri/settings/api
2. Copy the "service_role" key 
3. Run this command:

```bash
npx supabase@latest secrets set SUPABASE_SERVICE_ROLE_KEY=YOUR_ACTUAL_SERVICE_ROLE_KEY --project-ref zojbxdrvqtnyskpaslri
```

### 2. **Test Your Connection**

```bash
curl https://zojbxdrvqtnyskpaslri.supabase.co/functions/v1/make-server-a3cc576e/users \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvamJ4ZHJ2cXRueXNrcGFzbHJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwNjAxNTEsImV4cCI6MjA3NDYzNjE1MX0.ijm8c0TUFei0HKlPTbxaAxxs0Pfvj-Tp2Lu-lCoqgYc"
```

### 3. **Refresh Your App**

Once the Edge Function is working:
- Refresh your web application
- It should automatically switch from demo mode to live database
- No more "demo mode" toast notifications

---

## 📋 Environment Variables Explained

### Frontend Environment Variables (`.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | `https://xyz.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Public anonymous key | `eyJhbGci...` |
| `VITE_PROJECT_ID` | Supabase project ID | `zojbxdrvqtnyskpaslri` |
| `VITE_EDGE_FUNCTION_URL` | Full Edge Function endpoint | `https://xyz.supabase.co/functions/v1/make-server-a3cc576e` |
| `VITE_FORCE_DEMO_MODE` | Force demo mode (for testing) | `false` |

### Edge Function Environment Variables (Supabase Secrets)

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `SUPABASE_URL` | Your Supabase project URL | Dashboard → Settings → API |
| `SUPABASE_ANON_KEY` | Public anonymous key | Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side key (secret!) | Dashboard → Settings → API |

---

## 🔄 How It Works Now

### **Development Mode**
- Uses `.env` file for configuration
- Fallback to hardcoded values if env vars not found
- Can force demo mode via `VITE_FORCE_DEMO_MODE=true`

### **Production Mode**
- Environment variables provided by hosting platform
- Edge Function uses Supabase secrets
- Automatic fallback to demo mode if connection fails

### **Demo Mode**
- Activates automatically if Supabase connection fails
- Shows one-time toast notification
- Uses comprehensive mock data
- Full functionality without database

---

## 🛠️ Deployment Platforms

### **Vercel**
```bash
# Set environment variables
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add VITE_PROJECT_ID
vercel env add VITE_EDGE_FUNCTION_URL
```

### **Netlify**
```bash
# Set environment variables
netlify env:set VITE_SUPABASE_URL "https://zojbxdrvqtnyskpaslri.supabase.co"
netlify env:set VITE_SUPABASE_ANON_KEY "your_anon_key"
netlify env:set VITE_PROJECT_ID "zojbxdrvqtnyskpaslri"
netlify env:set VITE_EDGE_FUNCTION_URL "https://zojbxdrvqtnyskpaslri.supabase.co/functions/v1/make-server-a3cc576e"
```

### **General Hosting**
Add these environment variables in your hosting platform's dashboard:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_PROJECT_ID`
- `VITE_EDGE_FUNCTION_URL`

---

## 🔒 Security Best Practices

### ✅ **Safe to Expose (Frontend)**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_PROJECT_ID`
- `VITE_EDGE_FUNCTION_URL`

### ❌ **Never Expose (Backend Only)**
- `SUPABASE_SERVICE_ROLE_KEY`
- Database passwords
- API keys for external services

### 🛡️ **File Security**
- `.env` is in `.gitignore` (safe)
- Use `.env.example` for sharing configuration templates
- Never commit real credentials to Git

---

## 🧪 Testing Configuration

### **Test Demo Mode**
```bash
# Force demo mode
echo "VITE_FORCE_DEMO_MODE=true" >> .env
```

### **Test Live Connection**
```bash
# Disable demo mode
echo "VITE_FORCE_DEMO_MODE=false" >> .env
```

### **Check Environment Loading**
Open browser console and check for:
- "Using Supabase backend" (live mode)
- "Using fallback data" (demo mode)

---

## 🆘 Troubleshooting

### **App Still in Demo Mode?**
1. Check if Edge Function secrets are set: `npx supabase@latest secrets list --project-ref zojbxdrvqtnyskpaslri`
2. Test Edge Function directly with curl
3. Check browser console for connection errors

### **Environment Variables Not Loading?**
1. Restart your development server
2. Check file is named exactly `.env` (not `.env.txt`)
3. Variables must start with `VITE_` for Vite apps

### **Deployment Issues?**
1. Ensure environment variables are set in hosting platform
2. Check build logs for missing variables
3. Verify Edge Function is deployed and working

---

## ✅ **Complete Setup Checklist**

- [ ] Edge Function deployed (`npx supabase@latest functions deploy`)
- [ ] Edge Function secrets set (URL, ANON_KEY, SERVICE_ROLE_KEY)
- [ ] Environment file created (`.env`)
- [ ] Test connection with curl
- [ ] App switches from demo to live mode
- [ ] Data persists after page refresh

**You're almost there! Just set those Edge Function secrets and test the connection!** 🚀