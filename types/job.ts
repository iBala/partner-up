// Define the commitment levels as a type
export type JobCommitment = '< 5 hrs/week' | '5-10 hrs/week' | '10-20 hrs/week' | '20-40 hrs/week'

export interface Job {
  id: string
  title: string
  description: string
  location: string | null
  created_at: string
  updated_at: string
  skills_needed: string[]
  commitment: JobCommitment
  status: 'active' | 'inactive'
  creator: {
    id: string
    full_name: string
    avatar_url?: string
  }
  fit_reason?: string
  ai_summary?: string
} 