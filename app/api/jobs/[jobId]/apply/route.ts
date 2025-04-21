import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { CreateJobApplicationInput } from '@/types/job-application'
import { sendJobApplicationEmail } from '@/lib/email'
import { sendSlackNotification } from '@/lib/slack'

interface PartnerProfile {
  id: string
  full_name: string
  avatar_url: string | null
  portfolio_url: string[] | null
}

interface JobResponse {
  id: string
  title: string
  description: string
  location: string | null
  created_at: string
  updated_at: string
  user_profile_id: string
  creator: {
    id: string
    full_name: string
    avatar_url: string | null
  }
}

const applicationSchema = z.object({
  job_id: z.string().refine((val) => {
    // Accept either UUID or string number
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val) || /^\d+$/.test(val)
  }, {
    message: "Job ID must be either a UUID or a number"
  }),
  applicant_user_id: z.string().uuid(),
  applicant_email: z.string().email(),
  applicant_name: z.string().min(2),
  profile_links: z.array(z.string().url()),
  application_message: z.string().min(1).max(500),
  phone_number: z.string().optional(),
})

export async function POST(
  request: Request,
  { params }: { params: { jobId: string } }
) {
  const jobId = await Promise.resolve(params.jobId)
  console.log('1. API route hit with jobId:', jobId)
  console.log('2. Request headers:', Object.fromEntries(request.headers.entries()))
  
  try {
    // Get the authorization token
    const authHeader = request.headers.get('Authorization')
    console.log('3. Auth header present:', !!authHeader)
    
    if (!authHeader) {
      console.error('4. No authorization header found')
      return NextResponse.json(
        { error: 'Authorization header is required', message: 'Please log in to apply for this role' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    console.log('5. Token extracted, length:', token.length)
    
    const supabase = createClient()
    console.log('6. Supabase client created')
    
    // Verify the token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    console.log('7. Token verification result:', { user: !!user, error: !!authError })
    
    if (authError || !user) {
      console.error('8. Authentication error:', authError)
      return NextResponse.json(
        { error: 'Invalid or expired token', message: 'Your session has expired. Please log in again.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    console.log('9. Request body received:', body)

    // Validate input
    console.log('10. Validating input data:', {
      rawBody: body,
      jobId: jobId
    })
    const validatedData = applicationSchema.parse({
      ...body,
      job_id: jobId,
      applicant_user_id: user.id,
    })
    console.log('11. Input validation successful. Validated data:', validatedData)

    // Check if user has already applied
    console.log('12. Checking for existing applications')
    const { data: existingApplication, error: existingError } = await supabase
      .from('partner_job_applications')
      .select('id')
      .eq('job_id', jobId)
      .eq('applicant_user_id', user.id)
      .single()

    if (existingApplication) {
      console.log('13. Found existing application')
      return NextResponse.json(
        { 
          error: 'You have already applied for this job',
          message: "You've already applied for this role"
        },
        { status: 400 }
      )
    }

    // Get job details first to ensure it exists
    console.log('14. Fetching job details for jobId:', jobId)
    const { data: job, error: jobError } = await supabase
      .from('partner_jobs')
      .select(`
        id,
        title,
        description,
        location,
        created_at,
        updated_at,
        user_profile_id,
        creator:user_profiles!partner_jobs_user_profile_id_fkey (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('id', jobId)
      .single<JobResponse>()

    console.log('15. Job fetch result:', {
      hasJob: !!job,
      jobError: jobError,
      jobData: job
    })

    if (jobError) {
      console.error('16. Error fetching job details:', {
        error: jobError,
        message: jobError.message,
        details: jobError.details,
        hint: jobError.hint
      })
      return NextResponse.json(
        { 
          error: 'Error fetching job details', 
          message: 'Failed to load job details. Please try again later.',
          details: jobError 
        },
        { status: 500 }
      )
    }

    if (!job) {
      console.error('17. Job not found in database')
      return NextResponse.json(
        { 
          error: 'Job not found',
          message: 'This job posting is no longer available'
        },
        { status: 404 }
      )
    }
    console.log('18. Job details fetched successfully:', job)

    // Create application
    console.log('19. Attempting to create application in Supabase with data:', validatedData)
    const { data: application, error: createError } = await supabase
      .from('partner_job_applications')
      .insert(validatedData)
      .select()
      .single()

    if (createError) {
      console.error('20. Supabase error creating application:', {
        error: createError,
        errorMessage: createError.message,
        errorDetails: createError.details,
        errorHint: createError.hint,
        errorCode: createError.code
      })
      return NextResponse.json(
        { 
          error: 'Failed to create application',
          message: 'Failed to submit your application. Please try again later.',
          details: createError 
        },
        { status: 500 }
      )
    }

    console.log('21. Successfully created application in Supabase:', application)

    // Get the creator's email from auth.users
    const { data: creatorUser, error: creatorError } = await supabase.auth.admin.getUserById(job.user_profile_id)
    if (creatorError) {
      console.error('Error fetching creator email:', creatorError)
      await sendSlackNotification({
        message: `Failed to fetch creator email for job ${jobId}`,
        error: creatorError,
      })
    }

    // Send email notification
    try {
      console.log('22. Attempting to send email notification')
      await sendJobApplicationEmail({
        jobTitle: job.title,
        creatorEmail: creatorUser?.user?.email || 'unknown@example.com',
        creatorName: job.creator.full_name,
        applicantName: validatedData.applicant_name,
        applicantEmail: validatedData.applicant_email,
        applicationMessage: validatedData.application_message,
        profileLinks: validatedData.profile_links,
        applicationId: application.id,
      })
      console.log('23. Email notification sent successfully')
    } catch (emailError) {
      console.error('24. Error sending email:', emailError)
      // Don't fail the request if email fails, just log it
      await sendSlackNotification({
        message: `Failed to send job application email for job ${jobId}`,
        error: emailError,
      })
    }

    // Return success response with creator name
    console.log('25. Returning success response')
    return NextResponse.json({
      success: true,
      message: 'Your application has been submitted successfully!',
      creatorName: job.creator.full_name,
      applicantEmail: validatedData.applicant_email
    })
  } catch (error) {
    console.error('26. Error in job application process:', error)
    if (error instanceof z.ZodError) {
      console.error('27. Validation error details:', error.errors)
      return NextResponse.json(
        { 
          error: 'Invalid input data',
          message: 'Please check your input and try again',
          details: error.errors 
        },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Something went wrong. Please try again later.',
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
} 