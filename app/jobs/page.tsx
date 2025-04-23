'use client'

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import ProjectCard from "@/components/project-card"
import ProjectCardSkeleton from "@/components/project-card-skeleton"
import Header from "@/components/header"
import { Button } from "@/components/ui/button"
import { PlusIcon } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Search, Briefcase, MapPin, Clock, Building2, Users, Calendar, Star, MessageSquare, Target, Lightbulb } from "lucide-react"
import { DataTableFilter } from "@/components/data-table-filter"
import { useReactTable, getCoreRowModel, getFilteredRowModel } from "@tanstack/react-table"
import { columns } from "@/lib/jobs-table"
import type { Job, JobCommitment } from "@/types/job"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ColumnFiltersState } from '@tanstack/react-table'
import { OnChangeFn } from '@tanstack/react-table'
import { useAuth } from '@/contexts/auth-context'
import AuthModal from '@/components/auth/auth-modal'
import ConnectModal from '@/components/connect-modal'

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

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([])
  const [shortlistedJobs, setShortlistedJobs] = useState<string[]>([])
  const [isShortlisting, setIsShortlisting] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const { user, isAuthenticated, openAuthModal, openConnectModal } = useAuth()

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

  const handleShortlist = (jobId: string) => {
    if (isShortlisting) return
    setIsShortlisting(true)
    setShortlistedJobs(prev => [...prev, jobId])
    setTimeout(() => setIsShortlisting(false), 1000)
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAFAFA] dark:bg-[#111111]">
        <Header />
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
      <Header />
      <AuthModal />
      <ConnectModal />
      <main className="flex-1 container max-w-5xl mx-auto px-4 py-1">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col gap-6">
            <div className="w-full space-y-4">
              {/* <Card className="border rounded-xl"> */}
                {/* <CardContent className="py-6"> */}
                  <DataTableFilter table={table} />
                {/* </CardContent> */}
              {/* </Card> */}
            </div>

            <div className="w-full space-y-4">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : jobs.length === 0 ? (
                <Card className="overflow-hidden border-0 bg-white dark:bg-black shadow-sm hover:shadow-md transition-all duration-200">
                  <CardContent className="flex flex-col items-center justify-center px-5 py-4">
                    <div className="mb-6">
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
                    </div>
                    <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100">No recommended projects yet</h3>
                    <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-300 max-w-md leading-relaxed">
                      We're working on finding projects that match your skills and interests. Check back soon or create your own project.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 mt-8">
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
                    </div>
                    <div className="mt-6 flex items-center gap-2">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-50 dark:bg-gray-900">
                        <span className="text-xs text-gray-400">i</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Projects are reviewed by our team before being listed
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                filteredJobs.map((job) => (
                  <Card 
                    key={job.id} 
                    className="overflow-hidden border-0 bg-white dark:bg-black shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <div className="px-5 py-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h2 className="text-base font-medium text-gray-900 dark:text-gray-100">
                            {job.title}
                          </h2>
                          <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                            <Avatar className="h-4 w-4 mr-1.5">
                              <AvatarImage 
                                src={job.creator.avatar_url || "/placeholder.svg"} 
                                alt={job.creator.full_name} 
                              />
                              <AvatarFallback className="text-[10px]">
                                {job.creator.full_name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span>{job.creator.full_name}</span>
                          </div>
                        </div>

                        <Button 
                          onClick={() => handleConnect(job.id)}
                          disabled={isConnecting}
                          className="h-7 rounded-full text-xs font-medium bg-black hover:bg-gray-800 text-white dark:bg-white dark:text-black dark:hover:bg-gray-200"
                        >
                          Connect
                        </Button>
                      </div>

                      <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                        {job.description}
                      </p>

                      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-start gap-2">
                          <Target className="h-3.5 w-3.5 text-gray-400 mt-0.5" />
                          <div>
                            <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                              Skills needed
                            </span>
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {job.skills_needed?.map((skill, index) => (
                                <Badge
                                  key={index}
                                  variant="outline"
                                  className="h-5 px-1.5 text-[10px] font-medium bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300"
                                >
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <Clock className="h-3.5 w-3.5 text-gray-400 mt-0.5" />
                          <div>
                            <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                              Time commitment
                            </span>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {job.commitment}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <Lightbulb className="h-3.5 w-3.5 text-gray-400 mt-0.5" />
                          <div>
                            <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                              Why it fits you
                            </span>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {job.fit_reason || 'Great opportunity to collaborate'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
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
