import { Search, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from '@/contexts/auth-context'

export default function Header() {
  const { openAuthModal } = useAuth()

  return (
    <header className="border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-black sticky top-0 z-10 h-14">
      <div className="container max-w-5xl mx-auto px-4 h-full">
        <div className="flex items-center justify-between h-full">
          {/* Logo */}
          <div className="flex items-center">
            <div className="text-sm font-medium">
              builder<span className="font-bold">board</span>
            </div>
          </div>

          {/* Global Search */}
          <div className="hidden md:flex items-center max-w-md w-full mx-4 relative">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 h-3.5 w-3.5" />
              <Input
                type="text"
                placeholder="Search projects, skills, or people..."
                className="pl-8 pr-4 py-1.5 h-8 w-full text-sm bg-gray-50 dark:bg-gray-900 border-0 ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center space-x-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs h-8 px-3"
              onClick={() => openAuthModal('login')}
            >
              Login
            </Button>

            <Button variant="ghost" size="icon" className="md:hidden h-8 w-8">
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
