-- Drop existing policies
DROP POLICY IF EXISTS "Owner CRUD" ON public.partner_jobs;

-- Enable RLS
ALTER TABLE public.partner_jobs ENABLE ROW LEVEL SECURITY;

-- Create separate policies for each operation
-- Allow anyone to read (existing policy)
CREATE POLICY "Public read" ON public.partner_jobs
  FOR SELECT USING (true);

-- Allow authenticated users to insert their own jobs
CREATE POLICY "Users can create jobs" ON public.partner_jobs
  FOR INSERT 
  WITH CHECK (
    auth.uid() IS NOT NULL AND 
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = user_profile_id AND id = auth.uid()
    )
  );

-- Allow users to update their own jobs
CREATE POLICY "Users can update own jobs" ON public.partner_jobs
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = user_profile_id AND id = auth.uid()
    )
  );

-- Allow users to delete their own jobs
CREATE POLICY "Users can delete own jobs" ON public.partner_jobs
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = user_profile_id AND id = auth.uid()
    )
  ); 