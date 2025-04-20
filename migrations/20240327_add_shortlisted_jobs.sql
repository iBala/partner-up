-- Create shortlisted jobs table
CREATE TABLE public.partner_shortlisted_jobs (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.partner_profiles(id) ON DELETE CASCADE,
  job_id uuid REFERENCES public.partner_jobs(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, job_id)
);

-- Enable Row Level Security
ALTER TABLE public.partner_shortlisted_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for partner_shortlisted_jobs
CREATE POLICY "Users can view their own shortlisted jobs"
  ON public.partner_shortlisted_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can shortlist jobs"
  ON public.partner_shortlisted_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their shortlisted jobs"
  ON public.partner_shortlisted_jobs FOR DELETE
  USING (auth.uid() = user_id); 