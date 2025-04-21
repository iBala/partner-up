export type JobApplicationStatus = 'pending' | 'accepted' | 'rejected'

export interface JobApplication {
  id: string
  job_id: string
  applicant_user_id: string
  applicant_email: string
  applicant_name: string
  profile_links: string[]
  application_message: string
  phone_country_code?: string
  phone_number?: string
  status: JobApplicationStatus
  created_at: string
  updated_at: string
}

export interface CreateJobApplicationInput {
  job_id: string
  applicant_user_id: string
  applicant_email: string
  applicant_name: string
  profile_links: string[]
  application_message: string
  phone_country_code?: string
  phone_number?: string
}

export interface UpdateJobApplicationStatusInput {
  application_id: string
  status: JobApplicationStatus
} 