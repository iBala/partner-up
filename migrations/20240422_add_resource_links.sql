-- Add resource_links column as JSONB array
ALTER TABLE partner_jobs
ADD COLUMN IF NOT EXISTS resource_links JSONB DEFAULT '[]'::jsonb;

-- Add comment to explain the column
COMMENT ON COLUMN partner_jobs.resource_links IS 'Array of resource links with name and URL pairs';

-- Create an index for better query performance on resource_links
CREATE INDEX IF NOT EXISTS idx_partner_jobs_resource_links ON partner_jobs USING GIN (resource_links);

-- Update existing rows to have default value
UPDATE partner_jobs 
SET resource_links = COALESCE(resource_links, '[]'::jsonb)
WHERE resource_links IS NULL;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read" ON public.partner_jobs;
DROP POLICY IF EXISTS "Owner CRUD" ON public.partner_jobs;

-- Create new policies for partner_jobs
CREATE POLICY "Public read" ON public.partner_jobs
  FOR SELECT USING (true);

CREATE POLICY "Owner CRUD" ON public.partner_jobs
  FOR ALL USING (auth.uid() = (SELECT id FROM public.user_profiles WHERE id = user_profile_id)); 