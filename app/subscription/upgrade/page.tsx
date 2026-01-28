'use client'

import { Suspense } from 'react'
import RollerLoader from '@/components/ui/RollerLoader'
import UpgradePageContent from './UpgradePageContent'

export default function UpgradePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#000000' }}>
        <RollerLoader />
      </div>
    }>
      <UpgradePageContent />
    </Suspense>
  )
}