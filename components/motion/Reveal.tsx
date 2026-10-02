'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, registerGsap, ScrollTrigger, EASE, DUR, prefersReducedMotion } from '@/lib/motion'

/**
 * Behaviour 2. Scroll reveal.
 *
 * Elements enter on a clip-path wipe as they cross 85% of the viewport height.
 * Once only: `once: true` on the trigger, never replayed on scroll up, because
 * re-running on every pass is what makes scroll animation feel cheap.
 *
 * Identical on phone and laptop. Native scrolling throughout, no smooth-scroll
 * library. Under reduced motion the trigger is never created and the content
 * renders in place.
 */
export function Reveal({
  children,
  stagger = 0.06,
  className = '',
  as: Tag = 'div',
}: {
  children: React.ReactNode
  /** Stagger between direct children. 0 reveals the block as one unit. */
  stagger?: number
  className?: string
  as?: 'div' | 'section' | 'ul' | 'ol'
}) {
  const scope = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      registerGsap()
      if (prefersReducedMotion()) return

      const el = scope.current
      if (!el) return

      const targets = stagger > 0 && el.children.length > 1 ? Array.from(el.children) : [el]

      const tween = gsap.fromTo(
        targets,
        { clipPath: 'inset(0 0 100% 0)', opacity: 0 },
        {
          clipPath: 'inset(0 0 0% 0)',
          opacity: 1,
          duration: DUR.enter,
          ease: EASE.enter,
          stagger,
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            once: true,
          },
          onComplete: () => gsap.set(targets, { clearProps: 'clipPath,willChange' }),
        }
      )

      return () => {
        tween.scrollTrigger?.kill()
        tween.kill()
      }
    },
    { scope }
  )

  // @ts-expect-error -- the ref type varies with the chosen tag
  return <Tag ref={scope} className={className}>{children}</Tag>
}

/** Kill every trigger on unmount. Route changes must not leak them. */
export function killScrollTriggers() {
  ScrollTrigger.getAll().forEach((t) => t.kill())
}

export default Reveal
