import FlowerLoader from './FlowerLoader'

/**
 * Full-screen wait, used by ProtectedRoute while auth resolves.
 * Behaviour 9: states what is happening, never a skeleton.
 */
export default function Loading({ label = 'Checking your session' }: { label?: string }) {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ink"
      role="status"
      aria-live="polite"
    >
      <FlowerLoader />
      <p data-mono className="text-mono text-type-secondary">
        {label}
      </p>
    </div>
  )
}
