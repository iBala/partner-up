import { Filter, X } from "lucide-react"
import { Button } from "./button"

interface FilterChipProps {
  label: string
  operator: string
  value: string
  onRemove: () => void
}

export function FilterChip({ label, operator, value, onRemove }: FilterChipProps) {
  return (
    <div className="flex items-center gap-1 px-2 py-1 bg-white border rounded-full">
      <Filter className="h-4 w-4 text-gray-500" />
      <span className="text-sm font-medium">{label}</span>
      <span className="text-sm text-gray-500">{operator}</span>
      <div className="flex items-center gap-1">
        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-100 rounded-full">
          <span className="text-sm">{value}</span>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-5 w-5 p-0 hover:bg-gray-100"
          onClick={onRemove}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}

export function ClearFiltersButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="destructive"
      size="sm"
      className="h-8 px-3 flex items-center gap-1.5"
      onClick={onClick}
    >
      <Filter className="h-4 w-4" />
      Clear
    </Button>
  )
} 