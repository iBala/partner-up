import { Resend } from 'resend';
import { createClient } from '@/lib/supabase/server';
import { SignJWT } from 'jose';
import { nanoid } from 'nanoid';

if (!process.env.RESEND_API_KEY) {
  throw new Error('Missing RESEND_API_KEY');
}

if (!process.env.JWT_SECRET) {
  throw new Error('Missing JWT_SECRET');
}

const resend = new Resend(process.env.RESEND_API_KEY);

export type EmailTemplate = 'connection-request' | 'connection-accepted' | 'connection-rejected';

interface ConnectionRequestData {
  senderName: string;
  jobTitle: string;
  message: string;
  portfolioUrl?: string;
}

interface ConnectionResponseData {
  receiverName: string;
  jobTitle: string;
}

interface EmailOptions {
  to: string;
  template: EmailTemplate;
  data: ConnectionRequestData | ConnectionResponseData;
}

const templates = {
  'connection-request': (data: ConnectionRequestData) => ({
    subject: `New Connection Request for ${data.jobTitle}`,
    html: `
      <h1>New Connection Request</h1>
      <p>${data.senderName} wants to connect with you regarding your job posting: ${data.jobTitle}</p>
      <p>Message: ${data.message}</p>
      ${data.portfolioUrl ? `<p>Portfolio: <a href="${data.portfolioUrl}">View Portfolio</a></p>` : ''}
      <p>Please log in to your account to accept or reject this request.</p>
    `
  }),
  'connection-accepted': (data: ConnectionResponseData) => ({
    subject: `Connection Request Accepted for ${data.jobTitle}`,
    html: `
      <h1>Connection Request Accepted</h1>
      <p>${data.receiverName} has accepted your connection request for ${data.jobTitle}</p>
      <p>You can now communicate with them through the platform.</p>
    `
  }),
  'connection-rejected': (data: ConnectionResponseData) => ({
    subject: `Connection Request Rejected for ${data.jobTitle}`,
    html: `
      <h1>Connection Request Rejected</h1>
      <p>${data.receiverName} has rejected your connection request for ${data.jobTitle}</p>
      <p>You can continue to browse other opportunities on the platform.</p>
    `
  })
};

export async function sendEmail({ to, template, data }: EmailOptions) {
  const templateData = templates[template](data as any);
  
  try {
    const { data: emailData, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to,
      subject: templateData.subject,
      html: templateData.html
    });

    if (error) {
      console.error('Error sending email:', error);
      throw error;
    }

    return emailData;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}

interface JobApplicationEmailProps {
  jobTitle: string;
  creatorEmail: string;
  creatorName: string;
  applicantName: string;
  applicantEmail: string;
  applicationMessage: string;
  profileLinks: string[];
}

interface JobApplication {
  job: {
    user_id: string;
  };
}

export async function sendJobApplicationEmail({
  jobTitle,
  creatorEmail,
  creatorName,
  applicantName,
  applicantEmail,
  applicationMessage,
  profileLinks,
}: JobApplicationEmailProps) {
  // Format portfolio links for email
  const portfolioLinksText = profileLinks.length > 0 
    ? profileLinks.join('\n')
    : 'No portfolio links provided';

  // Get first name of the builder
  const builderFirstName = creatorName.split(' ')[0];

  const { data, error } = await resend.emails.send({
    from: 'Builder Board <notifications@mail.appliedai.club>',
    to: creatorEmail,
    subject: `${applicantName} wants to join "${jobTitle}"`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <p>Hey ${builderFirstName},</p>

        <p>${applicantName} spotted your project <strong>"${jobTitle}"</strong> and would love to jump in.</p>
        <p>Here's their short pitch:</p>

        <div style="margin: 20px 0; padding: 15px; border-top: 1px solid #eee; border-bottom: 1px solid #eee;">
          ${applicationMessage}
        </div>

        <p><strong>Portfolio / links</strong><br/>
        ${portfolioLinksText}</p>

        <p>If this sounds interesting, just hit reply or write to <strong><a href="mailto:${applicantEmail}">${applicantEmail}</a></strong> and you two can take it from there.</p>

        <p>Cheers and happy building,<br/>
        — <a href="https://appliedai.club/builderboard" style="color: inherit; text-decoration: underline;">The Builder Board team</a></p>
      </div>
    `,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function sendConnectionEmail({
  creatorEmail,
  creatorName,
  applicantEmail,
  applicantName,
  jobTitle,
}: {
  creatorEmail: string;
  creatorName: string;
  applicantEmail: string;
  applicantName: string;
  jobTitle: string;
}) {
  const { data, error } = await resend.emails.send({
    from: 'Builder Board <notifications@mail.appliedai.club>',
    to: [creatorEmail, applicantEmail],
    subject: `Connection Established for ${jobTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="${process.env.NEXT_PUBLIC_APP_URL}/logo.png" alt="Builder Board Logo" style="max-width: 150px;">
        </div>
        
        <h2 style="color: #333;">Connection Established</h2>
        
        <p>Hello,</p>
        
        <p>A connection has been established for the job posting "${jobTitle}".</p>
        
        <h3 style="color: #333; margin-top: 20px;">Contact Information:</h3>
        <p><strong>${creatorName}:</strong> ${creatorEmail}</p>
        <p><strong>${applicantName}:</strong> ${applicantEmail}</p>
        
        <p style="margin-top: 30px; color: #666; font-size: 12px;">
          This is an automated message. Please do not reply to this email.
        </p>
      </div>
    `,
  });

  if (error) {
    throw error;
  }

  return data;
} 