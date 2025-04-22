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
      console.error('[Shortlisted Jobs API] Error getting user:', userError)
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
      console.error('[Shortlisted Jobs API] Error getting profile:', profileError)
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Fetch shortlisted jobs
    const { data: jobs, error: jobsError } = await supabase
      .from('partner_jobs_shortlisted')
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
        )
      `)
      .eq('user_profile_id', profile.id)
      .order('created_at', { ascending: false })
      .range(from, to) as { data: { job: JobResponse }[] | null, error: any }

    if (jobsError) {
      console.error('[Shortlisted Jobs API] Error fetching jobs:', jobsError)
      return NextResponse.json(
        { error: jobsError.message || 'Failed to load shortlisted jobs' },
        { status: 500 }
      )
    }

    // Transform the data to match our Job type
    const transformedData = (jobs?.map(({ job }) => ({
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
      }
    })) || []) satisfies Job[]

    return NextResponse.json({
      jobs: transformedData,
      hasMore: jobs?.length === 10
    })
  } catch (error) {
    console.error('[Shortlisted Jobs API] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 