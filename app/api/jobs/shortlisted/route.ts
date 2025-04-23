import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { RequestCookie } from 'next/dist/compiled/@edge-runtime/cookies';

interface ShortlistedJob {
  job_id: string;
  partner_jobs: {
    id: string;
    title: string;
    description: string;
    location: string | null;
    created_at: string;
    updated_at: string;
    user_profile_id: string;
    creator: {
      id: string;
      full_name: string;
      avatar_url: string | null;
    };
  };
}

export async function GET(request: Request) {
  console.log('[Shortlisted API] Request received:', {
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries())
  });

  try {
    console.log('[Shortlisted API] Initializing cookie store...');
    const cookieStore = await cookies();
    
    console.log('[Shortlisted API] Cookie store initialized');

    console.log('[Shortlisted API] Initializing Supabase client...');
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            const cookie = cookieStore.get(name);
            return cookie?.value;
          },
          set() { /* Not needed in API route */ },
          remove() { /* Not needed in API route */ },
        },
      }
    );

    console.log('[Shortlisted API] Supabase client initialized successfully');

    console.log('[Shortlisted API] Checking environment variables:', {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    });

    console.log('[Shortlisted API] Getting session...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('[Shortlisted API] Session error:', {
        error: sessionError,
        errorMessage: sessionError.message,
        errorStack: sessionError.stack
      });
      return NextResponse.json(
        { error: 'Unauthorized', details: sessionError.message },
        { status: 401 }
      );
    }

    if (!session) {
      console.log('[Shortlisted API] No session found');
      return NextResponse.json(
        { error: 'Unauthorized', details: 'No session found' },
        { status: 401 }
      );
    }

    console.log('[Shortlisted API] User authenticated:', {
      userId: session.user.id,
      email: session.user.email,
      sessionExpiresAt: session.expires_at
    });

    // Parse URL for pagination with proper validation
    const { searchParams } = new URL(request.url);
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');
    
    // Ensure page is never negative
    const page = Math.max(0, parseInt(pageParam || '0'));
    const limit = parseInt(limitParam || '10');
    // Ensure offset is never negative
    const offset = Math.max(0, page * limit);

    console.log('[Shortlisted API] Pagination parameters:', {
      page,
      limit,
      offset,
      rawPage: pageParam,
      rawLimit: limitParam
    });

    // Fetch shortlisted jobs for the authenticated user
    console.log('[Shortlisted API] Building query for shortlisted jobs...');
    const query = supabase
      .from('partner_job_shortlists')
      .select(`
        job_id,
        partner_jobs!inner(
          id,
          title,
          description,
          location,
          created_at,
          updated_at,
          user_profile_id,
          creator:user_profiles!inner(
            id,
            full_name,
            avatar_url
          )
        )
      `, { count: 'exact' })
      .eq('user_profile_id', session.user.id)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    console.log('[Shortlisted API] Executing query:', {
      table: 'partner_job_shortlists',
      filter: { user_profile_id: session.user.id },
      range: [offset, offset + limit - 1]
    });

    const { data: shortlistedJobs, error: jobsError, count } = await query as { 
      data: ShortlistedJob[] | null;
      error: any;
      count: number | null;
    };

    if (jobsError) {
      console.error('[Shortlisted API] Database error:', {
        error: jobsError,
        errorMessage: jobsError.message,
        errorCode: jobsError.code,
        details: jobsError.details,
        hint: jobsError.hint,
        query: {
          table: 'partner_job_shortlists',
          filter: { user_profile_id: session.user.id },
          range: [offset, offset + limit - 1]
        }
      });
      return NextResponse.json(
        { error: 'Error fetching shortlisted jobs', details: jobsError.message },
        { status: 500 }
      );
    }

    // Log the raw data for debugging
    console.log('[Shortlisted API] Raw job data:', {
      firstJob: shortlistedJobs?.[0],
      totalJobs: shortlistedJobs?.length
    });

    // Transform the data to match the expected format
    const jobs = shortlistedJobs?.map(item => ({
      ...item.partner_jobs,
      creator: item.partner_jobs.creator
    })) || [];

    // Calculate if there are more jobs
    const hasMore = count ? offset + limit < count : false;

    console.log('[Shortlisted API] Successfully fetched jobs:', {
      totalJobs: count,
      returnedJobs: jobs?.length,
      hasMore,
      firstJobId: jobs?.[0]?.id,
      lastJobId: jobs?.[jobs?.length - 1]?.id,
      jobIds: jobs?.map(job => job.id),
      sampleCreator: jobs?.[0]?.creator // Log sample creator data
    });

    return NextResponse.json({
      jobs,
      hasMore,
      total: count
    });

  } catch (error) {
    console.error('[Shortlisted API] Unexpected error:', {
      error,
      stack: error instanceof Error ? error.stack : undefined,
      message: error instanceof Error ? error.message : 'Unknown error',
      type: error instanceof Error ? error.constructor.name : typeof error
    });
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 