-- Create partner_job_applications table
CREATE TABLE partner_job_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES partner_jobs(id),
    applicant_email TEXT NOT NULL,
    applicant_name TEXT NOT NULL,
    profile_links TEXT[] NOT NULL,
    application_message TEXT NOT NULL,
    phone_country_code TEXT,
    phone_number TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX idx_job_applications_job_id ON partner_job_applications(job_id);
CREATE INDEX idx_job_applications_applicant_email ON partner_job_applications(applicant_email);

-- Add constraint to ensure status is one of: pending, accepted, rejected
ALTER TABLE partner_job_applications
ADD CONSTRAINT valid_status CHECK (status IN ('pending', 'accepted', 'rejected'));

-- Add constraint to ensure application_message is not empty and within 500 characters
ALTER TABLE partner_job_applications
ADD CONSTRAINT valid_application_message 
CHECK (length(application_message) > 0 AND length(application_message) <= 500);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_partner_job_applications_updated_at
    BEFORE UPDATE ON partner_job_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 