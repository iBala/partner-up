"use client"

import { useState, useEffect } from "react"
import { useFormState } from "react-dom"
import { submitProjectApplication, type ApplicationFormState } from "@/app/actions/project-application"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Modal } from "@/components/ui/modal"
import { CheckCircle2, AlertCircle, Loader2, X } from "lucide-react"
import { createClient } from "@/lib/supabase"
import { toast } from "sonner"

interface ProjectApplicationFormProps {
  projectId: string
  projectTitle: string
  isOpen: boolean
  onClose: () => void
  creatorName?: string
}

const initialState: ApplicationFormState = {}

export function ProjectApplicationForm({ projectId, projectTitle, isOpen, onClose, creatorName }: ProjectApplicationFormProps) {
  const [state, formAction] = useFormState(submitProjectApplication, initialState)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [profileLinks, setProfileLinks] = useState<string[]>([])
  const [newLink, setNewLink] = useState("")
  const [userData, setUserData] = useState<{ fullName: string; email: string; userId: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [linkError, setLinkError] = useState<string | null>(null)
  const [formState, setFormState] = useState<ApplicationFormState>(initialState)

  useEffect(() => {
    const fetchUserData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        setUserData({
          fullName: user.user_metadata?.full_name || "",
          email: user.email || "",
          userId: user.id
        })
      }
      setIsLoading(false)
    }

    if (isOpen) {
      fetchUserData()
    }
  }, [isOpen])

  const validateUrl = (url: string): { isValid: boolean; normalizedUrl: string } => {
    try {
      // If URL doesn't start with http:// or https://, add https://
      const normalizedUrl = url.trim().startsWith('http://') || url.trim().startsWith('https://') 
        ? url.trim() 
        : `https://${url.trim()}`
      
      // Create URL object to validate
      const urlObj = new URL(normalizedUrl)
      
      // Check if the hostname has a TLD (e.g., .com, .org, etc.)
      // This regex checks for at least one dot followed by 2 or more characters
      const hasTLD = /\.([a-zA-Z]{2,})$/.test(urlObj.hostname)
      
      if (!hasTLD) {
        return { isValid: false, normalizedUrl }
      }
      
      return { isValid: true, normalizedUrl }
    } catch {
      return { isValid: false, normalizedUrl: url.trim() }
    }
  }

  const validatePhoneNumber = (phone: string): boolean => {
    // Only allow '+' at the start and numbers
    return /^\+?[0-9]+$/.test(phone)
  }

  const handleAddLink = () => {
    if (!newLink.trim()) return

    const { isValid, normalizedUrl } = validateUrl(newLink)
    if (!isValid) {
      setLinkError("Please enter a valid URL with a top-level domain (e.g., linkedin.com/in/your-profile)")
      return
    }

    setLinkError(null)
    setProfileLinks([...profileLinks, normalizedUrl])
    setNewLink("")
  }

  const handleRemoveLink = (index: number) => {
    setProfileLinks(profileLinks.filter((_, i) => i !== index))
  }

  // Handle form submission with loading state
  const handleSubmit = async (formData: FormData) => {
    console.log('1. Form submission started')
    setIsSubmitting(true)
    try {
      console.log('2. Getting Supabase session')
      // Get the current session
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      console.log('3. Session data:', session ? 'Found' : 'Not found')
      
      if (!session) {
        console.error('No session found')
        toast.error('You must be logged in to submit an application')
        throw new Error('You must be logged in to submit an application')
      }

      // Validate phone number if provided
      const phoneNumber = formData.get("phoneNumber") as string
      if (phoneNumber && !validatePhoneNumber(phoneNumber)) {
        toast.error('Phone number can only contain numbers and an optional + at the start')
        return
      }

      // Convert FormData to JSON
      const data = {
        job_id: projectId,
        applicant_user_id: session.user.id,
        applicant_name: formData.get("fullName") as string,
        applicant_email: formData.get("email") as string,
        phone_number: phoneNumber || undefined,
        application_message: formData.get("contribution") as string,
        profile_links: profileLinks,
      }

      console.log('4. Prepared data for API:', data)
      console.log('5. Making API call to:', `/api/jobs/${projectId}/apply`)

      try {
        console.log('5.1. Request details:', {
          url: `/api/jobs/${projectId}/apply`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify(data)
        })

        let response;
        try {
          console.log('5.2. Attempting fetch call...')
          response = await fetch(`/api/jobs/${projectId}/apply`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify(data),
          })
          console.log('5.3. Fetch call completed')
        } catch (error) {
          const fetchError = error as Error
          console.error('5.4. Fetch error details:', {
            error: fetchError,
            errorMessage: fetchError.message,
            errorName: fetchError.name,
            errorStack: fetchError.stack,
            isNetworkError: fetchError instanceof TypeError && fetchError.message.includes('Failed to fetch')
          })
          toast.error('Network error. Please check your connection and try again.')
          throw new Error(`Network error: ${fetchError.message}`)
        }

        console.log('6. API response received:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        })

        if (!response.ok) {
          const errorData = await response.json()
          console.error('7. API returned error:', {
            status: response.status,
            statusText: response.statusText,
            errorData,
            headers: Object.fromEntries(response.headers.entries())
          })
          toast.error(errorData.message || 'Failed to submit application. Please try again.')
          throw new Error(`API error (${response.status}): ${errorData.message}`)
        }

        const result = await response.json()
        console.log('8. Application submitted successfully:', result)

        toast.success(`Your application has been submitted successfully! We've sent your interest to ${result.creatorName || 'the builder'}.`)
        
        setFormState({ 
          success: true, 
          message: `Lovely! We've sent your interest to ${result.creatorName || 'the builder'}. Once they accept your request, you will see an email in ${result.applicantEmail}`
        })
      } catch (error) {
        console.error('Error in form submission:', error)
        if (error instanceof Error) {
          console.error('Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
          })
        }
        setFormState({ 
          success: false, 
          message: error instanceof Error ? error.message : "An unexpected error occurred. Please try again." 
        })
      } finally {
        setIsSubmitting(false)
      }
    } catch (error) {
      console.error('Error in form submission:', error)
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        })
      }
      setIsSubmitting(false)
    }
  }

  // Reset form when closed
  const handleClose = () => {
    setProfileLinks([])
    setNewLink("")
    setUserData(null)
    setIsLoading(true)
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={formState.success ? "Connection request sent" : `Tell ${creatorName || "the builder"} why you'd like to join them`}
      className="max-w-xl"
    >
      {formState.success ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="rounded-full bg-emerald-100 p-3 mb-4">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h3 className="text-2xl font-semibold mb-3 text-gray-900 dark:text-gray-100">Application sent!</h3>
          <p className="text-base text-gray-600 dark:text-gray-400 mb-6 max-w-sm leading-relaxed">
            We've sent your details to {creatorName}. If they're interested, they'll reach out to you directly via email.
          </p>
          <Button onClick={handleClose} className="min-w-[120px]">Close</Button>
        </div>
      ) : (
        <form onSubmit={(e) => {
          e.preventDefault()
          const formData = new FormData(e.currentTarget)
          handleSubmit(formData)
        }} className="space-y-6">
          <input type="hidden" name="projectId" value={projectId} />

          <div className="space-y-4">
            <div>
              <Label htmlFor="fullName" className="text-sm font-medium">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="fullName"
                name="fullName"
                placeholder="Enter your full name"
                className={state.errors?.fullName ? "border-red-500" : ""}
                defaultValue={userData?.fullName}
                disabled={isLoading}
              />
              {state.errors?.fullName && <p className="text-red-500 text-xs mt-1">{state.errors.fullName[0]}</p>}
            </div>

            <div>
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                className={state.errors?.email ? "border-red-500" : ""}
                defaultValue={userData?.email}
                disabled={isLoading}
              />
              {state.errors?.email && <p className="text-red-500 text-xs mt-1">{state.errors.email[0]}</p>}
            </div>

            <div>
              <Label htmlFor="phoneNumber" className="text-sm font-medium">
                Phone Number <span className="text-slate-400 font-normal">(optional)</span>
              </Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                placeholder="+1 (555) 123-4567"
                className={state.errors?.phoneNumber ? "border-red-500" : ""}
                pattern="^\+?[0-9]+$"
                title="Only numbers and an optional + at the start are allowed"
              />
              {state.errors?.phoneNumber && <p className="text-red-500 text-xs mt-1">{state.errors.phoneNumber[0]}</p>}
              <p className="text-xs text-slate-500 mt-1">
                Only numbers and an optional + at the start are allowed
              </p>
            </div>

            <div>
              <Label className="text-sm font-medium">
                Profile Links <span className="text-slate-400 font-normal">(optional)</span>
              </Label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={newLink}
                    onChange={(e) => {
                      setNewLink(e.target.value)
                      setLinkError(null)
                    }}
                    placeholder="Add a link (e.g., LinkedIn, portfolio, GitHub)"
                    className={`flex-1 ${linkError ? "border-red-500" : ""}`}
                  />
                  <Button type="button" onClick={handleAddLink} variant="outline">
                    Add
                  </Button>
                </div>
                {linkError && <p className="text-red-500 text-xs mt-1">{linkError}</p>}
                {profileLinks.length > 0 && (
                  <div className="space-y-1">
                    {profileLinks.map((link, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={link}
                          readOnly
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveLink(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Add links to your portfolio, LinkedIn, or other relevant profiles
              </p>
            </div>

            <div>
              <Label htmlFor="contribution" className="text-sm font-medium">
                Why do you want to apply and how can you contribute? <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="contribution"
                name="contribution"
                placeholder="Describe your interest in this project and how your skills can contribute..."
                className={`min-h-[120px] ${state.errors?.contribution ? "border-red-500" : ""}`}
              />
              {state.errors?.contribution && (
                <p className="text-red-500 text-xs mt-1">{state.errors.contribution[0]}</p>
              )}
            </div>
          </div>

          {state.message && !state.success && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-600 dark:text-red-400">{state.message}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="min-w-[100px]">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send connect request"
              )}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
