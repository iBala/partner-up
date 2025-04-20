'use client'

import { useState, useEffect } from 'react'
import { ProjectApplicationForm } from '@/components/project-application-form'
import { useAuth } from '@/contexts/auth-context'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase'

export default function ConnectModal() {
  const { showConnectModal, closeConnectModal, selectedJobId, user } = useAuth()
  const [creatorName, setCreatorName] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchCreatorName = async () => {
      if (!selectedJobId) return

      const supabase = createClient()
      const { data: job, error } = await supabase
        .from('partner_jobs')
        .select(`
          creator:user_id (
            full_name
          )
        `)
        .eq('id', selectedJobId)
        .single()

      if (error) {
        console.error('Error fetching job creator:', error)
        return
      }

      setCreatorName(job.creator[0].full_name)
      setIsLoading(false)
    }

    if (showConnectModal) {
      fetchCreatorName()
    }
  }, [selectedJobId, showConnectModal])

  if (!selectedJobId) return null

  return (
    <Dialog open={showConnectModal} onOpenChange={closeConnectModal}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-center">
            {isLoading ? (
              'Loading...'
            ) : (
              `Share with ${creatorName} why you'd want to join them`
            )}
          </DialogTitle>
        </DialogHeader>
        <ProjectApplicationForm
          projectId={selectedJobId}
          projectTitle="the builder"
          isOpen={showConnectModal}
          onClose={closeConnectModal}
          creatorName={creatorName || undefined}
        />
      </DialogContent>
    </Dialog>
  )
} 