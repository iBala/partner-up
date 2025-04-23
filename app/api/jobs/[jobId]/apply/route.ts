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
  creator: PartnerProfile
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

  try {
    const body = await request.json()
    console.log('3. Request body:', body)

    // Validate input data
    console.log('4. Validating input data')
    const validatedData = applicationSchema.parse({
      ...body,
      job_id: jobId
    })
    console.log('5. Input data validated successfully')

    const supabase = createClient()

    // Check if user has already applied
    console.log('12. Checking for existing application')
    const { data: existingApplication } = await supabase
      .from('partner_job_applications')
      .select('id')
      .eq('job_id', jobId)
      .eq('applicant_user_id', validatedData.applicant_user_id)
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

    if (jobError || !job) {
      console.error('16. Error fetching job details:', jobError)
      return NextResponse.json(
        { 
          error: 'Job not found',
          message: 'This job posting is no longer available'
        },
        { status: 404 }
      )
    }

    // Create application with pending status
    console.log('19. Creating application')
    const { data: application, error: createError } = await supabase
      .from('partner_job_applications')
      .insert({
        ...validatedData,
        status: 'pending'
      })
      .select()
      .single()

    if (createError) {
      console.error('20. Error creating application:', createError)
      return NextResponse.json(
        { 
          error: 'Failed to create application',
          message: 'Failed to submit your application. Please try again later.',
          details: createError 
        },
        { status: 500 }
      )
    }

    // Get the creator's email
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
      console.log('22. Sending email notification')
      await sendJobApplicationEmail({
        jobTitle: job.title,
        creatorEmail: creatorUser?.user?.email || 'unknown@example.com',
        creatorName: job.creator.full_name,
        applicantName: validatedData.applicant_name,
        applicantEmail: validatedData.applicant_email,
        applicationMessage: validatedData.application_message,
        profileLinks: validatedData.profile_links
      })
      console.log('23. Email notification sent successfully')
    } catch (emailError) {
      console.error('24. Error sending email:', emailError)
      await sendSlackNotification({
        message: `Failed to send job application email for job ${jobId}`,
        error: emailError,
      })
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Your application has been submitted successfully! The project creator will contact you if interested.',
      creatorName: job.creator.full_name,
      applicantEmail: validatedData.applicant_email
    })
  } catch (error) {
    console.error('26. Error in job application process:', error)
    if (error instanceof z.ZodError) {
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