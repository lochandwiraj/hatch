'use client'

import { Suspense } from 'react'
import UpgradePageContent from './UpgradePageContent'

export default function UpgradePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    }>
      <UpgradePageContent />
    </Suspense>
  )
}