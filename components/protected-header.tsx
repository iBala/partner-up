'use client'

import { Search, Menu, Settings, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useUserProfile } from '@/hooks/use-user-profile'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function ProtectedHeader() {
  const { user, logout } = useAuth()
  const { profile } = useUserProfile()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

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
            <Button variant="ghost" size="sm" className="text-xs h-8 px-3 hidden md:flex">
              My Projects
            </Button>

            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs h-8 px-3 hidden md:flex"
              onClick={() => router.push('/dashboard/jobs')}
            >
              Open Projects
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 p-0 focus-visible:ring-0 focus-visible:ring-offset-0">
                  <Avatar className="h-7 w-7 border border-gray-200 dark:border-gray-700">
                    <AvatarImage 
                      src={profile?.avatar_url} 
                      className="object-cover"
                      onError={(e) => {
                        console.error('Error loading header avatar:', e)
                        const img = e.target as HTMLImageElement
                        console.log('Failed header avatar URL:', JSON.stringify(img.src))
                        // Try to load the image directly to check if it's accessible
                        fetch(img.src)
                          .then(response => {
                            console.log('Header avatar URL response:', {
                              status: response.status,
                              ok: response.ok,
                              headers: Object.fromEntries(response.headers.entries())
                            })
                          })
                          .catch(error => console.error('Header avatar fetch error:', error))
                      }}
                      onLoad={(e) => {
                        const img = e.target as HTMLImageElement
                        console.log('Successfully loaded header avatar:', JSON.stringify(img.src))
                      }}
                      alt={`${profile?.full_name}'s avatar`}
                    />
                    <AvatarFallback className="text-xs">
                      {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 shadow-none">
                <div className="px-2 py-1.5 text-sm text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                  {profile?.full_name || user?.email || 'User'}
                </div>
                <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="icon" className="md:hidden h-8 w-8">
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
} 