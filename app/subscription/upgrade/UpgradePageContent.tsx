'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import RollerLoader from '@/components/ui/RollerLoader'
import QRPaymentModal from '@/components/payment/QRPaymentModal'
import { 
  CheckCircleIcon, 
  ArrowLeftIcon,
  StarIcon
} from '@heroicons/react/24/outline'

export default function UpgradePageContent() {
  const { profile } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedPlan, setSelectedPlan] = useState<'basic_99' | 'premium_149'>('basic_99')
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  useEffect(() => {
    const planParam = searchParams.get('plan')
    if (planParam === 'basic_99' || planParam === 'premium_149') {
      setSelectedPlan(planParam)
    }
  }, [searchParams])

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#000000' }}>
        <RollerLoader />
      </div>
    )
  }

  const plans = {
    basic_99: {
      name: 'Explorer',
      monthlyPrice: 99,
      annualPrice: 999,
      savings: 189,
      features: [
        '7 curated events',
        'New events added regularly',
        'Priority event registration',
        'Advanced filtering',
        'Event reminders',
        'Profile showcase',
        'Referral rewards'
      ],
      icon: StarIcon,
      description: 'Perfect for active event participants'
    },
    premium_149: {
      name: 'Professional',
      monthlyPrice: 149,
      annualPrice: 1499,
      savings: 289,
      features: [
        'All hackathons & events',
        'Fresh hackathons regularly',
        'Early access to events',
        'VIP event access',
        'Networking opportunities',
        'Career guidance',
        'Premium support',
        'Custom event requests'
      ],
      icon: StarIcon,
      description: 'For serious professionals and career builders'
    }
  }

  const currentPlan = plans[selectedPlan]
  const finalPrice = billingCycle === 'annual' ? currentPlan.annualPrice : currentPlan.monthlyPrice

  const handleUpgrade = () => {
    setShowPaymentModal(true)
  }

  return (
    <div className="min-h-screen funky-events-background">
      {/* Header */}
      <header className="glass-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-white">
                HATCH
              </Link>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link href="/dashboard" className="text-white/80 hover:text-white">
                Dashboard
              </Link>
              <Link href="/events" className="text-white/80 hover:text-white">
                Events
              </Link>
              <Link href="/subscription" className="text-white font-medium">
                Subscription
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Back Button */}
          <Link 
            href="/subscription" 
            className="inline-flex items-center text-white hover:text-cyan-300 transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Subscription
          </Link>

          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-4">
              Upgrade Your HATCH Experience
            </h1>
            <p className="text-xl text-white/80">
              Get access to more curated events and premium features
            </p>
          </div>

          {/* Plan Selection */}
          <div className="funky-upgrade-card funky-upgrade-card-cyan">
            <div className="funky-upgrade-header">Choose Your Plan</div>
            <div className="funky-upgrade-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(plans).map(([planId, plan]) => (
                  <button
                    key={planId}
                    onClick={() => setSelectedPlan(planId as any)}
                    className={`funky-plan-option ${
                      selectedPlan === planId ? 'funky-plan-selected' : ''
                    }`}
                  >
                    <div className="flex items-center mb-2">
                      <plan.icon className="h-6 w-6 text-white mr-2" />
                      <span className="font-semibold text-white">{plan.name}</span>
                    </div>
                    <p className="text-sm text-white/90 mb-2">{plan.description}</p>
                    <div className="text-lg font-bold text-white">
                      ₹{plan.monthlyPrice}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Billing Cycle */}
          <div className="funky-upgrade-card funky-upgrade-card-purple">
            <div className="funky-upgrade-header">Billing Cycle</div>
            <div className="funky-upgrade-body">
              <div className="space-y-3">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`funky-billing-option ${
                    billingCycle === 'monthly' ? 'funky-billing-selected' : ''
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-white">One-time</div>
                      <div className="text-sm text-white/90">Pay once, access forever</div>
                    </div>
                    <div className="text-lg font-bold text-white">
                      ₹{currentPlan.monthlyPrice}
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setBillingCycle('annual')}
                  className={`funky-billing-option ${
                    billingCycle === 'annual' ? 'funky-billing-selected' : ''
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="flex items-center">
                        <span className="font-semibold text-white mr-2">Annual</span>
                        <span className="bg-green-500 text-white text-xs font-medium px-2 py-1 rounded-full">
                          Save ₹{currentPlan.savings}
                        </span>
                      </div>
                      <div className="text-sm text-white/90">17% off - best value</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-white">
                        ₹{currentPlan.annualPrice}
                      </div>
                      <div className="text-sm text-white/70 line-through">
                        ₹{currentPlan.monthlyPrice * 12}
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Plan Features */}
          <div className="funky-upgrade-card funky-upgrade-card-orange">
            <div className="funky-upgrade-header">
              What's included in {currentPlan.name}
            </div>
            <div className="funky-upgrade-body">
              <ul className="space-y-3">
                {currentPlan.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-green-400 mr-3 flex-shrink-0" />
                    <span className="text-gray-800">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Order Summary */}
          <div className="funky-upgrade-card funky-upgrade-card-pink">
            <div className="funky-upgrade-header">Order Summary</div>
            <div className="funky-upgrade-body">
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-700">Plan:</span>
                  <span className="font-medium text-gray-800">{currentPlan.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Billing:</span>
                  <span className="font-medium text-gray-800">
                    {billingCycle === 'annual' ? 'Annual' : 'Monthly'}
                  </span>
                </div>
                {billingCycle === 'annual' && (
                  <div className="flex justify-between text-green-600">
                    <span>Savings:</span>
                    <span className="font-medium">₹{currentPlan.savings}</span>
                  </div>
                )}
              </div>
              <div className="border-t border-gray-300 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-800">Total:</span>
                  <span className="text-2xl font-bold text-gray-800">
                    ₹{finalPrice}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Upgrade Button */}
          <div className="text-center">
            <button 
              onClick={handleUpgrade}
              className="funky-upgrade-button"
            >
              Upgrade to {currentPlan.name}
            </button>
            <p className="text-sm text-white/60 mt-2">
              Secure payment • Lifetime access • 30-day money-back guarantee
            </p>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <QRPaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          selectedTier={selectedPlan}
          amount={finalPrice}
          billingCycle={billingCycle}
        />
      )}
    </div>
  )
}