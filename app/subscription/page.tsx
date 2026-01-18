'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import { 
  CheckCircleIcon, 
  StarIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'
import { getSubscriptionTierName, getSubscriptionTierPrice, getWeeklyEventLimit } from '@/lib/utils'

export default function SubscriptionPage() {
  const { profile, user } = useAuth()

  if (!profile) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
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
        '5 curated events per week',
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
        '10 curated events per week',
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
        '15 curated events per week',
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
              {(user?.email === 'dwiraj06@gmail.com' || 
                user?.email === 'pokkalilochan@gmail.com' ||
                user?.email === 'dwiraj@HATCH.in' || 
                user?.email === 'lochan@HATCH.in') && (
                <>
                  <Link href="/admin/events" className="bg-primary-100 text-primary-700 hover:bg-primary-200 hover:text-primary-800 px-3 py-2 rounded-md text-sm font-medium transition-colors border border-primary-200">
                    📅 Events
                  </Link>
                  <Link href="/admin/manage-events" className="bg-primary-100 text-primary-700 hover:bg-primary-200 hover:text-primary-800 px-3 py-2 rounded-md text-sm font-medium transition-colors border border-primary-200">
                    🔧 Manage
                  </Link>
                  <Link href="/admin/payments" className="bg-primary-100 text-primary-700 hover:bg-primary-200 hover:text-primary-800 px-3 py-2 rounded-md text-sm font-medium transition-colors border border-primary-200">
                    💳 Payments
                  </Link>
                </>
              )}
              <Link href="/events" className="text-neutral-600 hover:text-primary-600">
                Events
              </Link>
              <Link href="/subscription" className="text-primary-600 font-medium">
                Subscription
              </Link>
              <Link href="/profile" className="text-neutral-600 hover:text-primary-600">
                Profile
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Current Subscription */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">Current Subscription</h2>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center mb-2">
                  <span className="text-lg font-semibold text-neutral-900 mr-2">
                    {getSubscriptionTierName(profile.subscription_tier)}
                  </span>
                  {profile.subscription_tier !== 'free' && (
                    <span className="bg-primary-100 text-primary-800 text-xs font-medium px-2 py-1 rounded-full">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-neutral-600">
                  You get {getWeeklyEventLimit(profile.subscription_tier)} curated events per week
                </p>
                {profile.subscription_expires_at && (
                  <p className="text-sm text-neutral-500 mt-1">
                    {profile.subscription_tier !== 'free' ? 'Renews' : 'Expires'} on{' '}
                    {new Date(profile.subscription_expires_at).toLocaleDateString()}
                  </p>
                )}
              </div>
              {profile.subscription_tier === 'free' && (
                <Link href="/subscription/upgrade">
                  <Button>
                    Upgrade Now
                    <ArrowRightIcon className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Pricing Plans */}
          <div>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-neutral-900 mb-4">Choose Your Plan</h2>
              <p className="text-xl text-neutral-600">
                Quality over quantity - curated events for your growth
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`relative bg-white rounded-xl shadow-sm border-2 p-8 ${
                    plan.popular
                      ? 'border-primary-500 shadow-lg'
                      : plan.current
                      ? 'border-success-500'
                      : 'border-neutral-200'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-primary-500 text-white text-sm font-semibold px-4 py-2 rounded-full">
                        Most Popular
                      </span>
                    </div>
                  )}

                  {plan.current && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-success-500 text-white text-sm font-semibold px-4 py-2 rounded-full">
                        Current Plan
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <plan.icon className="h-12 w-12 text-primary-600 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-neutral-900 mb-2">{plan.name}</h3>
                    <p className="text-neutral-600 mb-4">{plan.description}</p>
                    
                    <div className="space-y-2">
                      <div className="text-4xl font-bold text-neutral-900">
                        {plan.price}
                        <span className="text-lg text-neutral-500">/month</span>
                      </div>
                      {plan.id !== 'free' && (
                        <div className="text-sm text-neutral-600">
                          or {plan.annualPrice}/year (17% off)
                        </div>
                      )}
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <CheckCircleIcon className="h-5 w-5 text-success-500 mr-3 flex-shrink-0" />
                        <span className="text-neutral-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto">
                    {plan.current ? (
                      <Button disabled className="w-full">
                        Current Plan
                      </Button>
                    ) : plan.id === 'free' ? (
                      <Button variant="secondary" disabled className="w-full">
                        Free Forever
                      </Button>
                    ) : (
                      <Link href={`/subscription/upgrade?plan=${plan.id}`}>
                        <Button 
                          variant={plan.popular ? 'primary' : 'secondary'} 
                          className="w-full"
                        >
                          {profile.subscription_tier === 'free' ? 'Upgrade' : 'Switch Plan'}
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Benefits */}
          <div className="bg-gradient-secondary rounded-xl p-8">
            <h3 className="text-2xl font-bold text-primary-800 mb-6 text-center">
              Why Choose HATCH?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <StarIcon className="h-8 w-8 text-primary-600" />
                </div>
                <h4 className="font-semibold text-primary-800 mb-2">Curated Quality</h4>
                <p className="text-primary-600 text-sm">
                  We research 50+ sources weekly to bring you only the best opportunities
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircleIcon className="h-8 w-8 text-primary-600" />
                </div>
                <h4 className="font-semibold text-primary-800 mb-2">Save Time</h4>
                <p className="text-primary-600 text-sm">
                  Stop scrolling through endless event lists. We do the hunting for you.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <StarIcon className="h-8 w-8 text-primary-600" />
                </div>
                <h4 className="font-semibold text-primary-800 mb-2">Build Portfolio</h4>
                <p className="text-primary-600 text-sm">
                  Every event you attend goes on your profile to share with recruiters
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}