'use client'

import { haptic } from '@/lib/motion'

/**
 * Behaviour 10, the touch half.
 *
 * There is no hover on a phone, so every permitted pointer change needs a
 * press equivalent that fires immediately. The visual part lives in CSS
 * (`active:` variants, which paint within a frame); this adds the 10ms tap,
 * and only where the device supports it and the user has not asked for
 * reduced motion.
 *
 * Spread onto any control. It never replaces a visual state change, and it
 * never carries information of its own.
 */
export function usePress(ms = 10) {
  return {
    onPointerDown: (e: React.PointerEvent) => {
      if (e.pointerType === 'touch') haptic(ms)
    },
  }
}

export default usePress
