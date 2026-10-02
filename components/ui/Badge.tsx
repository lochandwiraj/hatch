import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

/**
 * A badge. Rectangular, 1px rule, no fill except where the state is the point.
 *
 * The previous variants pointed at primary-100, accent-800, success-100 and so
 * on, none of which exist in this palette, so they resolved to nothing at all.
 * These map onto the real token set.
 */
interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'locked'
  size?: 'sm' | 'md' | 'lg'
}

const variants: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'border-rule text-type-secondary',
  primary: 'border-signal text-signal',
  secondary: 'border-rule-strong text-type-primary',
  success: 'border-verified text-verified',
  warning: 'border-deadline text-deadline',
  error: 'border-signal bg-signal text-ink',
  locked: 'border-locked text-locked',
}

const sizes: Record<NonNullable<BadgeProps['size']>, string> = {
  sm: 'px-2 py-px text-label uppercase',
  md: 'px-2 py-1 text-ui-s',
  lg: 'px-3 py-2 text-ui',
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { className, variant = 'default', size = 'md', children, ...props },
  ref
) {
  return (
    <span
      ref={ref}
      className={cn('inline-flex items-center border font-sans', variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </span>
  )
})

export default Badge
