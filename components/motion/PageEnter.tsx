'use client'

import { useEffect, useRef } from 'react'
import { prefersReducedMotion, isPhone } from '@/lib/motion-lite'

/**
 * Behaviour 1. Page enter.
 *
 * The title is split by LINE and revealed with a clip-path inset from 100% to
 * 0, bottom up. The rule beneath draws via scaleX, 60ms behind. 900ms on a
 * laptop, 600ms on a phone, where the title wraps to fewer lines.
 *
 * SplitText is never applied to the HATCH wordmark. Section 2 rule 5 forbids
 * animating the letterforms, so any .font-qepho inside is left whole.
 *
 * GSAP is imported inside the effect rather than at module scope. At module
 * scope it lands in the landing route's first load, which is the one route
 * with a hard 200 kB budget, and nothing here runs before hydration anyway.
 *
 * Under prefers-reduced-motion nothing is split and nothing animates: the
 * title is already in its end state on first paint.
 */
export function PageEnter({
  children,
  rule = true,
  className = '',
}: {
  children: React.ReactNode
  /** Draw a hairline under the title as part of the sequence. */
  rule?: boolean
  className?: string
}) {
  const scope = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (prefersReducedMotion()) return
    const root = scope.current
    const title = root?.querySelector<HTMLElement>('[data-page-title]')
    if (!title) return

    let cancelled = false
    let revert: (() => void) | undefined

    import('@/lib/motion').then(({ gsap, registerGsap, SplitText, EASE, DUR }) => {
      if (cancelled) return
      registerGsap()

      const line = root?.querySelector<HTMLElement>('[data-page-rule]')
      const phone = isPhone()
      const total = phone ? DUR.pagePhone : DUR.page
      const stagger = phone ? 0.03 : 0.045

      const split = SplitText.create(title, { type: 'lines', linesClass: 'page-enter-line' })
      revert = () => split.revert()

      gsap.set(split.lines, { willChange: 'clip-path' })
      const tl = gsap.timeline({
        onComplete: () => gsap.set(split.lines, { willChange: 'auto' }),
      })

      tl.fromTo(
        split.lines,
        { clipPath: 'inset(100% 0 0 0)' },
        { clipPath: 'inset(0% 0 0 0)', duration: total, ease: EASE.enter, stagger }
      )

      if (rule && line) {
        tl.fromTo(
          line,
          { scaleX: 0, transformOrigin: 'left center' },
          { scaleX: 1, duration: total, ease: EASE.enter },
          0.06
        )
      }
    })

    return () => {
      cancelled = true
      revert?.()
    }
  }, [rule])

  return (
    <div ref={scope} className={className}>
      {children}
      {rule ? <span data-page-rule aria-hidden className="mt-4 block h-px w-full bg-rule" /> : null}
    </div>
  )
}

export default PageEnter
