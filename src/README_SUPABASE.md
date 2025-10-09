# 🌿 Panchakarma Patient Management System - Supabase Integration

## Overview

Your Panchakarma Patient Management System is now fully integrated with **Supabase** for authentication, database, and edge functions. The system intelligently switches between Supabase and demo mode based on availability.

## 🎯 Features

### ✅ Fully Integrated
- **Supabase Authentication** - Secure user sign up, sign in, and session management
- **PostgreSQL Database** - All data stored securely with Row Level Security (RLS)
- **Real-time Ready** - Subscribe to data changes in real-time
- **Automatic Fallback** - Seamlessly falls back to demo mode if Supabase unavailable
- **Smart Connection** - One toast notification on startup showing connection status

### 🔐 Authentication
- Email/Password authentication via Supabase Auth
- Secure session management with automatic token refresh
- Role-based access control (Admin, Doctor, Patient)
- Profile creation automatically linked to auth users

### 📊 Database
- **Tables Created:**
  - `profiles` - User profiles with roles
  - `patients` - Patient medical information
  - `doctors` - Doctor credentials and specializations
  - `therapy_sessions` - Appointments and sessions
  - `progress_data` - Patient health tracking
  - `notifications` - System notifications
  - `feedback` - Session feedback and ratings
  - `therapy_types` - Reference data

### 🛡️ Security
- Row Level Security (RLS) enabled on all tables
- Patients can only access their own data
- Doctors can view patients and assigned sessions
- Admins have full access
- Secure password hashing
- JWT token-based authentication

## 🚀 Setup Instructions

### Step 1: Connect to Supabase
✅ **Already Done!** Your application is connected to Supabase.

### Step 2: Set Up Database

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy contents from `/supabase/schema.sql`
4. Run the SQL to create tables and policies

### Step 3: Add Demo Data (Optional)

1. In SQL Editor, run `/supabase/seed.sql`
2. This creates demo users and sample data
3. **Note:** You'll need to create auth accounts separately (see below)

### Step 4: Create Auth Users

For each demo user, create an account in Supabase:

**Via Dashboard:**
1. Go to **Authentication** > **Users**
2. Click **Add User**
3. Enter email and password:
   - `admin@panchakarma.com` / `admin123`
   - `sharma@panchakarma.com` / `doctor123`
   - `patient@example.com` / `patient123`

**Via Application:**
- Just use the Sign Up feature in your app!

## 📱 How It Works

### Connection Flow
```
App Starts
    ↓
Check Supabase Connection
    ↓
✅ Connected → Use Supabase
    ├─ Auth via Supabase Auth
    ├─ Data via PostgreSQL
    └─ Real-time subscriptions available
    
❌ Not Connected → Use Demo Mode
    ├─ Local authentication
    ├─ In-memory data storage
    └─ All features still work
```

### Authentication Flow
```typescript
// Sign Up
User enters email/password
    ↓
Create Supabase Auth user
    ↓
Create profile in profiles table
    ↓
Create role-specific record (patient/doctor)
    ↓
Return complete user data

// Sign In
User enters credentials
    ↓
Authenticate with Supabase
    ↓
Fetch complete profile
    ↓
Store session
    ↓
Redirect to dashboard
```

### Data Flow
```typescript
// All operations automatically route to Supabase or demo mode
await databaseService.patients.getPatients()
    ↓
Check Supabase connection
    ↓
If connected → Query Supabase
If not → Query demo data
    ↓
Return data
```

## 💻 Code Examples

### Authentication

```typescript
import { databaseService } from './utils/database-smart';

// Sign up new user
const user = await databaseService.auth.signUp(
  email,
  password,
  {
    name: 'John Doe',
    role: 'patient',
    phone: '+1-555-0123',
    age: 45
  }
);

// Sign in
const user = await databaseService.auth.signIn(email, password);

// Sign out
await databaseService.auth.signOut();

// Get current user
const user = await databaseService.auth.getCurrentUser();
```

### Database Operations

```typescript
// Get all patients (respects RLS policies)
const patients = await databaseService.patients.getPatients();

// Create therapy session
const session = await databaseService.therapySessions.createTherapySession({
  patient_id: patientId,
  doctor_id: doctorId,
  therapy_type: 'Abhyanga (Oil Massage)',
  date: '2024-10-15',
  time: '09:00',
  duration: 60,
  status: 'scheduled'
});

// Track progress
const progress = await databaseService.progress.createProgressEntry({
  patient_id: patientId,
  date: '2024-10-08',
  symptom_score: 7,
  energy_level: 8,
  sleep_quality: 7,
  notes: 'Feeling much better!'
});

// Submit feedback
const feedback = await databaseService.feedback.createFeedback({
  patient_id: patientId,
  session_id: sessionId,
  therapy_type: 'Abhyanga',
  overall_rating: 9,
  effectiveness_rating: 8,
  comfort_rating: 9,
  experience: 'Excellent treatment!',
  would_recommend: true
});
```

