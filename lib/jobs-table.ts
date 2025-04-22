import { ColumnDef, createColumnHelper } from '@tanstack/react-table'
import { Job, JobCommitment } from '@/types/job'
import { MapPin, Code, Clock, Text } from 'lucide-react'
import { filterFn, FilterModel, ColumnOption } from '@/lib/filters'

const columnHelper = createColumnHelper<Job>()

// Predefined skills options
const skillOptions = [
  { value: 'marketing', label: 'Marketing' },
  { value: 'sales', label: 'Sales' },
  { value: 'frontend', label: 'Front End Development' },
  { value: 'backend', label: 'Backend Development' },
  { value: 'ux', label: 'UX Design' },
  { value: 'ai', label: 'AI Vibe Coding' }
]

// Commitment options based on the enum
const commitmentOptions = [
  { value: '< 5 hrs/week', label: '< 5 hrs/week' },
  { value: '5-10 hrs/week', label: '5-10 hrs/week' },
  { value: '10-20 hrs/week', label: '10-20 hrs/week' },
  { value: '20+ hrs/week', label: '20+ hrs/week' }
]

// For debugging column configuration
const logColumnConfig = (columns: ColumnDef<Job, any>[]) => {
  console.log('[JobsTable] Column configuration:', columns.map(col => ({
    id: col.id,
    accessorKey: (col as any).accessorKey,
    meta: col.meta,
  })))
  return columns
}

export const columns: ColumnDef<Job, any>[] = logColumnConfig([
  columnHelper.accessor('title', {
    id: 'title',
    header: 'Title',
    cell: info => info.getValue(),
    filterFn: filterFn('text'),
    meta: {
      type: 'text',
      displayName: 'Title',
      icon: Text
    }
  }),
  columnHelper.accessor('location', {
    id: 'location',
    header: 'Location',
    cell: info => {
      const value = info.getValue()
      console.log('[JobsTable] Rendering location cell:', { value })
      return value
    },
    filterFn: filterFn('option'),
    meta: {
      type: 'option',
      icon: MapPin,
      displayName: 'Location',
      options: [{ value: 'worldwide', label: 'Worldwide' }]
    }
  }),
  columnHelper.accessor('skills_needed', {
    id: 'skills',
    header: 'Skills',
    cell: info => {
      const value = info.getValue()
      if (!Array.isArray(value)) return ''
      return value.map(skill => {
        const option = skillOptions.find(opt => opt.value === skill)
        return option ? option.label : skill
      }).join(', ')
    },
    filterFn: (row, columnId, filterValue) => {
      const cellValue = row.getValue(columnId) as string[]
      console.log('[JobsTable] Filter execution:', {
        columnId,
        rowId: row.id,
        cellValue,
        filterValue: JSON.stringify(filterValue, null, 2),
        filterValueType: typeof filterValue
      })

      // Handle empty or invalid cases
      if (!Array.isArray(cellValue)) {
        console.log('[JobsTable] Invalid cell value:', { cellValue })
        return true
      }
      if (!filterValue) {
        console.log('[JobsTable] No filter value')
        return true
      }

      // Extract selected values from filter value structure
      let selectedValues: string[] = []
      try {
        if (typeof filterValue === 'object' && 'values' in filterValue) {
          // Handle multiOption filter model structure
          selectedValues = filterValue.values[0] || []
          const operator = filterValue.operator

          // Log filter details for debugging
          console.log('[JobsTable] MultiOption filter:', {
            operator,
            selectedValues,
            cellValue
          })

          switch (operator) {
            case 'include':
            case 'include any of':
              return selectedValues.some(v => cellValue.includes(v))
            case 'include all of':
              return selectedValues.every(v => cellValue.includes(v))
            case 'exclude':
              return !selectedValues.some(v => cellValue.includes(v))
            default:
              return true
          }
        }
        return true
      } catch (error) {
        console.error('[JobsTable] Error in skills filter:', error)
        return true
      }
    },
    meta: {
      type: 'multiOption',
      icon: Code,
      displayName: 'Skills',
      options: skillOptions
    }
  }),
  columnHelper.accessor('commitment', {
    id: 'commitment',
    header: 'Time Commitment',
    cell: info => {
      const value = info.getValue()
      return value
    },
    filterFn: (row, columnId, filterValue) => {
      const cellValue = row.getValue(columnId) as string
      console.log('[JobsTable] Filtering commitment:', {
        cellValue,
        filterValue: JSON.stringify(filterValue, null, 2)
      })

      // Handle empty or invalid cases
      if (!filterValue) return true

      // Extract selected values from filter value structure
      let selectedValues: string[] = []
      try {
        if (typeof filterValue === 'object' && filterValue && 'values' in filterValue) {
          selectedValues = (filterValue.values as string[]) || []
        } else if (Array.isArray(filterValue)) {
          selectedValues = filterValue as string[]
        } else if (typeof filterValue === 'string') {
          selectedValues = [filterValue]
        }

        return selectedValues.length === 0 || selectedValues.includes(cellValue)
      } catch (error) {
        console.error('[JobsTable] Error in commitment filter:', error)
        return true
      }
    },
    meta: {
      type: 'option',
      icon: Clock,
      displayName: 'Time Commitment',
      options: commitmentOptions
    }
  })
]) 