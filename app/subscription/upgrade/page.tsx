'use client'

import { Suspense } from 'react'
import Header from '@/components/layout/Header'
import UpgradePageContent from './UpgradePageContent'

export default function UpgradePage() {
  return (
    <div className="min-h-screen">
      <Header />
      <Suspense fallback={
        <div className="px-4 py-16 lg:px-12" role="status" aria-live="polite">
          <p data-mono className="text-mono text-type-secondary">Loading</p>
          <div className="mt-3 h-px w-full bg-rule">
            <div className="h-px w-1/3 bg-signal" />
          </div>
        </div>
      }>
        <UpgradePageContent />
      </Suspense>
    </div>
  )
}
