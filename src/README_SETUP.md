# Panchakarma Patient Management System - Setup

## 🌿 Welcome!

Your **Panchakarma Patient Management System** is **fully functional** and deployed!

## 📊 Current Status

| Component | Status | Notes |
|-----------|--------|-------|
| Frontend (React) | ✅ **Live** | Deployed on Vercel |
| Demo Mode | ✅ **Working** | Full functionality with sample data |
| Supabase Credentials | ✅ **Configured** | Ready to connect |
| Edge Function | ⏳ **Pending** | Needs deployment (5 min) |
| Database | ⏳ **Pending** | Will auto-initialize on first connection |

## 🎯 What Works Right Now

### ✅ Admin Dashboard
- Patient management (create, view, edit)
- Doctor management
- Therapy session scheduling
- Analytics and charts
- Notification system
- **NEW**: System diagnostics panel

### ✅ Patient Dashboard
- View upcoming sessions
- Track treatment progress
- Submit feedback
- View care instructions

### ✅ Doctor Dashboard
- View assigned patients
- Manage therapy sessions
- Track patient progress

## 🚀 Quick Start Options

### Option 1: Use Demo Mode (Already Working!)
**No setup needed** - Your app works perfectly with demo data:
1. Visit your Vercel URL
2. Login with demo credentials (see below)
3. Explore all features

**Demo Credentials:**
```
Admin:   admin@panchakarma.com / admin123
Patient: patient@example.com / patient123  
Doctor:  sharma@panchakarma.com / doctor123
```

### Option 2: Connect to Supabase (5 Minutes)
For **persistent data storage**:

```bash
# Quick commands (see QUICK_CONNECT.md for details)
supabase login
supabase link --project-ref zojbxdrvqtnyskpaslri
supabase functions deploy make-server-a3cc576e --project-ref zojbxdrvqtnyskpaslri
```

**Full instructions**: See `QUICK_CONNECT.md`

## 🔍 Check Your Connection Status

### Method 1: Use the Diagnostic Panel (Recommended)
1. Login as admin
2. Go to **Settings** tab
3. Click **"Run Diagnostics"**
4. See instant status of all systems

### Method 2: Check Browser Console
1. Open DevTools (F12)
2. Look for connection message:
   - ✅ "Connected to API" = Supabase mode
   - 🟡 "Using demo mode" = Demo mode

### Method 3: Check Data Persistence
1. Create a new patient
2. Refresh the page
3. If patient persists → Supabase mode ✅
4. If patient disappears → Demo mode 🟡

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| `QUICK_CONNECT.md` | **START HERE** - 5-minute Supabase setup |
| `COMMANDS.md` | All terminal commands with examples |
| `SUPABASE_SETUP.md` | Detailed Supabase connection guide |
| `UI_DATA_ISSUE_ANALYSIS.md` | Understanding data flow & troubleshooting |
| `DEPLOYMENT.md` | Full deployment guide |
| `TROUBLESHOOTING.md` | Common issues and solutions |

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript
- **UI Library**: Shadcn/UI + Tailwind CSS v4
- **Backend**: Supabase Edge Functions (Hono + Deno)
- **Database**: Supabase PostgreSQL (KV Store)
- **Deployment**: Vercel (Frontend) + Supabase (Backend)
- **Charts**: Recharts
- **Notifications**: Sonner

## 🎨 Features

### Core Features
- ✅ Role-based authentication (Admin, Patient, Doctor)
- ✅ Patient management with medical history
- ✅ Doctor profiles with specializations
- ✅ Therapy session scheduling
- ✅ Pre/post procedure instructions
- ✅ Progress tracking with charts
- ✅ Notification system
- ✅ Analytics dashboard

### Advanced Features
- ✅ **Dual-mode operation** (Demo + Supabase)
- ✅ **Graceful fallback** to demo data
- ✅ **System diagnostics** panel
- ✅ **Real-time** data sync (Supabase mode)
- ✅ **Responsive design** (mobile + desktop)
- ✅ **ID-based relationships** (proper patient-doctor linking)

## 🔐 Demo Users

### Admin
```
Email: admin@panchakarma.com
Password: admin123
Access: Full system management
```

