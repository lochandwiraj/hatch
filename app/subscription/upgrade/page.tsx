'use client'

import { Suspense } from 'react'
import Header from '@/components/layout/Header'
import UpgradePageContent from './UpgradePageContent'

export default function UpgradePage() {
  return (
    <div className="min-h-screen">
      <Header />
      <Suspense fallback={
        <div className="flex items-center justify-center h-[60vh]">
          <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <UpgradePageContent />
      </Suspense>
    </div>
  )
}
