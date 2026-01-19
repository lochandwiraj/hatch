'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { getUserProfile } from '@/lib/auth'

interface UserProfile {
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

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshProfile = useCallback(async () => {
    if (user) {
      try {
        const userProfile = await getUserProfile(user.id)
        setProfile(userProfile)
      } catch (error: any) {
        console.error('Error fetching profile:', error)
        
        // If profile doesn't exist, try to create one
        if (error?.code === 'PGRST116') { // No rows returned
          console.log('Profile not found, attempting to create one...')
          try {
            // Try to create profile using the safer RPC function
            const { data: rpcResult, error: rpcError } = await supabase.rpc('create_user_profile_safe', {
              user_id: user.id,
              user_email: user.email || '',
              user_username: user.email?.split('@')[0] || `user_${user.id.slice(0, 8)}`,
              user_full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
              user_college: user.user_metadata?.college || '',
              user_graduation_year: user.user_metadata?.graduation_year || new Date().getFullYear()
            })

            if (rpcError) {
              console.error('RPC profile creation failed:', rpcError)
              // Fallback: create profile directly with conflict handling
              const { error: insertError } = await supabase
                .from('user_profiles')
                .upsert({
                  id: user.id,
                  email: user.email,
                  username: user.email?.split('@')[0] || `user_${user.id.slice(0, 8)}`,
                  full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
                  college: user.user_metadata?.college || '',
                  graduation_year: user.user_metadata?.graduation_year || new Date().getFullYear(),
                  subscription_tier: 'free',
                  profile_views_count: 0,
                  is_profile_public: true,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }, {
                  onConflict: 'id'
                })

              if (insertError) {
                console.error('Direct profile creation failed:', insertError)
                // Set a minimal profile to prevent blank page
                setProfile({
                  id: user.id,
                  username: user.email?.split('@')[0] || 'user',
                  full_name: user.email?.split('@')[0] || 'User',
                  profile_picture_url: null,
                  bio: null,
                  college: '',
                  graduation_year: new Date().getFullYear(),
                  skills: null,
                  social_links: null,
                  subscription_tier: 'free',
                  subscription_expires_at: null,
                  profile_views_count: 0,
                  is_profile_public: true,
                  custom_url: null,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                })
                return
              } else {
                console.log('Profile created successfully via direct insert')
              }
            } else {
              console.log('Profile created successfully via RPC:', rpcResult)
            }
            
            // Retry fetching the profile
            try {
              const userProfile = await getUserProfile(user.id)
              setProfile(userProfile)
            } catch (retryError) {
              console.error('Failed to fetch profile after creation:', retryError)
              // Set minimal profile as fallback
              setProfile({
                id: user.id,
                username: user.email?.split('@')[0] || 'user',
                full_name: user.email?.split('@')[0] || 'User',
                profile_picture_url: null,
                bio: null,
                college: '',
                graduation_year: new Date().getFullYear(),
                skills: null,
                social_links: null,
                subscription_tier: 'free',
                subscription_expires_at: null,
                profile_views_count: 0,
                is_profile_public: true,
                custom_url: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
            }
          } catch (createError) {
            console.error('Failed to create profile:', createError)
            // Set minimal profile as final fallback
            setProfile({
              id: user.id,
              username: user.email?.split('@')[0] || 'user',
              full_name: user.email?.split('@')[0] || 'User',
              profile_picture_url: null,
              bio: null,
              college: '',
              graduation_year: new Date().getFullYear(),
              skills: null,
              social_links: null,
              subscription_tier: 'free',
              subscription_expires_at: null,
              profile_views_count: 0,
              is_profile_public: true,
              custom_url: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
          }
        } else {
          // Other error, set minimal profile to prevent blank page
          console.error('Profile fetch error (not missing profile):', error)
          setProfile({
            id: user.id,
            username: user.email?.split('@')[0] || 'user',
            full_name: user.email?.split('@')[0] || 'User',
            profile_picture_url: null,
            bio: null,
            college: '',
            graduation_year: new Date().getFullYear(),
            skills: null,
            social_links: null,
            subscription_tier: 'free',
            subscription_expires_at: null,
            profile_views_count: 0,
            is_profile_public: true,
            custom_url: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        }
      }
    } else {
      setProfile(null)
    }
  }, [user])

  // Auto-refresh profile every 30 seconds to catch admin tier changes
  useEffect(() => {
    if (user && profile) {
      const interval = setInterval(() => {
        refreshProfile()
      }, 30000) // 30 seconds

      return () => clearInterval(interval)
    }
  }, [user, profile, refreshProfile])

  const signOut = useCallback(async () => {
    // Immediately clear state for faster UI response
    setUser(null)
    setProfile(null)
    setLoading(false)
    
    // Then perform the actual signout
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }, [])

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    // Only fetch profile if user exists and we don't already have a profile for this user
    if (user && (!profile || profile.id !== user.id)) {
      refreshProfile()
    } else if (!user && profile) {
      // Clear profile immediately when user is null (signout) only if we have a profile
      setProfile(null)
    }
  }, [user, refreshProfile]) // Include refreshProfile since it's now memoized

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}