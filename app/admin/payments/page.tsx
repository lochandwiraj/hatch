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
import { runPaymentCleanup, checkOldPayments } from '@/lib/cleanup'

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
  const [cleanupProcessing, setCleanupProcessing] = useState(false)
  const [oldPaymentsCount, setOldPaymentsCount] = useState(0)

  // Check if user is admin
  const isAdmin = user?.email === 'dwiraj06@gmail.com' || 
                  user?.email === 'pokkalilochan@gmail.com' ||
                  user?.email === 'dwiraj@HATCH.in' || 
                  user?.email === 'lochan@HATCH.in'

  useEffect(() => {
    if (isAdmin) {
      loadPayments()
      checkOldPaymentsCount()
    }
  }, [isAdmin, filter])

  const checkOldPaymentsCount = async () => {
    const result = await checkOldPayments()
    if (result.success) {
      setOldPaymentsCount(result.oldPaymentsCount || 0)
    }
  }

  const handleCleanupPayments = async () => {
    if (!confirm('Are you sure you want to delete all payment submissions older than 3 days? This action cannot be undone.')) {
      return
    }

    setCleanupProcessing(true)
    try {
      const result = await runPaymentCleanup()
      if (result.success) {
        toast.success(`Cleanup completed! ${result.records_deleted} old payment records deleted.`)
        loadPayments() // Refresh the list
        checkOldPaymentsCount() // Update count
      } else {
        toast.error(`Cleanup failed: ${result.error}`)
      }
    } catch (error: any) {
      toast.error('Cleanup failed: ' + error.message)
    } finally {
      setCleanupProcessing(false)
    }
  }

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
        // Determine duration based on payment amount or tier
        // Explorer: ₹99 = 30 days, ₹999 = 365 days
        // Professional: ₹149 = 30 days, ₹1499 = 365 days
        let durationDays = 30; // Default to monthly
        
        if (selectedPayment.requested_tier === 'basic_99') {
          // Explorer tier
          durationDays = selectedPayment.amount_paid >= 999 ? 365 : 30;
        } else if (selectedPayment.requested_tier === 'premium_149') {
          // Professional tier  
          durationDays = selectedPayment.amount_paid >= 1499 ? 365 : 30;
        }

        const { error: tierError } = await supabase.rpc('admin_upgrade_user_tier', {
          target_user_id: selectedPayment.user_id,
          new_tier: selectedPayment.requested_tier,
          admin_user_id: user?.id,
          duration_days: durationDays
        })

        if (tierError) {
          console.error('Error upgrading user tier:', tierError)
          toast.error('Payment approved but failed to upgrade user tier. Please upgrade manually.')
        } else {
          const tierName = selectedPayment.requested_tier === 'basic_99' ? 'Explorer' : 'Professional';
          const durationText = durationDays === 365 ? '365 days (1 year)' : '30 days';
          toast.success(`Payment approved and user upgraded to ${tierName} for ${durationText}!`)
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

  const handleDeletePayment = async (payment: PaymentSubmission) => {
    const isApproved = payment.status === 'approved'
    const confirmMessage = isApproved 
      ? 'This payment is APPROVED. Deleting it will change status to REJECTED and may affect user tier. Are you sure?'
      : 'Are you sure you want to delete this payment submission? This action cannot be undone.'

    if (!confirm(confirmMessage)) return

    setProcessing(true)

    try {
      if (isApproved) {
        // If approved, change to rejected instead of deleting
        const { error: updateError } = await supabase
          .from('payment_submissions')
          .update({
            status: 'rejected',
            admin_notes: (payment.admin_notes || '') + '\n[DELETED BY ADMIN - Changed from approved to rejected]',
            reviewed_by: user?.id,
            reviewed_at: new Date().toISOString()
          })
          .eq('id', payment.id)

        if (updateError) throw updateError

        // Downgrade user tier back to free
        const { error: tierError } = await supabase.rpc('admin_upgrade_user_tier', {
          target_user_id: payment.user_id,
          new_tier: 'free',
          admin_user_id: user?.id,
          duration_days: 0
        })

        if (tierError) {
          console.error('Error downgrading user tier:', tierError)
          toast.error('Payment rejected but failed to downgrade user tier. Please downgrade manually.')
        } else {
          toast.success('Approved payment changed to rejected and user downgraded to Free tier.')
        }
      } else {
        // If not approved, actually delete the record
        const { error: deleteError } = await supabase
          .from('payment_submissions')
          .delete()
          .eq('id', payment.id)

        if (deleteError) throw deleteError
        toast.success('Payment submission deleted successfully.')
      }

      loadPayments()
      checkOldPaymentsCount()

    } catch (error: any) {
      console.error('Error deleting payment:', error)
      toast.error('Failed to delete payment')
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

  const getSubscriptionDuration = (tier: string, amount: number) => {
    if (tier === 'basic_99') {
      // Explorer: ₹99 = 30 days, ₹999 = 365 days
      return amount >= 999 ? '365 days (1 year)' : '30 days'
    } else if (tier === 'premium_149') {
      // Professional: ₹149 = 30 days, ₹1499 = 365 days
      return amount >= 1499 ? '365 days (1 year)' : '30 days'
    }
    return '30 days'
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
            <div className="flex gap-2">
              <Button onClick={loadPayments} disabled={loading}>
                {loading ? 'Refreshing...' : 'Refresh Payments'}
              </Button>
              {oldPaymentsCount > 0 && (
                <Button 
                  variant="secondary" 
                  onClick={handleCleanupPayments}
                  disabled={cleanupProcessing}
                >
                  {cleanupProcessing ? 'Cleaning...' : `🗑️ Cleanup Old (${oldPaymentsCount})`}
                </Button>
              )}
              <Button 
                variant="secondary" 
                onClick={async () => {
                  try {
                    const { data, error } = await supabase.storage.from('payment-screenshots').list()
                    if (error) throw error
                    toast.success(`Storage accessible! Found ${data?.length || 0} files`)
                    console.log('Storage test result:', data)
                  } catch (error: any) {
                    toast.error('Storage test failed: ' + error.message)
                    console.error('Storage test error:', error)
                  }
                }}
              >
                🔍 Test Storage
              </Button>
            </div>
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
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 text-sm text-neutral-600">
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
                          <span className="font-medium">Duration:</span> {getSubscriptionDuration(payment.requested_tier, payment.amount_paid)}
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
                      
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeletePayment(payment)}
                        disabled={processing}
                      >
                        🗑️ Delete
                      </Button>
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
                  <div><span className="font-medium">Duration:</span> {getSubscriptionDuration(selectedPayment.requested_tier, selectedPayment.amount_paid)}</div>
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
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const errorDiv = target.nextElementSibling as HTMLElement;
                        if (errorDiv) errorDiv.style.display = 'block';
                      }}
                    />
                    <div 
                      className="hidden bg-neutral-100 border-2 border-dashed border-neutral-300 rounded-lg p-8"
                      style={{ display: 'none' }}
                    >
                      <PhotoIcon className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
                      <p className="text-neutral-600 mb-2">Screenshot could not be loaded</p>
                      <p className="text-sm text-neutral-500 mb-4">
                        This might be due to storage permissions or the file being moved/deleted
                      </p>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => window.open(selectedPayment.payment_screenshot_url, '_blank')}
                      >
                        Try Direct Link
                      </Button>
                    </div>
                    <div className="mt-2 space-x-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => window.open(selectedPayment.payment_screenshot_url, '_blank')}
                      >
                        View Full Size
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(selectedPayment.payment_screenshot_url);
                          toast.success('Screenshot URL copied to clipboard');
                        }}
                      >
                        Copy URL
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-neutral-500">
                    <strong>URL:</strong> {selectedPayment.payment_screenshot_url}
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