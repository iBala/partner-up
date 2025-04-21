import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendConnectionEmail } from '@/lib/email'
import { sendSlackNotification } from '@/lib/slack'

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
          title,
          user_id,
          creator:user_profile_id (
            email,
            full_name
          )
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
        { error: 'Unauthorized to accept this application' },
        { status: 403 }
      )
    }

    // Update application status
    const { error: updateError } = await supabase
      .from('partner_job_applications')
      .update({ status: 'accepted' })
      .eq('id', params.applicationId)

    if (updateError) {
      console.error('Error updating application:', updateError)
      return NextResponse.json(
        { error: 'Failed to update application' },
        { status: 500 }
      )
    }

    // Send connection email
    try {
      await sendConnectionEmail({
        creatorEmail: application.job.creator.email,
        creatorName: application.job.creator.full_name,
        applicantEmail: application.applicant_email,
        applicantName: application.applicant_name,
        jobTitle: application.job.title,
      })
    } catch (emailError) {
      console.error('Error sending connection email:', emailError)
      await sendSlackNotification({
        message: `Failed to send connection email for application ${params.applicationId}`,
        error: emailError,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in accepting application:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 