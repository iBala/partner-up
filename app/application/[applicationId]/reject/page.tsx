'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function RejectApplicationPage({
  params,
}: {
  params: { applicationId: string }
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const handleReject = async () => {
      try {
        const token = searchParams.get('token')
        
        if (!token) {
          throw new Error('Invalid or missing token')
        }

        const response = await fetch(`/api/jobs/application/${params.applicationId}/reject`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to reject application')
        }

        setStatus('success')
      } catch (error) {
        console.error('Error rejecting application:', error)
        setError(error instanceof Error ? error.message : 'Failed to reject application')
        setStatus('error')
      }
    }

    handleReject()
  }, [params.applicationId, searchParams])

  return (
    <div className="container max-w-lg mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Application Response</CardTitle>
          <CardDescription>
            Processing your response to the application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'loading' && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-4">Processing your rejection...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <div className="text-green-600 mb-4">
                <svg
                  className="h-12 w-12 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Application Rejected</h3>
              <p className="text-gray-600 mb-4">
                You have successfully rejected this application.
              </p>
              <Button onClick={() => router.push('/dashboard/jobs?tab=shortlisted')}>
                View Applications
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <div className="text-red-600 mb-4">
                <svg
                  className="h-12 w-12 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Error</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 