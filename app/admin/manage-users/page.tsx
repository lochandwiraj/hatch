'use client'

import { useState, useEffect } from 'react'
import { EmptyState } from '@/components/ui/EmptyState'
import type { Tables } from '@/lib/supabase'
import { Glyph } from '@/components/ui/Glyph'
import { useAuth } from '@/components/auth/AuthProvider'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'
import { formatDateShort, getSubscriptionTierName } from '@/lib/utils'
import {
  AdminShell,
  AdminLoading,
  AdminSearch,
  FilterChips,
  SortBar,
  RecordRow,
  Meta,
  useIsAdmin,
  sortRecords,
} from '@/components/admin/AdminUI'

type UserProfile = Tables<'user_profiles'>

const getTimeRemaining = (expiresAt: string | null) => {
  if (!expiresAt) return null
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return 'Expired'
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  return days > 0 ? `${days}d ${hours}h` : `${hours}h`
}

const TIERS = [
  { value: 'free', label: 'Free' },
  { value: 'basic_99', label: 'Explorer' },
  { value: 'premium_149', label: 'Professional' },
] as const

const FILTERS = [{ value: 'all', label: 'All' }, ...TIERS] as const

const SORTS = [
  { key: 'full_name', label: 'Name' },
  { key: 'subscription_tier', label: 'Tier' },
  { key: 'created_at', label: 'Joined' },
] as const

