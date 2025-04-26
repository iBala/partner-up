"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Clock, Target, Lightbulb, MoreVertical, Users, Bookmark } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { Job } from "@/types/job"

interface MyProjectCardProps {
  project: Job & {
    shortlist_count: number
    connection_count: number
  }
  onStatusChange?: (id: string, status: 'active' | 'inactive') => Promise<void>
}

export default function MyProjectCard({ project, onStatusChange }: MyProjectCardProps) {
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState(false)

  const handleStatusToggle = async () => {
    if (!onStatusChange) return
    
    console.log('1. Status toggle initiated', {
      projectId: project.id,
      currentStatus: project.status,
      newStatus: project.status === 'active' ? 'inactive' : 'active'
    })
    
    setIsUpdating(true)
    try {
      console.log('2. Calling onStatusChange function')
      await onStatusChange(project.id, project.status === 'active' ? 'inactive' : 'active')
      console.log('3. Status change successful')
      toast.success('Project status updated')
    } catch (error) {
      console.error('4. Status change failed:', error)
      toast.error('Failed to update project status')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleEdit = () => {
    router.push(`/dashboard/jobs/${project.id}/edit`)
  }

  return (
    <Card className="overflow-hidden border-0 bg-white dark:bg-black shadow-sm hover:shadow-md transition-all duration-200">
      <div className="p-5">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-medium text-gray-900 dark:text-gray-100">{project.title}</h2>
              {project.status !== 'active' && (
                <Badge
                  variant="outline"
                  className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                >
                  Inactive
                </Badge>
              )}
            </div>
            <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
              <Avatar className="h-4 w-4 mr-1.5">
                <AvatarImage src={project.creator?.avatar_url || undefined} />
                <AvatarFallback className="text-[10px]">{project.creator?.full_name?.[0] || '?'}</AvatarFallback>
              </Avatar>
              <span>{project.creator?.full_name || 'Unknown Creator'}</span>
              <div className="flex items-center ml-3 gap-3">
                <div className="flex items-center">
                  <Bookmark className="h-3 w-3 mr-1" />
                  <span>{project.shortlist_count || 0}</span>
                </div>
                <div className="flex items-center">
                  <Users className="h-3 w-3 mr-1" />
                  <span>{project.connection_count || 0}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {project.status === 'active' ? 'Active' : 'Inactive'}
              </span>
              <Switch
                checked={project.status === 'active'}
                onCheckedChange={handleStatusToggle}
                disabled={isUpdating}
                className="data-[state=checked]:bg-black dark:data-[state=checked]:bg-white data-[state=checked]:text-white dark:data-[state=checked]:text-black"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[140px] border-0">
                <DropdownMenuItem onClick={handleEdit}>Edit project</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{project.description}</p>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start gap-2">
            <Target className="h-3.5 w-3.5 text-gray-400 mt-0.5" />
            <div>
              <span className="text-xs font-medium text-gray-900 dark:text-gray-100">Skills needed</span>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {project.skills_needed.map((skill, index) => (
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
              <span className="text-xs font-medium text-gray-900 dark:text-gray-100">Time commitment</span>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{project.commitment}</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Lightbulb className="h-3.5 w-3.5 text-gray-400 mt-0.5" />
            <div>
              <span className="text-xs font-medium text-gray-900 dark:text-gray-100">Project status</span>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {project.status === 'active' ? 'Looking for collaborators' : 'Not accepting applications'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
} 