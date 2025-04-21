import { User } from '@supabase/supabase-js'

export interface SessionUser extends Omit<User, 'email' | 'name'> {
  email: string | undefined
  name: string | undefined
  image?: string | null
}

export interface Session {
  user: SessionUser
  expires: string
} 