'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

type JobTab = 'recommended' | 'shortlisted' | 'connection-sent'

export function JobTabs() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab') || 'recommended'

  const handleTabChange = (tab: JobTab) => {
    const params = new URLSearchParams(searchParams)
    params.set('tab', tab)
    router.push(`/dashboard/jobs?${params.toString()}`)
  }

  return (
    <Tabs 
      value={currentTab} 
      onValueChange={(value) => handleTabChange(value as JobTab)}
      className="w-full"
    >
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="recommended">Recommended</TabsTrigger>
        <TabsTrigger value="shortlisted">Shortlisted</TabsTrigger>
        <TabsTrigger value="connection-sent">Connection Sent</TabsTrigger>
      </TabsList>
    </Tabs>
  )
} 