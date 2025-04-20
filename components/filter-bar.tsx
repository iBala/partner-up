'use client'

import { Filter, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useState } from "react"

type Tab = 'for-you' | 'shortlisted' | 'trending' | 'newest'

interface FilterBarProps {
  filters: {
    location: string[]
    skills: string[]
    commitment: string[]
  }
  setFilters: React.Dispatch<React.SetStateAction<{
    location: string[]
    skills: string[]
    commitment: string[]
  }>>
}

const locations = ['Remote', 'Hybrid', 'On-site']
const skills = ['React', 'Next.js', 'TypeScript', 'Node.js', 'Python', 'AI/ML']
const commitments = ['< 5 hrs/week', '5-10 hrs/week', '10-20 hrs/week', '20+ hrs/week']

export default function FilterBar({ filters, setFilters }: FilterBarProps) {
  const [activeTab, setActiveTab] = useState<Tab>('for-you')

  const handleFilterChange = (type: 'location' | 'skills' | 'commitment', value: string) => {
    setFilters(prev => ({
      ...prev,
      [type]: prev[type].includes(value)
        ? prev[type].filter(item => item !== value)
        : [...prev[type], value]
    }))
  }

  return (
    <div className="py-3 sticky top-14 z-10 bg-[#FAFAFA] dark:bg-[#111111]">
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap gap-1">
          <Button
            variant="ghost"
            size="sm"
            className={`h-7 px-3 text-xs font-medium ${
              activeTab === 'for-you'
                ? 'bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90'
                : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
            }`}
            onClick={() => setActiveTab('for-you')}
          >
            For You
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`h-7 px-3 text-xs font-medium ${
              activeTab === 'shortlisted'
                ? 'bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90'
                : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
            }`}
            onClick={() => setActiveTab('shortlisted')}
          >
            Shortlisted
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`h-7 px-3 text-xs font-medium ${
              activeTab === 'trending'
                ? 'bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90'
                : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
            }`}
            onClick={() => setActiveTab('trending')}
          >
            Trending
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`h-7 px-3 text-xs font-medium ${
              activeTab === 'newest'
                ? 'bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90'
                : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
            }`}
            onClick={() => setActiveTab('newest')}
          >
            Newest
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-3 text-xs font-medium border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400"
              >
                <Filter className="h-3 w-3 mr-1.5" />
                Filters
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 p-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Location</Label>
                  <div className="space-y-2">
                    {locations.map((location) => (
                      <div key={location} className="flex items-center space-x-2">
                        <Checkbox
                          id={location}
                          checked={filters.location.includes(location)}
                          onCheckedChange={() => handleFilterChange('location', location)}
                        />
                        <Label htmlFor={location} className="text-xs">{location}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium">Skills</Label>
                  <div className="space-y-2">
                    {skills.map((skill) => (
                      <div key={skill} className="flex items-center space-x-2">
                        <Checkbox
                          id={skill}
                          checked={filters.skills.includes(skill)}
                          onCheckedChange={() => handleFilterChange('skills', skill)}
                        />
                        <Label htmlFor={skill} className="text-xs">{skill}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium">Time Commitment</Label>
                  <div className="space-y-2">
                    {commitments.map((commitment) => (
                      <div key={commitment} className="flex items-center space-x-2">
                        <Checkbox
                          id={commitment}
                          checked={filters.commitment.includes(commitment)}
                          onCheckedChange={() => handleFilterChange('commitment', commitment)}
                        />
                        <Label htmlFor={commitment} className="text-xs">{commitment}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="sm"
            className="h-7 px-3 text-xs font-medium border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400"
          >
            Sort
            <ChevronDown className="h-3 w-3 ml-1.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
