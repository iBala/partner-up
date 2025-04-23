import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendConnectionEmail } from '@/lib/email'
import { sendSlackNotification } from '@/lib/slack'
import { jwtVerify } from 'jose'

// Handle all HTTP methods except POST
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export const PUT = GET
export const DELETE = GET
export const PATCH = GET
export const HEAD = GET
export const OPTIONS = GET

export async function POST(
  request: Request,
  { params }: { params: { applicationId: string } }
) {
  console.log(`[Accept] Processing application ID: ${params.applicationId}`)
  
  try {
    const supabase = createClient()

    // Get the authorization token
    const authHeader = request.headers.get('Authorization')
    console.log('[Accept] Auth header present:', !!authHeader)
    
    if (!authHeader) {
      console.log('[Accept] Missing authorization header')
      return NextResponse.json(
        { error: 'Authorization header is required' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Verify JWT token
    let payload: any;
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET)
      const verifiedToken = await jwtVerify(token, secret)
      payload = verifiedToken.payload
      
      if (payload.action !== 'accept' || payload.applicationId !== params.applicationId) {
        console.error('[Accept] Invalid token payload:', payload)
        return NextResponse.json(
          { error: 'Invalid token' },
          { status: 401 }
        )
      }

      // Check if token has been used
      const { data: tokenData, error: tokenError } = await supabase
        .from('application_tokens')
        .select('used')
        .eq('token_id', payload.tokenId)
        .eq('application_id', params.applicationId)
        .eq('action', 'accept')
        .single()

      if (tokenError || !tokenData) {
        console.error('[Accept] Token not found:', tokenError)
        return NextResponse.json(
          { error: 'Invalid token' },
          { status: 401 }
        )
      }

      if (tokenData.used) {
        console.error('[Accept] Token already used')
        return NextResponse.json(
          { error: 'This link has already been used' },
          { status: 400 }
        )
      }

      // Mark token as used
      const { error: updateTokenError } = await supabase
        .from('application_tokens')
        .update({ used: true, used_at: new Date().toISOString() })
        .eq('token_id', payload.tokenId)

      if (updateTokenError) {
        console.error('[Accept] Error marking token as used:', updateTokenError)
        return NextResponse.json(
          { error: 'Failed to process request' },
          { status: 500 }
        )
      }

      console.log(`[Accept] Token verified for user: ${payload.userId}`)
    } catch (error) {
      console.error('[Accept] Token verification failed:', error)
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Get application details
    console.log(`[Accept] Fetching application details for ID: ${params.applicationId}`)
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

    if (applicationError || !application) {
      console.error('[Accept] Error fetching application:', applicationError)
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

    // Update application status
    console.log('[Accept] Updating application status to accepted')
    const { error: updateError } = await supabase
      .from('partner_job_applications')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', params.applicationId)

    if (updateError) {
      console.error('[Accept] Error updating application:', updateError)
      return NextResponse.json(
        { error: 'Failed to update application' },
        { status: 500 }
      )
    }

    console.log('[Accept] Successfully updated application status')

    // Send connection email
    try {
      console.log('[Accept] Attempting to send connection email')
      await sendConnectionEmail({
        creatorEmail: application.job.creator.email,
        creatorName: application.job.creator.full_name,
        applicantEmail: application.applicant_email,
        applicantName: application.applicant_name,
        jobTitle: application.job.title,
      })
      console.log('[Accept] Successfully sent connection email')
    } catch (emailError) {
      console.error('[Accept] Error sending connection email:', emailError)
      await sendSlackNotification({
        message: `Failed to send connection email for application ${params.applicationId}`,
        error: emailError,
      })
      // Don't fail the request if email fails
    }

    console.log('[Accept] Request completed successfully')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Accept] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 