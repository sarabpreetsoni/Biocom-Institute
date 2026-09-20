-- ==============================================================================
-- BIOCOM INSTITUTE - SUPABASE DATABASE & STORAGE SCHEMA
-- Run this script in your Supabase Project's SQL Editor (https://supabase.com/dashboard)
-- ==============================================================================

-- 1. Create the Students Table
--    id is the Supabase Auth UUID — links directly to auth.users
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Students can read own profile"
    ON public.students FOR SELECT
    USING (auth.uid() = id);

-- Admin can read all student profiles (used in AdminPortal)
CREATE POLICY "Allow anon read all students"
    ON public.students FOR SELECT
    USING (true);

-- Only the authenticated user can insert their own profile (during sign-up)
CREATE POLICY "Students can insert own profile"
    ON public.students FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Only the authenticated user can update their own profile
CREATE POLICY "Students can update own profile"
    ON public.students FOR UPDATE
    USING (auth.uid() = id);


-- 2. Create the Assignments Table
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    subject_id TEXT NOT NULL,
    file_url TEXT,
    file_name TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- All authenticated students can read assignments
CREATE POLICY "Authenticated users can read assignments"
    ON public.assignments FOR SELECT
    USING (true);

-- Only admins should insert/delete (done via service role / admin dashboard)
-- For simplicity, allow insert/delete from any authenticated context:
CREATE POLICY "Allow insert assignments"
    ON public.assignments FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow delete assignments"
    ON public.assignments FOR DELETE
    USING (true);


-- 3. Create the Storage Bucket for Coursework Documents (PDF, DOCX, Images)
INSERT INTO storage.buckets (id, name, public)
VALUES ('assignments', 'assignments', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read of uploaded files
CREATE POLICY "Allow public read assignment files"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'assignments');

-- Allow authenticated users to upload
CREATE POLICY "Allow upload assignment files"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'assignments');

-- Allow delete of uploaded files
CREATE POLICY "Allow delete assignment files"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'assignments');
