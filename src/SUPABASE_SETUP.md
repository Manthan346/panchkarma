# Supabase Setup Guide for Panchakarma Patient Management System

This guide will help you set up Supabase for your Panchakarma Patient Management System with full authentication, database, and edge functions support.

## 📋 Prerequisites

1. A Supabase account (sign up at [supabase.com](https://supabase.com))
2. Your project is already connected via the Figma Make Supabase connection

## 🚀 Quick Setup Steps

### Step 1: Run the Database Schema

1. Go to your Supabase Dashboard
2. Navigate to the **SQL Editor**
3. Copy the contents of `/supabase/schema.sql` file
4. Paste it into the SQL Editor
5. Click **Run** to execute the schema

This will create all necessary tables:
- `profiles` - User profiles
- `patients` - Patient-specific data
- `doctors` - Doctor-specific data  
- `therapy_sessions` - Therapy appointments
- `progress_data` - Patient progress tracking
- `notifications` - System notifications
- `feedback` - Patient feedback
- `therapy_types` - Reference data

### Step 2: Configure Authentication

1. Go to **Authentication** → **Settings**
2. Enable **Email Auth**
3. Optionally configure:
   - Email templates (Welcome, Password Reset, etc.)
   - Email rate limiting
   - Password requirements

### Step 3: Verify Row Level Security (RLS)

The schema automatically enables RLS with these policies:

**Patients:**
- Can view and update their own data
- Doctors and admins can view all patients

**Doctors:**
- Can view and update their own data
- Everyone can view doctors list
- Admins can manage doctors

**Therapy Sessions:**
- Patients can view their own sessions
- Doctors can view assigned sessions
- Admins can manage all sessions

**Progress Data:**
- Patients can manage their own progress
- Doctors can view all progress

**Feedback:**
- Patients can create and view their own feedback
- Doctors can view all feedback and respond

### Step 4: Seed Demo Data (Optional)

To add demo users and data for testing:

1. Go to SQL Editor
2. Run the following SQL:

```sql
-- Create demo admin
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'admin@panchakarma.com',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW()
);

-- Get the admin user ID
WITH admin AS (
  SELECT id FROM auth.users WHERE email = 'admin@panchakarma.com'
)
INSERT INTO profiles (id, email, full_name, role)
SELECT id, 'admin@panchakarma.com', 'Dr. Ayurveda Admin', 'admin'
FROM admin;

-- Create demo doctor
-- (Repeat similar pattern for doctors and patients)
```

### Step 5: Update Application

Your application is already configured to use Supabase! The system automatically:

✅ Connects to Supabase when available  
✅ Falls back to demo mode if Supabase is unavailable  
✅ Shows connection status on startup  
✅ Uses Supabase Auth for user authentication  
✅ Stores all data in Supabase database  

### Step 6: Test the Connection

1. Open your application
2. You should see: **"✅ Connected to Supabase Database"**
3. Try signing up a new user
4. Check your Supabase Dashboard to see the data

## 🔐 Authentication Flow

### Sign Up
```javascript
// Users sign up with email/password
// System automatically creates:
// 1. Auth user in auth.users
// 2. Profile in profiles table
// 3. Role-specific record (patients/doctors table)
```

### Sign In
```javascript
// Uses Supabase Auth
// Returns complete user data with role-specific info
```

### Session Management
```javascript
// Sessions managed by Supabase
// Auto-refresh tokens
// Persistent across page reloads
```

## 📊 Database Structure

### Users & Authentication
- `auth.users` - Supabase managed auth
- `profiles` - User profiles (admin, doctor, patient)
- `patients` - Patient-specific data
- `doctors` - Doctor-specific data

### Clinical Data
- `therapy_sessions` - Appointments and sessions
- `progress_data` - Patient health tracking
- `feedback` - Session feedback and ratings

### System
- `notifications` - User notifications
- `therapy_types` - Reference data for therapies

## 🛠️ Features Enabled

### Authentication ✅
- Email/Password authentication
- Secure password hashing
- Session management
- Role-based access control

### Database ✅
- PostgreSQL with RLS
- Real-time subscriptions (ready to use)
- Automatic timestamps
- Data validation

### Security ✅
- Row Level Security policies
- Role-based permissions
- Secure API access
- Password encryption

### Edge Functions 🚧
Ready to add custom edge functions:
```bash
# Example edge function
supabase functions new send-notification
```

## 📱 API Usage

### From Your App
```typescript
import { databaseService } from './utils/database-smart';

// Authentication
await databaseService.auth.signIn(email, password);
await databaseService.auth.signUp(email, password, userData);
await databaseService.auth.signOut();

// Data operations
const patients = await databaseService.patients.getPatients();
const sessions = await databaseService.therapySessions.getTherapySessions();
const progress = await databaseService.progress.getPatientProgress(patientId);
```

### Direct Supabase Access
```typescript
import { supabase } from './utils/supabase-client';

// Direct queries
const { data, error } = await supabase
  .from('patients')
  .select('*')
  .eq('id', patientId);
```

## 🐛 Troubleshooting

### Connection Issues
- Check your Supabase URL and Anon Key in connection settings
- Verify network connectivity
- Check browser console for errors

### RLS Policy Errors
- Verify user is authenticated
- Check user role in profiles table
- Review policy conditions in SQL Editor

### Data Not Showing
- Verify RLS policies allow access
- Check user permissions
- Look for errors in browser console

## 🎯 Next Steps

1. **Add Real-time Features**
   ```typescript
   // Subscribe to changes
   supabase
     .from('therapy_sessions')
     .on('*', (payload) => {
       console.log('Change received!', payload);
     })
     .subscribe();
   ```

2. **Add Edge Functions**
   - Automated notifications
   - Email sending
   - PDF report generation
   - Payment processing

3. **Add Storage**
   - Patient documents
   - Medical records
   - Profile pictures

4. **Add Analytics**
   - Track usage
   - Monitor performance
   - Generate reports

## 📚 Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Edge Functions](https://supabase.com/docs/guides/functions)

## 💡 Tips

1. **Development**: Use separate Supabase projects for dev/staging/production
2. **Backups**: Enable automatic database backups in Supabase dashboard
3. **Monitoring**: Set up alerts for database usage and errors
4. **Security**: Regularly review and update RLS policies
5. **Performance**: Add indexes for frequently queried columns

---

🌿 **Your Panchakarma Management System is now powered by Supabase!**

For questions or issues, check the Supabase dashboard logs and the browser console.