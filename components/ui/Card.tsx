import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

/**
 * A bounded block. Not a "card" in the marketing sense: no radius, no shadow,
 * no lift on hover. Depth comes from the rule and, where it earns it, the
 * offset plate behind.
 *
 * The old `hover` prop added a shadow transition, which is banned, so it now
 * controls the rule weight instead.
 */
interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Emphasise the edge on pointer and press. */
  interactive?: boolean
  /** Print misregistration: a 4px offset rule behind the block. */
  offset?: boolean
}

const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, interactive = false, offset = false, children, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn(
        'border border-rule bg-ink-raised p-6',
        interactive && 'hover:border-rule-strong active:border-signal',
        offset && 'offset-plate',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})

export default Card
