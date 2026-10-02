'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Hatch } from '@/components/brand/Hatch'
import { Button } from '@/components/ui/Button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="min-h-screen bg-ink px-4 py-24 lg:px-16">
      <div className="mx-auto max-w-measure">
        <p data-mono className="text-mono text-signal">
          500
        </p>
        <h1 className="mt-4 font-display text-display-m text-type-primary">
          Something broke on our side
        </h1>
        <p className="mt-4 max-w-tight font-serif text-body text-type-secondary">
          This is not your fault. Retrying usually works. If it keeps happening, send the
          reference below to hatch@hatchevent.in and we will look at it.
        </p>

        {error.digest ? (
          <p className="mt-6 border border-rule px-4 py-3">
            <span className="font-sans text-label uppercase text-type-muted">Reference</span>
            <br />
            <span data-mono className="text-mono text-type-primary">
              {error.digest}
            </span>
          </p>
        ) : null}

        <div className="mt-12 flex flex-wrap gap-3">
          <Button onClick={reset}>Try again</Button>
          <Link
            href="/"
            className="inline-flex min-h-touch items-center border border-rule-strong px-4 py-3 font-sans text-ui text-type-primary hover:bg-type-primary hover:text-ink active:bg-type-primary active:text-ink"
          >
            Back to <Hatch className="ml-1" />
          </Link>
        </div>
      </div>
    </main>
  )
}
