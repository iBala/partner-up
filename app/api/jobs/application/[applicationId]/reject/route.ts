import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: { applicationId: string } }
) {
  try {
    const supabase = createClient()

    // Get the authorization token
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header is required' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Get application details
    const { data: application, error: applicationError } = await supabase
      .from('partner_job_applications')
      .select(`
        *,
        job:partner_jobs (
          user_id
        )
      `)
      .eq('id', params.applicationId)
      .single()

    if (applicationError) {
      console.error('Error fetching application:', applicationError)
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

    // Check if the current user is the job owner
    if (application.job.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to reject this application' },
        { status: 403 }
      )
    }

    // Update application status
    const { error: updateError } = await supabase
      .from('partner_job_applications')
      .update({ status: 'rejected' })
      .eq('id', params.applicationId)

    if (updateError) {
      console.error('Error updating application:', updateError)
      return NextResponse.json(
        { error: 'Failed to update application' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in rejecting application:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 