export default function AdminManageUsersPage() {
  const [sortKey, setSortKey] = useState<string>('full_name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const { user } = useAuth()
  const isAdmin = useIsAdmin()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTier, setFilterTier] = useState<'all' | 'free' | 'basic_99' | 'premium_149'>('all')
  const [stats, setStats] = useState({ total: 0, free: 0, basic_99: 0, premium_149: 0, expiring_soon: 0 })

  useEffect(() => {
    if (isAdmin) loadUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, filterTier])

  const loadUsers = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('user_profiles')
        .select(
          'id,username,full_name,email,subscription_tier,subscription_expires_at,tier_upgraded_by,tier_upgraded_at,auto_downgrade_enabled,created_at,updated_at'
        )
        .order('created_at', { ascending: false })
      if (filterTier !== 'all') query = query.eq('subscription_tier', filterTier)
      const { data, error } = await query

      if (error) {
        if (error.message.includes('does not exist')) {
          const { data: basicData, error: basicError } = await supabase
            .from('user_profiles')
            .select('id,username,full_name,subscription_tier,created_at,updated_at')
            .order('created_at', { ascending: false })
          if (basicError) throw basicError
          const withDefaults = (basicData || []).map((p) => ({
            ...p,
            email: 'Run schema update to see emails',
            subscription_expires_at: null,
            tier_upgraded_by: null,
            tier_upgraded_at: null,
            auto_downgrade_enabled: true,
          }))
          setUsers(withDefaults as UserProfile[])
          setStats({
            total: withDefaults.length,
            free: withDefaults.filter((u) => u.subscription_tier === 'free').length,
            basic_99: withDefaults.filter((u) => u.subscription_tier === 'basic_99').length,
            premium_149: withDefaults.filter((u) => u.subscription_tier === 'premium_149').length,
            expiring_soon: 0,
          })
          return
        }
        throw error
      }

      const usersData = (data || []).map((p) => ({
        ...p,
        email: (p.email ?? '') || 'Email not available',
      })) as UserProfile[]
      setUsers(usersData)
      const sevenDays = new Date()
      sevenDays.setDate(sevenDays.getDate() + 7)
      setStats({
        total: usersData.length,
        free: usersData.filter((u) => u.subscription_tier === 'free').length,
        basic_99: usersData.filter((u) => u.subscription_tier === 'basic_99').length,
        premium_149: usersData.filter((u) => u.subscription_tier === 'premium_149').length,
        expiring_soon: usersData.filter(
          (u) =>
            u.subscription_expires_at &&
            new Date(u.subscription_expires_at) <= sevenDays &&
            new Date(u.subscription_expires_at) > new Date()
        ).length,
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
      const choice = prompt(
        `Duration for ${getSubscriptionTierName(newTier)} (days):\n30 = monthly, 365 = annual, 36500 = lifetime\nMax: 36500`,
        '30'
      )
      if (!choice) return
      const parsed = parseInt(choice)
      if (isNaN(parsed) || parsed < 1) {
        toast.error('Invalid duration.')
        return
      }
      durationDays = Math.min(parsed, 36500)
    }

    const durationText = durationDays === 0 ? '' : ` for ${durationDays} days`
    if (
      !confirm(
        `Change tier from ${getSubscriptionTierName(currentTier)} to ${getSubscriptionTierName(newTier)}${durationText}?`
      )
    )
      return

    try {
      const { error } = await supabase.rpc('admin_upgrade_user_tier', {
        target_user_id: userId,
        new_tier: newTier,
        admin_user_id: user?.id ?? '',
        duration_days: durationDays,
      })
      if (error) throw error
      toast.success(`Tier updated to ${getSubscriptionTierName(newTier)}${durationText}.`)
      loadUsers()
    } catch (err: any) {
      toast.error('Failed to update tier: ' + (err.message || 'Unknown error'))
    }
  }

  const q = searchQuery.trim().toLowerCase()
  const filteredUsers = q
    ? users.filter(
        (u) =>
          (u.username ?? '').toLowerCase().includes(q) ||
          (u.full_name ?? '').toLowerCase().includes(q) ||
          (u.email ?? '').toLowerCase().includes(q)
      )
    : users

  const rows = sortRecords(
    filteredUsers as unknown as Record<string, unknown>[],
    sortKey,
    sortDir
  ) as unknown as UserProfile[]

  return (
    <AdminShell
      label="admin · users"
      title="Users"
      lede="Every account, its plan, and when that plan runs out."
      stats={[
        { label: 'Total', value: stats.total },
        { label: 'Free', value: stats.free },
        { label: 'Explorer', value: stats.basic_99 },
        { label: 'Professional', value: stats.premium_149 },
        { label: 'Expiring in 7d', value: stats.expiring_soon },
      ]}
    >
      <div className="space-y-3 border-b border-rule pb-3">
        <AdminSearch value={searchQuery} onChange={setSearchQuery} placeholder="Search by name, username or email" />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <FilterChips legend="Tier" options={FILTERS} value={filterTier} onChange={setFilterTier} />
          <SortBar
            options={SORTS}
            sortKey={sortKey}
            sortDir={sortDir}
            onChange={(k, d) => {
              setSortKey(k)
              setSortDir(d)
            }}
          />
        </div>
      </div>

      {loading ? (
        <AdminLoading what="users" />
      ) : rows.length === 0 ? (
        <EmptyState
          glyph="users"
          title="No users found"
          detail={searchQuery ? 'Try adjusting your search terms' : 'No users match the selected filters'}
        />
      ) : (
        <>
          <p data-mono className="py-2 text-mono text-type-muted">
            {rows.length} shown
          </p>
          <ul>
            {rows.map((u) => {
              const timeLeft = getTimeRemaining(u.subscription_expires_at)
              const tier = u.subscription_tier ?? 'free'
              return (
                <RecordRow
                  key={u.id}
                  title={u.full_name || '(no name)'}
                  badges={
                    <>
                      <span
                        className={`border px-2 py-px font-sans text-label uppercase ${
                          tier === 'free' ? 'border-rule text-type-secondary' : 'border-signal text-signal'
                        }`}
                      >
                        {getSubscriptionTierName(tier)}
                      </span>
                      {timeLeft ? (
                        <span
                          className={`border px-2 py-px font-sans text-label uppercase ${
                            timeLeft === 'Expired' ? 'border-signal text-signal' : 'border-deadline text-deadline'
                          }`}
                        >
                          {timeLeft}
                        </span>
                      ) : null}
                    </>
                  }
                  meta={
                    <>
                      <p className="break-words font-sans text-ui-s text-type-secondary">
                        @{u.username ?? ''} · {u.email ?? ''}
                      </p>
                      <Meta
                        items={[
                          `Joined ${formatDateShort(u.created_at)}`,
                          u.tier_upgraded_at ? `Upgraded ${formatDateShort(u.tier_upgraded_at)}` : null,
                          u.subscription_expires_at ? `Expires ${formatDateShort(u.subscription_expires_at)}` : null,
                        ]}
                      />
                    </>
                  }
                  actions={TIERS.map((t) => {
                    const current = tier === t.value
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => toggleUserTier(u.id, tier, t.value)}
                        disabled={current}
                        aria-current={current ? 'true' : undefined}
                        className={`inline-flex min-h-touch items-center gap-1 border px-3 py-1 font-sans text-ui-s ${
                          current
                            ? 'cursor-default border-signal bg-signal text-ink'
                            : 'border-rule text-type-secondary hover:border-rule-strong hover:text-type-primary'
                        }`}
                      >
                        {t.label}
                        {current ? <Glyph name="check" size={14} /> : null}
                      </button>
                    )
                  })}
                />
              )
            })}
          </ul>
        </>
      )}
    </AdminShell>
  )
}
