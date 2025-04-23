import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '0')
    const limit = 20

    const supabase = createClient()

    const { data: jobs, error, count } = await supabase
      .from('partner_jobs')
      .select('*, creator:user_profiles(*)', { count: 'exact' })
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1)

    if (error) {
      console.error('[API] Error fetching recommended jobs:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      jobs,
      hasMore: count ? count > (page + 1) * limit : false,
      total: count
    })
  } catch (err) {
    console.error('[API] Unexpected error in recommended jobs:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 