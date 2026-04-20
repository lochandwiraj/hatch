'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import Header from '@/components/layout/Header'
import Link from 'next/link'
import {
  CreditCardIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  PhotoIcon,
  CurrencyRupeeIcon,
  MagnifyingGlassIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'
import { formatDate } from '@/lib/utils'
import { runPaymentCleanup, checkOldPayments } from '@/lib/cleanup'

interface PaymentSubmission {
  id: string
  user_id: string
  username: string
  full_name: string
  email: string
  transaction_id: string
  payment_screenshot_url: string
  requested_tier: 'basic_99' | 'premium_149'
  amount_paid: number
  payment_method: string
  status: 'pending' | 'approved' | 'rejected'
  admin_notes: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
}

const ADMIN_EMAILS = ['dwiraj06@gmail.com', 'pokkalilochan@gmail.com', 'dwiraj@HATCH.in', 'lochan@HATCH.in']
const tierName = (t: string) => t === 'basic_99' ? 'Explorer' : 'Professional'
const getSubDuration = (tier: string, amount: number) => {
  if (tier === 'basic_99') return amount >= 999 ? '365 days (1 year)' : '30 days'
  if (tier === 'premium_149') return amount >= 1499 ? '365 days (1 year)' : '30 days'
  return '30 days'
}

const statusStyle = (s: string) => s === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : s === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'

export default function AdminPaymentsPage() {
  const { user } = useAuth()
  const [payments, setPayments] = useState<PaymentSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPayment, setSelectedPayment] = useState<PaymentSubmission | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [processing, setProcessing] = useState(false)
  const [cleanupProcessing, setCleanupProcessing] = useState(false)
  const [oldPaymentsCount, setOldPaymentsCount] = useState(0)

  const isAdmin = ADMIN_EMAILS.includes(user?.email || '')

  useEffect(() => {
    if (isAdmin) { loadPayments(); checkOldPaymentsCount() }
  }, [isAdmin, filter])

  const checkOldPaymentsCount = async () => {
    const result = await checkOldPayments()
    if (result.success) setOldPaymentsCount(result.oldPaymentsCount || 0)
  }

  const handleCleanup = async () => {
    if (!confirm('Delete all payment submissions older than 3 days? This cannot be undone.')) return
    setCleanupProcessing(true)
    try {
      const result = await runPaymentCleanup()
      if (result.success) {
        toast.success(`Cleanup complete! ${result.records_deleted} records deleted.`)
        loadPayments(); checkOldPaymentsCount()
      } else {
        toast.error(`Cleanup failed: ${result.error}`)
      }
    } catch (err: any) {
      toast.error('Cleanup failed: ' + err.message)
    } finally {
      setCleanupProcessing(false)
    }
  }

  const loadPayments = async () => {
    try {
      setLoading(true)
      let query = supabase.from('payment_submissions').select('*').order('created_at', { ascending: false })
      if (filter !== 'all') query = query.eq('status', filter)
      const { data, error } = await query
      if (error) throw error
      let filtered = data || []
      if (searchQuery.trim()) {
        filtered = filtered.filter(p =>
          p.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.transaction_id.toLowerCase().includes(searchQuery.toLowerCase())
        )
      }
      setPayments(filtered)
    } catch {
      toast.error('Failed to load payment submissions')
    } finally {
      setLoading(false)
    }
  }

  const handleReview = async (paymentId: string, action: 'approve' | 'reject') => {
    if (!selectedPayment) return
    setProcessing(true)
    try {
      const { error: updateError } = await supabase.from('payment_submissions').update({
        status: action === 'approve' ? 'approved' : 'rejected',
        admin_notes: reviewNotes.trim() || null,
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
      }).eq('id', paymentId)
      if (updateError) throw updateError

      if (action === 'approve') {
        let durationDays = 30
        if (selectedPayment.requested_tier === 'basic_99') durationDays = selectedPayment.amount_paid >= 999 ? 365 : 30
        else if (selectedPayment.requested_tier === 'premium_149') durationDays = selectedPayment.amount_paid >= 1499 ? 365 : 30

        const { error: tierError } = await supabase.rpc('admin_upgrade_user_tier', {
          target_user_id: selectedPayment.user_id,
          new_tier: selectedPayment.requested_tier,
          admin_user_id: user?.id,
          duration_days: durationDays,
        })
        if (tierError) toast.error('Payment approved but failed to upgrade tier. Please upgrade manually.')
        else toast.success(`Payment approved! User upgraded to ${tierName(selectedPayment.requested_tier)} for ${durationDays === 365 ? '365 days' : '30 days'}.`)
      } else {
        toast.success('Payment rejected.')
      }

      setSelectedPayment(null); setReviewNotes(''); loadPayments()
    } catch {
      toast.error(`Failed to ${action} payment`)
    } finally {
      setProcessing(false)
    }
  }

  const handleDelete = async (payment: PaymentSubmission) => {
    const msg = payment.status === 'approved'
      ? 'This payment is APPROVED. Deleting will reject it and may affect user tier. Continue?'
      : 'Delete this payment submission? This cannot be undone.'
    if (!confirm(msg)) return
    setProcessing(true)
    try {
      if (payment.status === 'approved') {
        await supabase.from('payment_submissions').update({ status: 'rejected', admin_notes: (payment.admin_notes || '') + '\n[DELETED BY ADMIN]', reviewed_by: user?.id, reviewed_at: new Date().toISOString() }).eq('id', payment.id)
        await supabase.rpc('admin_upgrade_user_tier', { target_user_id: payment.user_id, new_tier: 'free', admin_user_id: user?.id, duration_days: 0 })
        toast.success('Payment rejected and user downgraded to Free.')
      } else {
        await supabase.from('payment_submissions').delete().eq('id', payment.id)
        toast.success('Payment submission deleted.')
      }
      loadPayments(); checkOldPaymentsCount()
    } catch {
      toast.error('Failed to delete payment')
    } finally {
      setProcessing(false)
    }
  }

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

  const stats = {
    total: payments.length,
    pending: payments.filter(p => p.status === 'pending').length,
    approved: payments.filter(p => p.status === 'approved').length,
    rejected: payments.filter(p => p.status === 'rejected').length,
    totalAmount: payments.filter(p => p.status === 'approved').reduce((sum, p) => sum + p.amount_paid, 0),
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-white mb-1">Payment Management</h1>
            <p className="text-sm text-zinc-500">Review and approve user payment submissions.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={loadPayments} disabled={loading} className="text-sm text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-50 px-3.5 py-2 rounded-lg transition-colors">
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
            {oldPaymentsCount > 0 && (
              <button onClick={handleCleanup} disabled={cleanupProcessing} className="text-sm text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-50 px-3.5 py-2 rounded-lg transition-colors">
                {cleanupProcessing ? 'Cleaning...' : `Cleanup Old (${oldPaymentsCount})`}
              </button>
            )}
            <button
              onClick={async () => {
                try {
                  const { data, error } = await supabase.storage.from('payment-screenshots').list()
                  if (error) throw error
                  toast.success(`Storage accessible! Found ${data?.length || 0} files`)
                } catch (err: any) {
                  toast.error('Storage test failed: ' + err.message)
                }
              }}
              className="text-sm text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] px-3.5 py-2 rounded-lg transition-colors"
            >
              Test Storage
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {[
            { label: 'Total', value: stats.total, icon: CreditCardIcon },
            { label: 'Pending', value: stats.pending, icon: ClockIcon },
            { label: 'Approved', value: stats.approved, icon: CheckCircleIcon },
            { label: 'Rejected', value: stats.rejected, icon: XCircleIcon },
            { label: 'Revenue', value: `₹${stats.totalAmount}`, icon: CurrencyRupeeIcon },
          ].map(stat => (
            <div key={stat.label} className="bg-[#111111] border border-white/[0.07] rounded-xl p-4">
              <stat.icon className="w-4 h-4 text-zinc-600 mb-2" />
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
                placeholder="Search by username, name, email, or transaction ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && loadPayments()}
                className="w-full bg-[#080808] border border-white/[0.07] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-colors"
              />
            </div>
            <button onClick={loadPayments} disabled={loading} className="text-sm text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-50 px-3.5 py-2 rounded-lg transition-colors">Search</button>
            {searchQuery && <button onClick={() => { setSearchQuery(''); loadPayments() }} className="text-sm text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] px-3 py-2 rounded-lg transition-colors">Clear</button>}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${filter === f ? 'bg-violet-600 text-white' : 'bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08]'}`}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Payments */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-28 bg-[#111111] rounded-xl animate-pulse" />)}
          </div>
        ) : payments.length > 0 ? (
          <div className="space-y-3">
            {payments.map(payment => (
              <div key={payment.id} className="bg-[#111111] border border-white/[0.07] rounded-xl p-4">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 bg-violet-600/20 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-sm font-semibold text-violet-400">{payment.full_name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-0.5">
                        <p className="text-sm font-medium text-white">{payment.full_name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${statusStyle(payment.status)}`}>
                          {payment.status}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500">@{payment.username} · {payment.email}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500 mt-1.5">
                        <span>Txn: {payment.transaction_id}</span>
                        <span>{tierName(payment.requested_tier)}</span>
                        <span>₹{payment.amount_paid}</span>
                        <span>{getSubDuration(payment.requested_tier, payment.amount_paid)}</span>
                        <span>{payment.payment_method}</span>
                        <span>{formatDate(payment.created_at)}</span>
                      </div>
                      {payment.admin_notes && (
                        <p className="text-xs text-zinc-500 mt-1.5 bg-white/[0.03] rounded px-2 py-1">Notes: {payment.admin_notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    {payment.payment_screenshot_url && (
                      <button onClick={() => window.open(payment.payment_screenshot_url, '_blank')} className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] px-2.5 py-1.5 rounded-lg transition-colors">
                        <PhotoIcon className="w-3.5 h-3.5" /> Screenshot
                      </button>
                    )}
                    {payment.status === 'pending' ? (
                      <button onClick={() => { setSelectedPayment(payment); setReviewNotes(payment.admin_notes || '') }} className="text-xs text-violet-400 hover:text-violet-300 bg-violet-500/10 hover:bg-violet-500/20 px-2.5 py-1.5 rounded-lg transition-colors">
                        Review
                      </button>
                    ) : (
                      <button onClick={() => { setSelectedPayment(payment); setReviewNotes(payment.admin_notes || '') }} className="text-xs text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] px-2.5 py-1.5 rounded-lg transition-colors">
                        Details
                      </button>
                    )}
                    <button onClick={() => handleDelete(payment)} disabled={processing} className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 disabled:opacity-50 px-2.5 py-1.5 rounded-lg transition-colors">
                      <TrashIcon className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-[#111111] border border-white/[0.07] rounded-xl">
            <CreditCardIcon className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-sm text-zinc-400 mb-1">No payment submissions found</p>
            <p className="text-xs text-zinc-600">{searchQuery ? 'Try adjusting search or filters' : filter === 'all' ? 'No submissions yet' : `No ${filter} payments`}</p>
          </div>
        )}

      </main>

      {/* Review Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111111] border border-white/[0.07] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-base font-medium text-white mb-5">
                {selectedPayment.status === 'pending' ? 'Review Payment' : 'Payment Details'}
              </h2>

              <div className="bg-[#161616] border border-white/[0.05] rounded-xl p-4 mb-4">
                <p className="text-xs text-zinc-500 mb-2">User Information</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  {[
                    { label: 'Name', value: selectedPayment.full_name },
                    { label: 'Username', value: `@${selectedPayment.username}` },
                    { label: 'Email', value: selectedPayment.email },
                    { label: 'Tier', value: tierName(selectedPayment.requested_tier) },
                    { label: 'Amount', value: `₹${selectedPayment.amount_paid}` },
                    { label: 'Duration', value: getSubDuration(selectedPayment.requested_tier, selectedPayment.amount_paid) },
                    { label: 'Method', value: selectedPayment.payment_method },
                    { label: 'Transaction ID', value: selectedPayment.transaction_id },
                    { label: 'Submitted', value: formatDate(selectedPayment.created_at) },
                  ].map(item => (
                    <div key={item.label}>
                      <span className="text-zinc-500">{item.label}:</span>
                      <span className="text-zinc-300 ml-1">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedPayment.payment_screenshot_url && (
                <div className="mb-4">
                  <p className="text-xs text-zinc-500 mb-2">Payment Screenshot</p>
                  <div className="bg-[#161616] border border-white/[0.05] rounded-xl p-4 text-center">
                    <img
                      src={selectedPayment.payment_screenshot_url}
                      alt="Payment Screenshot"
                      className="max-w-full h-64 object-contain mx-auto rounded-lg"
                    />
                    <div className="flex justify-center gap-2 mt-3">
                      <button onClick={() => window.open(selectedPayment.payment_screenshot_url, '_blank')} className="text-xs text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] px-2.5 py-1.5 rounded-lg transition-colors">View Full Size</button>
                      <button onClick={() => { navigator.clipboard.writeText(selectedPayment.payment_screenshot_url); toast.success('URL copied!') }} className="text-xs text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] px-2.5 py-1.5 rounded-lg transition-colors">Copy URL</button>
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-5">
                <label className="block text-xs text-zinc-400 mb-1.5">Admin Notes (optional)</label>
                <textarea
                  value={reviewNotes}
                  onChange={e => setReviewNotes(e.target.value)}
                  placeholder="Add notes about this payment review..."
                  rows={3}
                  className="w-full bg-[#080808] border border-white/[0.07] rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-colors"
                />
              </div>

              <div className="flex gap-2">
                <button onClick={() => { setSelectedPayment(null); setReviewNotes('') }} className="flex-1 text-sm text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] py-2.5 rounded-lg transition-colors">
                  Close
                </button>
                {selectedPayment.status === 'pending' && (
                  <>
                    <button onClick={() => handleReview(selectedPayment.id, 'reject')} disabled={processing} className="flex-1 text-sm text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 disabled:opacity-50 py-2.5 rounded-lg transition-colors">
                      {processing ? 'Processing...' : 'Reject'}
                    </button>
                    <button onClick={() => handleReview(selectedPayment.id, 'approve')} disabled={processing} className="flex-1 text-sm text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-50 py-2.5 rounded-lg transition-colors">
                      {processing ? 'Processing...' : 'Approve & Upgrade'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
