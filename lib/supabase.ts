import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          email: string
          username: string
          full_name: string
          college: string
          graduation_year: number
          bio: string | null
          skills: string[] | null
          subscription_tier: 'free' | 'basic_99' | 'premium_149'
          events_attended: number
          subscription_expires_at: string | null
          subscription_updated_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          username: string
          full_name: string
          college: string
          graduation_year: number
          bio?: string | null
          skills?: string[] | null
          subscription_tier?: 'free' | 'basic_99' | 'premium_149'
          events_attended?: number
          subscription_expires_at?: string | null
          subscription_updated_at?: string
        }
        Update: {
          email?: string
          username?: string
          full_name?: string
          college?: string
          graduation_year?: number
          bio?: string | null
          skills?: string[] | null
          subscription_tier?: 'free' | 'basic_99' | 'premium_149'
          events_attended?: number
          subscription_expires_at?: string | null
          subscription_updated_at?: string
        }
      }
      events: {
        Row: {
          id: string
          title: string
          description: string
          event_date: string
          location: string
          max_attendees: number | null
          current_attendees: number
          required_tier: 'free' | 'basic_99' | 'premium_149'
          status: 'draft' | 'published' | 'cancelled'
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          title: string
          description: string
          event_date: string
          location: string
          max_attendees?: number | null
          current_attendees?: number
          required_tier?: 'free' | 'basic_99' | 'premium_149'
          status?: 'draft' | 'published' | 'cancelled'
          created_by: string
        }
        Update: {
          title?: string
          description?: string
          event_date?: string
          location?: string
          max_attendees?: number | null
          current_attendees?: number
          required_tier?: 'free' | 'basic_99' | 'premium_149'
          status?: 'draft' | 'published' | 'cancelled'
        }
      }
      attendance_confirmations: {
        Row: {
          id: string
          user_id: string
          event_id: string
          event_title: string
          event_date: string
          confirmation_status: 'pending' | 'attended' | 'not_attended'
          confirmed_at: string | null
          created_at: string
        }
        Insert: {
          user_id: string
          event_id: string
          event_title: string
          event_date: string
          confirmation_status?: 'pending' | 'attended' | 'not_attended'
          confirmed_at?: string | null
        }
        Update: {
          confirmation_status?: 'pending' | 'attended' | 'not_attended'
          confirmed_at?: string | null
        }
      }
    }
  }
}