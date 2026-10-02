'use client'

import { useEffect, useRef, useCallback } from 'react'

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

/**
 * The accessibility engine behind every modal and sheet.
 *
 * Owns the four things that are routinely forgotten and are not optional:
 * focus is trapped inside, Escape closes, focus returns to whatever opened it,
 * and the rest of the page is inert to assistive tech while it is open.
 *
 * It renders no styling of its own. Sheet and the modals do that.
 */
export function Overlay({
  open,
  onClose,
  labelledBy,
  children,
  className = '',
  align = 'center',
}: {
  open: boolean
  onClose: () => void
  /** id of the element naming this dialog. */
  labelledBy?: string
  children: React.ReactNode
  className?: string
  align?: 'center' | 'bottom' | 'right'
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const restoreTo = useRef<HTMLElement | null>(null)

  // onClose is nearly always an inline arrow, so its identity changes on every
  // render of the parent. Held in a ref, the key handler below can stay stable,
  // which keeps the setup effect from re-running on each keystroke. Without
  // this, typing in a field inside an overlay tore focus back to the first
  // control in the panel after every character.
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onCloseRef.current()
        return
      }
      if (e.key !== 'Tab' || !panelRef.current) return

      const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (n) => n.offsetParent !== null
      )
      if (nodes.length === 0) {
        e.preventDefault()
        return
      }
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    },
    // Stable on purpose: onClose is read through onCloseRef.
    []
  )

  useEffect(() => {
    if (!open) return

    restoreTo.current = document.activeElement as HTMLElement | null
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKeyDown, true)

    // Move focus in, preferring the first control over the panel itself.
    const t = setTimeout(() => {
      const node = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)
      ;(node ?? panelRef.current)?.focus()
    }, 0)

    return () => {
      clearTimeout(t)
      document.removeEventListener('keydown', onKeyDown, true)
      document.body.style.overflow = overflow
      restoreTo.current?.focus?.()
    }
    // Only `open`. Depending on the handler re-ran this on every parent
    // render, and its cleanup-then-setup moved focus back to the first control.
  }, [open])

  if (!open) return null

  const position =
    align === 'bottom'
      ? 'items-end justify-center'
      : align === 'right'
        ? 'items-stretch justify-end'
        : 'items-center justify-center'

  return (
    <div className={`fixed inset-0 z-[100] flex ${position}`}>
      {/* Scrim. Flat ink, never a blur. */}
      <button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 bg-ink opacity-90"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={`relative z-10 outline-none ${className}`}
      >
        {children}
      </div>
    </div>
  )
}

export default Overlay
