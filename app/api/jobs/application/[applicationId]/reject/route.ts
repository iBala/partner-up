import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

// Add handler for GET requests to properly return 405
export async function GET() {
  console.log('GET request received for reject route - Method not allowed')
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

export async function POST(
  request: Request,
  { params }: { params: { applicationId: string } }
) {
  console.log(`[Reject] Processing application ID: ${params.applicationId}`)
  
  try {
    const supabase = createClient()

    // Get the authorization token
    const authHeader = request.headers.get('Authorization')
    console.log('[Reject] Auth header present:', !!authHeader)
    
    if (!authHeader) {
      console.log('[Reject] Missing authorization header')
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
      
      if (payload.action !== 'reject' || payload.applicationId !== params.applicationId) {
        console.error('[Reject] Invalid token payload:', payload)
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
        .eq('action', 'reject')
        .single()

      if (tokenError || !tokenData) {
        console.error('[Reject] Token not found:', tokenError)
        return NextResponse.json(
          { error: 'Invalid token' },
          { status: 401 }
        )
      }

      if (tokenData.used) {
        console.error('[Reject] Token already used')
        return NextResponse.json(
          { error: 'This link has already been used' },
          { status: 400 }
        )
      }

      // Mark token as used
      const { error: updateTokenError } = await supabase
        .from('application_tokens')
        .update({ used: true })
        .eq('token_id', payload.tokenId)

      if (updateTokenError) {
        console.error('[Reject] Error marking token as used:', updateTokenError)
        return NextResponse.json(
          { error: 'Failed to process request' },
          { status: 500 }
        )
      }

      console.log(`[Reject] Token verified for user: ${payload.userId}`)
    } catch (error) {
      console.error('[Reject] Token verification failed:', error)
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Update application status
    console.log('[Reject] Updating application status to rejected')
    const { error: updateError } = await supabase
      .from('partner_job_applications')
      .update({ status: 'rejected' })
      .eq('id', params.applicationId)

    if (updateError) {
      console.error('[Reject] Error updating application:', updateError)
      return NextResponse.json(
        { error: 'Failed to update application' },
        { status: 500 }
      )
    }

    console.log('[Reject] Request completed successfully')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Reject] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 