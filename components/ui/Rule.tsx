/**
 * A hairline rule. The only structural divider in this system.
 *
 * Depth here comes from rules, overlap and offset, never from shadow, so this
 * is used far more than a divider usually is. `strong` is for an active or
 * emphasised edge, `signal` for the current item.
 */
export function Rule({
  orientation = 'horizontal',
  weight = 'hair',
  tone = 'default',
  className = '',
}: {
  orientation?: 'horizontal' | 'vertical'
  weight?: 'hair' | 'thick'
  tone?: 'default' | 'strong' | 'signal'
  className?: string
}) {
  const color =
    tone === 'signal' ? 'bg-signal' : tone === 'strong' ? 'bg-rule-strong' : 'bg-rule'
  const size =
    orientation === 'horizontal'
      ? weight === 'thick'
        ? 'h-[2px] w-full'
        : 'h-px w-full'
      : weight === 'thick'
        ? 'w-[2px] self-stretch'
        : 'w-px self-stretch'

  return <span role="separator" aria-orientation={orientation} className={`block ${size} ${color} ${className}`} />
}

export default Rule
