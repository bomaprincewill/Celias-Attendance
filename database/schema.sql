-- Supabase SQL Schema for Biometric Attendance System
-- Copy and paste this into the SQL Editor in your Supabase dashboard

-- Create teachers table
CREATE TABLE teachers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  staff_id TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  credential_id TEXT,
  public_key TEXT,
  enrolled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create attendance_records table
CREATE TABLE attendance_records (
  id TEXT PRIMARY KEY,
  teacher_id TEXT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  teacher_name TEXT NOT NULL,
  staff_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  clock_in_time TIMESTAMP WITH TIME ZONE NOT NULL,
  date DATE NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('fingerprint', 'pin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_attendance_teacher_id ON attendance_records(teacher_id);
CREATE INDEX idx_attendance_date ON attendance_records(date);
CREATE INDEX idx_attendance_staff_id ON attendance_records(staff_id);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (for development - restrict in production)
CREATE POLICY "Allow all operations on teachers" ON teachers
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on attendance" ON attendance_records
  FOR ALL USING (true) WITH CHECK (true);
