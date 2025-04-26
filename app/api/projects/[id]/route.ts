import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createProjectSchema } from '@/app/dashboard/jobs/new/types'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('[Project Get API] Initializing...')
    const cookieStore = await cookies()
    
    // Initialize Supabase client with cookie-based auth
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set() { /* Not needed in API route */ },
          remove() { /* Not needed in API route */ },
        },
      }
    )

    // Get user session with proper error handling
    console.log('[Project Get API] Getting session...')
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      console.error('[Project Get API] Session error:', sessionError)
      return NextResponse.json(
        { error: 'Authentication failed', details: sessionError.message },
        { status: 401 }
      )
    }

    if (!session?.user) {
      console.error('[Project Get API] No session found')
      return NextResponse.json(
        { error: 'Unauthorized - No valid session' },
        { status: 401 }
      )
    }

    // Fetch project details
    const { data: project, error: projectError } = await supabase
      .from('partner_jobs')
      .select('*')
      .eq('id', params.id)
      .single()

    if (projectError) {
      console.error('[Project Get API] Error fetching project:', projectError)
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Check if user owns the project
    if (project.user_profile_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - You do not own this project' },
        { status: 403 }
      )
    }

    return NextResponse.json(project)
  } catch (error) {
    console.error('[Project Get API] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('[Project Update API] Initializing...')
    const cookieStore = await cookies()
    
    // Initialize Supabase client with cookie-based auth
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set() { /* Not needed in API route */ },
          remove() { /* Not needed in API route */ },
        },
      }
    )

    // Get user session with proper error handling
    console.log('[Project Update API] Getting session...')
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      console.error('[Project Update API] Session error:', sessionError)
      return NextResponse.json(
        { error: 'Authentication failed', details: sessionError.message },
        { status: 401 }
      )
    }

    if (!session?.user) {
      console.error('[Project Update API] No session found')
      return NextResponse.json(
        { error: 'Unauthorized - No valid session' },
        { status: 401 }
      )
    }

    // Get request body
    const body = await request.json()

    // If only updating status
    if (body.status !== undefined && Object.keys(body).length === 1) {
      if (!['active', 'inactive'].includes(body.status)) {
        return NextResponse.json(
          { error: 'Invalid status value' },
          { status: 400 }
        )
      }

      // First verify ownership
      const { data: project, error: projectError } = await supabase
        .from('partner_jobs')
        .select('user_profile_id')
        .eq('id', params.id)
        .single()

      if (projectError) {
        console.error('[Project Update API] Error fetching project:', projectError)
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        )
      }

      if (project.user_profile_id !== session.user.id) {
        return NextResponse.json(
          { error: 'Unauthorized - You do not own this project' },
          { status: 403 }
        )
      }

      const { error: updateError } = await supabase
        .from('partner_jobs')
        .update({ status: body.status })
        .eq('id', params.id)
        .eq('user_profile_id', session.user.id)

      if (updateError) {
        console.error('[Project Update API] Error updating project status:', updateError)
        return NextResponse.json(
          { error: 'Failed to update project status' },
          { status: 500 }
        )
      }

      return NextResponse.json({ message: 'Status updated successfully' })
    }

    // If updating project details
    try {
      const validatedData = createProjectSchema.parse(body)
      
      const { error: updateError } = await supabase
        .from('partner_jobs')
        .update({
          title: validatedData.title,
          description: validatedData.description,
          skills_needed: validatedData.skills_needed,
          commitment: validatedData.commitment,
          updated_at: new Date().toISOString()
        })
        .eq('id', params.id)
        .eq('user_profile_id', session.user.id)

      if (updateError) {
        console.error('[Project Update API] Error updating project:', updateError)
        return NextResponse.json(
          { error: 'Failed to update project' },
          { status: 500 }
        )
      }

      return NextResponse.json({ message: 'Project updated successfully' })
    } catch (validationError) {
      return NextResponse.json(
        { error: 'Invalid project data' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('[Project Update API] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 