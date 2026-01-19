'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Button from '@/components/ui/Button'
import { 
  CalendarDaysIcon, 
  UserGroupIcon, 
  ChartBarIcon,
  CheckCircleIcon,
  StarIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  if (loading) {
    return <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
    </div>
  }

  if (user) {
    return null // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="floating-element">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-shadow">
              Stop Searching. <span className="text-accent-300">Start Discovering.</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-neutral-200 max-w-3xl mx-auto">
              Hand-picked student events. Save 10+ hours. Build your portfolio.
              Quality over quantity - your curated event digest.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button 
              size="lg" 
              onClick={() => router.push('/auth/signup')}
              className="text-lg px-8 py-4"
            >
              Get Started Free
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="secondary" 
              size="lg"
              onClick={() => router.push('/auth/login')}
              className="text-lg px-8 py-4 bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20"
            >
              Sign In
            </Button>
          </div>

          {/* Feature Icons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="backdrop-blur-glass rounded-xl p-6 border border-white/20">
              <CalendarDaysIcon className="h-12 w-12 text-accent-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Curated, Not Cluttered</h3>
              <p className="text-neutral-300">We research 50+ sources to bring you only the best opportunities.</p>
            </div>
            <div className="backdrop-blur-glass rounded-xl p-6 border border-white/20">
              <UserGroupIcon className="h-12 w-12 text-accent-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Save Time</h3>
              <p className="text-neutral-300">Stop scrolling through Unstop, Devfolio, LinkedIn. We do the hunting for you.</p>
            </div>
            <div className="backdrop-blur-glass rounded-xl p-6 border border-white/20">
              <ChartBarIcon className="h-12 w-12 text-accent-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Build Your Portfolio</h3>
              <p className="text-neutral-300">Every event you attend goes on your profile. Share it with recruiters.</p>
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-accent-400/20 rounded-full animate-float"></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-primary-400/20 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-40 left-20 w-12 h-12 bg-accent-300/20 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold gradient-text mb-4">
              Everything you need to manage events
            </h2>
            <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
              From small meetups to large conferences, Hatch provides all the tools you need
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="card hover:shadow-glow">
                <div className="flex items-center mb-4">
                  <feature.icon className="h-8 w-8 text-primary-600 mr-3" />
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                </div>
                <p className="text-neutral-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gradient-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-primary-800 mb-4">
              Choose Your Plan
            </h2>
            <p className="text-xl text-primary-600 max-w-2xl mx-auto">
              Start free and upgrade as you grow
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <div key={index} className={`card ${plan.popular ? 'ring-2 ring-primary-500 shadow-glow' : ''}`}>
                {plan.popular && (
                  <div className="bg-primary-500 text-white text-sm font-semibold px-3 py-1 rounded-full inline-block mb-4">
                    Most Popular
                  </div>
                )}
                <h3 className="text-2xl font-bold text-primary-800 mb-2">{plan.name}</h3>
                <div className="text-4xl font-bold text-primary-600 mb-4">
                  {plan.price}
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-success-500 mr-2" />
                      <span className="text-neutral-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  variant={plan.popular ? 'primary' : 'secondary'} 
                  className="w-full"
                  onClick={() => router.push('/auth/signup')}
                >
                  Get Started
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-primary text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-xl mb-8 text-neutral-200">
            Join thousands of event organizers who trust Hatch for their events
          </p>
          <Button 
            variant="secondary" 
            size="lg"
            onClick={() => router.push('/auth/signup')}
            className="bg-white text-primary-600 hover:bg-neutral-100"
          >
            Start Your Free Trial
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">Hatch</h3>
            <p className="text-neutral-300 mb-4">
              Modern event management for the digital age
            </p>
            <p className="text-neutral-400 text-sm">
              © 2024 Hatch. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

const features = [
  {
    icon: CalendarDaysIcon,
    title: 'Event Creation',
    description: 'Create and customize events with detailed information, dates, and requirements'
  },
  {
    icon: UserGroupIcon,
    title: 'User Management',
    description: 'Manage attendees, track registrations, and handle user profiles'
  },
  {
    icon: ChartBarIcon,
    title: 'Analytics Dashboard',
    description: 'Get insights into attendance patterns and event performance'
  },
  {
    icon: CheckCircleIcon,
    title: 'Attendance Tracking',
    description: 'Track who attended events and manage attendance confirmations'
  },
  {
    icon: StarIcon,
    title: 'Subscription Tiers',
    description: 'Offer different access levels with subscription-based event access'
  },
  {
    icon: ArrowRightIcon,
    title: 'Easy Integration',
    description: 'Seamlessly integrate with your existing tools and workflows'
  }
]

const pricingPlans = [
  {
    name: 'Free',
    price: '₹0',
    popular: false,
    features: [
      '5 curated events',
      'Basic profile management',
      'Event browsing',
      'Community access'
    ]
  },
  {
    name: 'Explorer',
    price: '₹99',
    popular: true,
    features: [
      '7 curated events',
      'New events added regularly',
      'Priority event registration',
      'Enhanced profile features',
      'Email notifications'
    ]
  },
  {
    name: 'Professional',
    price: '₹149',
    popular: false,
    features: [
      'All hackathons & events',
      'Fresh hackathons regularly',
      'VIP event access',
      'Advanced analytics',
      'Custom event requests',
      'Priority support'
    ]
  }
]