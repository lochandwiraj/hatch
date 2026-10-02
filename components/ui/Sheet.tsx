'use client'

import { useId } from 'react'
import { Overlay } from './Overlay'
import { Glyph } from './Glyph'

/**
 * A panel. Bottom sheet on a phone, right-edge panel on a laptop.
 *
 * Section 6 requires every modal to become a bottom sheet on phone, so that is
 * the default rather than an afterthought: the sheet enters on translateY and
 * sits within thumb reach, with a visible grabber rule. On lg it enters from
 * the right edge instead. Same component, same DOM, one breakpoint.
 *
 * Focus trapping, Escape and focus restore all come from Overlay.
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  const titleId = useId()

  return (
    <Overlay
      open={open}
      onClose={onClose}
      labelledBy={titleId}
      align="bottom"
      className="w-full lg:h-full lg:w-[460px]"
    >
      <div
        className="flex max-h-[88vh] w-full flex-col border-t border-rule bg-ink-raised lg:h-full lg:max-h-none lg:border-l lg:border-t-0 animate-[sheet-up_280ms_var(--ease-enter)] motion-reduce:animate-none lg:animate-[sheet-in_320ms_var(--ease-enter)]"
      >
        {/* Grabber. Phone only: it signals the sheet is draggable height. */}
        <div className="flex justify-center pt-2 lg:hidden" aria-hidden>
          <span className="h-px w-12 bg-rule-strong" />
        </div>

        <div className="flex items-start justify-between gap-4 border-b border-rule px-4 py-4">
          <h2 id={titleId} className="font-display text-title uppercase text-type-primary">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-touch w-touch shrink-0 items-center justify-center border border-rule text-type-secondary hover:border-signal hover:text-signal"
          >
            <Glyph name="cross" size={16} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">{children}</div>

        {footer ? <div className="border-t border-rule px-4 py-4">{footer}</div> : null}
      </div>

      <style>{`
        @keyframes sheet-up { from { transform: translateY(100%) } to { transform: translateY(0) } }
        @keyframes sheet-in { from { transform: translateX(100%) } to { transform: translateX(0) } }
      `}</style>
    </Overlay>
  )
}

export default Sheet
