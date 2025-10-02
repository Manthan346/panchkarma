# Installing Supabase CLI

## ⚠️ Important: NPM Global Install No Longer Supported

As of recent updates, `npm install -g supabase` is **no longer supported**. Use the methods below instead.

## 🎯 Windows Installation Methods (Recommended)

### Method 1: Scoop Package Manager (Easiest for Windows)

```bash
# Install Scoop first if you don't have it:
# Open PowerShell as Administrator and run:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression

# Then install Supabase:
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Method 2: Direct Binary Download (No Package Manager Needed)

1. **Download the Windows binary:**
   - Go to: https://github.com/supabase/cli/releases/latest
   - Download: `supabase_windows_amd64.zip`

2. **Extract and add to PATH:**
   - Extract to a folder like `C:\supabase\`
   - Add `C:\supabase\` to your Windows PATH environment variable
   - Restart your terminal

### Method 3: Using NPX (No Installation Required)

You can use Supabase CLI without installing it:

```bash
# Login
npx supabase@latest login

# Link project
npx supabase@latest link --project-ref zojbxdrvqtnyskpaslri

# Deploy function
npx supabase@latest functions deploy make-server-a3cc576e
```

**Verify any installation:**
```bash
supabase --version
# or
npx supabase@latest --version
```

---

## 📦 Other Platform Installation Methods

### Mac (Homebrew)

```bash
brew install supabase/tap/supabase
```

### Windows (Scoop)

```bash
# Install Scoop first if you don't have it:
# Visit: https://scoop.sh

# Then install Supabase:
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Linux (Direct Binary)

```bash
# Download
wget https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.tar.gz

# Extract
tar -xzf supabase_linux_amd64.tar.gz

# Move to PATH
sudo mv supabase /usr/local/bin/

# Verify
supabase --version
```

---

## 🚫 CLI Not Working? Use Dashboard Instead!

**Don't want to install CLI?** You can do everything via the Supabase Dashboard:

### Step 1: Prepare Your Edge Function

Your Edge Function code is already in:
```
/supabase/functions/server/index.tsx
/supabase/functions/server/kv_store.tsx
```

### Step 2: Deploy via Dashboard

1. **Go to Edge Functions:**
   https://supabase.com/dashboard/project/zojbxdrvqtnyskpaslri/functions

2. **Click "Create Function"**

3. **Name it:** `make-server-a3cc576e`

4. **Copy the contents of `/supabase/functions/server/index.tsx`** and paste into the editor

5. **Click "Deploy"**

### Step 3: Set Environment Variables

1. **Go to Settings → Edge Functions:**
   https://supabase.com/dashboard/project/zojbxdrvqtnyskpaslri/settings/functions

2. **Add these secrets:**

   | Name | Value |
   |------|-------|
   | `SUPABASE_URL` | `https://zojbxdrvqtnyskpaslri.supabase.co` |
   | `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvamJ4ZHJ2cXRueXNrcGFzbHJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwNjAxNTEsImV4cCI6MjA3NDYzNjE1MX0.ijm8c0TUFei0HKlPTbxaAxxs0Pfvj-Tp2Lu-lCoqgYc` |
   | `SUPABASE_SERVICE_ROLE_KEY` | Get from: https://supabase.com/dashboard/project/zojbxdrvqtnyskpaslri/settings/api |

### Step 4: Test Your Function

Test URL:
```
https://zojbxdrvqtnyskpaslri.supabase.co/functions/v1/make-server-a3cc576e/users
```

Use the built-in function tester in the dashboard or curl:
```bash
curl https://zojbxdrvqtnyskpaslri.supabase.co/functions/v1/make-server-a3cc576e/users \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvamJ4ZHJ2cXRueXNrcGFzbHJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwNjAxNTEsImV4cCI6MjA3NDYzNjE1MX0.ijm8c0TUFei0HKlPTbxaAxxs0Pfvj-Tp2Lu-lCoqgYc"
```

---

## 🛠️ Troubleshooting Installation

### Error: "Installing Supabase CLI as a global module is not supported"

This is the error you're seeing! **Solution**: Use one of the methods above instead of `npm install -g supabase`.

**Quick fix - Use NPX:**
```bash
npx supabase@latest login
npx supabase@latest link --project-ref zojbxdrvqtnyskpaslri
npx supabase@latest functions deploy make-server-a3cc576e
```

### Error: "npm: command not found"

Install Node.js first:
- Download from: https://nodejs.org
- Or use: `choco install nodejs` (Windows with Chocolatey)

### Error: "Permission denied" or "EPERM"

**Windows:** Run Command Prompt or PowerShell as Administrator

**Mac/Linux:** Use `sudo` with package managers, or try the binary installation method

### Still Having Issues?

Use the **Dashboard method** above - it requires no CLI installation!

---

## 📝 After Installation

Once Supabase CLI is installed, follow these steps:

```bash
# 1. Login
supabase login

# 2. Link project
supabase link --project-ref zojbxdrvqtnyskpaslri

# 3. Deploy function
supabase functions deploy make-server-a3cc576e --project-ref zojbxdrvqtnyskpaslri

# 4. Set secrets (get service role key from dashboard)
supabase secrets set SUPABASE_URL=https://zojbxdrvqtnyskpaslri.supabase.co --project-ref zojbxdrvqtnyskpaslri

supabase secrets set SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvamJ4ZHJ2cXRueXNrcGFzbHJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwNjAxNTEsImV4cCI6MjA3NDYzNjE1MX0.ijm8c0TUFei0HKlPTbxaAxxs0Pfvj-Tp2Lu-lCoqgYc --project-ref zojbxdrvqtnyskpaslri

supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<YOUR_SERVICE_ROLE_KEY> --project-ref zojbxdrvqtnyskpaslri
```

---

## ✅ Quick Test

After installation and login:

```bash
# Should show your project info
supabase projects list

# Should show project details
supabase status
```

---

## 🎯 Recommended Approach

**For beginners or if CLI gives issues:**
→ Use Dashboard method (no CLI needed!)

**For developers comfortable with terminal:**
→ Install CLI via npm

**For those who want both:**
→ Install CLI for convenience, but know Dashboard is always available as backup

---

## 📚 Official Docs

- **Supabase CLI Docs**: https://supabase.com/docs/guides/cli
- **Installation Guide**: https://supabase.com/docs/guides/cli/getting-started
- **Edge Functions Guide**: https://supabase.com/docs/guides/functions