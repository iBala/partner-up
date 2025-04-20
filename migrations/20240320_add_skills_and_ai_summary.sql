-- Create enum type for commitment levels
DO $$ BEGIN
    CREATE TYPE job_commitment_type AS ENUM (
        '< 5 hrs/week',
        '5-10 hrs/week',
        '10-20 hrs/week',
        '20+ hrs/week'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add skills_needed and ai_summary columns
ALTER TABLE partner_jobs
ADD COLUMN IF NOT EXISTS skills_needed TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS ai_summary TEXT;

-- Add commitment column with proper casting of default value
DO $$ BEGIN
    ALTER TABLE partner_jobs
    ADD COLUMN commitment job_commitment_type DEFAULT '< 5 hrs/week'::job_commitment_type;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Add comments to explain the columns
COMMENT ON COLUMN partner_jobs.skills_needed IS 'Array of skills required for the job';
COMMENT ON COLUMN partner_jobs.ai_summary IS 'AI-generated summary of the job posting';
COMMENT ON COLUMN partner_jobs.commitment IS 'Time commitment required for the job';

-- Create an index on skills_needed for better query performance
CREATE INDEX IF NOT EXISTS idx_partner_jobs_skills ON partner_jobs USING GIN (skills_needed);

-- Create an index on commitment for better filtering
CREATE INDEX IF NOT EXISTS idx_partner_jobs_commitment ON partner_jobs (commitment);

-- Update existing rows to have default values (optional)
UPDATE partner_jobs 
SET skills_needed = COALESCE(skills_needed, '{}'),
    ai_summary = COALESCE(ai_summary, 'AI summary pending'),
    commitment = COALESCE(commitment, '< 5 hrs/week'::job_commitment_type)
WHERE skills_needed IS NULL OR ai_summary IS NULL OR commitment IS NULL; 