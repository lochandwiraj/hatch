'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/auth/AuthProvider'
import { Table, type Column } from '@/components/ui/Table'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatRupees, tierName } from '@/lib/tier'
import type { Tables } from '@/lib/supabase'

type Submission = Tables<'payment_submissions'>

/**
 * Billing history. A real table at lg and stacked record blocks on a phone,
 * both from the Table primitive.
 *
 * payment_submissions is empty: no payment has ever completed on this product.
 * The empty state is therefore the normal case, not an edge case, and it says
 * so plainly rather than looking like a loading failure.
 */
export default function BillingHistory() {
  const { user } = useAuth()
  const [rows, setRows] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase
      .from('payment_submissions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setRows(data ?? [])
        setLoading(false)
      })
  }, [user])

  const columns: Column<Submission>[] = [
    {
      key: 'created_at',
      header: 'Date',
      render: (r) => (
        <span data-mono className="text-mono">
          {r.created_at ? r.created_at.slice(0, 10) : ''}
        </span>
      ),
    },
    { key: 'requested_tier', header: 'Tier', render: (r) => tierName(r.requested_tier) },
    {
      key: 'amount_paid',
      header: 'Amount',
      align: 'right',
      render: (r) => (
        <span data-mono className="text-mono">
          {formatRupees(Number(r.amount_paid ?? 0))}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'right',
      render: (r) => (
        <span
          className={
            r.status === 'approved'
              ? 'text-verified'
              : r.status === 'rejected'
                ? 'text-signal'
                : 'text-deadline'
          }
        >
          {r.status ?? 'pending'}
        </span>
      ),
    },
  ]

  return (
    <section aria-labelledby="billing-heading">
      <h2 id="billing-heading" className="border-b border-rule pb-2 font-display text-title uppercase text-type-primary">
        Billing history
      </h2>
      <div className="mt-3">
        {loading ? (
          <p data-mono className="py-4 text-mono text-type-muted">Loading</p>
        ) : (
          <Table
            caption="Your payment submissions"
            columns={columns}
            rows={rows}
            rowKey={(r) => r.id}
            empty={
              <EmptyState
                glyph="card"
                title="No payments yet"
                detail="Nothing has been billed to this account. Upgrading creates the first entry here."
                action={{ label: 'See the tiers', href: '/subscription/upgrade' }}
              />
            }
          />
        )}
      </div>
    </section>
  )
}
