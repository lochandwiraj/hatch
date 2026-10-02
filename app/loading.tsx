/**
 * Route-level loading. Motion behaviour 9.
 *
 * Not a skeleton. Skeletons are banned: they fake a layout that may never
 * arrive, and with this much empty data they routinely lie about what is
 * coming. This states what is being fetched and fills a single rule as it
 * goes. Pure CSS, so it costs nothing and works with reduced motion.
 */
export default function Loading() {
  return (
    <div
      className="min-h-screen bg-ink px-4 py-24 lg:px-16"
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <div className="mx-auto max-w-measure">
        <p data-mono className="text-mono text-type-secondary">
          Fetching
        </p>
        <div className="mt-3 h-px w-full bg-rule">
          <div className="h-px animate-[fill_1.1s_var(--ease-enter)_infinite] bg-signal" />
        </div>
      </div>

      <style>{`
        @keyframes fill {
          0%   { width: 0%;   opacity: 1; }
          70%  { width: 88%;  opacity: 1; }
          100% { width: 100%; opacity: 0.35; }
        }
        @media (prefers-reduced-motion: reduce) {
          [role="status"] div > div { animation: none; width: 40%; }
        }
      `}</style>
    </div>
  )
}