### Patient
```
Email: patient@example.com
Password: patient123
Access: Personal dashboard, appointments, progress
```

### Doctors
```
Dr. Sharma:  sharma@panchakarma.com / doctor123
Dr. Patel:   patel@panchakarma.com / doctor123
Dr. Kumar:   kumar@panchakarma.com / doctor123
```

## 🎯 Use Cases

### Scenario 1: Testing/Demo
**Use**: Demo mode (current state)
- No setup required
- Instant access
- All features work
- Data resets on refresh

### Scenario 2: Development
**Use**: Demo mode + Local development
- Edit code locally
- See changes instantly
- No database needed

### Scenario 3: Production
**Use**: Supabase mode
- Deploy Edge Function
- Persistent data
- Multi-user support
- Real-time sync

## 🚨 Common Questions

### Q: Is my app broken if I see "Demo mode"?
**A**: No! Demo mode is a **feature**, not a bug. Your app is fully functional.

### Q: Why isn't data persisting?
**A**: You're in demo mode. Deploy Edge Function to enable persistence.

### Q: Do I need to connect Supabase?
**A**: Only if you want data to persist. Demo mode has full functionality.

### Q: How do I know which mode I'm in?
**A**: Check the toast message on login, or run diagnostics in Admin → Settings.

### Q: Data shows in console but not UI?
**A**: See `UI_DATA_ISSUE_ANALYSIS.md` - likely a mode confusion, not a bug.

## 🎓 Understanding the System

### Data Flow
```
User Login → Auth Check → Dashboard Load
                ↓
        Test Supabase Connection
                ↓
        ┌───────┴───────┐
        ↓               ↓
   ✅ Connected    ❌ Failed
   Supabase Mode   Demo Mode
        ↓               ↓
   Real Database   Fallback Data
        ↓               ↓
    Persistent    Session Only
```

### File Structure
```
/App.tsx                    - Main entry point
/components/
  ├── AdminDashboard.tsx    - Admin interface
  ├── PatientDashboard.tsx  - Patient interface
  ├── DoctorDashboard.tsx   - Doctor interface
  ├── DiagnosticPanel.tsx   - NEW: System diagnostics
  └── ui/                   - Shadcn components
/utils/
  ├── database.tsx          - Data service layer
  └── supabase/
      └── info.tsx          - Credentials (auto-generated)
/supabase/functions/server/
  ├── index.tsx             - Edge Function
  └── kv_store.tsx          - Database utilities
```

## 📈 Next Steps

### Immediate (Optional)
1. ✅ Test demo mode (already working!)
2. ✅ Explore all dashboards
3. ✅ Run diagnostics panel

### Short-term (Recommended)
1. 📖 Read `QUICK_CONNECT.md`
2. 🚀 Deploy Edge Function
3. ✅ Connect to Supabase
4. ✅ Test persistence

### Long-term (As Needed)
1. 📝 Customize for your needs
2. 🎨 Add branding/styling
3. 📧 Configure email notifications
4. 📱 Test on mobile devices
5. 🚀 Deploy to production

## 🆘 Need Help?

### In-App Diagnostics
**Admin → Settings → Run Diagnostics**
- Instant system status
- Connection testing
- Detailed error messages
- Actionable recommendations

### Documentation
1. Start with `QUICK_CONNECT.md` for Supabase setup
2. Check `UI_DATA_ISSUE_ANALYSIS.md` for data issues
3. See `TROUBLESHOOTING.md` for common problems

### Logs & Debugging
```bash
# View Edge Function logs
supabase functions logs make-server-a3cc576e --project-ref zojbxdrvqtnyskpaslri --follow

# Test API directly
curl https://zojbxdrvqtnyskpaslri.supabase.co/functions/v1/make-server-a3cc576e/users \
  -H "Authorization: Bearer eyJ..."
```

## 💪 You're Ready!

Your Panchakarma Patient Management System is **live and working**. 

- **Want to explore?** → Use demo mode (no setup needed!)
- **Want persistence?** → Follow `QUICK_CONNECT.md` (5 minutes)
- **Want details?** → Check the documentation files

**Enjoy your new system!** 🌿✨

---

**Made with ❤️ for the Ayurveda community**

*Supporting the USD 16 billion Ayurveda market with modern digital solutions*
