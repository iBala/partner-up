-- Enable Row Level Security
ALTER TABLE public.partner_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_connections ENABLE ROW LEVEL SECURITY;

-- Create profiles table
CREATE TABLE public.partner_profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name text,
  avatar_url text,
  portfolio_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Create jobs table
CREATE TABLE public.partner_jobs (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.partner_profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  location text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Create connections table
CREATE TABLE public.partner_connections (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_id uuid REFERENCES public.partner_jobs(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES public.partner_profiles(id) ON DELETE CASCADE,
  receiver_id uuid REFERENCES public.partner_profiles(id) ON DELETE CASCADE,
  message text NOT NULL,
  portfolio_url text,
  status text CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- RLS Policies for partner_profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.partner_profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.partner_profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for partner_jobs
CREATE POLICY "Jobs are viewable by everyone"
  ON public.partner_jobs FOR SELECT
  USING (true);

CREATE POLICY "Users can create jobs"
  ON public.partner_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own jobs"
  ON public.partner_jobs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own jobs"
  ON public.partner_jobs FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for partner_connections
CREATE POLICY "Users can view their own connections"
  ON public.partner_connections FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can create connection requests"
  ON public.partner_connections FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Job owners can update connection status"
  ON public.partner_connections FOR UPDATE
  USING (auth.uid() = receiver_id);

  CREATE TABLE partner_job_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES partner_jobs(id),
    applicant_email TEXT NOT NULL,
    applicant_name TEXT NOT NULL,
    profile_links TEXT[],
    application_message TEXT,
    phone_number TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_job_applications_job_id ON partner_job_applications(job_id);
CREATE INDEX idx_job_applications_applicant_email ON partner_job_applications(applicant_email);


-- Add applicant_user_id column to partner_job_applications
ALTER TABLE partner_job_applications
ADD COLUMN applicant_user_id UUID REFERENCES auth.users(id);

-- Add a NOT NULL constraint after migrating existing data
ALTER TABLE partner_job_applications
ALTER COLUMN applicant_user_id SET NOT NULL;


-- First rename the existing user_id to user_profile_id
ALTER TABLE partner_jobs
RENAME COLUMN user_id TO user_profile_id;

-- Add the new user_id column
ALTER TABLE partner_jobs
ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Add a NOT NULL constraint after migrating existing data
ALTER TABLE partner_jobs
ALTER COLUMN user_id SET NOT NULL;

-- First, drop the existing foreign key constraint if it exists
ALTER TABLE partner_jobs
DROP CONSTRAINT IF EXISTS partner_jobs_user_id_fkey;

-- Add the new foreign key constraint to auth.users
ALTER TABLE partner_jobs
ADD CONSTRAINT partner_jobs_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id);

-- Update the query in the API to use the correct relationship
-- The query should be changed from:
-- partner_profiles!partner_jobs_user_id_fkey
-- to:
-- auth_users!partner_jobs_user_id_fkey