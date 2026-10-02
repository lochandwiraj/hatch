'use client'

import { useEffect } from 'react'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])

  return (
    <div className="px-4 py-16 lg:px-12">
      <p data-mono className="text-mono text-signal">error</p>
      <h2 className="mt-3 font-display text-display-m text-type-primary">Could not load the event admin</h2>
      <p className="mt-3 max-w-tight font-serif text-body text-type-secondary">
        This is not your fault. Retrying usually works.
      </p>
      {error.digest ? (
        <p className="mt-6 border border-rule px-4 py-3">
          <span className="font-sans text-label uppercase text-type-muted">Reference</span>
          <br />
          <span data-mono className="text-mono text-type-primary">{error.digest}</span>
        </p>
      ) : null}
      <button
        type="button"
        onClick={reset}
        className="mt-8 inline-flex min-h-touch items-center border border-signal bg-signal px-6 py-3 font-sans text-ui text-ink hover:bg-ink hover:text-signal active:bg-ink active:text-signal"
      >
        Try again
      </button>
    </div>
  )
}
