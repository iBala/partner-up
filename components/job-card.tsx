/**
 * JobCard Component
 * 
 * Displays a job posting with interactive elements for shortlisting and connecting with builders.
 * Features:
 * - Shortlist functionality with authentication check
 * - Connect with builder action
 * - Responsive layout
 * - Dark mode support
 * - Loading states for async actions
 */

import { Heart, Loader2, Target, Clock, Lightbulb } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useJobShortlist } from "@/hooks/use-job-shortlist"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import type { Job } from "@/types/job"

interface JobCardProps {
  job: Job
  onConnect: (jobId: string) => void
  isConnecting: boolean
}

export function JobCard({ job, onConnect, isConnecting }: JobCardProps) {
  const { isAuthenticated, openAuthModal } = useAuth()
  const { isShortlisted, isLoading, toggleShortlist } = useJobShortlist(job.id)

  // Handle shortlist action with authentication check
  const handleShortlist = async () => {
    if (!isAuthenticated) {
      openAuthModal('login')
      return
    }

    try {
      await toggleShortlist()
    } catch (error) {
      console.error('[JobCard] Error toggling shortlist:', error)
      toast.error('Failed to update shortlist')
    }
  }

  return (
    <div className="px-5 py-4">
      {/* Header section with job title and actions */}
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

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={handleShortlist}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            ) : (
              <Heart 
                className={`h-4 w-4 ${
                  isShortlisted
                    ? 'fill-red-500 text-red-500' 
                    : 'text-gray-400'
                }`}
              />
            )}
          </Button>

          <Button 
            onClick={() => onConnect(job.id)}
            disabled={isConnecting}
            className="h-7 rounded-full text-xs font-medium bg-black hover:bg-gray-800 text-white dark:bg-white dark:text-black dark:hover:bg-gray-200"
          >
            Connect with Builder
          </Button>
        </div>
      </div>

      {/* Job description */}
      <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
        {job.description}
      </p>

      {/* Job details grid */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Skills section */}
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

        {/* Time commitment section */}
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

        {/* Fit reason section */}
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
  )
} 