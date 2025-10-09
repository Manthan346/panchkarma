# 🏥 Panchakarma Patient Management System

> A comprehensive cloud-based patient management system for Ayurvedic Panchakarma treatments, built with React, Tailwind CSS, and Supabase.

[![Supabase](https://img.shields.io/badge/Database-Supabase-green)](https://supabase.com)
[![React](https://img.shields.io/badge/Frontend-React-blue)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue)](https://www.typescriptlang.org)

---

## 🌟 Features

### Multi-Role Dashboard System
- **👨‍💼 Admin Dashboard** - Manage patients, doctors, therapies, and analytics
- **👨‍⚕️ Doctor Dashboard** - View patients, schedules, and progress tracking
- **🧑‍🤝‍🧑 Patient Dashboard** - Book appointments, track progress, view notifications

### Core Functionality
- ✅ **Patient Management** - Complete patient profiles with medical history
- ✅ **Doctor Management** - Manage practitioners and specializations
- ✅ **Therapy Scheduling** - Book and manage Panchakarma treatments
- ✅ **Progress Tracking** - Visual graphs showing patient improvement
- ✅ **Notification System** - Pre & post-procedure instructions
- ✅ **Analytics Dashboard** - Real-time system statistics
- ✅ **Persistent Database** - All data saved to Supabase cloud

### Technical Features
- 🚀 **Edge Function Backend** - Serverless API with Supabase
- 🔒 **Secure Authentication** - Role-based access control
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- ⚡ **Real-Time Updates** - Instant data synchronization
- 🎨 **Modern UI** - Built with shadcn/ui components
- 🔄 **Automatic Fallback** - Demo mode when offline

---

## 🚀 Quick Start

### ⚡ Zero Setup - Just Refresh! (0 minutes)

**No deployment needed!** The app now connects **directly to Supabase**.

Just **refresh your browser** and start using the app! 🎉

**Credentials:**
- **Admin**: admin@panchakarma.com / admin123
- **Patient**: patient@example.com / patient123
- **Doctor**: sharma@panchakarma.com / doctor123

### 📖 Important Docs

**→ ALL FIXED!** **[ALL_ERRORS_FIXED.md](ALL_ERRORS_FIXED.md)** - Complete error-free solution!

**Previous fixes:**
- **[RLS_ERROR_FIXED.md](RLS_ERROR_FIXED.md)** - RLS permission errors
- **[ERRORS_FIXED.md](ERRORS_FIXED.md)** - Deployment issues  
- **[📚 COMPLETE_SETUP_GUIDE.md](COMPLETE_SETUP_GUIDE.md)** - Full system overview

---

## 📋 Documentation Index

### Getting Started
- **[🚀 COMPLETE_SETUP_GUIDE.md](COMPLETE_SETUP_GUIDE.md)** - Complete setup walkthrough
- **[⚡ START_HERE.md](START_HERE.md)** - Quick start guide
- **[📖 QUICK_START.md](QUICK_START.md)** - Basic setup instructions

### Database Setup
- **[🔌 DATABASE_CONNECTION_GUIDE.md](DATABASE_CONNECTION_GUIDE.md)** - Database configuration
- **[🗄️ SUPABASE_SETUP.md](SUPABASE_SETUP.md)** - Supabase project setup

### CORS & Deployment
- **[🌐 FIX_CORS_NOW.md](FIX_CORS_NOW.md)** - Fix CORS errors (3 steps)
- **[📚 CORS_FIX_SUMMARY.md](CORS_FIX_SUMMARY.md)** - Complete CORS guide
- **[🎨 CORS_VISUAL_GUIDE.md](CORS_VISUAL_GUIDE.md)** - Visual CORS explanation
- **[🚀 DEPLOY_COMMANDS.md](DEPLOY_COMMANDS.md)** - Quick command reference

### Testing & Troubleshooting
- **[🧪 test-database-connection.html](test-database-connection.html)** - Database connection tester
- **[🧪 test-cors.html](test-cors.html)** - CORS configuration tester
- **[🔧 TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Common issues & fixes

---

## 🎯 Default Users

The system comes pre-loaded with demo users:

| Role | Email | Password | Access |
|------|-------|----------|--------|
| 👨‍💼 Admin | admin@panchakarma.com | admin123 | Full system access |
| 🧑‍🤝‍🧑 Patient | patient@example.com | patient123 | Patient dashboard |
| 👨‍⚕️ Doctor | sharma@panchakarma.com | doctor123 | Doctor dashboard |
| 👨‍⚕️ Doctor | patel@panchakarma.com | doctor123 | Doctor dashboard |
| 👨‍⚕️ Doctor | kumar@panchakarma.com | doctor123 | Doctor dashboard |

---

## 🛠️ Tech Stack

### Frontend
- **React** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Styling
- **shadcn/ui** - Component library
- **Recharts** - Data visualization
- **Lucide React** - Icons
- **Sonner** - Toast notifications

### Backend
- **Supabase** - Cloud database & authentication
- **Edge Functions** - Serverless API (Deno runtime)
- **PostgreSQL** - Database
- **Hono** - Edge Function routing

### Development
- **Vite** - Build tool
- **ESLint** - Code linting
- **Figma Make** - Design to code

---

## 📁 Project Structure

```
├── App.tsx                    # Main application entry
├── components/                # React components
│   ├── AdminDashboard.tsx    # Admin interface
│   ├── PatientDashboard.tsx  # Patient interface
│   ├── DoctorDashboard.tsx   # Doctor interface
│   ├── AuthPage.tsx          # Login page
│   └── ui/                   # shadcn components
├── utils/
│   ├── database.tsx          # Database service layer
│   └── supabase/
│       └── info.tsx          # Supabase configuration
├── supabase/functions/
│   └── server/
│       ├── index.tsx         # Edge Function API
│       └── kv_store.tsx      # Database utilities
├── styles/
│   └── globals.css           # Global styles
└── [Documentation files]     # Setup guides
```

---

## 🔐 Security

### Current Setup (Development)
- ✅ Basic authentication
- ✅ Role-based access
- ✅ CORS enabled for all origins
- ✅ Secure API keys

### Production Recommendations
- 🔒 Enable Row Level Security (RLS)
- 🔒 Restrict CORS to specific domains
- 🔒 Implement JWT authentication
- 🔒 Add rate limiting
- 🔒 Regular security audits

---

## 📊 Features in Detail

### Patient Management
- Add new patients with complete profiles
- Track medical history
- View appointment history
- Monitor treatment progress
- Send notifications

### Therapy Scheduling
- Book Panchakarma treatments
- Assign practitioners
- Set pre/post-procedure instructions
- Track session status
- View calendar

### Progress Tracking
- Visual charts showing improvement
- Symptom scores
- Energy levels
- Sleep quality
- Patient feedback

### Analytics
- Total patients count
- Therapy sessions statistics
- Completion rates
- Average health scores
- System-wide metrics

---

## 🧪 Testing

### Automated Tests

```bash
# Run database connection tests
open test-database-connection.html

# Run CORS tests
open test-cors.html
```

### Manual Testing

1. **Login Test:**
   - Try all user roles
   - Verify correct dashboard loads

2. **Data Persistence:**
   - Create a patient
   - Refresh browser
   - Verify patient still exists

3. **CRUD Operations:**
   - Create, Read, Update, Delete patients
   - Create, Read, Update therapy sessions
   - Add progress entries

---

## 🚀 Deployment

### Frontend Deployment

Deploy to any static hosting:

**Vercel:**
```bash
npm install -g vercel
vercel
```

**Netlify:**
```bash
npm install -g netlify-cli
netlify deploy
```

**GitHub Pages, Cloudflare Pages, etc.** also supported.

### Backend Deployment

Backend is automatically deployed via Supabase Edge Functions:

```bash
npx supabase functions deploy server --project-ref YOUR_PROJECT_REF
```

---

## 📈 Scaling

The system is designed to scale:

- **Database:** PostgreSQL with automatic backups
- **API:** Serverless Edge Functions (auto-scaling)
- **Frontend:** Static files (CDN-ready)
- **Storage:** Supabase cloud storage

---

## 🔄 Updates

### Current Version: 1.0.0

**Latest Updates:**
- ✅ Fixed CORS configuration
- ✅ Enhanced database connection
- ✅ Improved error handling
- ✅ Added comprehensive documentation
- ✅ Created testing tools

---

## 🤝 Contributing

### Development Setup

```bash
# 1. Clone repository
git clone <repository-url>

# 2. Install dependencies
npm install

# 3. Set up Supabase
# Follow COMPLETE_SETUP_GUIDE.md

# 4. Run development server
npm run dev
```

### Code Style

- Use TypeScript for type safety
- Follow existing component patterns
- Use shadcn/ui components
- Write clean, documented code

---

## 📄 License

This project is for the USD 16 billion Ayurveda market, featuring automated therapy scheduling, pre- and post-procedure notifications, real-time therapy tracking with visualization tools, and role-based authentication.

---

## 🆘 Support

### Self-Help Resources

1. **Setup Issues:** See [`COMPLETE_SETUP_GUIDE.md`](COMPLETE_SETUP_GUIDE.md)
2. **CORS Errors:** See [`FIX_CORS_NOW.md`](FIX_CORS_NOW.md)
3. **Database Issues:** See [`DATABASE_CONNECTION_GUIDE.md`](DATABASE_CONNECTION_GUIDE.md)
4. **General Problems:** See [`TROUBLESHOOTING.md`](TROUBLESHOOTING.md)

### Test Tools

- **Database Test:** Open `test-database-connection.html`
- **CORS Test:** Open `test-cors.html`

### Debug Commands

```bash
# Check deployment
npx supabase functions list

# Check secrets
npx supabase secrets list

# View logs
npx supabase functions logs server --tail

# Test API
curl https://YOUR_PROJECT_REF.supabase.co/functions/v1/make-server-a3cc576e/users \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

---

## 🎯 Roadmap

### Planned Features
- [ ] Email notifications
- [ ] SMS reminders
- [ ] Payment integration
- [ ] Inventory management
- [ ] Reporting system
- [ ] Mobile app
- [ ] Multi-language support

---

## 🙏 Acknowledgments

Built with:
- [Supabase](https://supabase.com) - Backend infrastructure
- [shadcn/ui](https://ui.shadcn.com) - UI components
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [Recharts](https://recharts.org) - Charts
- [Lucide](https://lucide.dev) - Icons

---

## 📞 Quick Links

- **Supabase Dashboard:** https://supabase.com/dashboard
- **Database Editor:** https://supabase.com/dashboard/project/YOUR_PROJECT_REF/editor
- **Edge Functions:** https://supabase.com/dashboard/project/YOUR_PROJECT_REF/functions
- **API Settings:** https://supabase.com/dashboard/project/YOUR_PROJECT_REF/settings/api

---

<div align="center">

**Made with ❤️ for the Ayurveda community**

[Setup Guide](COMPLETE_SETUP_GUIDE.md) • [Quick Start](FIX_CORS_NOW.md) • [Database Guide](DATABASE_CONNECTION_GUIDE.md) • [Troubleshooting](TROUBLESHOOTING.md)

</div>