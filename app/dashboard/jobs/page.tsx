'use client'

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import ProtectedHeader from "@/components/protected-header"
import { Button } from "@/components/ui/button"
import { PlusIcon } from "lucide-react"
import { toast } from "sonner"
import { useRouter, useSearchParams } from "next/navigation"
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
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab') || 'recommended'
  const [isTabLoading, setIsTabLoading] = useState(false)
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

  const fetchJobs = async (pageNumber: number, tab: string) => {
    try {
      if (pageNumber === 0) {
        setIsTabLoading(true)
      }
      setLoading(true)
      console.log('[Jobs] Fetching jobs:', { pageNumber, tab })

      const response = await fetch(`/api/jobs/${tab}?page=${pageNumber}`)
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
      if (pageNumber === 0) {
        setIsTabLoading(false)
      }
    }
  }

  // Reset and fetch when tab changes
  useEffect(() => {
    setPage(0)
    setJobs([])
    setFilteredJobs([])
    setHasMore(true)
    setError(null)
    fetchJobs(0, currentTab)
  }, [currentTab])

  // Fetch next page
  useEffect(() => {
    if (page > 0) {
      fetchJobs(page, currentTab)
    }
  }, [page])

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1)
    }
  }

  const handleCreateJob = () => {
    router.push('/dashboard/jobs/new')
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
                fetchJobs(0, currentTab)
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
          <div className="flex justify-between items-center py-4">
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
            {isTabLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : jobs.length === 0 ? (
              <Card className="overflow-hidden border-0 bg-white dark:bg-black shadow-sm hover:shadow-md transition-all duration-200">
                <CardContent className="flex flex-col items-center justify-center px-5 py-4">
                  <div className="mb-6">
                    {currentTab === 'recommended' ? (
                      <svg
                        width="48"
                        height="48"
                        viewBox="0 0 48 48"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="text-gray-400"
                      >
                        <path
                          d="M24 4C12.96 4 4 12.96 4 24C4 35.04 12.96 44 24 44C35.04 44 44 35.04 44 24C44 12.96 35.04 4 24 4ZM24 40C15.18 40 8 32.82 8 24C8 15.18 15.18 8 24 8C32.82 8 40 15.18 40 24C40 32.82 32.82 40 24 40Z"
                          fill="currentColor"
                          opacity="0.2"
                        />
                        <path
                          d="M24 12C27.32 12 30 14.68 30 18C30 21.32 27.32 24 24 24C20.68 24 18 21.32 18 18C18 14.68 20.68 12 24 12ZM24 34C18.66 34 14 31.68 14 28.4V26C14 23.24 19.34 21 24 21C28.66 21 34 23.24 34 26V28.4C34 31.68 29.34 34 24 34Z"
                          fill="currentColor"
                        />
                      </svg>
                    ) : currentTab === 'shortlisted' ? (
                      <svg
                        width="48"
                        height="48"
                        viewBox="0 0 48 48"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="text-gray-400"
                      >
                        <path
                          d="M24 42.7L21.1 40.06C11.05 30.9 4 24.5 4 16.75C4 10.35 9.15 5.2 15.55 5.2C19.25 5.2 22.8 6.95 24 9.65C25.2 6.95 28.75 5.2 32.45 5.2C38.85 5.2 44 10.35 44 16.75C44 24.5 36.95 30.9 26.9 40.06L24 42.7Z"
                          fill="currentColor"
                          opacity="0.2"
                        />
                        <path
                          d="M32.45 5.2C28.75 5.2 25.2 6.95 24 9.65C22.8 6.95 19.25 5.2 15.55 5.2C9.15 5.2 4 10.35 4 16.75C4 24.5 11.05 30.9 21.1 40.06L24 42.7L26.9 40.06C36.95 30.9 44 24.5 44 16.75C44 10.35 38.85 5.2 32.45 5.2Z"
                          fill="currentColor"
                        />
                      </svg>
                    ) : (
                      <svg
                        width="48"
                        height="48"
                        viewBox="0 0 48 48"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="text-gray-400"
                      >
                        <path
                          d="M40 8H8C5.8 8 4.02 9.8 4.02 12L4 36C4 38.2 5.8 40 8 40H40C42.2 40 44 38.2 44 36V12C44 9.8 42.2 8 40 8ZM40 16L24 26L8 16V12L24 22L40 12V16Z"
                          fill="currentColor"
                          opacity="0.2"
                        />
                        <path
                          d="M40 8H8C5.8 8 4.02 9.8 4.02 12L4 36C4 38.2 5.8 40 8 40H40C42.2 40 44 38.2 44 36V12C44 9.8 42.2 8 40 8ZM40 16L24 26L8 16V12L24 22L40 12V16Z"
                          fill="currentColor"
                        />
                      </svg>
                    )}
                  </div>
                  <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100">
                    {currentTab === 'recommended' 
                      ? "No recommended projects yet"
                      : currentTab === 'shortlisted'
                      ? "No shortlisted projects"
                      : "No connection requests sent"}
                  </h3>
                  <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-300 max-w-md leading-relaxed">
                    {currentTab === 'recommended' 
                      ? "We're working on finding projects that match your skills and interests. Check back soon or create your own project."
                      : currentTab === 'shortlisted'
                      ? "Projects you shortlist will appear here. Find interesting projects and save them for later."
                      : "When you send connection requests to project creators, they'll appear here."}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 mt-8">
                    {currentTab === 'recommended' ? (
                      <>
                        <Button 
                          onClick={handleCreateJob}
                          className="h-9 px-6 rounded-full text-sm font-medium bg-black hover:bg-gray-800 text-white dark:bg-white dark:text-black dark:hover:bg-gray-200"
                        >
                          <PlusIcon className="h-4 w-4 mr-2" />
                          Create Project
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => router.push('/explore')}
                          className="h-9 px-6 rounded-full text-sm font-medium border-gray-200 dark:border-gray-800"
                        >
                          Explore Projects
                        </Button>
                      </>
                    ) : currentTab === 'shortlisted' ? (
                      <Button 
                        variant="outline"
                        onClick={() => router.push('/jobs')}
                        className="h-9 px-6 rounded-full text-sm font-medium border-gray-200 dark:border-gray-800"
                      >
                        Browse Projects
                      </Button>
                    ) : (
                      <Button 
                        variant="outline"
                        onClick={() => router.push('/jobs')}
                        className="h-9 px-6 rounded-full text-sm font-medium border-gray-200 dark:border-gray-800"
                      >
                        Find Projects
                      </Button>
                    )}
                  </div>
                  {currentTab === 'recommended' && (
                    <div className="mt-6 flex items-center gap-2">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-50 dark:bg-gray-900">
                        <span className="text-xs text-gray-400">i</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Projects are reviewed by our team before being listed
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <>
                {filteredJobs.map((job) => (
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
                ))}
                {loading && (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                )}
                {!loading && hasMore && (
                  <div className="flex justify-center py-4">
                    <Button
                      variant="outline"
                      onClick={handleLoadMore}
                      disabled={loading}
                    >
                      Load More
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

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