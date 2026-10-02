/** Route-level wait. Behaviour 9: name the resource, never a skeleton. */
export default function Loading() {
  return (
    <div className="px-4 py-16 lg:px-12" role="status" aria-live="polite">
      <p data-mono className="text-mono text-type-secondary">Loading your dashboard</p>
      <div className="mt-3 h-px w-full bg-rule">
        <div className="h-px w-1/3 bg-signal motion-reduce:animate-none animate-[rule-fill_1.1s_var(--ease-enter)_infinite]" />
      </div>
      <style>{`@keyframes rule-fill { 0% { width: 0% } 70% { width: 88% } 100% { width: 100%; opacity: .35 } }`}</style>
    </div>
  )
}
