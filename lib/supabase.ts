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
          subscription_tier: 'free' | 'explorer_99' | 'professional_199'
          events_attended: number
          subscription_expires_at: string | null
          subscription_updated_at: string
          referral_code: string | null
          referred_by: string | null
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
          subscription_tier?: 'free' | 'explorer_99' | 'professional_199'
          events_attended?: number
          subscription_expires_at?: string | null
          subscription_updated_at?: string
          referral_code?: string | null
          referred_by?: string | null
        }
        Update: {
          email?: string
          username?: string
          full_name?: string
          college?: string
          graduation_year?: number
          bio?: string | null
          skills?: string[] | null
          subscription_tier?: 'free' | 'explorer_99' | 'professional_199'
          events_attended?: number
          subscription_expires_at?: string | null
          subscription_updated_at?: string
          referral_code?: string | null
          referred_by?: string | null
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
          required_tier: 'free' | 'explorer_99' | 'professional_199'
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
          required_tier?: 'free' | 'explorer_99' | 'professional_199'
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
          required_tier?: 'free' | 'explorer_99' | 'professional_199'
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
      referrals: {
        Row: {
          id: string
          referrer_id: string
          referee_id: string | null
          referee_email: string
          status: 'pending' | 'signed_up' | 'paid'
          discount_applied: number | null
          reward_given: boolean
          created_at: string
        }
        Insert: {
          referrer_id: string
          referee_email: string
          status?: 'pending' | 'signed_up' | 'paid'
          discount_applied?: number | null
          reward_given?: boolean
        }
        Update: {
          referee_id?: string | null
          status?: 'pending' | 'signed_up' | 'paid'
          discount_applied?: number | null
          reward_given?: boolean
        }
      }
      organizer_listings: {
        Row: {
          id: string
          event_id: string
          organizer_name: string
          organizer_email: string
          amount_paid: number
          payment_status: 'pending' | 'paid'
          analytics_views: number
          analytics_clicks: number
          analytics_bookmarks: number
          featured_until: string
          created_at: string
        }
        Insert: {
          event_id: string
          organizer_name: string
          organizer_email: string
          amount_paid: number
          payment_status?: 'pending' | 'paid'
          analytics_views?: number
          analytics_clicks?: number
          analytics_bookmarks?: number
          featured_until: string
        }
        Update: {
          payment_status?: 'pending' | 'paid'
          analytics_views?: number
          analytics_clicks?: number
          analytics_bookmarks?: number
          featured_until?: string
        }
      }
    }
  }
}