-- ==============================================================================
-- BIOCOM INSTITUTE - SUPABASE DATABASE & STORAGE SCHEMA
-- Run this script in your Supabase Project's SQL Editor (https://supabase.com/dashboard)
-- ==============================================================================

-- 1. Create the Students Table
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) for students
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Allow public read and insert access to students roster
CREATE POLICY "Allow public read students" 
    ON public.students FOR SELECT 
    USING (true);

CREATE POLICY "Allow public insert students" 
    ON public.students FOR INSERT 
    WITH CHECK (true);


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

-- Enable Row Level Security (RLS) for assignments
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- Allow public read, insert, and delete on assignments
CREATE POLICY "Allow public read assignments" 
    ON public.assignments FOR SELECT 
    USING (true);

CREATE POLICY "Allow public insert assignments" 
    ON public.assignments FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Allow public delete assignments" 
    ON public.assignments FOR DELETE 
    USING (true);


-- 3. Create the Storage Bucket for Coursework Documents (PDF, DOCX, Images)
INSERT INTO storage.buckets (id, name, public)
VALUES ('assignments', 'assignments', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies to allow public read and uploads
CREATE POLICY "Allow public read assignment files"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'assignments');

CREATE POLICY "Allow public upload assignment files"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'assignments');

CREATE POLICY "Allow public delete assignment files"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'assignments');
