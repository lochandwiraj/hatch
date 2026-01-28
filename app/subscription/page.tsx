'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import RollerLoader from '@/components/ui/RollerLoader'
import { 
  CheckCircleIcon, 
  StarIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'
import { getSubscriptionTierName, getSubscriptionTierPrice, getEventLimit, getEventLimitDescription } from '@/lib/utils'

export default function SubscriptionPage() {
  const { profile, user } = useAuth()

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center funky-events-background">
        <RollerLoader />
      </div>
    )
  }

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: '₹0',
      annualPrice: '₹0',
      description: 'Perfect for getting started',
      features: [
        '5 curated events',
        'Basic event browsing',
        'Community access',
        'Email notifications'
      ],
      icon: StarIcon,
      popular: false,
      current: profile.subscription_tier === 'free'
    },
    {
      id: 'basic_99',
      name: 'Explorer',
      price: '₹99',
      annualPrice: '₹999',
      description: 'For active event participants',
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
      popular: true,
      current: profile.subscription_tier === 'basic_99'
    },
    {
      id: 'premium_149',
      name: 'Professional',
      price: '₹149',
      annualPrice: '₹1,499',
      description: 'For serious professionals',
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
      popular: false,
      current: profile.subscription_tier === 'premium_149'
    }
  ]

  return (
    <div className="min-h-screen funky-events-background">
      {/* Header */}
      <header className="shadow-sm border-b border-gray-700" style={{ backgroundColor: '#1a1a1a' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-white">
                HATCH
              </Link>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link href="/dashboard" className="text-gray-300 hover:text-cyan-400">
                Dashboard
              </Link>
              {(user?.email === 'dwiraj06@gmail.com' || 
                user?.email === 'pokkalilochan@gmail.com' ||
                user?.email === 'dwiraj@hatch.in' || 
                user?.email === 'lochan@hatch.in') && (
                <>
                  <Link href="/admin/events" className="bg-gray-800 text-cyan-300 hover:bg-gray-700 hover:text-cyan-200 px-3 py-2 rounded-md text-sm font-medium transition-colors border border-gray-600">
                    Events
                  </Link>
                  <Link href="/admin/manage-events" className="bg-gray-800 text-cyan-300 hover:bg-gray-700 hover:text-cyan-200 px-3 py-2 rounded-md text-sm font-medium transition-colors border border-gray-600">
                    Manage
                  </Link>
                  <Link href="/admin/manage-users" className="bg-gray-800 text-cyan-300 hover:bg-gray-700 hover:text-cyan-200 px-3 py-2 rounded-md text-sm font-medium transition-colors border border-gray-600">
                    Users
                  </Link>
                  <Link href="/admin/payments" className="bg-gray-800 text-cyan-300 hover:bg-gray-700 hover:text-cyan-200 px-3 py-2 rounded-md text-sm font-medium transition-colors border border-gray-600">
                    Payments
                  </Link>
                </>
              )}
              <Link href="/events" className="text-gray-300 hover:text-cyan-400">
                Events
              </Link>
              <Link href="/calendar" className="text-gray-300 hover:text-cyan-400">
                Calendar
              </Link>
              <Link href="/subscription" className="text-cyan-400 font-medium">
                Subscription
              </Link>
              <Link href="/profile" className="text-gray-300 hover:text-cyan-400">
                Profile
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Current Subscription */}
          <div className="funky-current-subscription-card">
            <div className="funky-current-subscription-header">
              Current Subscription
            </div>
            <div className="funky-current-subscription-body">
              <div>
                <div className="flex items-center mb-2">
                  <span className="text-lg font-bold text-gray-800 mr-2">
                    {getSubscriptionTierName(profile.subscription_tier)}
                  </span>
                  {profile.subscription_tier !== 'free' && (
                    <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full border border-black">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-gray-700 font-medium">
                  You have access to {getEventLimitDescription(profile.subscription_tier)}
                </p>
                {profile.subscription_expires_at && (
                  <p className="text-sm text-gray-600 mt-1 font-medium">
                    {profile.subscription_tier !== 'free' ? 'Renews' : 'Expires'} on{' '}
                    {new Date(profile.subscription_expires_at).toLocaleDateString()}
                  </p>
                )}
              </div>
              {profile.subscription_tier === 'free' && (
                <Link href="/subscription/upgrade">
                  <button className="funky-plan-button" style={{ width: 'auto', minWidth: '120px' }}>
                    Upgrade Now
                    <ArrowRightIcon className="ml-2 h-4 w-4 inline" />
                  </button>
                </Link>
              )}
            </div>
          </div>

          {/* Pricing Plans */}
          <div>
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-white mb-4 text-shadow">Choose Your Plan</h2>
              <p className="text-xl text-gray-300 font-medium">
                Quality over quantity - curated events for your growth
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 justify-items-center">
              {plans.map((plan) => (
                <div key={plan.id} className="subscription-parent">
                  <div className={`subscription-card ${
                    plan.popular ? 'popular' : plan.current ? 'current' : ''
                  }`}>
                    
                    {/* Date Box */}
                    <div className={`subscription-date-box ${
                      plan.popular ? 'popular' : plan.current ? 'current' : ''
                    }`}>
                      <span className={`month ${
                        plan.popular ? 'popular' : plan.current ? 'current' : ''
                      }`}>
                        {plan.popular ? 'HOT' : plan.current ? 'NOW' : plan.id === 'premium_149' ? 'PRO' : 'FREE'}
                      </span>
                      <span className={`date ${
                        plan.popular ? 'popular' : plan.current ? 'current' : ''
                      }`}>
                        {plan.id === 'free' ? '0' : plan.id === 'basic_99' ? '99' : '149'}
                      </span>
                    </div>

                    {/* Content Box */}
                    <div className={`subscription-content-box ${
                      plan.popular ? 'popular' : plan.current ? 'current' : ''
                    }`}>
                      <div className="subscription-card-title">
                        {plan.name}
                      </div>
                      
                      <div className="subscription-card-price">
                        {plan.price}
                      </div>
                      
                      <div className="subscription-card-content">
                        <p style={{ fontSize: '13px', fontWeight: '700', marginBottom: '15px', textAlign: 'center' }}>
                          {plan.description}
                        </p>
                        
                        {plan.id !== 'free' && (
                          <p style={{ fontSize: '11px', fontWeight: '700', marginBottom: '15px', textAlign: 'center' }}>
                            or {plan.annualPrice}/year (17% off)
                          </p>
                        )}

                        <ul className="subscription-feature-list">
                          {plan.features.map((feature, index) => (
                            <li key={index} className="subscription-feature-item">
                              <CheckCircleIcon className="subscription-feature-icon" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>

                        <div style={{ marginTop: 'auto' }}>
                          {plan.current ? (
                            <button disabled className={`subscription-see-more current`}>
                              Current Plan
                            </button>
                          ) : plan.id === 'free' ? (
                            <button disabled className="subscription-see-more">
                              Free Forever
                            </button>
                          ) : (
                            <Link href={`/subscription/upgrade?plan=${plan.id}`}>
                              <button className={`subscription-see-more ${plan.popular ? 'popular' : ''}`}>
                                {profile.subscription_tier === 'free' ? 'Upgrade Now' : 'Switch Plan'}
                              </button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Benefits */}
          <div className="funky-benefits-card">
            <div className="funky-benefits-header">
              Why Choose HATCH?
            </div>
            <div className="funky-benefits-body">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="funky-benefit-item">
                  <div className="funky-benefit-icon">
                    <StarIcon className="h-8 w-8 text-white" />
                  </div>
                  <h4 className="funky-benefit-title">Curated Quality</h4>
                  <p className="funky-benefit-description">
                    We research 50+ sources weekly to bring you only the best opportunities
                  </p>
                </div>
                <div className="funky-benefit-item">
                  <div className="funky-benefit-icon">
                    <CheckCircleIcon className="h-8 w-8 text-white" />
                  </div>
                  <h4 className="funky-benefit-title">Save Time</h4>
                  <p className="funky-benefit-description">
                    Stop scrolling through endless event lists. We do the hunting for you.
                  </p>
                </div>
                <div className="funky-benefit-item">
                  <div className="funky-benefit-icon">
                    <StarIcon className="h-8 w-8 text-white" />
                  </div>
                  <h4 className="funky-benefit-title">Build Portfolio</h4>
                  <p className="funky-benefit-description">
                    Every event you attend goes on your profile to share with recruiters
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}