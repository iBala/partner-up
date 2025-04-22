'use client'

import { Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { JobTabs } from "@/components/job-tabs"
import { DataTableFilter } from "@/components/data-table-filter"
import { Table } from "@tanstack/react-table"
import { Job } from "@/types/job"

interface FilterBarProps {
  table: Table<Job>
}

export function FilterBar({ table }: FilterBarProps) {
  return (
    <div className="py-3 sticky top-14 z-10 bg-[#FAFAFA] dark:bg-[#111111]">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="w-auto min-w-fit">
          <JobTabs />
        </div>

        <div className="flex items-start gap-2 w-auto">
          <div className="w-auto">
            <DataTableFilter table={table} />
          </div>
        </div>
      </div>
    </div>
  )
}
