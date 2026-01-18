'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import MainLayout from '@/components/layout/MainLayout'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  EyeIcon,
  ClockIcon,
  CurrencyRupeeIcon
} from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'
import { formatDate } from '@/lib/utils'

interface PaymentRequest {
  id: string
  user_id: string
  plan_name: string
  plan_tier: string
  amount: number
  is_annual: boolean
  transaction_id: string
  screenshot_url: string
  qr_used: string
  status: 'pending' | 'approved' | 'rejected'
  admin_notes: string | null
  created_at: string
  user_profiles: {
    full_name: string
    email: string
    username: string
  }
}

export default function AdminPaymentsPage() {
  const { profile } = useAuth()
  const [payments, setPayments] = useState<PaymentRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [selectedPayment, setSelectedPayment] = useState<PaymentRequest | null>(null)
  const [showScreenshot, setShowScreenshot] = useState(false)

  // Check if user is admin
  const isAdmin = profile?.email === 'admin@eventscout.in' || 
                  profile?.email === 'dwiraj@eventscout.in' || 
                  profile?.email === 'lochan@eventscout.in'

  useEffect(() => {
    if (isAdmin) {
      loadPaymentRequests()
    }
  }, [isAdmin, filter])

  const loadPaymentRequests = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('payment_requests')
        .select(`
          *,
          user_profiles (
            full_name,
            email,
            username
          )
        `)
        .order('created_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data, error } = await query

      if (error) throw error
      setPayments(data || [])
    } catch (error: any) {
      toast.error('Failed to load payment requests')
      console.error('Error loading payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const approvePayment = async (paymentId: string) => {
    try {
      const { error } = await supabase.rpc('approve_payment_request', {
        request_id: paymentId,
        admin_user_id: profile?.id
      })

      if (error) throw error

      toast.success('Payment approved and subscription activated!')
      loadPaymentRequests()
    } catch (error: any) {
      toast.error('Failed to approve payment')
      console.error('Error approving payment:', error)
    }
  }

  const rejectPayment = async (paymentId: string, notes: string) => {
    try {
      const { error } = await supabase.rpc('reject_payment_request', {
        request_id: paymentId,
        admin_user_id: profile?.id,
        notes: notes
      })

      if (error) throw error

      toast.success('Payment rejected')
      loadPaymentRequests()
    } catch (error: any) {
      toast.error('Failed to reject payment')
      console.error('Error rejecting payment:', error)
    }
  }

  const viewScreenshot = async (payment: PaymentRequest) => {
    try {
      const { data } = await supabase.storage
        .from('payment-screenshots')
        .createSignedUrl(payment.screenshot_url, 3600) // 1 hour expiry

      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank')
      }
    } catch (error) {
      toast.error('Failed to load screenshot')
    }
  }

  if (!isAdmin) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-neutral-900 mb-4">Access Denied</h1>
          <p className="text-neutral-600">You don't have permission to access this page.</p>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Payment Management</h1>
            <p className="text-neutral-600 mt-1">
              Review and approve payment requests
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="text-center">
            <ClockIcon className="h-8 w-8 text-warning-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-neutral-900">
              {payments.filter(p => p.status === 'pending').length}
            </div>
            <p className="text-neutral-600">Pending</p>
          </Card>
          
          <Card className="text-center">
            <CheckCircleIcon className="h-8 w-8 text-success-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-neutral-900">
              {payments.filter(p => p.status === 'approved').length}
            </div>
            <p className="text-neutral-600">Approved</p>
          </Card>
          
          <Card className="text-center">
            <XCircleIcon className="h-8 w-8 text-error-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-neutral-900">
              {payments.filter(p => p.status === 'rejected').length}
            </div>
            <p className="text-neutral-600">Rejected</p>
          </Card>
          
          <Card className="text-center">
            <CurrencyRupeeIcon className="h-8 w-8 text-primary-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-neutral-900">
              ₹{payments
                .filter(p => p.status === 'approved')
                .reduce((sum, p) => sum + p.amount, 0)
                .toLocaleString()}
            </div>
            <p className="text-neutral-600">Total Revenue</p>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-neutral-700 mr-2">Filter by status:</span>
            {[
              { key: 'all', label: 'All' },
              { key: 'pending', label: 'Pending' },
              { key: 'approved', label: 'Approved' },
              { key: 'rejected', label: 'Rejected' }
            ].map((option) => (
              <button
                key={option.key}
                onClick={() => setFilter(option.key as any)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filter === option.key
                    ? 'bg-primary-100 text-primary-800'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </Card>

        {/* Payment Requests List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse h-32 bg-neutral-200 rounded-xl"></div>
            ))}
          </div>
        ) : payments.length > 0 ? (
          <div className="space-y-4">
            {payments.map((payment) => (
              <Card key={payment.id}>
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h3 className="text-lg font-semibold text-neutral-900 mr-3">
                        {payment.user_profiles.full_name}
                      </h3>
                      <Badge 
                        variant={
                          payment.status === 'approved' ? 'success' :
                          payment.status === 'rejected' ? 'error' :
                          'warning'
                        }
                      >
                        {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-neutral-600">
                      <div>
                        <span className="font-medium">Plan:</span> {payment.plan_name}
                        {payment.is_annual && <span className="text-success-600"> (Annual)</span>}
                      </div>
                      <div>
                        <span className="font-medium">Amount:</span> ₹{payment.amount}
                      </div>
                      <div>
                        <span className="font-medium">Transaction ID:</span> {payment.transaction_id}
                      </div>
                      <div>
                        <span className="font-medium">QR Used:</span> {payment.qr_used}
                      </div>
                      <div>
                        <span className="font-medium">Email:</span> {payment.user_profiles.email}
                      </div>
                      <div>
                        <span className="font-medium">Date:</span> {formatDate(payment.created_at)}
                      </div>
                    </div>

                    {payment.admin_notes && (
                      <div className="mt-2 p-2 bg-neutral-50 rounded text-sm">
                        <span className="font-medium">Admin Notes:</span> {payment.admin_notes}
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2 mt-4 lg:mt-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => viewScreenshot(payment)}
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      View Screenshot
                    </Button>
                    
                    {payment.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => approvePayment(payment.id)}
                        >
                          <CheckCircleIcon className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => {
                            const notes = prompt('Reason for rejection (optional):')
                            if (notes !== null) {
                              rejectPayment(payment.id, notes)
                            }
                          }}
                        >
                          <XCircleIcon className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <div className="text-center py-12">
              <ClockIcon className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 mb-2">
                No payment requests
              </h3>
              <p className="text-neutral-600">
                {filter === 'all' 
                  ? 'No payment requests found'
                  : `No ${filter} payment requests found`
                }
              </p>
            </div>
          </Card>
        )}
      </div>
    </MainLayout>
  )
}