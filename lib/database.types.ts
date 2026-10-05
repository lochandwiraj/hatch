export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      archived_attendance: {
        Row: {
          archived_at: string | null
          archived_event_id: string
          attended_at: string | null
          event_date: string
          event_name: string
          id: string
          original_event_id: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          archived_event_id: string
          attended_at?: string | null
          event_date: string
          event_name: string
          id?: string
          original_event_id: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          archived_event_id?: string
          attended_at?: string | null
          event_date?: string
          event_name?: string
          id?: string
          original_event_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "archived_attendance_archived_event_id_fkey"
            columns: ["archived_event_id"]
            isOneToOne: false
            referencedRelation: "archived_events"
            referencedColumns: ["id"]
          },
        ]
      }
      archived_events: {
        Row: {
          archived_at: string | null
          category: string | null
          created_at: string | null
          event_date: string
          event_name: string
          event_time: string | null
          id: string
          mode: string | null
          organizer: string | null
          original_event_id: string
          tier_requirement: string | null
        }
        Insert: {
          archived_at?: string | null
          category?: string | null
          created_at?: string | null
          event_date: string
          event_name: string
          event_time?: string | null
          id?: string
          mode?: string | null
          organizer?: string | null
          original_event_id: string
          tier_requirement?: string | null
        }
        Update: {
          archived_at?: string | null
          category?: string | null
          created_at?: string | null
          event_date?: string
          event_name?: string
          event_time?: string | null
          id?: string
          mode?: string | null
          organizer?: string | null
          original_event_id?: string
          tier_requirement?: string | null
        }
        Relationships: []
      }
      attendance_confirmations: {
        Row: {
          confirmed_at: string | null
          created_at: string | null
          event_id: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          confirmed_at?: string | null
          created_at?: string | null
          event_id?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          confirmed_at?: string | null
          created_at?: string | null
          event_id?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_confirmations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_deletion_impact"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "attendance_confirmations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_confirmations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events_with_datetime"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_confirmations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "user_registered_events"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_prompts: {
        Row: {
          created_at: string | null
          event_date: string
          event_id: string | null
          id: string
          prompt_date: string
          responded: boolean | null
          sent: boolean | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_date: string
          event_id?: string | null
          id?: string
          prompt_date: string
          responded?: boolean | null
          sent?: boolean | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_date?: string
          event_id?: string | null
          id?: string
          prompt_date?: string
          responded?: boolean | null
          sent?: boolean | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_prompts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_deletion_impact"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "attendance_prompts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_prompts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events_with_datetime"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_prompts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "user_registered_events"
            referencedColumns: ["id"]
          },
        ]
      }
      colleges: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      event_attendance: {
        Row: {
          attended_at: string | null
          auto_marked: boolean | null
          created_at: string | null
          event_id: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          attended_at?: string | null
          auto_marked?: boolean | null
          created_at?: string | null
          event_id?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          attended_at?: string | null
          auto_marked?: boolean | null
          created_at?: string | null
          event_id?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_attendance_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_deletion_impact"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_attendance_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_attendance_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events_with_datetime"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_attendance_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "user_registered_events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_views: {
        Row: {
          event_id: string | null
          id: string
          user_id: string | null
          viewed_at: string | null
        }
        Insert: {
          event_id?: string | null
          id?: string
          user_id?: string | null
          viewed_at?: string | null
        }
        Update: {
          event_id?: string | null
          id?: string
          user_id?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_views_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_deletion_impact"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_views_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_views_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events_with_datetime"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_views_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "user_registered_events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          category: string
          created_at: string | null
          description: string
          eligibility: string | null
          event_date: string
          event_link: string
          event_time: string | null
          id: string
          is_early_access: boolean | null
          mode: string
          organizer: string
          phases: Json | null
          poster_image_url: string | null
          prize_pool: string | null
          registration_deadline: string | null
          required_tier: string | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description: string
          eligibility?: string | null
          event_date: string
          event_link: string
          event_time?: string | null
          id?: string
          is_early_access?: boolean | null
          mode: string
          organizer: string
          phases?: Json | null
          poster_image_url?: string | null
          prize_pool?: string | null
          registration_deadline?: string | null
          required_tier?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string
          eligibility?: string | null
          event_date?: string
          event_link?: string
          event_time?: string | null
          id?: string
          is_early_access?: boolean | null
          mode?: string
          organizer?: string
          phases?: Json | null
          poster_image_url?: string | null
          prize_pool?: string | null
          registration_deadline?: string | null
          required_tier?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      external_events: {
        Row: {
          achievement: string | null
          category: string
          created_at: string | null
          description: string | null
          event_date: string
          event_name: string
          id: string
          organizer: string
          proof_url: string | null
          user_id: string | null
        }
        Insert: {
          achievement?: string | null
          category: string
          created_at?: string | null
          description?: string | null
          event_date: string
          event_name: string
          id?: string
          organizer: string
          proof_url?: string | null
          user_id?: string | null
        }
        Update: {
          achievement?: string | null
          category?: string
          created_at?: string | null
          description?: string | null
          event_date?: string
          event_name?: string
          id?: string
          organizer?: string
          proof_url?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
        }
        Relationships: []
      }
      payment_cleanup_log: {
        Row: {
          cleanup_date: string | null
          created_at: string | null
          id: string
          records_deleted: number | null
          status: string | null
        }
        Insert: {
          cleanup_date?: string | null
          created_at?: string | null
          id?: string
          records_deleted?: number | null
          status?: string | null
        }
        Update: {
          cleanup_date?: string | null
          created_at?: string | null
          id?: string
          records_deleted?: number | null
          status?: string | null
        }
        Relationships: []
      }
      payment_requests: {
        Row: {
          admin_notes: string | null
          amount: number
          created_at: string | null
          id: string
          payment_screenshot_url: string
          requested_tier: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          transaction_reference: string | null
          upi_transaction_id: string | null
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          created_at?: string | null
          id?: string
          payment_screenshot_url: string
          requested_tier: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          transaction_reference?: string | null
          upi_transaction_id?: string | null
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          created_at?: string | null
          id?: string
          payment_screenshot_url?: string
          requested_tier?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          transaction_reference?: string | null
          upi_transaction_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      payment_submissions: {
        Row: {
          admin_notes: string | null
          amount_paid: number | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          is_annual: boolean | null
          payment_method: string | null
          payment_screenshot_url: string | null
          requested_tier: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          transaction_id: string
          updated_at: string | null
          user_id: string | null
          username: string | null
        }
        Insert: {
          admin_notes?: string | null
          amount_paid?: number | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_annual?: boolean | null
          payment_method?: string | null
          payment_screenshot_url?: string | null
          requested_tier: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          transaction_id: string
          updated_at?: string | null
          user_id?: string | null
          username?: string | null
        }
        Update: {
          admin_notes?: string | null
          amount_paid?: number | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_annual?: boolean | null
          payment_method?: string | null
          payment_screenshot_url?: string | null
          requested_tier?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          transaction_id?: string
          updated_at?: string | null
          user_id?: string | null
          username?: string | null
        }
        Relationships: []
      }
      profile_views: {
        Row: {
          id: string
          profile_user_id: string | null
          referrer_source: string | null
          viewed_at: string | null
          viewer_id: string | null
        }
        Insert: {
          id?: string
          profile_user_id?: string | null
          referrer_source?: string | null
          viewed_at?: string | null
          viewer_id?: string | null
        }
        Update: {
          id?: string
          profile_user_id?: string | null
          referrer_source?: string | null
          viewed_at?: string | null
          viewer_id?: string | null
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_type: string
          earned_at: string | null
          id: string
          is_displayed: boolean | null
          user_id: string | null
        }
        Insert: {
          badge_type: string
          earned_at?: string | null
          id?: string
          is_displayed?: boolean | null
          user_id?: string | null
        }
        Update: {
          badge_type?: string
          earned_at?: string | null
          id?: string
          is_displayed?: boolean | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_events: {
        Row: {
          added_at: string | null
          event_id: string | null
          id: string
          is_verified: boolean | null
          notes: string | null
          proof_url: string | null
          relationship_type: string
          user_id: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          added_at?: string | null
          event_id?: string | null
          id?: string
          is_verified?: boolean | null
          notes?: string | null
          proof_url?: string | null
          relationship_type: string
          user_id?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          added_at?: string | null
          event_id?: string | null
          id?: string
          is_verified?: boolean | null
          notes?: string | null
          proof_url?: string | null
          relationship_type?: string
          user_id?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_deletion_impact"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "user_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events_with_datetime"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "user_registered_events"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          auto_downgrade_enabled: boolean | null
          bio: string | null
          college: string | null
          college_id: string | null
          created_at: string | null
          custom_url: string | null
          email: string | null
          events_attended_this_month: number | null
          full_name: string
          graduation_year: number | null
          id: string
          is_profile_public: boolean | null
          last_attendance_reset: string | null
          profile_picture_url: string | null
          profile_views_count: number | null
          role: string
          skills: string[] | null
          social_links: Json | null
          subscription_expires_at: string | null
          subscription_tier: string | null
          tier_upgraded_at: string | null
          tier_upgraded_by: string | null
          total_events_attended: number | null
          updated_at: string | null
          username: string
        }
        Insert: {
          auto_downgrade_enabled?: boolean | null
          bio?: string | null
          college?: string | null
          college_id?: string | null
          created_at?: string | null
          custom_url?: string | null
          email?: string | null
          events_attended_this_month?: number | null
          full_name: string
          graduation_year?: number | null
          id: string
          is_profile_public?: boolean | null
          last_attendance_reset?: string | null
          profile_picture_url?: string | null
          profile_views_count?: number | null
          role?: string
          skills?: string[] | null
          social_links?: Json | null
          subscription_expires_at?: string | null
          subscription_tier?: string | null
          tier_upgraded_at?: string | null
          tier_upgraded_by?: string | null
          total_events_attended?: number | null
          updated_at?: string | null
          username: string
        }
        Update: {
          auto_downgrade_enabled?: boolean | null
          bio?: string | null
          college?: string | null
          college_id?: string | null
          created_at?: string | null
          custom_url?: string | null
          email?: string | null
          events_attended_this_month?: number | null
          full_name?: string
          graduation_year?: number | null
          id?: string
          is_profile_public?: boolean | null
          last_attendance_reset?: string | null
          profile_picture_url?: string | null
          profile_views_count?: number | null
          role?: string
          skills?: string[] | null
          social_links?: Json | null
          subscription_expires_at?: string | null
          subscription_tier?: string | null
          tier_upgraded_at?: string | null
          tier_upgraded_by?: string | null
          total_events_attended?: number | null
          updated_at?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_registrations: {
        Row: {
          created_at: string | null
          event_id: string | null
          id: string
          registered_at: string | null
          registration_status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_id?: string | null
          id?: string
          registered_at?: string | null
          registration_status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_id?: string | null
          id?: string
          registered_at?: string | null
          registration_status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_deletion_impact"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "user_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events_with_datetime"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "user_registered_events"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          bio: string | null
          college: string | null
          created_at: string | null
          custom_url: string | null
          email: string
          full_name: string
          graduation_year: number | null
          id: string
          is_profile_public: boolean | null
          profile_picture_url: string | null
          profile_views_count: number | null
          skills: string[] | null
          social_links: Json | null
          subscription_expires_at: string | null
          subscription_tier: string | null
          updated_at: string | null
          username: string
        }
        Insert: {
          bio?: string | null
          college?: string | null
          created_at?: string | null
          custom_url?: string | null
          email: string
          full_name: string
          graduation_year?: number | null
          id?: string
          is_profile_public?: boolean | null
          profile_picture_url?: string | null
          profile_views_count?: number | null
          skills?: string[] | null
          social_links?: Json | null
          subscription_expires_at?: string | null
          subscription_tier?: string | null
          updated_at?: string | null
          username: string
        }
        Update: {
          bio?: string | null
          college?: string | null
          created_at?: string | null
          custom_url?: string | null
          email?: string
          full_name?: string
          graduation_year?: number | null
          id?: string
          is_profile_public?: boolean | null
          profile_picture_url?: string | null
          profile_views_count?: number | null
          skills?: string[] | null
          social_links?: Json | null
          subscription_expires_at?: string | null
          subscription_tier?: string | null
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      event_deletion_impact: {
        Row: {
          attendance_records: number | null
          event_id: string | null
          event_title: string | null
          registered_users: number | null
          status: string | null
        }
        Relationships: []
      }
      events_with_datetime: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          eligibility: string | null
          event_date: string | null
          event_datetime: string | null
          event_link: string | null
          event_time: string | null
          id: string | null
          is_early_access: boolean | null
          mode: string | null
          organizer: string | null
          poster_image_url: string | null
          prize_pool: string | null
          registration_deadline: string | null
          required_tier: string | null
          status: string | null
          tags: string[] | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          eligibility?: string | null
          event_date?: string | null
          event_datetime?: never
          event_link?: string | null
          event_time?: string | null
          id?: string | null
          is_early_access?: boolean | null
          mode?: string | null
          organizer?: string | null
          poster_image_url?: string | null
          prize_pool?: string | null
          registration_deadline?: string | null
          required_tier?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          eligibility?: string | null
          event_date?: string | null
          event_datetime?: never
          event_link?: string | null
          event_time?: string | null
          id?: string | null
          is_early_access?: boolean | null
          mode?: string | null
          organizer?: string | null
          poster_image_url?: string | null
          prize_pool?: string | null
          registration_deadline?: string | null
          required_tier?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_attendance_stats: {
        Row: {
          events_attended_this_month: number | null
          events_remaining: number | null
          full_name: string | null
          id: string | null
          last_attendance_reset: string | null
          monthly_limit: number | null
          subscription_tier: string | null
          total_events_attended: number | null
          username: string | null
        }
        Insert: {
          events_attended_this_month?: number | null
          events_remaining?: never
          full_name?: string | null
          id?: string | null
          last_attendance_reset?: string | null
          monthly_limit?: never
          subscription_tier?: string | null
          total_events_attended?: number | null
          username?: string | null
        }
        Update: {
          events_attended_this_month?: number | null
          events_remaining?: never
          full_name?: string | null
          id?: string | null
          last_attendance_reset?: string | null
          monthly_limit?: never
          subscription_tier?: string | null
          total_events_attended?: number | null
          username?: string | null
        }
        Relationships: []
      }
      user_attendance_with_events: {
        Row: {
          attendance_id: string | null
          attended_at: string | null
          auto_marked: boolean | null
          category: string | null
          event_date: string | null
          event_id: string | null
          event_time: string | null
          event_title: string | null
          mode: string | null
          organizer: string | null
          registered_at: string | null
          required_tier: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_attendance_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_deletion_impact"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_attendance_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_attendance_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events_with_datetime"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_attendance_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "user_registered_events"
            referencedColumns: ["id"]
          },
        ]
      }
      user_complete_attendance: {
        Row: {
          attended_at: string | null
          category: string | null
          event_date: string | null
          event_id: string | null
          event_name: string | null
          event_time: string | null
          is_archived: boolean | null
          mode: string | null
          organizer: string | null
          required_tier: string | null
          subscription_tier: string | null
          user_id: string | null
        }
        Relationships: []
      }
      user_registered_events: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          eligibility: string | null
          event_date: string | null
          event_link: string | null
          event_time: string | null
          id: string | null
          is_early_access: boolean | null
          mode: string | null
          organizer: string | null
          phases: Json | null
          poster_image_url: string | null
          prize_pool: string | null
          registered_at: string | null
          registration_deadline: string | null
          registration_id: string | null
          registration_status: string | null
          required_tier: string | null
          status: string | null
          tags: string[] | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_upgrade_user_tier: {
        Args: {
          admin_user_id: string
          duration_days?: number
          new_tier: string
          target_user_id: string
        }
        Returns: undefined
      }
      archive_event_data: {
        Args: { event_id_param: string }
        Returns: undefined
      }
      auto_downgrade_expired_subscriptions: { Args: never; Returns: undefined }
      auto_mark_attendance: { Args: never; Returns: number }
      can_attend_event: { Args: { user_uuid: string }; Returns: boolean }
      cleanup_old_payments: { Args: never; Returns: undefined }
      college_key: { Args: { raw: string }; Returns: string }
      confirm_attendance: {
        Args: { did_attend: boolean; event_uuid: string; user_uuid: string }
        Returns: Json
      }
      create_user_profile_safe: {
        Args: {
          user_college?: string
          user_email: string
          user_full_name?: string
          user_graduation_year?: number
          user_id: string
          user_username?: string
        }
        Returns: Json
      }
      current_app_role: { Args: never; Returns: string }
      current_college_id: { Args: never; Returns: string }
      delete_old_events: { Args: never; Returns: undefined }
      get_attendance_limit: { Args: { tier: string }; Returns: number }
      get_events_needing_attendance_confirmation: {
        Args: { user_uuid: string }
        Returns: {
          category: string
          description: string
          event_date: string
          event_id: string
          event_time: string
          mode: string
          organizer: string
          registered_at: string
          title: string
        }[]
      }
      get_pending_attendance_prompts: {
        Args: { user_uuid: string }
        Returns: {
          event_date: string
          event_id: string
          event_title: string
          prompt_date: string
          prompt_id: string
        }[]
      }
      get_user_archived_attendance: {
        Args: { user_uuid: string }
        Returns: {
          attended_at: string
          category: string
          event_date: string
          event_name: string
          event_time: string
          mode: string
          organizer: string
        }[]
      }
      get_user_attendance_stats: {
        Args: { user_uuid: string }
        Returns: {
          attendance_rate: number
          total_attended: number
          total_registered: number
        }[]
      }
      is_username_available: { Args: { candidate: string }; Returns: boolean }
      log_payment_cleanup: { Args: never; Returns: undefined }
      mark_manual_attendance: {
        Args: { event_uuid: string; user_uuid: string }
        Returns: boolean
      }
      register_for_event: {
        Args: { event_uuid: string; user_uuid: string }
        Returns: Json
      }
      reset_monthly_attendance: {
        Args: { user_uuid: string }
        Returns: undefined
      }
      run_payment_cleanup: {
        Args: never
        Returns: {
          cleanup_date: string
          records_deleted: number
          status: string
        }[]
      }
      sync_user_emails: { Args: never; Returns: undefined }
      validate_transaction_id: { Args: { txn_id: string }; Returns: boolean }
      validate_transaction_id_simple: {
        Args: { txn_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
