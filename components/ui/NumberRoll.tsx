'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Motion behaviour 4. A digit roll.
 *
 * When a number changes, the old digit slides up behind a one-digit-tall mask
 * as the new one enters below. steps(6) so it reads as mechanical rather than
 * eased, 180ms, tabular figures so nothing reflows mid-roll.
 *
 * Only digits that actually change move. Pure CSS transforms, no library.
 * Under prefers-reduced-motion it cuts straight to the new value.
 */

function Digit({ char, duration }: { char: string; duration: number }) {
  const [prev, setPrev] = useState(char)
  const [rolling, setRolling] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (char === prev) return
    setRolling(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      setPrev(char)
      setRolling(false)
    }, duration)
    return () => clearTimeout(timer.current)
  }, [char, prev, duration])

  // Anything that is not a digit (":", "/", ",", " ") never rolls. A space
  // keeps its width explicitly, or the per-character cells swallow it and
  // "Rs 99" renders as "Rs99".
  if (!/\d/.test(char))
    return <span style={char === ' ' ? { display: 'inline-block', width: '0.32em' } : undefined}>{char}</span>

  return (
    <span className="relative inline-block overflow-hidden align-bottom" style={{ height: '1em', width: '1ch' }}>
      <span
        className="absolute inset-x-0 flex flex-col motion-reduce:transition-none"
        style={{
          transform: rolling ? 'translateY(-50%)' : 'translateY(0)',
          transition: rolling ? `transform ${duration}ms steps(6)` : 'none',
        }}
      >
        <span className="block h-[1em] leading-none">{prev}</span>
        <span className="block h-[1em] leading-none">{char}</span>
      </span>
    </span>
  )
}

export function NumberRoll({
  value,
  duration = 180,
  className = '',
  label,
  /** Roll in the data face. Off for prices, which are set in display. */
  mono = true,
}: {
  value: number | string
  duration?: number
  className?: string
  label?: string
  mono?: boolean
}) {
  const text = String(value)
  return (
    <span
      {...(mono ? { 'data-mono': true } : {})}
      className={`inline-flex leading-none ${className}`}
      style={{ fontVariantNumeric: 'tabular-nums' }}
      aria-label={label ?? text}
      role={label ? 'text' : undefined}
    >
      <span aria-hidden className="inline-flex">
        {text.split('').map((c, i) => (
          <Digit key={`${i}-${c}`} char={c} duration={duration} />
        ))}
      </span>
    </span>
  )
}

export default NumberRoll
