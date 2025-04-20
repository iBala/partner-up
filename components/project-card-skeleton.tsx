import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function ProjectCardSkeleton() {
  return (
    <Card className="overflow-hidden border-0 bg-white dark:bg-black shadow-sm">
      <div className="p-5">
        <div className="flex justify-between items-start">
          <div>
            <Skeleton className="h-5 w-48" />
            <div className="flex items-center mt-1">
              <Skeleton className="h-4 w-4 rounded-full mr-1.5" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-7 w-20 rounded-full" />
        </div>

        <Skeleton className="h-4 w-full mt-3" />
        <Skeleton className="h-4 w-3/4 mt-1" />

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start gap-2">
            <Skeleton className="h-3.5 w-3.5 mt-0.5" />
            <div>
              <Skeleton className="h-3 w-20" />
              <div className="flex flex-wrap gap-1 mt-1.5">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-16" />
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Skeleton className="h-3.5 w-3.5 mt-0.5" />
            <div>
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-16 mt-1" />
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Skeleton className="h-3.5 w-3.5 mt-0.5" />
            <div>
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-32 mt-1" />
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
} 