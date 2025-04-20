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

    // Get application details
    const { data: application, error: applicationError } = await supabase
      .from('partner_job_applications')
      .select(`
        *,
        job:partner_jobs (
          title,
          creator:user_id (
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