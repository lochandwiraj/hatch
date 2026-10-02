'use client'

import { useState, useEffect } from 'react'
import { EmptyState } from '@/components/ui/EmptyState'
import type { Tables } from '@/lib/supabase'
import { Overlay } from '@/components/ui/Overlay'
import { useAuth } from '@/components/auth/AuthProvider'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'
import { formatDate, formatDateShort } from '@/lib/utils'
import { runPaymentCleanup, checkOldPayments } from '@/lib/cleanup'
import {
  AdminShell,
  AdminGhost,
  AdminLoading,
  AdminSearch,
  FilterChips,
  SortBar,
  RecordRow,
  RowAction,
  useIsAdmin,
  sortRecords,
} from '@/components/admin/AdminUI'

type PaymentSubmission = Tables<'payment_submissions'>

const tierName = (t: string) => t === 'basic_99' ? 'Explorer' : 'Professional'
const getSubDuration = (tier: string, amount: number) => {
  if (tier === 'basic_99') return amount >= 999 ? '365 days (1 year)' : '30 days'
  if (tier === 'premium_149') return amount >= 1499 ? '365 days (1 year)' : '30 days'
  return '30 days'
}

const statusStyle = (s: string | null) => s === 'approved' ? 'text-verified border-verified' : s === 'rejected' ? 'text-signal border-signal' : 'text-deadline border-deadline'

