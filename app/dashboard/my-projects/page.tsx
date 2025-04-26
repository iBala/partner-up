"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import MyProjectCard from "@/components/my-project-card"
import { toast } from "sonner"
import { Job } from "@/types/job"
import ProtectedHeader from "@/components/protected-header"
import { createBrowserClient } from '@supabase/ssr'

interface ProjectsResponse {
  projects: (Job & {
    shortlist_count: number
    connection_count: number
  })[]
  pagination: {
    totalPages: number
    currentPage: number
    totalCount: number
    itemsPerPage: number
  }
}

export default function MyProjectsPage() {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data, error, mutate } = useSWR<ProjectsResponse>(
    `/api/projects/my-projects?page=${currentPage}`,
    async (url: string) => {
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch projects')
      return res.json()
    }
  )

  const handleStatusChange = async (id: string, status: string) => {
    console.log('5. handleStatusChange called in parent', { id, status })
    
    try {
      console.log('7. Making API request to update status')
      const response = await fetch(`/api/projects/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
        credentials: 'include'  // Include cookies in the request
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('8. API request failed', { 
          status: response.status,
          statusText: response.statusText,
          error: errorData
        })
        throw new Error(errorData.error || 'Failed to update project status')
      }

      console.log('9. API request successful')
      await mutate() // Revalidate the data
      toast.success('Project status updated successfully')
    } catch (error) {
      console.error('10. Error in handleStatusChange:', error)
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        })
      }
      toast.error('Failed to update project status')
      throw error
    }
  }

  const handleCreateProject = () => {
    router.push('/dashboard/jobs/new')
  }

  const handleLoadMore = () => {
    if (data && currentPage < data.pagination.totalPages) {
      setCurrentPage(prev => prev + 1)
    }
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAFAFA] dark:bg-[#111111]">
        <ProtectedHeader />
        <main className="flex-1 container max-w-5xl mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center h-64">
            <h2 className="text-xl font-medium text-gray-900 dark:text-gray-100">Something went wrong</h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Failed to load projects</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => mutate()}
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
      <main className="flex-1 container max-w-5xl mx-auto px-4">
        <div className="flex flex-col">
          <div className="flex justify-between items-center py-8">
            <h1 className="text-2xl font-medium text-gray-900 dark:text-gray-100">
              My Projects
            </h1>
            <Button 
              onClick={handleCreateProject}
              className="h-9 px-4"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Project
            </Button>
          </div>

          <div className="flex flex-col gap-4">
            {!data ? (
              // Loading state
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="w-full h-48 animate-pulse bg-gray-100 dark:bg-gray-800" />
              ))
            ) : data.projects.length === 0 ? (
              // Empty state
              <Card className="overflow-hidden border-0 bg-white dark:bg-black shadow-sm hover:shadow-md transition-all duration-200">
                <CardContent className="flex flex-col items-center justify-center px-5 py-8">
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
                        d="M40 8H8C5.8 8 4.02 9.8 4.02 12L4 36C4 38.2 5.8 40 8 40H40C42.2 40 44 38.2 44 36V12C44 9.8 42.2 8 40 8ZM40 16L24 26L8 16V12L24 22L40 12V16Z"
                        fill="currentColor"
                        opacity="0.2"
                      />
                      <path
                        d="M40 8H8C5.8 8 4.02 9.8 4.02 12L4 36C4 38.2 5.8 40 8 40H40C42.2 40 44 38.2 44 36V12C44 9.8 42.2 8 40 8ZM40 16L24 26L8 16V12L24 22L40 12V16Z"
                        fill="currentColor"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100">No projects yet</h3>
                  <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-300 max-w-md leading-relaxed">
                    Create your first project and find collaborators to help bring your ideas to life.
                  </p>
                  <Button 
                    onClick={handleCreateProject}
                    className="mt-6 h-9 px-6 rounded-full text-sm font-medium bg-black hover:bg-gray-800 text-white dark:bg-white dark:text-black dark:hover:bg-gray-200"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Create Project
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {data.projects.map((project) => (
                  <MyProjectCard
                    key={project.id}
                    project={project}
                    onStatusChange={handleStatusChange}
                  />
                ))}
                {currentPage < data.pagination.totalPages && (
                  <div className="flex justify-center py-4">
                    <Button
                      variant="outline"
                      onClick={handleLoadMore}
                      className="h-9 px-6"
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
    </div>
  )
} 