import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { Job, JobCommitment } from '@/types/job'

interface JobResponse {
  id: string
  title: string
  description: string
  location: string | null
  created_at: string
  skills_needed: string[]
  commitment: string
  user_id: string
  creator: {
    id: string
    full_name: string
    avatar_url: string | null
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '0')
    const from = page * 10
    const to = from + 9

    const supabase = createClient()

    // Get the current user's profile ID
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('[Connection Requests API] Error getting user:', userError)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get the user's profile ID
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('auth_user', user.id)
      .single()

    if (profileError || !profile) {
      console.error('[Connection Requests API] Error getting profile:', profileError)
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Fetch connection requests
    const { data: jobs, error: jobsError } = await supabase
      .from('partner_job_applications')
      .select(`
        job:partner_jobs(
          id,
          title,
          description,
          location,
          created_at,
          skills_needed,
          commitment,
          user_profile_id,
          creator:user_profiles!partner_jobs_user_profile_id_fkey(
            id,
            full_name,
            avatar_url
          )
        ),
        status,
        created_at as application_date
      `)
      .eq('applicant_profile_id', profile.id)
      .order('created_at', { ascending: false })
      .range(from, to) as { data: { job: JobResponse, status: string, application_date: string }[] | null, error: any }

    if (jobsError) {
      console.error('[Connection Requests API] Error fetching jobs:', jobsError)
      return NextResponse.json(
        { error: jobsError.message || 'Failed to load connection requests' },
        { status: 500 }
      )
    }

    // Transform the data to match our Job type
    const transformedData = (jobs?.map(({ job, status, application_date }) => ({
      id: job.id,
      title: job.title,
      description: job.description,
      location: job.location,
      created_at: job.created_at,
      skills_needed: job.skills_needed || [],
      commitment: job.commitment as JobCommitment,
      creator: {
        full_name: job.creator?.full_name || 'Emotional Monkey',
        avatar_url: job.creator?.avatar_url || null
      },
      // Add application-specific fields
      application_status: status,
      application_date
    })) || []) satisfies (Job & { application_status: string, application_date: string })[]

    return NextResponse.json({
      jobs: transformedData,
      hasMore: jobs?.length === 10
    })
  } catch (error) {
    console.error('[Connection Requests API] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 