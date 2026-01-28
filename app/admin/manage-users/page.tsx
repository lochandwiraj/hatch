'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { 
  UserGroupIcon,
  CogIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'
import { formatDate, getSubscriptionTierName } from '@/lib/utils'

interface UserProfile {
  id: string
  username: string
  full_name: string
  email: string
  subscription_tier: 'free' | 'basic_99' | 'premium_149'
  subscription_expires_at: string | null
  tier_upgraded_by: string | null
  tier_upgraded_at: string | null
  auto_downgrade_enabled: boolean
  created_at: string
  updated_at: string
}

export default function AdminManageUsersPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTier, setFilterTier] = useState<'all' | 'free' | 'basic_99' | 'premium_149'>('all')
  const [stats, setStats] = useState({
    total: 0,
    free: 0,
    basic_99: 0,
    premium_149: 0,
    expiring_soon: 0
  })

  // Check if user is admin
  const isAdmin = user?.email === 'dwiraj06@gmail.com' || 
                  user?.email === 'pokkalilochan@gmail.com' ||
                  user?.email === 'dwiraj@HATCH.in' || 
                  user?.email === 'lochan@HATCH.in'

  useEffect(() => {
    if (isAdmin) {
      loadUsers()
    }
  }, [isAdmin, filterTier])

  const loadUsers = async () => {
    try {
      setLoading(true)
      
      console.log('Starting to load users...')
      console.log('Current user:', user?.email)
      console.log('Filter tier:', filterTier)
      
      // Load users from existing user_profiles table
      let query = supabase
        .from('user_profiles')
        .select(`
          id,
          username,
          full_name,
          email,
          subscription_tier,
          subscription_expires_at,
          tier_upgraded_by,
          tier_upgraded_at,
          auto_downgrade_enabled,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false })

      if (filterTier !== 'all') {
        query = query.eq('subscription_tier', filterTier)
      }

      const { data, error } = await query

      if (error) {
        console.error('Query error:', error)
        
        // If the new columns don't exist yet, try with basic columns
        if (error.message.includes('does not exist')) {
          console.log('New columns not found, trying with basic structure...')
          
          let basicQuery = supabase
            .from('user_profiles')
            .select(`
              id,
              username,
              full_name,
              subscription_tier,
              created_at,
              updated_at
            `)
            .order('created_at', { ascending: false })

          if (filterTier !== 'all') {
            basicQuery = basicQuery.eq('subscription_tier', filterTier)
          }

          const { data: basicData, error: basicError } = await basicQuery

          if (basicError) {
            throw new Error(`Basic query failed: ${basicError.message}`)
          }

          // Use basic data with placeholder values for new fields
          const usersWithDefaults = (basicData || []).map(profile => ({
            ...profile,
            email: 'Run schema update to see emails',
            subscription_expires_at: null,
            tier_upgraded_by: null,
            tier_upgraded_at: null,
            auto_downgrade_enabled: true
          }))

          setUsers(usersWithDefaults)
          
          // Calculate stats
          const totalUsers = usersWithDefaults.length
          const freeUsers = usersWithDefaults.filter(u => u.subscription_tier === 'free').length
          const basicUsers = usersWithDefaults.filter(u => u.subscription_tier === 'basic_99').length
          const premiumUsers = usersWithDefaults.filter(u => u.subscription_tier === 'premium_149').length

          setStats({
            total: totalUsers,
            free: freeUsers,
            basic_99: basicUsers,
            premium_149: premiumUsers,
            expiring_soon: 0
          })

          console.log('Loaded with basic structure:', totalUsers, 'users')
          toast.success(`Loaded ${totalUsers} users. Run the database schema update for full functionality.`)
          return
        }
        
        throw new Error(`Query failed: ${error.message}`)
      }

      console.log('Query successful! Found', data?.length || 0, 'users')
      console.log('Sample user:', data?.[0])

      const usersWithEmails = (data || []).map(profile => ({
        ...profile,
        email: profile.email || 'Email not available'
      }))

      setUsers(usersWithEmails)
      
      // Calculate stats
      const totalUsers = usersWithEmails.length
      const freeUsers = usersWithEmails.filter(u => u.subscription_tier === 'free').length
      const basicUsers = usersWithEmails.filter(u => u.subscription_tier === 'basic_99').length
      const premiumUsers = usersWithEmails.filter(u => u.subscription_tier === 'premium_149').length
      
      // Users expiring in next 7 days
      const expiringUsers = usersWithEmails.filter(u => {
        if (!u.subscription_expires_at) return false
        const expiryDate = new Date(u.subscription_expires_at)
        const sevenDaysFromNow = new Date()
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
        return expiryDate <= sevenDaysFromNow && expiryDate > new Date()
      }).length

      const newStats = {
        total: totalUsers,
        free: freeUsers,
        basic_99: basicUsers,
        premium_149: premiumUsers,
        expiring_soon: expiringUsers
      }

      setStats(newStats)
      console.log('Stats updated:', newStats)

    } catch (error: any) {
      console.error('Error loading users:', error)
      toast.error('Failed to load users: ' + (error.message || 'Unknown error'))
      
      // Set empty state
      setUsers([])
      setStats({
        total: 0,
        free: 0,
        basic_99: 0,
        premium_149: 0,
        expiring_soon: 0
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleUserTier = async (userId: string, currentTier: string, newTier: string) => {
    // Ask admin to specify duration for paid tiers
    let durationDays = 0;
    
    if (newTier !== 'free') {
      const durationChoice = prompt(
        `Choose subscription duration for ${getSubscriptionTierName(newTier)}:\n\n` +
        `Enter "30" for 30 days (monthly)\n` +
        `Enter "365" for 365 days (annual)\n\n` +
        `Duration (days):`,
        '30'
      );
      
      if (!durationChoice) return; // User cancelled
      
      const parsedDuration = parseInt(durationChoice);
      if (isNaN(parsedDuration) || parsedDuration < 1) {
        toast.error('Invalid duration. Please enter a valid number of days.');
        return;
      }
      
      durationDays = parsedDuration;
    }

    const durationText = durationDays === 0 ? '' : 
                        durationDays === 365 ? ' for 365 days (1 year)' : 
                        ` for ${durationDays} days`;

    if (!confirm(`Are you sure you want to change this user's tier from ${getSubscriptionTierName(currentTier)} to ${getSubscriptionTierName(newTier)}${durationText}?`)) {
      return
    }

    try {
      // Call the database function to upgrade user tier
      const { error } = await supabase.rpc('admin_upgrade_user_tier', {
        target_user_id: userId,
        new_tier: newTier,
        admin_user_id: user?.id,
        duration_days: durationDays
      })

      if (error) throw error

      const tierName = getSubscriptionTierName(newTier)
      
      toast.success(`User tier updated to ${tierName}${durationText}! Changes will reflect in their dashboard within 15 seconds.`)
      
      // Refresh the list to show updated data
      loadUsers()
      
    } catch (error: any) {
      console.error('Error updating user tier:', error)
      toast.error('Failed to update user tier: ' + (error.message || 'Unknown error'))
    }
  }

  const searchUsers = () => {
    if (!searchQuery.trim()) {
      loadUsers()
      return
    }

    const filtered = users.filter(user => 
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setUsers(filtered)
  }

  const clearSearch = () => {
    setSearchQuery('')
    loadUsers()
  }

  const getTierBadgeVariant = (tier: string) => {
    switch (tier) {
      case 'free': return 'default'
      case 'basic_99': return 'primary'
      case 'premium_149': return 'warning'
      default: return 'default'
    }
  }

  const getTimeRemaining = (expiresAt: string | null) => {
    if (!expiresAt) return null
    
    const now = new Date()
    const expiry = new Date(expiresAt)
    const diff = expiry.getTime() - now.getTime()
    
    if (diff <= 0) return 'Expired'
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    if (days > 0) return `${days}d ${hours}h`
    return `${hours}h`
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-900 mb-4">Access Denied</h1>
          <p className="text-neutral-600 mb-4">You don't have permission to access this page.</p>
          <Link href="/dashboard">
            <Button>Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold gradient-text">
                HATCH
              </Link>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link href="/dashboard" className="text-neutral-600 hover:text-primary-600">
                Dashboard
              </Link>
              <Link href="/admin/events" className="bg-primary-100 text-primary-700 hover:bg-primary-200 hover:text-primary-800 px-3 py-2 rounded-md text-sm font-medium transition-colors border border-primary-200">
                📅 Events
              </Link>
              <Link href="/admin/manage-events" className="bg-primary-100 text-primary-700 hover:bg-primary-200 hover:text-primary-800 px-3 py-2 rounded-md text-sm font-medium transition-colors border border-primary-200">
                🔧 Manage
              </Link>
              <Link href="/admin/manage-users" className="text-primary-600 font-medium">
                👥 Users
              </Link>
              <Link href="/admin/payments" className="bg-primary-100 text-primary-700 hover:bg-primary-200 hover:text-primary-800 px-3 py-2 rounded-md text-sm font-medium transition-colors border border-primary-200">
                💳 Payments
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">Manage Users</h1>
              <p className="text-neutral-600 mt-1">
                View and manage user subscriptions and tiers
              </p>
            </div>
            <Button onClick={loadUsers} disabled={loading}>
              {loading ? 'Refreshing...' : 'Refresh Users'}
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <Card className="text-center">
              <UserGroupIcon className="h-8 w-8 text-primary-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-neutral-900">
                {stats.total}
              </div>
              <p className="text-neutral-600">Total Users</p>
            </Card>
            
            <Card className="text-center">
              <div className="w-8 h-8 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-neutral-600 font-bold">F</span>
              </div>
              <div className="text-2xl font-bold text-neutral-900">
                {stats.free}
              </div>
              <p className="text-neutral-600">Free Users</p>
            </Card>
            
            <Card className="text-center">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-primary-600 font-bold">E</span>
              </div>
              <div className="text-2xl font-bold text-neutral-900">
                {stats.basic_99}
              </div>
              <p className="text-neutral-600">Explorer Users</p>
            </Card>
            
            <Card className="text-center">
              <div className="w-8 h-8 bg-warning-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-warning-600 font-bold">P</span>
              </div>
              <div className="text-2xl font-bold text-neutral-900">
                {stats.premium_149}
              </div>
              <p className="text-neutral-600">Professional Users</p>
            </Card>

            <Card className="text-center">
              <ClockIcon className="h-8 w-8 text-error-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-neutral-900">
                {stats.expiring_soon}
              </div>
              <p className="text-neutral-600">Expiring Soon</p>
            </Card>
          </div>

          {/* Search and Filters */}
          <Card>
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search users by username, name, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
                  className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              
              <Button onClick={searchUsers} disabled={loading}>
                Search
              </Button>
              
              {searchQuery && (
                <Button variant="secondary" onClick={clearSearch}>
                  Clear
                </Button>
              )}
            </div>

            {/* Tier Filter */}
            <div className="mt-4 pt-4 border-t border-neutral-200">
              <div className="flex flex-wrap gap-2">
                <span className="text-sm font-medium text-neutral-700 mr-2">Filter by tier:</span>
                {[
                  { key: 'all', label: 'All Users' },
                  { key: 'free', label: 'Free' },
                  { key: 'basic_99', label: 'Explorer' },
                  { key: 'premium_149', label: 'Professional' }
                ].map((option) => (
                  <button
                    key={option.key}
                    onClick={() => setFilterTier(option.key as any)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      filterTier === option.key
                        ? 'bg-primary-100 text-primary-800'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Users List */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse h-24 bg-neutral-200 rounded-xl"></div>
              ))}
            </div>
          ) : users.length > 0 ? (
            <div className="space-y-4">
              {users.map((userProfile) => (
                <Card key={userProfile.id}>
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-accent rounded-full flex items-center justify-center mr-3">
                            <span className="text-white font-semibold">
                              {userProfile.full_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-neutral-900">
                              {userProfile.full_name}
                            </h3>
                            <p className="text-sm text-neutral-600">@{userProfile.username}</p>
                            <p className="text-xs text-neutral-500">{userProfile.email}</p>
                          </div>
                        </div>
                        
                        <div className="ml-4 flex items-center gap-2">
                          <Badge variant={getTierBadgeVariant(userProfile.subscription_tier)}>
                            {getSubscriptionTierName(userProfile.subscription_tier)}
                          </Badge>
                          
                          {userProfile.subscription_expires_at && (
                            <div className="text-sm">
                              <div className={`px-2 py-1 rounded text-xs font-medium ${
                                getTimeRemaining(userProfile.subscription_expires_at) === 'Expired' 
                                  ? 'bg-error-100 text-error-800'
                                  : 'bg-warning-100 text-warning-800'
                              }`}>
                                ⏰ {getTimeRemaining(userProfile.subscription_expires_at)}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-neutral-600">
                        <div>
                          <span className="font-medium">Joined:</span> {formatDate(userProfile.created_at)}
                        </div>
                        {userProfile.tier_upgraded_at && (
                          <div>
                            <span className="font-medium">Last Upgraded:</span> {formatDate(userProfile.tier_upgraded_at)}
                          </div>
                        )}
                        {userProfile.subscription_expires_at && (
                          <div>
                            <span className="font-medium">Expires:</span> {formatDate(userProfile.subscription_expires_at)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Tier Toggle Buttons */}
                    <div className="flex flex-wrap gap-2 mt-4 lg:mt-0">
                      {['free', 'basic_99', 'premium_149'].map((tier) => (
                        <Button
                          key={tier}
                          variant={userProfile.subscription_tier === tier ? 'primary' : 'secondary'}
                          size="sm"
                          onClick={() => toggleUserTier(userProfile.id, userProfile.subscription_tier, tier)}
                          disabled={userProfile.subscription_tier === tier}
                        >
                          {tier === 'free' ? 'Free' : 
                           tier === 'basic_99' ? 'Explorer' : 'Professional'}
                          {userProfile.subscription_tier === tier && (
                            <CheckCircleIcon className="h-4 w-4 ml-1" />
                          )}
                        </Button>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <div className="text-center py-12">
                <UserGroupIcon className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-neutral-900 mb-2">
                  No users found
                </h3>
                <p className="text-neutral-600 mb-4">
                  {searchQuery 
                    ? 'Try adjusting your search terms or filters'
                    : 'No users match the selected filters'
                  }
                </p>
                {searchQuery && (
                  <Button variant="secondary" onClick={clearSearch}>
                    Clear Search
                  </Button>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}