'use client'

import { useRouter } from 'next/navigation'
import TierLedger from '@/components/subscription/TierLedger'

/**
 * The pricing comparison. A client component because checkout opens from the
 * ledger row itself, which needs a router; the page stays a server component
 * so it can keep exporting metadata.
 */
export default function PricingLedger() {
  const router = useRouter()
  return (
    <TierLedger
      onChoose={(tier, annual) =>
        router.push(`/subscription/upgrade?tier=${tier}&cycle=${annual ? 'annual' : 'monthly'}`)
      }
    />
  )
}
