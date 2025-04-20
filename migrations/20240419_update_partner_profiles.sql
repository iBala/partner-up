-- Update portfolio_url to be an array and add skills array
ALTER TABLE partner_profiles
ALTER COLUMN portfolio_url TYPE TEXT[] USING ARRAY[portfolio_url],
ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Add comments to explain the columns
COMMENT ON COLUMN partner_profiles.portfolio_url IS 'Array of portfolio URLs';
COMMENT ON COLUMN partner_profiles.skills IS 'Array of skills possessed by the user';
COMMENT ON COLUMN partner_profiles.phone_number IS 'Contact phone number of the user';

-- Create an index on skills for better query performance
CREATE INDEX IF NOT EXISTS idx_partner_profiles_skills ON partner_profiles USING GIN (skills);

-- Update existing rows to have default values
UPDATE partner_profiles 
SET portfolio_url = COALESCE(portfolio_url, '{}'),
    skills = COALESCE(skills, '{}')
WHERE portfolio_url IS NULL OR skills IS NULL; 