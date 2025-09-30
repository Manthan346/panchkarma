# Troubleshooting Guide

## Common Issues

### Demo Mode (Expected Behavior)
If you see "Using demo mode with sample data" message, this is normal when:
- The Edge Function is not deployed to Supabase
- Supabase connection is not configured
- You're testing the application locally

**Demo credentials:**
- Admin: `admin@panchakarma.com` / `admin123`
- Doctor: `sharma@panchakarma.com` / `doctor123`  
- Patient: `patient@example.com` / `patient123`

### Edge Function Deployment Errors

#### Error 403: Forbidden
This error occurs when trying to deploy the Edge Function. To fix:

1. **Connect to Supabase** (if not already done):
   - Click the Supabase button in your project
   - Follow the connection wizard
   - This will set up your project credentials

2. **Manual Deployment** (if needed):
   - Go to your Supabase Dashboard
   - Navigate to Edge Functions
   - Deploy the function from `/supabase/functions/server`
   - Use function name: `make-server-a3cc576e`

#### Error 404: API Not Found
The Edge Function is not deployed. The app will run in demo mode automatically.

To enable persistent storage:
1. Connect to Supabase project
2. Deploy the Edge Function
3. Refresh the application

### API Timeout Errors
These are expected when:
- Edge Function is not deployed
- Supabase project is paused (free tier)
- Network connectivity issues

The application automatically falls back to demo mode.

## Features in Demo Mode

All features work in demo mode with local storage:
- ✅ User authentication (admin/doctor/patient)
- ✅ Therapy scheduling and management
- ✅ Patient progress tracking
- ✅ Notifications system
- ✅ Analytics dashboard
- ✅ Doctor-patient relationships

**Limitation:** Data is stored in browser memory and will reset on page refresh.

## Switching to Production Mode

1. **Connect Supabase:**
   - Use the Supabase connection tool
   - Or manually update `/utils/supabase/info.tsx`

2. **Deploy Edge Function:**
   ```bash
   supabase functions deploy make-server-a3cc576e
   ```

3. **Verify Connection:**
   - Login to the application
   - Check for "Connected to API" message (instead of "Demo mode")

## Need Help?

- Check `/DEPLOYMENT.md` for detailed deployment instructions
- Review `/QUICK_START.md` for getting started guide
- Ensure Supabase project is active (not paused)