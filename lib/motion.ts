'use client'

import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Flip } from 'gsap/Flip'
import { SplitText } from 'gsap/SplitText'

/**
 * The single animation system. GSAP only.
 *
 * `motion` was removed from package.json: two animation libraries doubled the
 * bundle and split the mental model for no gain. ScrollSmoother is deliberately
 * NOT registered. It is heavy, it fights native touch scrolling, and most of
 * this product's traffic is on a phone where it would be switched off anyway.
 */

let registered = false

export function registerGsap() {
  if (registered || typeof window === 'undefined') return
  gsap.registerPlugin(ScrollTrigger, Flip, SplitText)
  registered = true
}

export { gsap, ScrollTrigger, Flip, SplitText }

/** The only curves permitted. Mirrors the CSS custom properties exactly. */
export const EASE = {
  enter: 'expo.out',
  exit: 'power2.in',
  move: 'power3.inOut',
} as const

/** The duration budget, in seconds, as GSAP wants them. */
export const DUR = {
  micro: 0.11,
  state: 0.22,
  enter: 0.42,
  page: 0.9,
  pagePhone: 0.6,
  flip: 0.52,
} as const

export const PHONE_QUERY = '(max-width: 767px)'

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function isPhone(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia(PHONE_QUERY).matches
}

/**
 * will-change is set before a sequence and removed when it finishes, as the
 * performance rules require. Left on permanently it costs memory on exactly
 * the mid-range Android this has to hit 60fps on.
 */
export function withWillChange(targets: gsap.TweenTarget, props: string) {
  gsap.set(targets, { willChange: props })
  return () => gsap.set(targets, { willChange: 'auto' })
}

/**
 * Hand-off used by behaviour 5. The index records the position of the element
 * it is about to navigate away from; the detail view reads it back and lets
 * Flip animate the difference. sessionStorage, because it must survive a route
 * change but not a new tab.
 */
const FLIP_KEY = 'hatch:flip-state'

export function storeFlipState(id: string, state: unknown) {
  try {
    sessionStorage.setItem(FLIP_KEY, JSON.stringify({ id, at: Date.now() }))
  } catch {
    /* private mode, or storage disabled. The transition simply does not run. */
  }
}

export function takeFlipId(): string | null {
  try {
    const raw = sessionStorage.getItem(FLIP_KEY)
    if (!raw) return null
    sessionStorage.removeItem(FLIP_KEY)
    const { id, at } = JSON.parse(raw) as { id: string; at: number }
    // Stale hand-offs are dropped: a back button hours later should not animate.
    return Date.now() - at < 4000 ? id : null
  } catch {
    return null
  }
}

/**
 * A 10ms tap, where the device supports it and the user has not asked for
 * reduced motion. Never a substitute for a visual state change.
 */
export function haptic(ms = 10) {
  if (prefersReducedMotion()) return
  try {
    navigator.vibrate?.(ms)
  } catch {
    /* unsupported, or blocked by the browser. Not worth reporting. */
  }
}
