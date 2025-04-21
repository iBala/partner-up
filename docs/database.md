# Database Documentation

## Tables

### user_profiles
Public profile information for users. Synced with auth.users.

#### Columns
| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| id | uuid | Primary key, references auth.users | PRIMARY KEY, REFERENCES auth.users(id) ON DELETE CASCADE |
| full_name | text | User's full name | |
| avatar_url | text | URL to user's avatar | |
| created_at | timestamp with time zone | Creation timestamp | DEFAULT timezone('utc'::text, now()) |

#### Indexes
- `idx_user_profiles_id` ON (id)
- `idx_user_profiles_full_name` ON (full_name)

#### Triggers
- `on_auth_user_change`: Syncs with auth.users on insert/update
  - Trigger function: `sync_user_profile()`
  - Fires: AFTER INSERT OR UPDATE
  - Updates: full_name, avatar_url from raw_user_meta_data

### partner_jobs
Job postings created by users.

#### Columns
| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| id | uuid | Primary key | PRIMARY KEY, DEFAULT uuid_generate_v4() |
| user_profile_id | uuid | Creator's profile ID | REFERENCES user_profiles(id) ON DELETE CASCADE |
| title | text | Job title | NOT NULL |
| description | text | Job description | NOT NULL |
| location | text | Job location | |
| created_at | timestamp with time zone | Creation timestamp | DEFAULT timezone('utc'::text, now()) |
| updated_at | timestamp with time zone | Last update timestamp | DEFAULT timezone('utc'::text, now()) |
| skills_needed | text[] | Required skills | DEFAULT '{}'::text[] |
| ai_summary | text | AI-generated summary | |
| commitment | job_commitment_type | Time commitment | DEFAULT '< 5 hrs/week'::job_commitment_type |

### partner_job_applications
Applications submitted for jobs.

#### Columns
| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| id | uuid | Primary key | PRIMARY KEY, DEFAULT uuid_generate_v4() |
| job_id | uuid | Job being applied for | REFERENCES partner_jobs(id) |
| applicant_user_id | uuid | Applicant's profile ID | REFERENCES user_profiles(id) |
| applicant_email | text | Applicant's email | NOT NULL |
| applicant_name | text | Applicant's name | NOT NULL |
| profile_links | text[] | Links to applicant's profiles | |
| application_message | text | Application message | |
| phone_number | text | Applicant's phone number | |
| status | text | Application status | NOT NULL, DEFAULT 'pending' |
| created_at | timestamp with time zone | Creation timestamp | DEFAULT NOW() |
| updated_at | timestamp with time zone | Last update timestamp | DEFAULT NOW() |

#### Indexes
- `idx_job_applications_job_id` ON (job_id)
- `idx_job_applications_applicant_email` ON (applicant_email)

## Functions

### sync_user_profile()
Synchronizes user profile data from auth.users to user_profiles.

```sql
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
```

## Row Level Security (RLS) Policies

### user_profiles
- **Public read**: Anyone can read profiles
  ```sql
  CREATE POLICY "Public read" ON public.user_profiles
    FOR SELECT USING (true);
  ```
- **Owner can update**: Users can update their own profile
  ```sql
  CREATE POLICY "Owner can update" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);
  ```

### partner_jobs
- **Public read**: Anyone can read jobs
  ```sql
  CREATE POLICY "Public read" ON public.partner_jobs
    FOR SELECT USING (true);
  ```
- **Owner CRUD**: Job owners can perform all operations
  ```sql
  CREATE POLICY "Owner CRUD" ON public.partner_jobs
    FOR ALL USING (auth.uid() = (SELECT id FROM public.user_profiles WHERE id = user_profile_id));
  ```

### partner_job_applications
- **Participant read**: Applicants and job owners can view applications
  ```sql
  CREATE POLICY "Participant read" ON public.partner_job_applications
    FOR SELECT USING (
      auth.uid() = applicant_user_id
      OR auth.uid() = (SELECT user_profile_id FROM public.partner_jobs WHERE id = job_id)
    );
  ```
- **Logged-in insert**: Only logged-in users can apply
  ```sql
  CREATE POLICY "Logged-in insert" ON public.partner_job_applications
    FOR INSERT WITH CHECK (auth.uid() = applicant_user_id);
  ```
- **Owner updates status**: Job owners can update application status
  ```sql
  CREATE POLICY "Owner updates status" ON public.partner_job_applications
    FOR UPDATE USING (
      auth.uid() = (SELECT user_profile_id FROM public.partner_jobs WHERE id = job_id)
    );
  ```

## Foreign Key Relationships

1. `user_profiles.id` → `auth.users.id`
2. `partner_jobs.user_profile_id` → `user_profiles.id`
3. `partner_job_applications.job_id` → `partner_jobs.id`
4. `partner_job_applications.applicant_user_id` → `user_profiles.id`

## Notes
- All tables have RLS enabled
- Timestamps are in UTC
- UUIDs are used for all primary keys
- Cascade deletes are implemented where appropriate
- Indexes are created for frequently queried columns
- Triggers maintain data consistency between auth.users and user_profiles 