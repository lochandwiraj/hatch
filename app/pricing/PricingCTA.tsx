'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import { useRouter } from 'next/navigation'

interface Props {
  planId: string
  popular?: boolean
}

export default function PricingCTA({ planId, popular }: Props) {
  const { user } = useAuth()
  const router = useRouter()

  const handle = () => {
    if (user) router.push(planId === 'free' ? '/dashboard' : '/subscription/upgrade')
    else router.push('/auth')
  }

  const label = user ? (planId === 'free' ? 'Go to dashboard' : 'Upgrade now') : 'Get started'

  return (
    <button
      onClick={handle}
      className={`w-full text-ui py-2  ${
 popular
 ? 'bg-signal hover:bg-signal text-ink'
 : 'bg-ink-raised hover:bg-ink-raised text-type-primary'
 }`}
    >
      {label}
    </button>
  )
}
