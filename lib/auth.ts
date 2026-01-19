import { supabase } from './supabase'

export async function checkUsernameAvailability(username: string): Promise<boolean> {
  // Validate username format
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
  if (!usernameRegex.test(username)) {
    throw new Error('Username must be 3-20 characters long and contain only letters, numbers, and underscores')
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .select('username')
    .eq('username', username)
    .single()

  if (error && error.code === 'PGRST116') {
    // No rows returned, username is available
    return true
  }
  
  // Username exists or other error
  return false
}

export async function signUp(email: string, password: string, userData: {
  username: string
  full_name: string
  college: string
  graduation_year: number
}) {
  // Check if username is available
  const isUsernameAvailable = await checkUsernameAvailability(userData.username)
  if (!isUsernameAvailable) {
    throw new Error('Username is already taken. Please choose a different one.')
  }

  // First, sign up the user
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: userData.username,
        full_name: userData.full_name,
        college: userData.college,
        graduation_year: userData.graduation_year
      }
    }
  })

  if (error) throw error

  // If user was created successfully, create profile using RPC
  if (data.user && !data.user.email_confirmed_at) {
    // User needs email confirmation, profile will be created by trigger
    return data
  }

  // If user is immediately confirmed, create profile now
  if (data.user) {
    try {
      const { data: rpcResult, error: rpcError } = await supabase.rpc('create_user_profile_safe', {
        user_id: data.user.id,
        user_email: email,
        user_username: userData.username,
        user_full_name: userData.full_name,
        user_college: userData.college,
        user_graduation_year: userData.graduation_year
      })

      if (rpcError) {
        console.error('Profile creation error:', rpcError)
        // Don't throw error here, as auth user was created successfully
      } else {
        console.log('Profile creation result:', rpcResult)
      }
    } catch (profileError) {
      console.error('Profile creation failed:', profileError)
      // Don't throw error here, as auth user was created successfully
    }
  }

  return data
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data
}