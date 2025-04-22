'use client'

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import ProtectedHeader from "@/components/protected-header"
import { Button } from "@/components/ui/button"
import { PlusIcon } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Card, CardContent} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Briefcase, Clock,Target, Lightbulb, Heart } from "lucide-react"
import { DataTableFilter } from "@/components/data-table-filter"
import { useReactTable, getCoreRowModel, getFilteredRowModel } from "@tanstack/react-table"
import { columns } from "@/lib/jobs-table"
import type { Job } from "@/types/job"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ColumnFiltersState } from '@tanstack/react-table'
import { OnChangeFn } from '@tanstack/react-table'
import { useAuth } from '@/contexts/auth-context'
import AuthModal from '@/components/auth/auth-modal'
import ConnectModal from '@/components/connect-modal'
import { useJobShortlist } from '@/hooks/use-job-shortlist'
import { JobCard } from '@/components/job-card'
import { FilterBar } from '@/components/filter-bar'


interface JobResponse {
  id: string
  title: string
  description: string
  location: string | null
  created_at: string
  skills_needed: string[]
  commitment: string
  creator: {
    id: string
    user_metadata: {
      full_name: string
      avatar_url?: string
    }
  }[]
}

export default function DashboardJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([])
  const [isShortlisting, setIsShortlisting] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const { user, isAuthenticated, openAuthModal, openConnectModal } = useAuth()
  const [filters, setFilters] = useState<{
    location: string[]
    skills: string[]
    commitment: string[]
  }>({
    location: [],
    skills: [],
    commitment: []
  })

  const handleFilterChange: OnChangeFn<ColumnFiltersState> = (updaterOrValue) => {
    try {
      console.log('[Jobs] Filter change details:', {
        type: typeof updaterOrValue,
        value: updaterOrValue,
        isFunction: typeof updaterOrValue === 'function',
        currentState: columnFilters
      })

      if (typeof updaterOrValue === 'function') {
        const newState = updaterOrValue(columnFilters)
        console.log('[Jobs] New filter state from function:', newState)
      }

      setColumnFilters(updaterOrValue)
    } catch (error) {
      console.error('[Jobs] Error applying filters:', error)
      toast.error('Failed to apply filters. Please try again.')
    }
  }

  const table = useReactTable({
    data: jobs,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      columnFilters,
    },
    onColumnFiltersChange: handleFilterChange,
    debugAll: true,
    debugTable: true,
  })

  useEffect(() => {
    console.log('[Jobs] Column filters detailed state:', {
      filters: columnFilters,
      filterValues: columnFilters.map(f => ({
        id: f.id,
        value: f.value,
        valueType: typeof f.value
      })),
      filteredRows: table.getFilteredRowModel().rows.length,
      totalRows: table.getCoreRowModel().rows.length,
      allRows: table.getCoreRowModel().rows.map(row => ({
        id: row.id,
        skills: row.getValue('skills')
      })),
      tableColumns: table.getAllColumns().map(col => ({
        id: col.id,
        hasFilterFn: Boolean(col.columnDef.filterFn)
      }))
    })
  }, [columnFilters, table])

  // Update filteredJobs when table filters change
  useEffect(() => {
    const filteredRows = table.getFilteredRowModel().rows
    const filteredData = filteredRows.map(row => row.original)
    setFilteredJobs(filteredData)
  }, [table.getFilteredRowModel().rows])

  useEffect(() => {
    console.log('[Jobs] Table state updated:', {
      rowCount: table.getRowModel().rows.length,
      filterState: table.getState().columnFilters,
      columns: table.getAllColumns().map(col => ({
        id: col.id,
        filterValue: col.getFilterValue(),
      }))
    })
  }, [table.getState().columnFilters, jobs])

  const supabase = createClient()

  const fetchJobs = async (pageNumber: number) => {
    try {
      setLoading(true)
      console.log('[Jobs] Fetching jobs:', { pageNumber })

      const response = await fetch(`/api/jobs?page=${pageNumber}`)
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to load jobs')
      }

      const { jobs: transformedData, hasMore } = await response.json()

      console.log('[Jobs] Transformed jobs data:', {
        firstJob: transformedData[0],
        creatorExample: transformedData[0]?.creator,
        totalJobs: transformedData.length
      })

      if (!transformedData || transformedData.length === 0) {
        if (pageNumber === 0) {
          setJobs([])
          setFilteredJobs([])
        }
        setHasMore(false)
        return
      }

      setHasMore(hasMore)

      if (pageNumber === 0) {
        setJobs(transformedData)
        setFilteredJobs(transformedData)
      } else {
        setJobs(prev => [...prev, ...transformedData])
        setFilteredJobs(prev => [...prev, ...transformedData])
      }
    } catch (err) {
      console.error('[Jobs] Unexpected error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to load jobs'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs(0)
  }, [])

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1)
      fetchJobs(page + 1)
    }
  }

  const handleCreateJob = () => {
    // TODO: Implement create job functionality
    toast('Coming soon', {
      description: 'This feature is under development'
    })
  }

  const handleConnect = async (jobId: string) => {
    if (!isAuthenticated) {
      openAuthModal('login')
      return
    }

    openConnectModal(jobId)
  }

  const handleShortlist = async (jobId: string) => {
    if (!isAuthenticated) {
      openAuthModal('login')
      return
    }

    try {
      setIsShortlisting(true)
      const { toggleShortlist, isShortlisted } = useJobShortlist(jobId)
      await toggleShortlist()
    } catch (error) {
      console.error('[Jobs] Error toggling shortlist:', error)
      toast.error('Failed to update shortlist')
    } finally {
      setIsShortlisting(false)
    }
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAFAFA] dark:bg-[#111111]">
        <ProtectedHeader />
        <AuthModal />
        <main className="flex-1 container max-w-5xl mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center h-64">
            <h2 className="text-xl font-medium text-gray-900 dark:text-gray-100">Something went wrong</h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{error}</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => {
                setError(null)
                fetchJobs(0)
              }}
            >
              Try again
            </Button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] dark:bg-[#111111]">
      <ProtectedHeader />
      <AuthModal />
      <ConnectModal />
      <main className="flex-1 container max-w-5xl mx-auto px-4">
        <div className="flex flex-col">
          <div className="flex justify-between items-center py-8">
            <h1 className="text-2xl font-medium text-gray-900 dark:text-gray-100">
              A place for builders to find each other
            </h1>
            <Button 
              onClick={handleCreateJob}
              className="h-9 px-4"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Project
            </Button>
          </div>

          <FilterBar table={table} />

          <div className="flex flex-col gap-4 py-6">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : jobs.length === 0 ? (
              <Card className="border rounded-xl">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">No jobs available</h3>
                  <p className="text-muted-foreground">Check back later for new opportunities</p>
                  {user && (
                    <Button 
                      className="mt-4"
                      onClick={handleCreateJob}
                    >
                      Create a Job Post
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              filteredJobs.map((job) => (
                <Card 
                  key={job.id} 
                  className="overflow-hidden border-0 bg-white dark:bg-black shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <JobCard 
                    job={job}
                    onConnect={handleConnect}
                    isConnecting={isConnecting}
                  />
                </Card>
              ))
            )}
          </div>
        </div>
      </main>

      <div className="fixed bottom-8 right-8">
        <Button 
          className="h-12 w-12 rounded-full shadow-lg bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 dark:text-black"
          onClick={handleCreateJob}
        >
          <PlusIcon className="h-5 w-5" />
          <span className="sr-only">Create new project</span>
        </Button>
      </div>

      <footer className="py-8 border-t border-gray-100 dark:border-gray-800">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-xs text-gray-500 dark:text-gray-400">© 2025 BuilderBoard. All rights reserved.</div>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <span className="text-xs text-gray-500 dark:text-gray-400">Terms</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">Privacy</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">Help</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
} 