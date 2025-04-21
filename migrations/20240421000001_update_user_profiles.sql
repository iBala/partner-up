-- Rename partner_profiles to user_profiles
ALTER TABLE public.partner_profiles RENAME TO user_profiles;

-- Add indexes for performance
CREATE INDEX idx_user_profiles_id ON public.user_profiles(id);
CREATE INDEX idx_user_profiles_full_name ON public.user_profiles(full_name);

-- Create trigger function for syncing with auth.users
CREATE OR REPLACE FUNCTION public.sync_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  )
  ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      avatar_url = EXCLUDED.avatar_url;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_change ON auth.users;
CREATE TRIGGER on_auth_user_change
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_user_profile();

-- Update partner_jobs table
ALTER TABLE public.partner_jobs
  DROP CONSTRAINT IF EXISTS partner_jobs_user_id_fkey,
  DROP COLUMN IF EXISTS user_id;

-- Update partner_job_applications table
ALTER TABLE public.partner_job_applications
  DROP CONSTRAINT IF EXISTS partner_job_applications_applicant_user_id_fkey,
  ADD CONSTRAINT partner_job_applications_applicant_user_id_fkey
    FOREIGN KEY (applicant_user_id) REFERENCES public.user_profiles(id);

-- Update RLS Policies
-- Drop existing policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Jobs are viewable by everyone" ON public.partner_jobs;
DROP POLICY IF EXISTS "Users can create jobs" ON public.partner_jobs;
DROP POLICY IF EXISTS "Users can update their own jobs" ON public.partner_jobs;
DROP POLICY IF EXISTS "Users can delete their own jobs" ON public.partner_jobs;

-- Create new policies for user_profiles
CREATE POLICY "Public read" ON public.user_profiles
  FOR SELECT USING (true);

CREATE POLICY "Owner can update" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create new policies for partner_jobs
CREATE POLICY "Public read" ON public.partner_jobs
  FOR SELECT USING (true);

CREATE POLICY "Owner CRUD" ON public.partner_jobs
  FOR ALL USING (auth.uid() = (SELECT id FROM public.user_profiles WHERE id = user_profile_id));

-- Create new policies for partner_job_applications
CREATE POLICY "Participant read" ON public.partner_job_applications
  FOR SELECT USING (
    auth.uid() = applicant_user_id
    OR auth.uid() = (SELECT user_profile_id FROM public.partner_jobs WHERE id = job_id)
  );

CREATE POLICY "Logged-in insert" ON public.partner_job_applications
  FOR INSERT WITH CHECK (auth.uid() = applicant_user_id);

CREATE POLICY "Owner updates status" ON public.partner_job_applications
  FOR UPDATE USING (
    auth.uid() = (SELECT user_profile_id FROM public.partner_jobs WHERE id = job_id)
  );

-- One-time sync from auth.users to user_profiles
INSERT INTO public.user_profiles (id, full_name, avatar_url)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'full_name', ''),
  COALESCE(raw_user_meta_data->>'avatar_url', '')
FROM auth.users
ON CONFLICT (id) DO UPDATE
SET full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url; 