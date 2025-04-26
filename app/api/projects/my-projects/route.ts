import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const ITEMS_PER_PAGE = 10

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    
    console.log('[My Projects API] Initializing cookie store...')
    const cookieStore = await cookies()
    
    console.log('[My Projects API] Initializing Supabase client...')
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            console.log('[My Projects API] Getting cookie:', name)
            const cookie = cookieStore.get(name)
            return cookie?.value
          },
          set() { /* Not needed in API route */ },
          remove() { /* Not needed in API route */ },
        },
      }
    )

    // Get user session with proper error handling
    console.log('[My Projects API] Getting session...')
    const {
      data: { session },
      error: sessionError
    } = await supabase.auth.getSession()

    if (sessionError) {
      console.error('[My Projects API] Session error:', sessionError)
      return NextResponse.json(
        { error: 'Authentication failed', details: sessionError.message },
        { status: 401 }
      )
    }

    if (!session?.user?.id) {
      console.log('[My Projects API] No valid session found')
      return NextResponse.json(
        { error: 'Unauthorized - No valid session' },
        { status: 401 }
      )
    }

    // Get authenticated user data
    console.log('[My Projects API] Verifying user authentication...')
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('[My Projects API] User verification failed:', userError)
      return NextResponse.json(
        { error: 'Authentication failed', details: userError?.message },
        { status: 401 }
      )
    }

    console.log('[My Projects API] Authenticated user ID:', user.id)

    // Calculate offset for pagination
    const offset = (page - 1) * ITEMS_PER_PAGE

    console.log('[My Projects API] Fetching projects for user:', user.id, 'page:', page)
    
    // Get projects with counts and proper error handling
    const { 
      data: projects, 
      error: projectsError, 
      count 
    } = await supabase
      .from('partner_jobs')
      .select(`
        *,
        shortlist_count:partner_job_shortlists(count),
        connection_count:partner_connections(count),
        creator:user_profiles!partner_jobs_user_profile_id_fkey(
          id,
          full_name,
          avatar_url
        )
      `, { count: 'exact' })
      .eq('user_profile_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + ITEMS_PER_PAGE - 1)

    if (projectsError) {
      console.error('[My Projects API] Error fetching projects:', projectsError)
      return NextResponse.json(
        { error: 'Failed to fetch projects', details: projectsError.message },
        { status: 500 }
      )
    }

    console.log('[My Projects API] Successfully fetched projects. Count:', count)

    // Transform the data to handle count objects
    const transformedProjects = projects?.map(project => ({
      ...project,
      shortlist_count: project.shortlist_count?.count || 0,
      connection_count: project.connection_count?.count || 0
    })) || []

    // Return paginated response with metadata
    return NextResponse.json({
      projects: transformedProjects,
      pagination: {
        totalPages: Math.ceil((count || 0) / ITEMS_PER_PAGE),
        currentPage: page,
        totalCount: count || 0,
        itemsPerPage: ITEMS_PER_PAGE
      }
    })

  } catch (error: any) {
    console.error('[My Projects API] Unexpected error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
} 