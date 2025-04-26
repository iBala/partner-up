"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Clock, Target, Lightbulb } from "lucide-react"
import { ProjectApplicationForm } from "@/components/project-application-form"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from '@/contexts/auth-context'
import { toast } from "sonner"
import { formatDistanceToNow } from 'date-fns'
import { Job } from "@/types/job"
import { Session } from "@/types/session"

interface ProjectCardProps {
  project: Job
  onStatusChange: (status: boolean) => void
}

export default function ProjectCard({ project, onStatusChange }: ProjectCardProps) {
  const { user } = useAuth()
  const [isApplicationOpen, setIsApplicationOpen] = useState(false)
  const [hasApplied, setHasApplied] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const checkApplicationStatus = async () => {
      if (!user?.id) return

      const { data } = await supabase
        .from("partner_job_applications")
        .select("id")
        .eq("job_id", project.id)
        .eq("applicant_user_id", user.id)
        .single()

      setHasApplied(!!data)
    }

    checkApplicationStatus()
  }, [project.id, user?.id, supabase])

  return (
    <Card className="overflow-hidden border-0 bg-white dark:bg-black shadow-sm hover:shadow-md transition-all duration-200">
      <CardHeader className="p-6">
        <div className="flex items-center gap-4">
          <Avatar>
            <AvatarImage src={project.creator.avatar_url || undefined} />
            <AvatarFallback>{project.creator.full_name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-lg font-semibold">{project.title}</h3>
            <p className="text-sm text-gray-500">{project.creator.full_name}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <p className="text-gray-600 dark:text-gray-400">{project.description}</p>
        {project.skills_needed.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {project.skills_needed.map((skill) => (
              <Badge key={skill} variant="secondary">
                {skill}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="p-6 pt-0">
        <Button
          onClick={() => setIsApplicationOpen(true)}
          disabled={hasApplied}
          className="w-full"
        >
          {hasApplied ? "Applied" : "Connect"}
        </Button>
      </CardFooter>
      <ProjectApplicationForm
        projectId={project.id}
        projectTitle={project.title}
        isOpen={isApplicationOpen}
        onClose={() => setIsApplicationOpen(false)}
        creatorName={project.creator.full_name}
      />
    </Card>
  )
}
