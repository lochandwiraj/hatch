'use client'

import Link from 'next/link'
import { XMarkIcon, CheckIcon, ArrowUpRightIcon } from '@heroicons/react/24/outline'

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
  const base = ['Priority registration', 'Advanced filters', 'Event reminders']
  if (t === 'premium_149') return ['Access to all events', 'Early access', 'VIP events', 'Career guidance', 'Priority support']
  return ['7 curated events', ...base, 'Profile showcase']
}

export default function TierLimitModal({ isOpen, onClose, currentTier, eventsAttended, tierLimit, upgradeNeeded }: TierLimitModalProps) {
  if (!isOpen) return null

  const pct = Math.min(100, Math.round((eventsAttended / tierLimit) * 100))

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="w-full max-w-md"
        style={{
          background: '#111111',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '20px',
          boxShadow: '0 32px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
          animation: 'modalIn 0.2s cubic-bezier(0.32,0.72,0,1)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/[0.06]">
          <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium">Access Limit</p>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-all duration-200"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-white mb-1">You've reached your limit</h2>
            <p className="text-xs text-zinc-500">
              Your <span className="text-zinc-300">{tierName(currentTier)}</span> plan allows {tierLimit} events per month.
            </p>
          </div>

          {/* Usage bar */}
          <div
            className="rounded-xl p-4"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-zinc-500">Events used</span>
              <span className="text-xs font-medium text-white">{eventsAttended} / {tierLimit}</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #4f46e5, #ec4899)' }}
              />
            </div>
            <p className="text-xs text-zinc-600 mt-2">Limits reset on the 1st of every month</p>
          </div>

          {/* Upgrade card */}
          {upgradeNeeded && (
            <div
              className="rounded-xl p-4"
              style={{ background: 'rgba(79,70,229,0.06)', border: '1px solid rgba(99,102,241,0.2)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-white">{upgradeName(upgradeNeeded)}</p>
                  <p className="text-xs text-zinc-500">{upgradeLimit(upgradeNeeded)} per month</p>
                </div>
                <p className="text-xl font-bold text-white">{upgradePrice(upgradeNeeded)}<span className="text-xs text-zinc-500 font-normal">/mo</span></p>
              </div>
              <ul className="space-y-1.5 mb-4">
                {upgradeFeatures(upgradeNeeded).map(f => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckIcon className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                    <span className="text-xs text-zinc-400">{f}</span>
                  </li>
                ))}
              </ul>
              <Link href="/subscription/upgrade">
                <button
                  className="w-full text-sm font-medium text-white py-2.5 rounded-xl transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-1.5"
                  style={{ background: 'linear-gradient(135deg, #4f46e5, #6366f1)', boxShadow: '0 4px 16px rgba(79,70,229,0.3)' }}
                >
                  Upgrade to {upgradeName(upgradeNeeded)}
                  <ArrowUpRightIcon className="w-3.5 h-3.5" />
                </button>
              </Link>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full text-sm text-zinc-500 hover:text-zinc-300 py-2 transition-colors duration-200"
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
