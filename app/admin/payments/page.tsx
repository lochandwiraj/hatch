'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { 
  CreditCardIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  PhotoIcon,
  UserIcon,
  CurrencyRupeeIcon,
  CalendarDaysIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'
import { formatDate } from '@/lib/utils'

interface PaymentSubmission {
  id: string
  user_id: string
  username: string
  full_name: string
  email: string
  transaction_id: string
  payment_screenshot_url: string
  requested_tier: 'basic_99' | 'premium_149'
  amount_paid: number
  payment_method: string
  status: 'pending' | 'approved' | 'rejected'
  admin_notes: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
}

export default function AdminPaymentsPage() {
  const { user } = useAuth()
  const [payments, setPayments] = useState<PaymentSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPayment, setSelectedPayment] = useState<PaymentSubmission | null>(null)
  const [reviewModal, setReviewModal] = useState(false)
  const [reviewNotes, setReviewNotes] = useState('')
  const [processing, setProcessing] = useState(false)

  // Check if user is admin
  const isAdmin = user?.email === 'dwiraj06@gmail.com' || 
                  user?.email === 'pokkalilochan@gmail.com' ||
                  user?.email === 'dwiraj@HATCH.in' || 
                  user?.email === 'lochan@HATCH.in'

  useEffect(() => {
    if (isAdmin) {
      loadPayments()
    }
  }, [isAdmin, filter])

  const loadPayments = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('payment_submissions')
        .select('*')
        .order('created_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data, error } = await query

      if (error) throw error

      let filteredData = data || []

      // Apply search filter
      if (searchQuery.trim()) {
        filteredData = filteredData.filter(payment => 
          payment.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          payment.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          payment.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          payment.transaction_id.toLowerCase().includes(searchQuery.toLowerCase())
        )
      }

      setPayments(filteredData)
    } catch (error: any) {
      console.error('Error loading payments:', error)
      toast.error('Failed to load payment submissions')
    } finally {
      setLoading(false)
    }
  }

  const handleReviewPayment = async (paymentId: string, action: 'approve' | 'reject') => {
    if (!selectedPayment) return

    setProcessing(true)

    try {
      // Update payment status
      const { error: updateError } = await supabase
        .from('payment_submissions')
        .update({
          status: action === 'approve' ? 'approved' : 'rejected',
          admin_notes: reviewNotes.trim() || null,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', paymentId)

      if (updateError) throw updateError

      // If approved, upgrade user tier
      if (action === 'approve') {
        const { error: tierError } = await supabase.rpc('admin_upgrade_user_tier', {
          target_user_id: selectedPayment.user_id,
          new_tier: selectedPayment.requested_tier,
          admin_user_id: user?.id,
          duration_days: 30
        })

        if (tierError) {
          console.error('Error upgrading user tier:', tierError)
          toast.error('Payment approved but failed to upgrade user tier. Please upgrade manually.')
        } else {
          toast.success(`Payment ${action}d and user upgraded to ${selectedPayment.requested_tier === 'basic_99' ? 'Explorer' : 'Professional'}!`)
        }
      } else {
        toast.success(`Payment ${action}d successfully!`)
      }

      // Close modal and refresh
      setReviewModal(false)
      setSelectedPayment(null)
      setReviewNotes('')
      loadPayments()

    } catch (error: any) {
      console.error('Error reviewing payment:', error)
      toast.error(`Failed to ${action} payment`)
    } finally {
      setProcessing(false)
    }
  }

  const openReviewModal = (payment: PaymentSubmission) => {
    setSelectedPayment(payment)
    setReviewNotes(payment.admin_notes || '')
    setReviewModal(true)
  }

  const closeReviewModal = () => {
    setReviewModal(false)
    setSelectedPayment(null)
    setReviewNotes('')
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved': return 'success'
      case 'rejected': return 'error'
      case 'pending': return 'warning'
      default: return 'default'
    }
  }

  const getTierName = (tier: string) => {
    return tier === 'basic_99' ? 'Explorer' : 'Professional'
  }

  const searchPayments = () => {
    loadPayments()
  }

  const clearSearch = () => {
    setSearchQuery('')
    loadPayments()
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-900 mb-4">Access Denied</h1>
          <p className="text-neutral-600 mb-4">You don't have permission to access this page.</p>
          <Link href="/dashboard">
            <Button>Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  const stats = {
    total: payments.length,
    pending: payments.filter(p => p.status === 'pending').length,
    approved: payments.filter(p => p.status === 'approved').length,
    rejected: payments.filter(p => p.status === 'rejected').length,
    totalAmount: payments.filter(p => p.status === 'approved').reduce((sum, p) => sum + p.amount_paid, 0)
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
              <Link href="/admin/events" className="bg-primary-100 text-primary-700 hover:bg-primary-200 hover:text-primary-800 px-3 py-2 rounded-md text-sm font-medium transition-colors border border-primary-200">
                📅 Events
              </Link>
              <Link href="/admin/manage-events" className="bg-primary-100 text-primary-700 hover:bg-primary-200 hover:text-primary-800 px-3 py-2 rounded-md text-sm font-medium transition-colors border border-primary-200">
                🔧 Manage
              </Link>
              <Link href="/admin/manage-users" className="bg-primary-100 text-primary-700 hover:bg-primary-200 hover:text-primary-800 px-3 py-2 rounded-md text-sm font-medium transition-colors border border-primary-200">
                👥 Users
              </Link>
              <Link href="/admin/payments" className="text-primary-600 font-medium">
                💳 Payments
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">Payment Management</h1>
              <p className="text-neutral-600 mt-1">
                Review and approve user payment submissions
              </p>
            </div>
            <Button onClick={loadPayments} disabled={loading}>
              {loading ? 'Refreshing...' : 'Refresh Payments'}
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <Card className="text-center">
              <CreditCardIcon className="h-8 w-8 text-primary-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-neutral-900">
                {stats.total}
              </div>
              <p className="text-neutral-600">Total Submissions</p>
            </Card>
            
            <Card className="text-center">
              <ClockIcon className="h-8 w-8 text-warning-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-neutral-900">
                {stats.pending}
              </div>
              <p className="text-neutral-600">Pending Review</p>
            </Card>
            
            <Card className="text-center">
              <CheckCircleIcon className="h-8 w-8 text-success-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-neutral-900">
                {stats.approved}
              </div>
              <p className="text-neutral-600">Approved</p>
            </Card>
            
            <Card className="text-center">
              <XCircleIcon className="h-8 w-8 text-error-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-neutral-900">
                {stats.rejected}
              </div>
              <p className="text-neutral-600">Rejected</p>
            </Card>

            <Card className="text-center">
              <CurrencyRupeeIcon className="h-8 w-8 text-accent-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-neutral-900">
                ₹{stats.totalAmount}
              </div>
              <p className="text-neutral-600">Total Revenue</p>
            </Card>
          </div>

          {/* Search and Filters */}
          <Card>
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search by username, name, email, or transaction ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchPayments()}
                  className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              
              <Button onClick={searchPayments} disabled={loading}>
                Search
              </Button>
              
              {searchQuery && (
                <Button variant="secondary" onClick={clearSearch}>
                  Clear
                </Button>
              )}
            </div>

            {/* Status Filter */}
            <div className="mt-4 pt-4 border-t border-neutral-200">
              <div className="flex flex-wrap gap-2">
                <span className="text-sm font-medium text-neutral-700 mr-2">Filter by status:</span>
                {[
                  { key: 'all', label: 'All Payments' },
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
            </div>
          </Card>

          {/* Payments List */}
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
                      <div className="flex items-center mb-3">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-accent rounded-full flex items-center justify-center mr-3">
                            <span className="text-white font-semibold">
                              {payment.full_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-neutral-900">
                              {payment.full_name}
                            </h3>
                            <p className="text-sm text-neutral-600">@{payment.username}</p>
                            <p className="text-xs text-neutral-500">{payment.email}</p>
                          </div>
                        </div>
                        
                        <div className="ml-4 flex items-center gap-2">
                          <Badge variant={getStatusBadgeVariant(payment.status)}>
                            {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-neutral-600">
                        <div>
                          <span className="font-medium">Transaction ID:</span> {payment.transaction_id}
                        </div>
                        <div>
                          <span className="font-medium">Requested Tier:</span> {getTierName(payment.requested_tier)}
                        </div>
                        <div>
                          <span className="font-medium">Amount:</span> ₹{payment.amount_paid}
                        </div>
                        <div>
                          <span className="font-medium">Method:</span> {payment.payment_method}
                        </div>
                        <div>
                          <span className="font-medium">Submitted:</span> {formatDate(payment.created_at)}
                        </div>
                        {payment.reviewed_at && (
                          <div>
                            <span className="font-medium">Reviewed:</span> {formatDate(payment.reviewed_at)}
                          </div>
                        )}
                      </div>

                      {payment.admin_notes && (
                        <div className="mt-3 p-2 bg-neutral-50 rounded text-sm">
                          <span className="font-medium text-neutral-700">Admin Notes:</span> {payment.admin_notes}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2 mt-4 lg:mt-0">
                      {payment.payment_screenshot_url && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => window.open(payment.payment_screenshot_url, '_blank')}
                        >
                          <PhotoIcon className="h-4 w-4 mr-1" />
                          View Screenshot
                        </Button>
                      )}
                      
                      {payment.status === 'pending' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => openReviewModal(payment)}
                        >
                          Review Payment
                        </Button>
                      )}
                      
                      {payment.status !== 'pending' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => openReviewModal(payment)}
                        >
                          View Details
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <div className="text-center py-12">
                <CreditCardIcon className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-neutral-900 mb-2">
                  No payment submissions found
                </h3>
                <p className="text-neutral-600 mb-4">
                  {searchQuery 
                    ? 'Try adjusting your search terms or filters'
                    : filter === 'all' 
                      ? 'No payment submissions have been made yet'
                      : `No ${filter} payments found`
                  }
                </p>
                {searchQuery && (
                  <Button variant="secondary" onClick={clearSearch}>
                    Clear Search
                  </Button>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {reviewModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-6">
                Review Payment Submission
              </h2>

              {/* User Details */}
              <div className="bg-neutral-50 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-neutral-900 mb-3">User Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div><span className="font-medium">Name:</span> {selectedPayment.full_name}</div>
                  <div><span className="font-medium">Username:</span> @{selectedPayment.username}</div>
                  <div><span className="font-medium">Email:</span> {selectedPayment.email}</div>
                  <div><span className="font-medium">Requested Tier:</span> {getTierName(selectedPayment.requested_tier)}</div>
                  <div><span className="font-medium">Amount:</span> ₹{selectedPayment.amount_paid}</div>
                  <div><span className="font-medium">Payment Method:</span> {selectedPayment.payment_method}</div>
                  <div><span className="font-medium">Transaction ID:</span> {selectedPayment.transaction_id}</div>
                  <div><span className="font-medium">Submitted:</span> {formatDate(selectedPayment.created_at)}</div>
                </div>
              </div>

              {/* Screenshot */}
              {selectedPayment.payment_screenshot_url && (
                <div className="mb-6">
                  <h3 className="font-medium text-neutral-900 mb-3">Payment Screenshot</h3>
                  <div className="border rounded-lg p-4 text-center">
                    <img 
                      src={selectedPayment.payment_screenshot_url} 
                      alt="Payment Screenshot" 
                      className="max-w-full h-64 object-contain mx-auto"
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => window.open(selectedPayment.payment_screenshot_url, '_blank')}
                      className="mt-2"
                    >
                      View Full Size
                    </Button>
                  </div>
                </div>
              )}

              {/* Admin Notes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Admin Notes (Optional)
                </label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add notes about this payment review..."
                  rows={3}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <Button
                  variant="secondary"
                  onClick={closeReviewModal}
                  className="flex-1"
                >
                  Cancel
                </Button>
                
                {selectedPayment.status === 'pending' && (
                  <>
                    <Button
                      variant="danger"
                      onClick={() => handleReviewPayment(selectedPayment.id, 'reject')}
                      loading={processing}
                      className="flex-1"
                    >
                      Reject Payment
                    </Button>
                    <Button
                      onClick={() => handleReviewPayment(selectedPayment.id, 'approve')}
                      loading={processing}
                      className="flex-1"
                    >
                      Approve & Upgrade User
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}