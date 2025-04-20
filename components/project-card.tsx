"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Clock, Target, Lightbulb } from "lucide-react"
import { ProjectApplicationForm } from "@/components/project-application-form"
import { createClient } from "@/lib/supabase/client"
import { useSession } from "next-auth/react"

interface ProjectCardProps {
  project: {
    id: string
    title: string
    founder: {
      name: string
      avatar: string
    }
    summary: string
    skillsNeeded: string[]
    commitment: string
    fitReason: string
  }
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const [isApplicationOpen, setIsApplicationOpen] = useState(false)
  const [hasApplied, setHasApplied] = useState(false)
  const { data: session } = useSession()
  const supabase = createClient()

  useEffect(() => {
    const checkApplicationStatus = async () => {
      if (!session?.user?.email) return

      const { data } = await supabase
        .from("partner_job_applications")
        .select("id")
        .eq("job_id", project.id)
        .eq("applicant_email", session.user.email)
        .single()

      setHasApplied(!!data)
    }

    checkApplicationStatus()
  }, [project.id, session?.user?.email, supabase])

  return (
    <>
      <Card className="overflow-hidden border-0 bg-white dark:bg-black shadow-sm hover:shadow-md transition-all duration-200">
        <div className="p-5">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-base font-medium text-gray-900 dark:text-gray-100">
                {project.title}
              </h2>
              <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                <Avatar className="h-4 w-4 mr-1.5">
                  <AvatarImage
                    src={project.founder.avatar || "/placeholder.svg"}
                    alt={project.founder.name}
                  />
                  <AvatarFallback className="text-[10px]">
                    {project.founder.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span>{project.founder.name}</span>
              </div>
            </div>

            <Button
              className={`h-8 rounded-full text-xs font-medium ${
                hasApplied
                  ? "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 cursor-not-allowed"
                  : "bg-amber-500 hover:bg-amber-600 text-white dark:bg-amber-600 dark:text-white dark:hover:bg-amber-700 shadow-sm"
              }`}
              onClick={() => !hasApplied && setIsApplicationOpen(true)}
              disabled={hasApplied}
            >
              {hasApplied ? "Applied" : "Connect"}
            </Button>
          </div>

          <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            {project.summary}
          </p>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-2">
              <Target className="h-3.5 w-3.5 text-gray-400 mt-0.5" />
              <div>
                <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                  Skills needed
                </span>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {project.skillsNeeded.map((skill, index) => (
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
                  {project.commitment}
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
                  {project.fitReason}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <ProjectApplicationForm
        projectId={project.id}
        projectTitle={project.title}
        isOpen={isApplicationOpen}
        onClose={() => setIsApplicationOpen(false)}
      />
    </>
  )
}