export default function AdminPaymentsPage() {
  const [sortKey, setSortKey] = useState<string>('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
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

  const isAdmin = useIsAdmin()

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
          (p.username ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.full_name ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.email ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.transaction_id ?? '').toLowerCase().includes(searchQuery.toLowerCase())
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
        if ((selectedPayment.requested_tier ?? '') === 'basic_99') durationDays = (selectedPayment.amount_paid ?? 0) >= 999 ? 365 : 30
        else if ((selectedPayment.requested_tier ?? '') === 'premium_149') durationDays = (selectedPayment.amount_paid ?? 0) >= 1499 ? 365 : 30

        const { error: tierError } = await supabase.rpc('admin_upgrade_user_tier', {
          target_user_id: selectedPayment.user_id ?? '',
          new_tier: (selectedPayment.requested_tier ?? ''),
          admin_user_id: user?.id ?? '',
          duration_days: durationDays,
        })
        if (tierError) toast.error('Payment approved but failed to upgrade tier. Please upgrade manually.')
        else toast.success(`Payment approved! User upgraded to ${tierName((selectedPayment.requested_tier ?? ''))} for ${durationDays === 365 ? '365 days' : '30 days'}.`)
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
    const msg = (payment.status ?? '') === 'approved'
      ? 'This payment is APPROVED. Deleting will reject it and may affect user tier. Continue?'
      : 'Delete this payment submission? This cannot be undone.'
    if (!confirm(msg)) return
    setProcessing(true)
    try {
      if ((payment.status ?? '') === 'approved') {
        await supabase.from('payment_submissions').update({ status: 'rejected', admin_notes: ((payment.admin_notes ?? '') || '') + '\n[DELETED BY ADMIN]', reviewed_by: user?.id, reviewed_at: new Date().toISOString() }).eq('id', payment.id)
        await supabase.rpc('admin_upgrade_user_tier', { target_user_id: payment.user_id ?? '', new_tier: 'free', admin_user_id: user?.id ?? '', duration_days: 0 })
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

  const stats = {
    total: payments.length,
    pending: payments.filter(p => (p.status ?? '') === 'pending').length,
    approved: payments.filter(p => (p.status ?? '') === 'approved').length,
    rejected: payments.filter(p => (p.status ?? '') === 'rejected').length,
    totalAmount: payments.filter(p => (p.status ?? '') === 'approved').reduce((sum, p) => sum + (p.amount_paid ?? 0), 0),
  }

  return (
    <>
      <AdminShell
        label="admin · payments"
        title="Payments"
        lede="Review UPI submissions and upgrade the account when one checks out."
        actions={
          <>
            <AdminGhost onClick={loadPayments} disabled={loading}>
              {loading ? 'Refreshing' : 'Refresh'}
            </AdminGhost>
            {oldPaymentsCount > 0 ? (
              <AdminGhost onClick={handleCleanup} disabled={cleanupProcessing}>
                {cleanupProcessing ? 'Cleaning' : `Clean up old (${oldPaymentsCount})`}
              </AdminGhost>
            ) : null}
            <AdminGhost
              onClick={async () => {
                try {
                  const { data, error } = await supabase.storage.from('payment-screenshots').list()
                  if (error) throw error
                  toast.success(`Storage reachable. ${data?.length || 0} file(s).`)
                } catch (err: any) {
                  toast.error('Storage test failed: ' + err.message)
                }
              }}
            >
              Test storage
            </AdminGhost>
          </>
        }
        stats={[
          { label: 'Total', value: stats.total },
          { label: 'Pending', value: stats.pending },
          { label: 'Approved', value: stats.approved },
          { label: 'Rejected', value: stats.rejected },
          { label: 'Revenue', value: `₹${stats.totalAmount}` },
        ]}
      >
        <div className="space-y-3 border-b border-rule pb-3">
          <AdminSearch
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by name, username, email or transaction ID"
          />
          <div className="flex flex-wrap items-center justify-between gap-4">
            <FilterChips
              legend="Status"
              options={[
                { value: 'all', label: 'All' },
                { value: 'pending', label: 'Pending' },
                { value: 'approved', label: 'Approved' },
                { value: 'rejected', label: 'Rejected' },
              ] as const}
              value={filter}
              onChange={setFilter}
            />
            <SortBar
              options={[
                { key: 'created_at', label: 'Submitted' },
                { key: 'amount_paid', label: 'Amount' },
                { key: 'status', label: 'Status' },
              ]}
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
          <AdminLoading what="payments" />
        ) : payments.length === 0 ? (
          <EmptyState
            glyph="card"
            title="No payment submissions found"
            detail={
              searchQuery
                ? 'Try adjusting search or filters'
                : filter === 'all'
                  ? 'No submissions yet'
                  : `No ${filter} payments`
            }
          />
        ) : (
          <ul>
            {(sortRecords(payments as unknown as Record<string, unknown>[], sortKey, sortDir) as unknown as PaymentSubmission[]).map((payment) => (
              <RecordRow
                key={payment.id}
                title={payment.full_name ?? ''}
                badges={
                  <span className={`border px-2 py-px font-sans text-label uppercase ${statusStyle(payment.status ?? '')}`}>
                    {payment.status ?? ''}
                  </span>
                }
                meta={
                  <>
                    <p className="break-words font-sans text-ui-s text-type-secondary">
                      @{payment.username ?? ''} · {payment.email ?? ''}
                    </p>
                    {/* The figures an approval turns on, in mono so they can be
                        compared down the column rather than read one by one. */}
                    <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1">
                      {[
                        { k: 'Amount', v: `₹${payment.amount_paid ?? 0}` },
                        { k: 'Plan', v: tierName(payment.requested_tier ?? '') },
                        { k: 'For', v: getSubDuration(payment.requested_tier ?? '', payment.amount_paid ?? 0) },
                        { k: 'Txn', v: payment.transaction_id ?? '--' },
                        { k: 'Via', v: payment.payment_method ?? '--' },
                        { k: 'Sent', v: formatDateShort(payment.created_at) },
                      ].map(({ k, v }) => (
                        <div key={k} className="flex items-baseline gap-2">
                          <dt className="font-sans text-label uppercase text-type-muted">{k}</dt>
                          <dd data-mono className="text-mono text-type-primary">
                            {v}
                          </dd>
                        </div>
                      ))}
                    </dl>
                    {payment.admin_notes ? (
                      <p className="mt-2 border-l-2 border-rule pl-2 font-sans text-ui-s text-type-muted">
                        {payment.admin_notes}
                      </p>
                    ) : null}
                  </>
                }
                actions={
                  <>
                    {payment.payment_screenshot_url ? (
                      <RowAction glyph="photo" onClick={() => window.open(payment.payment_screenshot_url ?? '', '_blank')}>
                        Screenshot
                      </RowAction>
                    ) : null}
                    <RowAction
                      onClick={() => {
                        setSelectedPayment(payment)
                        setReviewNotes(payment.admin_notes ?? '')
                      }}
                    >
                      {payment.status === 'pending' ? 'Review' : 'Details'}
                    </RowAction>
                    <RowAction danger glyph="trash" disabled={processing} onClick={() => handleDelete(payment)}>
                      Delete
                    </RowAction>
                  </>
                }
              />
            ))}
          </ul>
        )}
      </AdminShell>

      {/* Review. Routed through Overlay so Escape, the scrim, focus trapping
          and focus restore all work; it had none of them. */}
      {selectedPayment && (
        <Overlay
          open
          onClose={() => {
            setSelectedPayment(null)
            setReviewNotes('')
          }}
          className="w-full max-w-2xl"
        >
          <div className="max-h-[90vh] overflow-y-auto border border-rule-strong bg-ink">
            <div className="p-6">
              <h2 className="text-body font-medium text-type-primary mb-6">
                {(selectedPayment.status ?? '') === 'pending' ? 'Review Payment' : 'Payment Details'}
              </h2>

              <div className="bg-ink-raised border border-rule-strong p-4 mb-4">
                <p className="text-ui-s text-type-muted mb-2">User Information</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-ui">
                  {[
                    { label: 'Name', value: (selectedPayment.full_name ?? '') },
                    { label: 'Username', value: `@${(selectedPayment.username ?? '')}` },
                    { label: 'Email', value: (selectedPayment.email ?? '') },
                    { label: 'Tier', value: tierName((selectedPayment.requested_tier ?? '')) },
                    { label: 'Amount', value: `₹${(selectedPayment.amount_paid ?? 0)}` },
                    { label: 'Duration', value: getSubDuration((selectedPayment.requested_tier ?? ''), (selectedPayment.amount_paid ?? 0)) },
                    { label: 'Method', value: (selectedPayment.payment_method ?? '') },
                    { label: 'Transaction ID', value: (selectedPayment.transaction_id ?? '') },
                    { label: 'Submitted', value: formatDate(selectedPayment.created_at) },
                  ].map(item => (
                    <div key={item.label}>
                      <span className="text-type-muted">{item.label}:</span>
                      <span className="text-type-primary ml-1">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {(selectedPayment.payment_screenshot_url ?? '') && (
                <div className="mb-4">
                  <p className="text-ui-s text-type-muted mb-2">Payment Screenshot</p>
                  <div className="bg-ink-raised border border-rule-strong p-4 text-center">
                    <img
                      src={(selectedPayment.payment_screenshot_url ?? '')}
                      alt="Payment Screenshot"
                      className="max-w-full h-64 object-contain mx-auto"
                    />
                    <div className="flex justify-center gap-2 mt-3">
                      <button onClick={() => window.open((selectedPayment.payment_screenshot_url ?? ''), '_blank')} className="text-ui-s text-type-secondary hover:text-type-primary bg-ink-raised hover:bg-ink-raised px-3 py-2">View Full Size</button>
                      <button onClick={() => { navigator.clipboard.writeText((selectedPayment.payment_screenshot_url ?? '')); toast.success('URL copied!') }} className="text-ui-s text-type-secondary hover:text-type-primary bg-ink-raised hover:bg-ink-raised px-3 py-2">Copy URL</button>
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-6">
                <label className="block text-ui-s text-type-secondary mb-2">Admin Notes (optional)</label>
                <textarea
                  value={reviewNotes}
                  onChange={e => setReviewNotes(e.target.value)}
                  placeholder="Add notes about this payment review..."
                  rows={3}
                  className="w-full bg-ink-raised border border-rule-strong px-3 py-2 text-ui text-type-primary placeholder-type-muted focus:outline-none focus:border-signal focus:border focus:border-signal"
                />
              </div>

              <div className="flex gap-2">
                <button onClick={() => { setSelectedPayment(null); setReviewNotes('') }} className="flex-1 text-ui text-type-secondary hover:text-type-primary bg-ink-raised hover:bg-ink-raised py-3">
                  Close
                </button>
                {(selectedPayment.status ?? '') === 'pending' && (
                  <>
                    <button onClick={() => handleReview(selectedPayment.id, 'reject')} disabled={processing} className="flex-1 text-ui text-signal border border-rule hover:border-signal disabled:opacity-50 py-3">
                      {processing ? 'Processing...' : 'Reject'}
                    </button>
                    <button onClick={() => handleReview(selectedPayment.id, 'approve')} disabled={processing} className="flex-1 text-ui text-ink bg-signal hover:bg-signal disabled:opacity-50 py-3">
                      {processing ? 'Processing...' : 'Approve & Upgrade'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </Overlay>
      )}
    </>
  )
}

