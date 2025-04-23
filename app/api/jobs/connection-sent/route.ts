import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '0')
    const limit = 20

    // Create a Supabase client with cookie handling
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            const cookie = cookieStore.get(name)
            return cookie?.value
          },
          set(name: string, value: string, options: any) {
            // We don't need to set cookies in an API route
          },
          remove(name: string, options: any) {
            // We don't need to remove cookies in an API route
          },
        },
      }
    )

    // Get authenticated user data
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    // Handle authentication errors
    if (userError) {
      console.error('[API] Authentication error:', userError)
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      )
    }

    // Check if user exists
    if (!user) {
      console.error('[API] No authenticated user found')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Query jobs with applications
    const { data: jobs, error, count } = await supabase
      .from('partner_jobs')
      .select(`
        *, 
        creator:user_profiles(*),
        partner_job_applications!inner(*)
      `, { count: 'exact' })
      .eq('partner_job_applications.applicant_user_id', user.id)
      .order('created_at', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1)

    if (error) {
      console.error('[API] Error fetching connection sent jobs:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      jobs,
      hasMore: count ? count > (page + 1) * limit : false,
      total: count
    })
  } catch (err) {
    console.error('[API] Unexpected error in connection sent jobs:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 