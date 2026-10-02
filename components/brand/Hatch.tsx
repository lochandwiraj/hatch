/**
 * The HATCH wordmark. The ONLY way to render the brand name.
 *
 * Qepho Modern is the brand face and it is exempt from the entire type system:
 * no uppercase transform, no tracking, no weight change, no SplitText, no
 * per-character animation. It may fade or translate as a whole unit only.
 *
 * A raw "HATCH" string in JSX is a bug. Use this.
 */
export function Hatch({ className = '' }: { className?: string }) {
  return <span className={`font-qepho ${className}`}>HATCH</span>
}

/**
 * Founder names, which are also set in Qepho in the existing About page.
 * Same exemptions apply.
 */
export function BrandName({ children, className = '' }: { children: string; className?: string }) {
  return <span className={`font-qepho ${className}`}>{children}</span>
}

export default Hatch