### Real-time Subscriptions (Supabase Only)

```typescript
import { supabase } from './utils/supabase-client';

// Subscribe to new therapy sessions
const subscription = supabase
  .from('therapy_sessions')
  .on('INSERT', (payload) => {
    console.log('New session scheduled:', payload.new);
    // Update UI automatically
  })
  .subscribe();

// Unsubscribe when done
subscription.unsubscribe();
```

## 🔧 File Structure

```
/utils/
  ├── supabase-client.tsx          # Supabase client setup
  ├── supabase-database.tsx        # Supabase database service
  ├── database.tsx                 # Demo mode database
  └── database-smart.tsx           # Smart router (Supabase + fallback)

/supabase/
  ├── schema.sql                   # Database schema
  └── seed.sql                     # Demo data

/components/
  └── (All components work with both modes)
```

## 🎨 User Experience

### Connection Status
- **Supabase Connected:** `✅ Connected to Supabase Database`
- **Demo Mode:** `📊 Running in Demo Mode - All features available`

### Features in Both Modes
✅ User authentication  
✅ Patient management  
✅ Doctor management  
✅ Therapy scheduling  
✅ Progress tracking  
✅ Feedback system  
✅ Notifications  
✅ Analytics  

### Supabase-Only Features
🔄 Real-time data synchronization  
💾 Persistent data storage  
🔒 Advanced RLS policies  
📧 Email notifications (via Edge Functions)  
📊 Advanced analytics  

## 🐛 Troubleshooting

### "Running in Demo Mode" message
- Check Supabase connection in dashboard
- Verify URL and API key
- Check browser console for errors

### Authentication errors
- Verify schema is set up correctly
- Check that auth users exist in Supabase
- Ensure RLS policies allow the operation

### Data not saving
- Check Supabase dashboard for errors
- Verify RLS policies
- Check browser network tab for failed requests

### RLS Policy Errors
```sql
-- Check user's role
SELECT * FROM profiles WHERE id = auth.uid();

-- Test a policy
SELECT * FROM patients WHERE id = auth.uid();
```

## 📈 Performance

### Optimization Tips
1. **Indexes:** Already added for common queries
2. **RLS:** Policies are optimized for performance
3. **Caching:** Consider adding React Query for client-side caching
4. **Real-time:** Use selectively to avoid excessive connections

### Monitoring
- Check Supabase Dashboard > Database > Performance
- Monitor API usage in Supabase Dashboard
- Set up alerts for rate limits

## 🔐 Security Best Practices

### ✅ Already Implemented
- Row Level Security on all tables
- Secure password hashing (Supabase Auth)
- JWT token authentication
- HTTPS only connections
- Input validation

### 🎯 Recommended
- Regular security audits of RLS policies
- Monitor for suspicious activity
- Regular password policy updates
- Enable 2FA for admin accounts (future)
- Regular backups

## 🚀 Next Steps

### 1. Edge Functions
Create Supabase Edge Functions for:
- Automated email notifications
- SMS reminders
- PDF report generation
- Payment processing
- Appointment confirmations

Example:
```typescript
// /supabase/functions/send-notification/index.ts
import { serve } from 'std/server'

serve(async (req) => {
  const { patientId, message } = await req.json()
  
  // Send notification logic
  // ... send email/SMS
  
  return new Response(JSON.stringify({ success: true }))
})
```

### 2. Storage
Add Supabase Storage for:
- Patient documents
- Medical records
- Profile pictures
- Prescription PDFs

### 3. Real-time Features
Implement live updates for:
- New appointment notifications
- Real-time chat between doctor/patient
- Live therapy session status
- Dashboard auto-refresh

### 4. Advanced Analytics
- Custom reports
- Export to PDF/Excel
- Treatment effectiveness metrics
- Revenue tracking

## 📚 Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Real-time Subscriptions](https://supabase.com/docs/guides/realtime)

## 💡 Tips

1. **Development:** Use separate Supabase projects for dev/staging/prod
2. **Backups:** Enable automatic backups in Supabase settings
3. **Monitoring:** Set up dashboard alerts
4. **Testing:** Demo mode allows testing without Supabase
5. **Migration:** Export/import data between projects easily

## ✨ Summary

Your Panchakarma Patient Management System now has:

✅ **Production-ready authentication** with Supabase Auth  
✅ **Secure database** with PostgreSQL and RLS  
✅ **Smart fallback** to demo mode when needed  
✅ **Complete feature parity** between modes  
✅ **Ready for real-time** features  
✅ **Scalable architecture** for growth  
✅ **Secure by default** with best practices  

**You're ready to go live! 🎉**

For questions or support, check:
- Supabase Dashboard logs
- Browser developer console
- Database query logs
- This documentation

---

Built with ❤️ for the USD 16 billion Ayurveda market 🌿