-- ==============================================================================
-- BIOCOM INSTITUTE - SUPABASE DATABASE & STORAGE SCHEMA
-- Run this script in your Supabase Project's SQL Editor (https://supabase.com/dashboard)
-- Safe to re-run — drops existing policies before recreating them.
-- ==============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. STUDENTS TABLE
-- ─────────────────────────────────────────────────────────────────────────────

-- Drop old table if schema changed (only needed once when migrating)
-- Uncomment the line below ONLY if you had the old students table without auth link:
-- DROP TABLE IF EXISTS public.students CASCADE;

CREATE TABLE IF NOT EXISTS public.students (
    id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name       TEXT NOT NULL,
    email      TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Drop existing policies before recreating
DROP POLICY IF EXISTS "Students can read own profile"    ON public.students;
DROP POLICY IF EXISTS "Allow anon read all students"     ON public.students;
DROP POLICY IF EXISTS "Allow public read students"       ON public.students;
DROP POLICY IF EXISTS "Students can insert own profile"  ON public.students;
DROP POLICY IF EXISTS "Allow public insert students"     ON public.students;
DROP POLICY IF EXISTS "Students can update own profile"  ON public.students;

-- Re-create policies
CREATE POLICY "Allow anon read all students"
    ON public.students FOR SELECT USING (true);

CREATE POLICY "Students can insert own profile"
    ON public.students FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Students can update own profile"
    ON public.students FOR UPDATE USING (auth.uid() = id);


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. ASSIGNMENTS TABLE
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.assignments (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title       TEXT NOT NULL,
    description TEXT NOT NULL,
    subject_id  TEXT NOT NULL,
    file_url    TEXT,
    file_name   TEXT,
    created_at  TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read assignments"           ON public.assignments;
DROP POLICY IF EXISTS "Allow read assignments"                   ON public.assignments;
DROP POLICY IF EXISTS "Authenticated users can read assignments" ON public.assignments;
DROP POLICY IF EXISTS "Allow public insert assignments"          ON public.assignments;
DROP POLICY IF EXISTS "Allow insert assignments"                 ON public.assignments;
DROP POLICY IF EXISTS "Allow public delete assignments"          ON public.assignments;
DROP POLICY IF EXISTS "Allow delete assignments"                 ON public.assignments;

CREATE POLICY "Allow read assignments"
    ON public.assignments FOR SELECT USING (true);

CREATE POLICY "Allow insert assignments"
    ON public.assignments FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow delete assignments"
    ON public.assignments FOR DELETE USING (true);


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. STORAGE BUCKET
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('assignments', 'assignments', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies before recreating
DROP POLICY IF EXISTS "Allow public read assignment files"   ON storage.objects;
DROP POLICY IF EXISTS "Allow public upload assignment files" ON storage.objects;
DROP POLICY IF EXISTS "Allow upload assignment files"        ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete assignment files" ON storage.objects;
DROP POLICY IF EXISTS "Allow delete assignment files"        ON storage.objects;

CREATE POLICY "Allow public read assignment files"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'assignments');

CREATE POLICY "Allow upload assignment files"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'assignments');

CREATE POLICY "Allow delete assignment files"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'assignments');
