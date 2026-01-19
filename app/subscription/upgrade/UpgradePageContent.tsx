'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Button from '@/components/ui/Button'
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
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
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
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold gradient-text">
                HATCH
              </Link>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link href="/dashboard" className="text-neutral-600 hover:text-primary-600">
                Dashboard
              </Link>
              <Link href="/events" className="text-neutral-600 hover:text-primary-600">
                Events
              </Link>
              <Link href="/subscription" className="text-primary-600 font-medium">
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
            className="inline-flex items-center text-primary-600 hover:text-primary-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Subscription
          </Link>

          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-neutral-900 mb-4">
              Upgrade Your HATCH Experience
            </h1>
            <p className="text-xl text-neutral-600">
              Get access to more curated events and premium features
            </p>
          </div>

          {/* Plan Selection */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4">Choose Your Plan</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(plans).map(([planId, plan]) => (
                <button
                  key={planId}
                  onClick={() => setSelectedPlan(planId as any)}
                  className={`p-4 rounded-lg border-2 text-left transition-colors ${
                    selectedPlan === planId
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-center mb-2">
                    <plan.icon className="h-6 w-6 text-primary-600 mr-2" />
                    <span className="font-semibold text-neutral-900">{plan.name}</span>
                  </div>
                  <p className="text-sm text-neutral-600 mb-2">{plan.description}</p>
                  <div className="text-lg font-bold text-primary-600">
                    ₹{plan.monthlyPrice}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Billing Cycle */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4">Billing Cycle</h2>
            <div className="space-y-3">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${
                  billingCycle === 'monthly'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-neutral-900">One-time</div>
                    <div className="text-sm text-neutral-600">Pay once, access forever</div>
                  </div>
                  <div className="text-lg font-bold text-neutral-900">
                    ₹{currentPlan.monthlyPrice}
                  </div>
                </div>
              </button>

              <button
                onClick={() => setBillingCycle('annual')}
                className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${
                  billingCycle === 'annual'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center">
                      <span className="font-semibold text-neutral-900 mr-2">Annual</span>
                      <span className="bg-success-100 text-success-800 text-xs font-medium px-2 py-1 rounded-full">
                        Save ₹{currentPlan.savings}
                      </span>
                    </div>
                    <div className="text-sm text-neutral-600">17% off - best value</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-neutral-900">
                      ₹{currentPlan.annualPrice}
                    </div>
                    <div className="text-sm text-neutral-500 line-through">
                      ₹{currentPlan.monthlyPrice * 12}
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Plan Features */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4">
              What's included in {currentPlan.name}
            </h2>
            <ul className="space-y-3">
              {currentPlan.features.map((feature, index) => (
                <li key={index} className="flex items-center">
                  <CheckCircleIcon className="h-5 w-5 text-success-500 mr-3 flex-shrink-0" />
                  <span className="text-neutral-700">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Order Summary */}
          <div className="bg-gradient-secondary rounded-xl p-6 border border-primary-200">
            <h2 className="text-xl font-semibold text-primary-800 mb-4">Order Summary</h2>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-primary-700">Plan:</span>
                <span className="font-medium text-primary-800">{currentPlan.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-primary-700">Billing:</span>
                <span className="font-medium text-primary-800">
                  {billingCycle === 'annual' ? 'Annual' : 'Monthly'}
                </span>
              </div>
              {billingCycle === 'annual' && (
                <div className="flex justify-between text-success-700">
                  <span>Savings:</span>
                  <span className="font-medium">₹{currentPlan.savings}</span>
                </div>
              )}
            </div>
            <div className="border-t border-primary-300 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-primary-800">Total:</span>
                <span className="text-2xl font-bold text-primary-800">
                  ₹{finalPrice}
                </span>
              </div>
            </div>
          </div>

          {/* Upgrade Button */}
          <div className="text-center">
            <Button 
              size="lg" 
              onClick={handleUpgrade}
              className="px-8 py-4 text-lg"
            >
              Upgrade to {currentPlan.name}
            </Button>
            <p className="text-sm text-neutral-500 mt-2">
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
        />
      )}
    </div>
  )
}