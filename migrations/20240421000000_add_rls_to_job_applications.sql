-- Enable Row Level Security
ALTER TABLE public.partner_job_applications ENABLE ROW LEVEL SECURITY;

-- Policy for applicants to view their own applications
CREATE POLICY "Applicants can view their own applications"
  ON public.partner_job_applications FOR SELECT
  USING (
    -- Check if the current user's email matches the applicant_email
    auth.jwt() ->> 'email' = applicant_email
  );

-- Policy for applicants to create applications
CREATE POLICY "Applicants can create applications"
  ON public.partner_job_applications FOR INSERT
  WITH CHECK (
    -- Check if the current user's email matches the applicant_email
    auth.jwt() ->> 'email' = applicant_email
  );

-- Policy for builders to view applications for their jobs
CREATE POLICY "Builders can view applications for their jobs"
  ON public.partner_job_applications FOR SELECT
  USING (
    -- Check if the current user is the owner of the job
    EXISTS (
      SELECT 1 FROM public.partner_jobs
      WHERE partner_jobs.id = partner_job_applications.job_id
      AND partner_jobs.user_id = auth.uid()
    )
  );

-- Policy for builders to update application status
CREATE POLICY "Builders can update application status"
  ON public.partner_job_applications FOR UPDATE
  USING (
    -- Check if the current user is the owner of the job
    EXISTS (
      SELECT 1 FROM public.partner_jobs
      WHERE partner_jobs.id = partner_job_applications.job_id
      AND partner_jobs.user_id = auth.uid()
    )
  )
  WITH CHECK (
    -- Only allow updating the status field
    (OLD.* IS DISTINCT FROM NEW.*) AND
    (NEW.status IN ('pending', 'accepted', 'rejected')) AND
    -- Ensure other fields remain unchanged
    NEW.id = OLD.id AND
    NEW.job_id = OLD.job_id AND
    NEW.applicant_email = OLD.applicant_email AND
    NEW.applicant_name = OLD.applicant_name AND
    NEW.profile_links = OLD.profile_links AND
    NEW.application_message = OLD.application_message AND
    NEW.phone_country_code = OLD.phone_country_code AND
    NEW.phone_number = OLD.phone_number
  ); 