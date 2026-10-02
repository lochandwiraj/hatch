'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, registerGsap, Flip, EASE, DUR, takeFlipId, prefersReducedMotion } from '@/lib/motion'

/**
 * Behaviour 5, the receiving half. Index to detail.
 *
 * The index stores which event it navigated from; this reads that back and
 * animates the detail header into place from the row's last known position.
 *
 * Next.js replaces the DOM across a route change, so the two elements never
 * co-exist and Flip cannot diff them directly. What it can do is animate the
 * arriving header from the stored rect, which produces the same read: the
 * plate and title travel rather than cut.
 *
 * 520ms, power3.inOut. Under reduced motion it is a cut, which is the correct
 * experience and not a degraded one.
 */
export function FlipTarget({
  id,
  children,
  className = '',
}: {
  /** The event id this header belongs to. */
  id: string
  children: React.ReactNode
  className?: string
}) {
  const scope = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      registerGsap()
      const el = scope.current
      if (!el) return

      const from = takeFlipId()
      if (from !== id) return
      if (prefersReducedMotion()) return

      const rect = (() => {
        try {
          const raw = sessionStorage.getItem('hatch:flip-rect')
          sessionStorage.removeItem('hatch:flip-rect')
          return raw ? (JSON.parse(raw) as { top: number; left: number; width: number; height: number }) : null
        } catch {
          return null
        }
      })()
      if (!rect) return

      const now = el.getBoundingClientRect()
      const dx = rect.left - now.left
      const dy = rect.top - now.top
      const sx = rect.width / Math.max(now.width, 1)

      gsap.set(el, { willChange: 'transform' })
      gsap.fromTo(
        el,
        { x: dx, y: dy, scaleX: sx, scaleY: sx, transformOrigin: 'top left' },
        {
          x: 0,
          y: 0,
          scaleX: 1,
          scaleY: 1,
          duration: DUR.flip,
          ease: EASE.move,
          onComplete: () => gsap.set(el, { willChange: 'auto', clearProps: 'transform' }),
        }
      )
    },
    { scope, dependencies: [id] }
  )

  return (
    <div ref={scope} className={className}>
      {children}
    </div>
  )
}

/**
 * Behaviour 5, the sending half. Call on the row the user is leaving, and the
 * remaining rows clear on a 60ms staggered clip-path wipe.
 */
export function startFlip(id: string, el: HTMLElement | null, siblings?: HTMLElement[]) {
  if (!el || prefersReducedMotion()) return
  try {
    const r = el.getBoundingClientRect()
    sessionStorage.setItem('hatch:flip-state', JSON.stringify({ id, at: Date.now() }))
    sessionStorage.setItem(
      'hatch:flip-rect',
      JSON.stringify({ top: r.top, left: r.left, width: r.width, height: r.height })
    )
  } catch {
    return
  }

  if (siblings?.length) {
    registerGsap()
    gsap.to(siblings, {
      clipPath: 'inset(0 0 100% 0)',
      opacity: 0,
      duration: 0.22,
      ease: EASE.exit,
      stagger: 0.06,
    })
  }
}

export { Flip }
export default FlipTarget
