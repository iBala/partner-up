export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      partner_profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          portfolio_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          portfolio_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          portfolio_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      partner_jobs: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string
          location: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description: string
          location?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string
          location?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      partner_shortlisted_jobs: {
        Row: {
          id: string
          user_id: string
          job_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          job_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          job_id?: string
          created_at?: string
        }
      }
      partner_connections: {
        Row: {
          id: string
          job_id: string
          sender_id: string
          receiver_id: string
          message: string
          portfolio_url: string | null
          status: 'pending' | 'accepted' | 'rejected'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          job_id: string
          sender_id: string
          receiver_id: string
          message: string
          portfolio_url?: string | null
          status?: 'pending' | 'accepted' | 'rejected'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          sender_id?: string
          receiver_id?: string
          message?: string
          portfolio_url?: string | null
          status?: 'pending' | 'accepted' | 'rejected'
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 