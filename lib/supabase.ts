import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Generated from the live schema with `supabase gen types typescript --linked`.
// Regenerate after any migration instead of editing by hand.
export type { Database } from './database.types'

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
export type Views<T extends keyof Database['public']['Views']> =
  Database['public']['Views'][T]['Row']

export type UserProfile = Tables<'user_profiles'>
export type Event = Tables<'events'>
export type UserRegistration = Tables<'user_registrations'>
export type PaymentSubmission = Tables<'payment_submissions'>
export type AttendanceStats = Views<'user_attendance_stats'>

export type SubscriptionTier = 'free' | 'basic_99' | 'premium_149'
