import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/supabase'

type Event = Database['public']['Tables']['events']['Row']
type EventInsert = Database['public']['Tables']['events']['Insert']
type EventUpdate = Database['public']['Tables']['events']['Update']

export async function getEvents(filters?: {
  status?: 'draft' | 'published' | 'cancelled'
  userTier?: 'free' | 'basic_99' | 'premium_149'
  limit?: number
}) {
  let query = supabase
    .from('events')
    .select('*')
    .order('event_date', { ascending: true })

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  if (filters?.userTier) {
    // Filter events based on user's subscription tier
    const tierHierarchy = {
      free: ['free'],
      basic_99: ['free', 'basic_99'],
      premium_149: ['free', 'basic_99', 'premium_149']
    }
    
    const allowedTiers = tierHierarchy[filters.userTier]
    query = query.in('required_tier', allowedTiers)
  }

  if (filters?.limit) {
    query = query.limit(filters.limit)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

export async function getEvent(id: string) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function createEvent(event: EventInsert) {
  const { data, error } = await supabase
    .from('events')
    .insert(event)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateEvent(id: string, updates: EventUpdate) {
  const { data, error } = await supabase
    .from('events')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteEvent(id: string) {
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function getUpcomingEvents(userTier: string, limit = 5) {
  const now = new Date().toISOString()
  
  const tierHierarchy = {
    free: ['free'],
    basic_99: ['free', 'basic_99'],
    premium_149: ['free', 'basic_99', 'premium_149']
  }
  
  const allowedTiers = tierHierarchy[userTier as keyof typeof tierHierarchy]

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'published')
    .in('required_tier', allowedTiers)
    .gte('event_date', now)
    .order('event_date', { ascending: true })
    .limit(limit)

  if (error) throw error
  return data
}

export async function searchEvents(query: string, userTier: string) {
  const tierHierarchy = {
    free: ['free'],
    basic_99: ['free', 'basic_99'],
    premium_149: ['free', 'basic_99', 'premium_149']
  }
  
  const allowedTiers = tierHierarchy[userTier as keyof typeof tierHierarchy]

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'published')
    .in('required_tier', allowedTiers)
    .or(`title.ilike.%${query}%,description.ilike.%${query}%,location.ilike.%${query}%`)
    .order('event_date', { ascending: true })

  if (error) throw error
  return data
}