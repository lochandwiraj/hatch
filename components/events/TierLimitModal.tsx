'use client'

import Link from 'next/link'
import { Glyph } from '@/components/ui/Glyph'
interface TierLimitModalProps {
  isOpen: boolean
  onClose: () => void
  currentTier: string
  eventsAttended: number
  tierLimit: number
  upgradeNeeded?: string
}

const tierName = (t: string) => t === 'free' ? 'Free' : t === 'basic_99' ? 'Explorer' : 'Professional'
const upgradeName = (t?: string) => t === 'basic_99' ? 'Explorer' : t === 'premium_149' ? 'Professional' : 'Premium'
const upgradePrice = (t?: string) => t === 'basic_99' ? '₹99' : t === 'premium_149' ? '₹149' : '₹99'
const upgradeLimit = (t?: string) => t === 'basic_99' ? '7 events' : 'All events'

const upgradeFeatures = (t?: string) => {
    if (t === 'premium_149') return ['Highest monthly limit', 'Every event, at any tier', 'Unlimited manual events']
  return ['10 events per month', 'Free and Explorer events', 'Unlimited manual events']
}

export default function TierLimitModal({ isOpen, onClose, currentTier, eventsAttended, tierLimit, upgradeNeeded }: TierLimitModalProps) {
  if (!isOpen) return null

  const pct = Math.min(100, Math.round((eventsAttended / tierLimit) * 100))

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'var(--ink)', }}
    >
      <div
        className="w-full max-w-md"
        style={{
          background: 'var(--ink-raised)',
          border: '1px solid var(--rule)',
          animation: 'modalIn 0.2s cubic-bezier(0.32,0.72,0,1)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-rule-strong">
          <p className="text-ui-s text-type-muted uppercase tracking-widest font-medium">Access Limit</p>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-type-muted hover:text-type-primary hover:bg-ink-raised"
          >
            <Glyph name="cross" className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <h2 className="text-body font-semibold text-type-primary mb-1">You've reached your limit</h2>
            <p className="text-ui-s text-type-muted">
              Your <span className="text-type-primary">{tierName(currentTier)}</span> plan allows {tierLimit} events per month.
            </p>
          </div>

          {/* Usage bar */}
          <div
            className="p-4"
            style={{ background: 'var(--ink-raised)', border: '1px solid var(--rule)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-ui-s text-type-muted">Events used</span>
              <span className="text-ui-s font-medium text-type-primary">{eventsAttended} / {tierLimit}</span>
            </div>
            <div className="h-2 bg-ink-raised overflow-hidden">
              <div
                className="h-full"
                style={{ width: `${pct}%`, background: 'var(--ink-raised)' }}
              />
            </div>
            <p className="text-ui-s text-type-muted mt-2">Limits reset on the 1st of every month</p>
          </div>

          {/* Upgrade card */}
          {upgradeNeeded && (
            <div
              className="p-4"
              style={{ background: 'var(--ink-raised)', border: '1px solid var(--signal)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-ui font-semibold text-type-primary">{upgradeName(upgradeNeeded)}</p>
                  <p className="text-ui-s text-type-muted">{upgradeLimit(upgradeNeeded)} per month</p>
                </div>
                <p className="text-title font-bold text-type-primary">{upgradePrice(upgradeNeeded)}<span className="text-ui-s text-type-muted font-normal">/mo</span></p>
              </div>
              <ul className="space-y-2 mb-4">
                {upgradeFeatures(upgradeNeeded).map(f => (
                  <li key={f} className="flex items-center gap-2">
                    <Glyph name="check" className="w-4 h-4 text-signal shrink-0" />
                    <span className="text-ui-s text-type-secondary">{f}</span>
                  </li>
                ))}
              </ul>
              <Link href="/subscription/upgrade">
                <button
                  className="w-full text-ui font-medium text-type-primary py-3 active:scale-[0.98] flex items-center justify-center gap-2"
                  style={{ background: 'var(--ink-raised)', }}
                >
                  Upgrade to {upgradeName(upgradeNeeded)}
                  <Glyph name="arrow-up-right" className="w-4 h-4" />
                </button>
              </Link>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full text-ui text-type-muted hover:text-type-primary py-2"
          >
            Maybe later
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  )
}
