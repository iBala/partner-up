'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import ProtectedHeader from "@/components/protected-header"
import { useUserProfile, type UserProfile } from "@/hooks/use-user-profile"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Upload } from "lucide-react"
import { validateUrl, validatePhoneNumber, sanitizeText, validateName } from "../../../lib/validations"

interface PortfolioUrl {
  url: string;
  index: number;
}

export default function SettingsPage() {
  const router = useRouter()
  const { profile, loading, updateProfile, uploadAvatar } = useUserProfile()
  const [newSkill, setNewSkill] = useState("")
  const [portfolioUrls, setPortfolioUrls] = useState<string[]>([''])
  const [skills, setSkills] = useState<string[]>([])

  // Initialize state when profile data is loaded
  useEffect(() => {
    if (profile) {
      setPortfolioUrls(profile.portfolio_url || [''])
      setSkills(profile.skills || [])
    }
  }, [profile])

  // Add debug logging for profile changes
  useEffect(() => {
    if (profile) {
      // Log complete URL without truncation
      console.log('Profile in settings page:', JSON.stringify({
        hasAvatar: !!profile.avatar_url,
        avatarUrl: profile.avatar_url
      }, null, 2))
    }
  }, [profile])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    // Validate and sanitize full name
    const fullName = sanitizeText(formData.get('full_name') as string)
    if (!validateName(fullName)) {
      toast.error('Name can only contain letters, spaces, hyphens, and apostrophes')
      return
    }

    // Validate phone number
    const phoneNumber = formData.get('phone_number') as string
    if (phoneNumber && !validatePhoneNumber(phoneNumber)) {
      toast.error('Phone number can only contain numbers and an optional + at the start')
      return
    }

    // Sanitize bio
    const bio = sanitizeText(formData.get('bio') as string)

    // Validate URLs with TLD check
    const validatedUrls: string[] = []
    for (const url of portfolioUrls) {
      const { isValid, normalizedUrl } = validateUrl(url)
      if (!isValid) {
        toast.error(`Invalid URL: ${url}. URLs must have a valid domain (e.g., .com, .org, .io)`)
        return
      }
      if (normalizedUrl) {
        validatedUrls.push(normalizedUrl)
      }
    }

    // Get skills from state instead of form data
    const validatedSkills = skills.filter(Boolean)
    
    try {
      await updateProfile({
        full_name: fullName,
        phone_number: phoneNumber,
        bio,
        portfolio_url: validatedUrls,
        skills: validatedSkills,
      })
    } catch (error) {
      console.error('Failed to update profile:', error)
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB')
      return
    }

    try {
      await uploadAvatar(file)
    } catch (error) {
      console.error('Failed to upload avatar:', error)
    }
  }

  const handleAddSkill = () => {
    if (!newSkill.trim()) return
    setSkills(prev => [...prev, newSkill.trim()])
    setNewSkill("")
  }

  const handleRemoveSkill = (index: number) => {
    setSkills(prev => prev.filter((_, i) => i !== index))
  }

  const handleAddPortfolioUrl = () => {
    setPortfolioUrls(prev => [...prev, ''])
  }

  const handlePortfolioUrlChange = (index: number, value: string) => {
    setPortfolioUrls(prev => {
      const newUrls = [...prev]
      newUrls[index] = value
      return newUrls
    })
  }

  const handleRemovePortfolioUrl = (index: number) => {
    setPortfolioUrls(prev => prev.filter((_, i) => i !== index))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAFAFA] dark:bg-[#111111]">
        <ProtectedHeader />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] dark:bg-[#111111]">
      <ProtectedHeader />
      <main className="flex-1">
        <div className="hidden space-y-6 md:block max-w-5xl mx-auto py-8">
          <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
            <aside className="lg:w-1/5">
              <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1">
                <Button variant="secondary" className="justify-start w-full">
                  Profile
                </Button>
                {/* <Button variant="ghost" className="justify-start w-full">
                  Account
                </Button> */}
              </nav>
            </aside>
            
            <div className="flex-1 lg:pl-8">
              <div className="space-y-6">
                {/* <div>
                  <h3 className="text-lg font-medium">Profile</h3>
                  <p className="text-sm text-muted-foreground">
                    This is how others will see you on the site.
                  </p>
                </div> */}
                
                {/* <Separator /> */}
                
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="space-y-2">
                    <Label>Avatar</Label>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16 border border-gray-200 dark:border-gray-700">
                        <AvatarImage 
                          src={profile?.avatar_url} 
                          onError={(e) => {
                            console.error('Error loading avatar image:', e)
                            const img = e.target as HTMLImageElement
                            console.log('Failed avatar URL:', JSON.stringify(img.src))
                            // Try to load the image directly to check if it's accessible
                            fetch(img.src)
                              .then(response => {
                                console.log('Avatar URL response:', {
                                  status: response.status,
                                  ok: response.ok,
                                  headers: Object.fromEntries(response.headers.entries())
                                })
                              })
                              .catch(error => console.error('Avatar fetch error:', error))
                          }}
                          onLoad={(e) => {
                            const img = e.target as HTMLImageElement
                            console.log('Successfully loaded avatar:', JSON.stringify(img.src))
                          }}
                          className="object-cover"
                          alt={`${profile?.full_name}'s avatar`}
                        />
                        <AvatarFallback className="text-lg">
                          {profile?.full_name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <Label 
                        htmlFor="avatar" 
                        className="cursor-pointer inline-flex items-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
                      >
                        <Upload className="h-4 w-4" />
                        Upload new avatar
                      </Label>
                      <input
                        id="avatar"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                      />
                          </div>
                        </div>

                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      name="full_name"
                      defaultValue={profile?.full_name}
                      placeholder="Your full name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      defaultValue={profile?.email}
                      disabled
                    />
                    <p className="text-[0.8rem] text-muted-foreground">
                      Your email address is managed through your account settings.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone_number">Phone Number</Label>
                    <Input
                      id="phone_number"
                      name="phone_number"
                      type="tel"
                      defaultValue={profile?.phone_number}
                      placeholder="+1234567890"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      name="bio"
                      defaultValue={profile?.bio || ''}
                      placeholder="Tell us a little bit about yourself"
                    />
                    <p className="text-[0.8rem] text-muted-foreground">
                      Write a few sentences about yourself.
                    </p>
                      </div>

                  <div>
                    <div className="space-y-2">
                      <Label>Portfolio URLs</Label>
                      <p className="text-[0.8rem] text-muted-foreground">
                        Add links to your website, blog, or social media profiles.
                      </p>
                      {portfolioUrls.map((url, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            value={url}
                            onChange={(e) => handlePortfolioUrlChange(index, e.target.value)}
                            placeholder="https://example.com"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemovePortfolioUrl(index)}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-4 w-4"
                            >
                              <path d="M18 6 6 18" />
                              <path d="m6 6 12 12" />
                            </svg>
                          </Button>
                        </div>
                      ))}
                          </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={handleAddPortfolioUrl}
                    >
                      Add URL
                    </Button>
                        </div>

                          <div>
                    <div className="space-y-2">
                      <Label>Skills</Label>
                      <p className="text-[0.8rem] text-muted-foreground">
                        Add your skills and expertise
                      </p>
                      <div className="flex gap-2">
                        <Input
                          value={newSkill}
                          onChange={(e) => setNewSkill(e.target.value)}
                          placeholder="Add a skill (e.g., React, Product Management)"
                          className="flex-1"
                        />
                        <Button type="button" onClick={handleAddSkill} variant="outline">
                          Add
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {skills.map((skill, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Input
                              value={skill}
                              onChange={(e) => {
                                const newSkills = [...skills]
                                newSkills[index] = e.target.value
                                setSkills(newSkills)
                              }}
                              placeholder="Enter your skill"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveSkill(index)}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-4 w-4"
                              >
                                <path d="M18 6 6 18" />
                                <path d="m6 6 12 12" />
                              </svg>
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <Button type="submit">Update profile</Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 