'use client'

/**
 * The parts of the motion system that carry no GSAP.
 *
 * Importing lib/motion pulls GSAP and its plugins into whatever chunk the
 * importer lands in, which put roughly 30 kB of animation code into the
 * landing route's first load for components that do not animate until the
 * user acts. These two helpers are all most call sites actually need
 * synchronously; the rest is imported at the moment it is used.
 */

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function isPhone(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(max-width: 767px)').matches
}

/** A 10ms tap, where supported and not suppressed by reduced motion. */
export function haptic(ms = 10) {
  if (prefersReducedMotion()) return
  try {
    navigator.vibrate?.(ms)
  } catch {
    /* unsupported or blocked */
  }
}
