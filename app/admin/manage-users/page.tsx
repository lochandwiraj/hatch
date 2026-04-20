'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import Header from '@/components/layout/Header'
import Link from 'next/link'
import {
  UserGroupIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  CheckCircleIcon,
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

const ADMIN_EMAILS = ['dwiraj06@gmail.com', 'pokkalilochan@gmail.com', 'dwiraj@HATCH.in', 'lochan@HATCH.in']

const tierStyle = (t: string) => t === 'free' ? 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' : t === 'basic_99' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'

const getTimeRemaining = (expiresAt: string | null) => {
  if (!expiresAt) return null
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return 'Expired'
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  return days > 0 ? `${days}d ${hours}h` : `${hours}h`
}

export default function AdminManageUsersPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTier, setFilterTier] = useState<'all' | 'free' | 'basic_99' | 'premium_149'>('all')
  const [stats, setStats] = useState({ total: 0, free: 0, basic_99: 0, premium_149: 0, expiring_soon: 0 })

  const isAdmin = ADMIN_EMAILS.includes(user?.email || '')

  useEffect(() => {
    if (isAdmin) loadUsers()
  }, [isAdmin, filterTier])

  const loadUsers = async () => {
    try {
      setLoading(true)
      let query = supabase.from('user_profiles').select('id,username,full_name,email,subscription_tier,subscription_expires_at,tier_upgraded_by,tier_upgraded_at,auto_downgrade_enabled,created_at,updated_at').order('created_at', { ascending: false })
      if (filterTier !== 'all') query = query.eq('subscription_tier', filterTier)
      const { data, error } = await query

      if (error) {
        if (error.message.includes('does not exist')) {
          const { data: basicData, error: basicError } = await supabase.from('user_profiles').select('id,username,full_name,subscription_tier,created_at,updated_at').order('created_at', { ascending: false })
          if (basicError) throw basicError
          const withDefaults = (basicData || []).map(p => ({ ...p, email: 'Run schema update to see emails', subscription_expires_at: null, tier_upgraded_by: null, tier_upgraded_at: null, auto_downgrade_enabled: true }))
          setUsers(withDefaults as UserProfile[])
          setStats({ total: withDefaults.length, free: withDefaults.filter(u => u.subscription_tier === 'free').length, basic_99: withDefaults.filter(u => u.subscription_tier === 'basic_99').length, premium_149: withDefaults.filter(u => u.subscription_tier === 'premium_149').length, expiring_soon: 0 })
          return
        }
        throw error
      }

      const usersData = (data || []).map(p => ({ ...p, email: p.email || 'Email not available' })) as UserProfile[]
      setUsers(usersData)
      const sevenDays = new Date(); sevenDays.setDate(sevenDays.getDate() + 7)
      setStats({
        total: usersData.length,
        free: usersData.filter(u => u.subscription_tier === 'free').length,
        basic_99: usersData.filter(u => u.subscription_tier === 'basic_99').length,
        premium_149: usersData.filter(u => u.subscription_tier === 'premium_149').length,
        expiring_soon: usersData.filter(u => u.subscription_expires_at && new Date(u.subscription_expires_at) <= sevenDays && new Date(u.subscription_expires_at) > new Date()).length,
      })
    } catch (err: any) {
      toast.error('Failed to load users: ' + (err.message || 'Unknown error'))
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const toggleUserTier = async (userId: string, currentTier: string, newTier: string) => {
    let durationDays = 0
    if (newTier !== 'free') {
      const choice = prompt(`Duration for ${getSubscriptionTierName(newTier)} (days):\n30 = monthly, 365 = annual, 36500 = lifetime\nMax: 36500`, '30')
      if (!choice) return
      const parsed = parseInt(choice)
      if (isNaN(parsed) || parsed < 1) { toast.error('Invalid duration.'); return }
      durationDays = Math.min(parsed, 36500)
    }

    const durationText = durationDays === 0 ? '' : ` for ${durationDays} days`
    if (!confirm(`Change tier from ${getSubscriptionTierName(currentTier)} to ${getSubscriptionTierName(newTier)}${durationText}?`)) return

    try {
      const { error } = await supabase.rpc('admin_upgrade_user_tier', { target_user_id: userId, new_tier: newTier, admin_user_id: user?.id, duration_days: durationDays })
      if (error) throw error
      toast.success(`Tier updated to ${getSubscriptionTierName(newTier)}${durationText}!`)
      loadUsers()
    } catch (err: any) {
      toast.error('Failed to update tier: ' + (err.message || 'Unknown error'))
    }
  }

  const filteredUsers = searchQuery.trim()
    ? users.filter(u => u.username.toLowerCase().includes(searchQuery.toLowerCase()) || u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase()))
    : users

  if (!isAdmin) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <p className="text-white font-medium mb-2">Access Denied</p>
            <p className="text-zinc-500 text-sm mb-4">You don't have permission to access this page.</p>
            <Link href="/dashboard" className="text-sm text-violet-400 hover:text-violet-300 transition-colors">Go to Dashboard</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-white mb-1">Manage Users</h1>
            <p className="text-sm text-zinc-500">View and manage user subscriptions and tiers.</p>
          </div>
          <button onClick={loadUsers} disabled={loading} className="text-sm text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-50 px-3.5 py-2 rounded-lg transition-colors">
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {[
            { label: 'Total', value: stats.total, icon: UserGroupIcon },
            { label: 'Free', value: stats.free, badge: 'F' },
            { label: 'Explorer', value: stats.basic_99, badge: 'E' },
            { label: 'Professional', value: stats.premium_149, badge: 'P' },
            { label: 'Expiring Soon', value: stats.expiring_soon, icon: ClockIcon },
          ].map(stat => (
            <div key={stat.label} className="bg-[#111111] border border-white/[0.07] rounded-xl p-4">
              {stat.icon ? <stat.icon className="w-4 h-4 text-zinc-600 mb-2" /> : <div className="w-4 h-4 flex items-center justify-center text-xs text-zinc-600 font-bold mb-2">{stat.badge}</div>}
              <div className="text-2xl font-semibold text-white">{stat.value}</div>
              <div className="text-xs text-zinc-500 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Search + Filters */}
        <div className="bg-[#111111] border border-white/[0.07] rounded-xl p-4 mb-5 space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
              <input
                type="text"
                placeholder="Search by username, name, or email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[#080808] border border-white/[0.07] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-colors"
              />
            </div>
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-sm text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] px-3 py-2 rounded-lg transition-colors">Clear</button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(['all', 'free', 'basic_99', 'premium_149'] as const).map(f => (
              <button key={f} onClick={() => setFilterTier(f)} className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${filterTier === f ? 'bg-violet-600 text-white' : 'bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08]'}`}>
                {f === 'all' ? 'All Users' : f === 'free' ? 'Free' : f === 'basic_99' ? 'Explorer' : 'Professional'}
              </button>
            ))}
          </div>
        </div>

        {/* Users */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-[#111111] rounded-xl animate-pulse" />)}
          </div>
        ) : filteredUsers.length > 0 ? (
          <div className="space-y-3">
            {filteredUsers.map(u => {
              const timeLeft = getTimeRemaining(u.subscription_expires_at)
              return (
                <div key={u.id} className="bg-[#111111] border border-white/[0.07] rounded-xl p-4">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 bg-violet-600/20 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-sm font-semibold text-violet-400">{u.full_name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-0.5">
                          <p className="text-sm font-medium text-white">{u.full_name}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${tierStyle(u.subscription_tier)}`}>
                            {getSubscriptionTierName(u.subscription_tier)}
                          </span>
                          {timeLeft && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${timeLeft === 'Expired' ? 'text-red-400 bg-red-500/10' : 'text-yellow-400 bg-yellow-500/10'}`}>
                              {timeLeft}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-500">@{u.username} · {u.email}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-zinc-600 mt-1">
                          <span>Joined {formatDate(u.created_at)}</span>
                          {u.tier_upgraded_at && <span>Upgraded {formatDate(u.tier_upgraded_at)}</span>}
                          {u.subscription_expires_at && <span>Expires {formatDate(u.subscription_expires_at)}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 shrink-0">
                      {(['free', 'basic_99', 'premium_149'] as const).map(tier => (
                        <button
                          key={tier}
                          onClick={() => toggleUserTier(u.id, u.subscription_tier, tier)}
                          disabled={u.subscription_tier === tier}
                          className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-colors ${
                            u.subscription_tier === tier
                              ? 'bg-violet-600 text-white cursor-default'
                              : 'bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08] hover:text-zinc-300'
                          }`}
                        >
                          {tier === 'free' ? 'Free' : tier === 'basic_99' ? 'Explorer' : 'Professional'}
                          {u.subscription_tier === tier && <CheckCircleIcon className="w-3.5 h-3.5" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-[#111111] border border-white/[0.07] rounded-xl">
            <UserGroupIcon className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-sm text-zinc-400 mb-1">No users found</p>
            <p className="text-xs text-zinc-600">{searchQuery ? 'Try adjusting your search terms' : 'No users match the selected filters'}</p>
          </div>
        )}

      </main>
    </div>
  )
}
