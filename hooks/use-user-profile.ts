import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { toast } from 'sonner'

const PROFILE_CACHE_KEY = 'builder_board_profile'
const CACHE_EXPIRY = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

export interface UserProfile {
  id: string
  full_name: string
  avatar_url: string
  phone_number: string
  bio: string | null
  portfolio_url: string[]
  skills: string[]
  email: string // From auth.users
  cached_at?: number // Timestamp for cache management
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    // Try to load from localStorage on initial mount
    try {
      const cached = localStorage.getItem(PROFILE_CACHE_KEY)
      if (cached) {
        const parsedCache = JSON.parse(cached) as UserProfile
        // Check if cache is still valid (less than 24 hours old)
        if (parsedCache.cached_at && Date.now() - parsedCache.cached_at < CACHE_EXPIRY) {
          console.log('Using cached profile data')
          return parsedCache
        } else {
          console.log('Cache expired, will fetch fresh data')
          localStorage.removeItem(PROFILE_CACHE_KEY)
        }
      }
    } catch (error) {
      console.error('Error reading from cache:', error)
    }
    return null
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) {
          setLoading(false)
          return
        }

        console.log('Loading profile for user:', session.user.id)

        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (error) throw error

        // Log the complete data without console's truncation
        console.log('Raw profile data:', JSON.stringify(data, null, 2))

        // Convert to public URL if it's a signed URL
        if (data.avatar_url && data.avatar_url.includes('/object/sign/')) {
          const avatarPath = data.avatar_url.split('/').slice(-2).join('/')
          console.log('Converting to public URL for avatar:', avatarPath)
          
          const { data: publicUrlData } = supabase
            .storage
            .from('avatars')
            .getPublicUrl(avatarPath)

          data.avatar_url = publicUrlData.publicUrl
          console.log('Converted to public URL:', data.avatar_url)

          // Update the stored URL to public URL
          const { error: updateError } = await supabase
            .from('user_profiles')
            .update({ avatar_url: data.avatar_url })
            .eq('id', session.user.id)

          if (updateError) {
            console.error('Error updating to public URL:', updateError)
          }
        }

        const profileData = {
          ...data,
          email: session.user.email || '', // Include email from auth session
          cached_at: Date.now() // Add timestamp for cache management
        }

        // Cache the profile data
        try {
          localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profileData))
          console.log('Profile data cached successfully')
        } catch (error) {
          console.error('Error caching profile data:', error)
        }

        // Log the final profile data
        console.log('Final profile data:', JSON.stringify(profileData, null, 2))

        setProfile(profileData)
      } catch (error) {
        console.error('Error loading profile:', error)
        toast.error('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    // Only load from API if we don't have valid cached data
    if (!profile || !profile.cached_at || Date.now() - profile.cached_at >= CACHE_EXPIRY) {
      loadProfile()
    } else {
      setLoading(false)
    }
  }, [supabase, profile])

  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) throw new Error('No user session')

      const { error } = await supabase
        .from('user_profiles')
        .update({
          full_name: updates.full_name,
          phone_number: updates.phone_number,
          bio: updates.bio,
          portfolio_url: updates.portfolio_url,
          skills: updates.skills,
        })
        .eq('id', session.user.id)

      if (error) throw error

      // Update auth.users metadata if name changed
      if (updates.full_name) {
        const { error: updateAuthError } = await supabase.auth.updateUser({
          data: { full_name: updates.full_name }
        })

        if (updateAuthError) throw updateAuthError
      }

      // Remove phone number update from auth.users
      // if (updates.phone_number) {
      //   const { error: updatePhoneError } = await supabase.auth.updateUser({
      //     phone: updates.phone_number
      //   })

      //   if (updatePhoneError) throw updatePhoneError
      // }

      const updatedProfile = profile ? {
        ...profile,
        ...updates,
        id: profile.id, // Ensure required fields are present
        full_name: updates.full_name || profile.full_name,
        avatar_url: profile.avatar_url,
        email: profile.email,
        cached_at: Date.now()
      } : null
      
      // Update cache with new data
      if (updatedProfile) {
        try {
          localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(updatedProfile))
          console.log('Updated profile cached successfully')
        } catch (error) {
          console.error('Error caching updated profile:', error)
        }
      }

      setProfile(updatedProfile)
      toast.success('Profile updated successfully')
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
      throw error
    }
  }

  const uploadAvatar = async (file: File) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) throw new Error('No user session')

      const fileExt = file.name.split('.').pop()
      const fileName = `${session.user.id}.${fileExt}`
      const filePath = `${session.user.id}/${fileName}`

      console.log('Uploading avatar with:', {
        userId: session.user.id,
        filePath,
        bucket: 'avatars'
      })

      // Upload to storage
      const { error: uploadError } = await supabase
        .storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) {
        console.error('Upload error details:', uploadError)
        throw uploadError
      }

      // Get public URL
      const { data: publicUrlData } = supabase
        .storage
        .from('avatars')
        .getPublicUrl(filePath)

      const avatarUrl = publicUrlData.publicUrl
      console.log('New avatar public URL:', avatarUrl)

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', session.user.id)

      if (updateError) throw updateError

      // Update auth metadata
      const { error: updateAuthError } = await supabase.auth.updateUser({
        data: { avatar_url: avatarUrl }
      })

      if (updateAuthError) throw updateAuthError

      const updatedProfile = profile ? { ...profile, avatar_url: avatarUrl, cached_at: Date.now() } : null
      
      // Update cache with new avatar
      if (updatedProfile) {
        try {
          localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(updatedProfile))
          console.log('Profile with new avatar cached successfully')
        } catch (error) {
          console.error('Error caching profile with new avatar:', error)
        }
      }

      setProfile(updatedProfile)
      toast.success('Avatar updated successfully')
    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast.error('Failed to upload avatar')
      throw error
    }
  }

  return {
    profile,
    loading,
    updateProfile,
    uploadAvatar
  }
} 