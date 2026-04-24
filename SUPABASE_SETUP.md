# Supabase Integration Guide

## Setup Steps

### 1. Create a Supabase Account
- Go to https://supabase.com
- Sign up for a free account
- Create a new project (choose PostgreSQL, your region, and a strong password)
- Wait for the project to be ready (usually 2-3 minutes)

### 2. Get Your Credentials
- Open your Supabase project dashboard
- Go to **Settings > API** in the left sidebar
- Copy the following values:
  - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
  - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Update Environment Variables
Edit `.env.local` in your project root:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Important:
- Use the project base URL like `https://your-project.supabase.co`
- Do not use the REST endpoint like `https://your-project.supabase.co/rest/v1/`
- Add the same variables to your Vercel project environment settings before deploying

### 4. Create Database Tables
- In your Supabase dashboard, go to **SQL Editor**
- Click **New Query**
- Open the file: `database/schema.sql`
- Copy all the SQL code and paste it into Supabase SQL Editor
- Click **Run** to execute the schema

### 5. Seed Initial Data (Optional)
Go to **Table Editor** and add your teachers manually, or run this SQL:
```sql
INSERT INTO teachers (id, name, staff_id, subject, email, phone, credential_id, public_key, enrolled_at) VALUES
('T001', 'Mrs. Adaeze Okonkwo', 'STF-001', 'Mathematics', 'a.okonkwo@school.edu', '08012345678', NULL, NULL, NULL),
('T002', 'Mr. Emeka Nwosu', 'STF-002', 'English Language', 'e.nwosu@school.edu', '08023456789', NULL, NULL, NULL),
('T003', 'Miss Chioma Eze', 'STF-003', 'Biology', 'c.eze@school.edu', '08034567890', NULL, NULL, NULL),
('T004', 'Mr. Bello Abdullahi', 'STF-004', 'Physics', 'b.abdullahi@school.edu', '08045678901', NULL, NULL, NULL),
('T005', 'Mrs. Funke Adeyemi', 'STF-005', 'Chemistry', 'f.adeyemi@school.edu', '08056789012', NULL, NULL, NULL);
```

### 6. Restart Your Dev Server
```bash
npm run dev
```

## File Structure
```
lib/
  ├── supabase.ts          # Supabase client instance
  ├── store.ts             # Updated to use Supabase
  ├── types.ts             # Unchanged - TypeScript interfaces
database/
  ├── schema.sql           # Database schema
```

## Important Notes
- **Development**: The schema allows all operations without authentication
- **Production**: Update RLS (Row Level Security) policies in Supabase to restrict access
- **API Routes**: No changes needed - they continue to work the same way
- **Real-time**: Supabase supports real-time subscriptions if you want live updates

## Next Steps
1. Restart your dev server: `npm run dev`
2. The app will now persist data to Supabase instead of in-memory storage
3. Test by adding teachers and clocking in - data will survive app restarts!

## Troubleshooting
- **Blank page or errors**: Check that `.env.local` has correct credentials
- **Connection refused**: Ensure your Supabase project is running
- **Auth errors**: Check that RLS policies are set to allow all operations (for dev)
- **Missing tables**: Verify schema.sql was executed successfully in Supabase
