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
          username: string
          full_name: string
          profile_picture_url: string | null
          bio: string | null
          college: string | null
          graduation_year: number | null
          skills: string[] | null
          social_links: any | null
          subscription_tier: 'free' | 'basic_99' | 'premium_149'
          subscription_expires_at: string | null
          profile_views_count: number
          is_profile_public: boolean
          custom_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          full_name: string
          profile_picture_url?: string | null
          bio?: string | null
          college?: string | null
          graduation_year?: number | null
          skills?: string[] | null
          social_links?: any | null
          subscription_tier?: 'free' | 'basic_99' | 'premium_149'
          subscription_expires_at?: string | null
          profile_views_count?: number
          is_profile_public?: boolean
          custom_url?: string | null
        }
        Update: {
          username?: string
          full_name?: string
          profile_picture_url?: string | null
          bio?: string | null
          college?: string | null
          graduation_year?: number | null
          skills?: string[] | null
          social_links?: any | null
          subscription_tier?: 'free' | 'basic_99' | 'premium_149'
          subscription_expires_at?: string | null
          profile_views_count?: number
          is_profile_public?: boolean
          custom_url?: string | null
        }
      }
      events: {
        Row: {
          id: string
          title: string
          description: string
          event_link: string
          poster_image_url: string | null
          category: string
          tags: string[] | null
          event_date: string
          registration_deadline: string | null
          required_tier: 'free' | 'basic_99' | 'premium_149'
          status: 'draft' | 'published'
          is_early_access: boolean
          organizer: string
          prize_pool: string | null
          mode: string
          eligibility: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          title: string
          description: string
          event_link: string
          poster_image_url?: string | null
          category: string
          tags?: string[] | null
          event_date: string
          registration_deadline?: string | null
          required_tier?: 'free' | 'basic_99' | 'premium_149'
          status?: 'draft' | 'published'
          is_early_access?: boolean
          organizer: string
          prize_pool?: string | null
          mode: string
          eligibility?: string | null
        }
        Update: {
          title?: string
          description?: string
          event_link?: string
          poster_image_url?: string | null
          category?: string
          tags?: string[] | null
          event_date?: string
          registration_deadline?: string | null
          required_tier?: 'free' | 'basic_99' | 'premium_149'
          status?: 'draft' | 'published'
          is_early_access?: boolean
          organizer?: string
          prize_pool?: string | null
          mode?: string
          eligibility?: string | null
        }
      }
      user_events: {
        Row: {
          id: string
          user_id: string
          event_id: string
          relationship_type: 'registered' | 'attended' | 'won'
          is_verified: boolean
          verified_by: string | null
          verified_at: string | null
          proof_url: string | null
          added_at: string
          notes: string | null
        }
        Insert: {
          user_id: string
          event_id: string
          relationship_type: 'registered' | 'attended' | 'won'
          is_verified?: boolean
          verified_by?: string | null
          verified_at?: string | null
          proof_url?: string | null
          notes?: string | null
        }
        Update: {
          relationship_type?: 'registered' | 'attended' | 'won'
          is_verified?: boolean
          verified_by?: string | null
          verified_at?: string | null
          proof_url?: string | null
          notes?: string | null
        }
      }
      payment_requests: {
        Row: {
          id: string
          user_id: string
          requested_tier: 'basic_99' | 'premium_149'
          amount: number
          payment_screenshot_url: string
          transaction_reference: string | null
          upi_transaction_id: string | null
          status: 'pending' | 'approved' | 'rejected'
          admin_notes: string | null
          reviewed_by: string | null
          reviewed_at: string | null
          created_at: string
        }
        Insert: {
          user_id: string
          requested_tier: 'basic_99' | 'premium_149'
          amount: number
          payment_screenshot_url: string
          transaction_reference?: string | null
          upi_transaction_id?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          admin_notes?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
        }
        Update: {
          status?: 'pending' | 'approved' | 'rejected'
          admin_notes?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
        }
      }
    }
  }
}