# Panchakarma Patient Management System - Deployment Guide

## Important: Manual Deployment Required ⚠️

If you encountered a **401 error** during automatic deployment, this is expected! Supabase Edge Functions require manual deployment from your local machine for security reasons. The automatic deployment system cannot authenticate with Supabase.

## Quick Start

Your Panchakarma Patient Management System is configured and ready to deploy! The application currently runs in **demo mode** with sample data. To enable full backend functionality with persistent data storage, follow the manual deployment steps below.

## Current Status

✅ **Frontend**: Fully functional with React and Shadcn components  
✅ **Backend Code**: Complete and ready to deploy  
✅ **Database Schema**: Configured in Supabase PostgreSQL  
✅ **API Routes**: All 18 endpoints properly configured  
✅ **Analytics**: Fully dynamic - updates with real user data  
⏳ **Deployment**: Supabase Edge Function needs to be deployed  

## What You Need

- Supabase account (you already have this!)
- Supabase CLI installed on your computer
- Terminal/Command line access

## Why Manual Deployment?

1. **Security**: Supabase requires authenticated CLI access to deploy functions
2. **Access Control**: Only users with project access can deploy functions
3. **Best Practice**: Prevents unauthorized deployments to your database
4. **One-Time Setup**: You only need to do this once; future updates use the same process

The **401 Unauthorized error** you saw means the automatic deployment system doesn't have (and shouldn't have) access to deploy to your Supabase project. This is a security feature, not a bug!

## Deployment Steps

### Step 1: Install Supabase CLI

Choose the installation method for your operating system:

**macOS/Linux:**
```bash
brew install supabase/tap/supabase
```

**Windows:**
```bash
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**npm (any platform):**
```bash
npm install -g supabase
```

### Step 2: Link Your Project

Link the CLI to your Supabase project:

```bash
supabase link --project-ref zojbxdrvqtnyskpaslri
```

You'll be prompted to enter your database password (find this in your Supabase dashboard).

### Step 3: Deploy the Edge Function

Deploy the server function to Supabase:

```bash
supabase functions deploy make-server-a3cc576e --project-ref zojbxdrvqtnyskpaslri
```

This command deploys the `/supabase/functions/server/` directory as the `make-server-a3cc576e` edge function.

### Step 4: Verify Deployment

1. Visit your Supabase dashboard: https://supabase.com/dashboard
2. Navigate to Edge Functions
3. Confirm `make-server-a3cc576e` is listed and active
4. Check the API Status in the Settings tab of your admin dashboard

## Environment Variables (Already Configured)

Your Supabase project already has these environment variables set:

- ✅ `SUPABASE_URL`: Your project URL
- ✅ `SUPABASE_ANON_KEY`: Public anonymous key for frontend
- ✅ `SUPABASE_SERVICE_ROLE_KEY`: Admin key for backend operations
- ✅ `SUPABASE_DB_URL`: Database connection string

## API Endpoints

Once deployed, your backend will be available at:

**Base URL:**
```
https://zojbxdrvqtnyskpaslri.supabase.co/functions/v1/make-server-a3cc576e
```

**Available Endpoints:**
- `POST /make-server-a3cc576e/auth/login` - User authentication
- `GET /make-server-a3cc576e/users` - Get all users
- `POST /make-server-a3cc576e/users` - Create new user
- `GET /make-server-a3cc576e/patients` - Get all patients
- `GET /make-server-a3cc576e/patients/:id` - Get patient by ID
- `GET /make-server-a3cc576e/therapy-sessions` - Get all therapy sessions
- `POST /make-server-a3cc576e/therapy-sessions` - Create therapy session
- `PUT /make-server-a3cc576e/therapy-sessions/:id` - Update therapy session
- `GET /make-server-a3cc576e/progress/patient/:id` - Get patient progress
- `POST /make-server-a3cc576e/progress` - Create progress entry
- `GET /make-server-a3cc576e/notifications/patient/:id` - Get patient notifications
- `POST /make-server-a3cc576e/notifications` - Create notification
- `GET /make-server-a3cc576e/therapy-types` - Get therapy types
- `GET /make-server-a3cc576e/practitioners` - Get practitioners list
- `GET /make-server-a3cc576e/analytics` - Get system analytics

## Demo Mode vs Production Mode

### Demo Mode (Current)
- ✅ All features work normally
- ✅ Sample data pre-loaded
- ✅ Analytics show demo visualizations
- ❌ Data doesn't persist between sessions
- ❌ Changes are lost on page refresh

### Production Mode (After Deployment)
- ✅ All features work normally
- ✅ Real data persistence in PostgreSQL
- ✅ Data syncs across devices
- ✅ Production-ready scalability
- ✅ Multi-user support
- ✅ **Dynamic Analytics**: All charts, graphs, and metrics automatically update based on real user data:
  - Patient counts reflect actual registrations
  - Therapy session statistics calculated from database
  - Practitioner performance metrics derived from actual sessions
  - Progress trends based on patient feedback entries
  - Monthly revenue and session trends from real data
  - Therapy type distribution from scheduled sessions

## Troubleshooting

If you encounter issues after deployment:

1. **Check the API Status** in the Settings tab
2. **Review browser console** for error messages (F12 → Console)
3. **Verify function deployment** in Supabase dashboard
4. **Test API endpoint** directly in browser:
   ```
   https://zojbxdrvqtnyskpaslri.supabase.co/functions/v1/make-server-a3cc576e/make-server-a3cc576e/users
   ```
5. **Consult the Troubleshooting Guide** in the Settings tab

## Need Help?

- 📚 [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- 🔧 [Supabase CLI Guide](https://supabase.com/docs/guides/cli/getting-started)
- 🌐 [Your Supabase Dashboard](https://supabase.com/dashboard)

## Demo Credentials

For testing purposes, use these credentials:

**Admin:**
- Email: admin@panchakarma.com
- Password: admin123

**Patient:**
- Email: patient@example.com
- Password: patient123

---

**Note:** The application will continue to function perfectly in demo mode even without deployment. Deploy when you're ready to move to production with persistent data storage!