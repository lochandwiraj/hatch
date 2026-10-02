'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { haptic, prefersReducedMotion } from '@/lib/motion-lite'
import { Sheet } from '@/components/ui/Sheet'
import { Glyph } from '@/components/ui/Glyph'
import { TIER_PRICING, formatRupees, normalizeRequiredTier, tierName } from '@/lib/tier'

/**
 * Behaviour 7. Tier lock.
 *
 * On activation the row shears 1.5deg on skewX and back over 120ms, with no
 * bounce, then the upgrade panel enters. It has to read as a turnstile: a
 * mechanism declining to let you through, not an error telling you off.
 *
 * The panel is a bottom sheet on a phone and a right-edge panel on a laptop,
 * which Sheet already handles, including the focus trap and drag affordance.
 *
 * Under reduced motion the shear is skipped and the panel simply appears.
 */
export function TierLock({
  requiredTier,
  children,
}: {
  requiredTier: string | null
  children: React.ReactNode
}) {
  const wrap = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)

  const required = normalizeRequiredTier(requiredTier)
  const price = TIER_PRICING[required]

  function reject(e: React.MouseEvent | React.KeyboardEvent) {
    e.preventDefault()
    e.stopPropagation()
    haptic(10)

    if (!prefersReducedMotion() && wrap.current) {
      const node = wrap.current
      import('@/lib/motion').then(({ gsap, registerGsap, EASE }) => {
        registerGsap()
        // Out and back, no overshoot. A turnstile does not bounce.
        gsap
          .timeline({ onComplete: () => setOpen(true) })
          .to(node, { skewX: 1.5, duration: 0.06, ease: EASE.exit })
          .to(node, { skewX: 0, duration: 0.06, ease: EASE.enter })
      })
      return
    }
    setOpen(true)
  }

  return (
    <>
      <div
        ref={wrap}
        role="button"
        tabIndex={0}
        aria-haspopup="dialog"
        aria-label={`Locked. Requires ${tierName(required)}.`}
        onClick={reject}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') reject(e)
        }}
        className="relative block w-full cursor-pointer text-left"
      >
        {children}
        <span
          aria-hidden
          className="hatch-locked pointer-events-none absolute inset-0 flex items-center justify-end pr-4"
        >
          <Glyph name="lock" size={16} className="text-locked" />
        </span>
      </div>

      <Sheet open={open} onClose={() => setOpen(false)} title={`${tierName(required)} required`}>
        <p className="font-serif text-body text-type-secondary">
          This event is listed for {tierName(required)}. Upgrading raises your monthly limit and
          unlocks every listing at that tier.
        </p>

        <dl className="mt-6 border-t border-rule">
          <div className="flex items-baseline justify-between border-b border-rule py-3">
            <dt className="font-sans text-ui-s text-type-secondary">Per month</dt>
            <dd data-mono className="text-mono-l text-type-primary">
              {formatRupees(price.monthly)}
            </dd>
          </div>
          <div className="flex items-baseline justify-between border-b border-rule py-3">
            <dt className="font-sans text-ui-s text-type-secondary">Per year</dt>
            <dd data-mono className="text-mono text-type-primary">
              {formatRupees(price.annual)}
              <span className="ml-2 text-verified">saves {formatRupees(price.saving)}</span>
            </dd>
          </div>
        </dl>

        <Link
          href="/subscription/upgrade"
          className="mt-6 flex min-h-touch items-center justify-center border border-signal bg-signal px-4 py-3 font-sans text-ui text-ink hover:bg-ink hover:text-signal active:bg-ink active:text-signal"
        >
          See the tiers
        </Link>
      </Sheet>
    </>
  )
}

export default TierLock
