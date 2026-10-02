'use client'

import { useEffect, useState } from 'react'
import { Toaster, toast, type Toast } from 'react-hot-toast'
import { Glyph } from './Glyph'

/**
 * Toasts. Bottom on a phone, top-right on a laptop.
 *
 * The library's own toast is a rounded pill with a drawn, animating tick or
 * cross inside it — a shape and a motion this product does not use anywhere
 * else. CSS could flatten the corners but not replace the icon or the layout,
 * so rendering is taken over completely through Toaster's render prop.
 *
 * That matters because there are 107 `toast.success(...)` / `toast.error(...)`
 * calls across 21 files. None of them change: the call sites keep their plain
 * API and this decides what a notification looks like.
 *
 * The result reads like the rest of the product: a ruled plate, the status as a
 * mono word rather than a symbol, the message in the UI face, and a rule down
 * the left edge in the status colour. Errors are assertive to assistive tech and
 * stay twice as long, because a failure the reader missed is a failure repeated.
 */

const TONES = {
  success: { label: 'done', color: 'var(--verified)' },
  error: { label: 'failed', color: 'var(--signal)' },
  loading: { label: 'working', color: 'var(--type-secondary)' },
  blank: { label: 'note', color: 'var(--type-secondary)' },
  custom: { label: 'note', color: 'var(--type-secondary)' },
} as const

function HatchToast({ t }: { t: Toast }) {
  const tone = TONES[t.type as keyof typeof TONES] ?? TONES.blank
  const isError = t.type === 'error'

  return (
    <div
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      // The width lives here, not in toastOptions: with Toaster's render prop
      // the library's own ToastBar is bypassed, and toastOptions.style and
      // .className go with it. Setting them there left the toast spanning a
      // 1440px screen.
      className="pointer-events-auto flex w-full max-w-[380px] items-start gap-3 border border-rule bg-ink py-3 pl-3 pr-2 motion-reduce:transition-none"
      style={{
        borderLeftWidth: '2px',
        borderLeftColor: tone.color,
        // Enter and leave on one axis. No scale, no bounce: a notification is
        // an announcement, not an event.
        transform: t.visible ? 'translateY(0)' : 'translateY(-6px)',
        opacity: t.visible ? 1 : 0,
        transition: 'transform 180ms var(--ease-enter, ease-out), opacity 180ms linear',
      }}
    >
      <span data-mono className="shrink-0 pt-px text-mono" style={{ color: tone.color }}>
        {tone.label}
      </span>

      <p className="min-w-0 flex-1 break-words font-sans text-ui-s text-type-primary">
        {typeof t.message === 'function' ? t.message(t) : t.message}
      </p>

      <button
        type="button"
        onClick={() => toast.dismiss(t.id)}
        aria-label="Dismiss notification"
        className="-m-1 shrink-0 p-1 text-type-muted hover:text-type-primary active:text-type-primary"
      >
        <Glyph name="cross" size={14} />
      </button>
    </div>
  )
}

export function AppToaster() {
  const [isLarge, setIsLarge] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const update = () => setIsLarge(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  return (
    <Toaster
      position={isLarge ? 'top-right' : 'bottom-center'}
      // The header is sticky and 64px tall. At `top: 16` the toast sat on top of
      // it and hid the account menu, so on laptop it starts below the header.
      // `inset` stays: replacing it with four explicit sides changed how the
      // container lays its children out and collapsed the toast to 23px.
      containerStyle={{ inset: 16, ...(isLarge ? { top: 80 } : null) }}
      gutter={8}
      toastOptions={{
        duration: 4000,
        // A failure the reader missed is a failure repeated.
        error: { duration: 7000 },
        className: 'hatch-toast',
        // The wrapper carries no appearance of its own; HatchToast is the toast.
        style: {
          background: 'transparent',
          border: 'none',
          boxShadow: 'none',
          padding: 0,
          margin: 0,
          maxWidth: '380px',
          width: '100%',
        },
      }}
    >
      {(t) => <HatchToast t={t} />}
    </Toaster>
  )
}

export default AppToaster
