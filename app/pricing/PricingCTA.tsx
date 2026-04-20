'use client'

import { motion } from 'motion/react'
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
    <motion.button
      onClick={handle}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.15 }}
      className={`w-full text-sm py-2 rounded-lg transition-colors ${
        popular
          ? 'bg-violet-600 hover:bg-violet-500 text-white'
          : 'bg-white/[0.05] hover:bg-white/[0.08] text-zinc-300'
      }`}
    >
      {label}
    </motion.button>
  )
}
