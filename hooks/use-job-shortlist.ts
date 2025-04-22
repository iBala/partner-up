import { useCallback } from 'react'
import useSWR from 'swr'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase'

interface ShortlistResponse {
  data?: {
    id: string
    job_id: string
    user_profile_id: string
    created_at: string
  }
  error?: string
}

// Cache key for SWR
const getShortlistKey = (jobId: string) => `/api/jobs/${jobId}/shortlist`

export function useJobShortlist(jobId: string) {
  const { user } = useAuth()
  const userId = user?.id

  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.access_token) {
      throw new Error('Not authenticated')
    }

    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${session.access_token}`
    }

    const response = await fetch(url, { ...options, headers })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to fetch shortlist status')
    }
    return response.json()
  }

  // Use SWR for caching shortlist status
  const { data, error, mutate, isLoading } = useSWR<ShortlistResponse>(
    userId ? getShortlistKey(jobId) : null,
    fetchWithAuth,
    {
      // Revalidate on focus
      revalidateOnFocus: false,
      // Revalidate on reconnect
      revalidateOnReconnect: true,
      // Don't revalidate on mount if we have data
      revalidateIfStale: false,
      // Don't retry on error
      shouldRetryOnError: false,
      // Keep previous data while revalidating
      keepPreviousData: true
    }
  )

  const toggleShortlist = useCallback(async () => {
    if (!userId) return

    try {
      // Optimistic update
      const isCurrentlyShortlisted = !!data?.data
      await mutate(
        {
          data: isCurrentlyShortlisted ? undefined : {
            id: 'temp',
            job_id: jobId,
            user_profile_id: userId,
            created_at: new Date().toISOString()
          }
        },
        false
      )

      // Make the actual API call
      await fetchWithAuth(getShortlistKey(jobId), {
        method: isCurrentlyShortlisted ? 'DELETE' : 'POST',
      })

      // Revalidate the data
      await mutate()
    } catch (error) {
      console.error('[Shortlist] Error toggling shortlist:', error)
      // Revert optimistic update
      await mutate()
      throw error
    }
  }, [data, jobId, mutate, userId])

  return {
    isShortlisted: !!data?.data,
    isLoading,
    error,
    toggleShortlist
  }
} 