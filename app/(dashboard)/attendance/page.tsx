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
  ClockIcon,
  TrophyIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline'
import { formatDateShort, formatTime } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'

interface AttendanceConfirmation {
  id: string
  event_id: string
  event_title: string
  event_date: string
  confirmation_status: 'pending' | 'attended' | 'not_attended'
  confirmed_at: string | null
  created_at: string
}

export default function AttendancePage() {
  const { profile } = useAuth()
  const [confirmations, setConfirmations] = useState<AttendanceConfirmation[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'attended' | 'not_attended'>('all')

  useEffect(() => {
    if (profile) {
      loadAttendanceConfirmations()
    }
  }, [profile])

  const loadAttendanceConfirmations = async () => {
    if (!profile) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('attendance_confirmations')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setConfirmations(data || [])
    } catch (error: any) {
      toast.error('Failed to load attendance confirmations')
      console.error('Error loading confirmations:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateAttendanceStatus = async (
    confirmationId: string, 
    status: 'attended' | 'not_attended'
  ) => {
    try {
      const { error } = await supabase
        .from('attendance_confirmations')
        .update({
          confirmation_status: status,
          confirmed_at: new Date().toISOString()
        })
        .eq('id', confirmationId)

      if (error) throw error

      // Update local state
      setConfirmations(prev => 
        prev.map(conf => 
          conf.id === confirmationId 
            ? { ...conf, confirmation_status: status, confirmed_at: new Date().toISOString() }
            : conf
        )
      )

      toast.success(`Attendance ${status === 'attended' ? 'confirmed' : 'marked as not attended'}`)
    } catch (error: any) {
      toast.error('Failed to update attendance status')
      console.error('Error updating attendance:', error)
    }
  }

  const filteredConfirmations = confirmations.filter(conf => {
    if (filter === 'all') return true
    return conf.confirmation_status === filter
  })

  const stats = {
    total: confirmations.length,
    pending: confirmations.filter(c => c.confirmation_status === 'pending').length,
    attended: confirmations.filter(c => c.confirmation_status === 'attended').length,
    notAttended: confirmations.filter(c => c.confirmation_status === 'not_attended').length
  }

  if (!profile) {
    return (
      <MainLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-neutral-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-neutral-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Attendance</h1>
          <p className="text-neutral-600 mt-1">
            Track your event attendance and confirm participation
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="text-center">
            <TrophyIcon className="h-8 w-8 text-success-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-neutral-900">{stats.attended}</div>
            <p className="text-neutral-600">Attended</p>
          </Card>
          
          <Card className="text-center">
            <ClockIcon className="h-8 w-8 text-warning-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-neutral-900">{stats.pending}</div>
            <p className="text-neutral-600">Pending</p>
          </Card>
          
          <Card className="text-center">
            <XCircleIcon className="h-8 w-8 text-error-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-neutral-900">{stats.notAttended}</div>
            <p className="text-neutral-600">Not Attended</p>
          </Card>
          
          <Card className="text-center">
            <CalendarDaysIcon className="h-8 w-8 text-primary-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-neutral-900">{stats.total}</div>
            <p className="text-neutral-600">Total Events</p>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-neutral-700 mr-2">Filter by status:</span>
            {[
              { key: 'all', label: 'All' },
              { key: 'pending', label: 'Pending' },
              { key: 'attended', label: 'Attended' },
              { key: 'not_attended', label: 'Not Attended' }
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

        {/* Confirmations List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse h-32 bg-neutral-200 rounded-xl"></div>
            ))}
          </div>
        ) : filteredConfirmations.length > 0 ? (
          <div className="space-y-4">
            {filteredConfirmations.map((confirmation) => (
              <Card key={confirmation.id}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h3 className="text-lg font-semibold text-neutral-900 mr-3">
                        {confirmation.event_title}
                      </h3>
                      <Badge 
                        variant={
                          confirmation.confirmation_status === 'attended' ? 'success' :
                          confirmation.confirmation_status === 'not_attended' ? 'error' :
                          'warning'
                        }
                      >
                        {confirmation.confirmation_status === 'attended' ? 'Attended' :
                         confirmation.confirmation_status === 'not_attended' ? 'Not Attended' :
                         'Pending'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center text-sm text-neutral-600 mb-2">
                      <CalendarDaysIcon className="h-4 w-4 mr-2" />
                      <span>{formatDateShort(confirmation.event_date)} at {formatTime(confirmation.event_date)}</span>
                    </div>
                    
                    {confirmation.confirmed_at && (
                      <div className="flex items-center text-sm text-neutral-500">
                        <CheckCircleIcon className="h-4 w-4 mr-2" />
                        <span>Confirmed on {formatDateShort(confirmation.confirmed_at)}</span>
                      </div>
                    )}
                  </div>

                  {confirmation.confirmation_status === 'pending' && (
                    <div className="flex space-x-2 mt-4 sm:mt-0">
                      <Button
                        size="sm"
                        onClick={() => updateAttendanceStatus(confirmation.id, 'attended')}
                      >
                        I Attended
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateAttendanceStatus(confirmation.id, 'not_attended')}
                      >
                        Didn't Attend
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <div className="text-center py-12">
              <ClockIcon className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 mb-2">
                {filter === 'all' ? 'No attendance confirmations' : `No ${filter} confirmations`}
              </h3>
              <p className="text-neutral-600">
                {filter === 'all' 
                  ? 'Attendance confirmations will appear here after you attend events'
                  : `No confirmations with ${filter} status found`
                }
              </p>
            </div>
          </Card>
        )}
      </div>
    </MainLayout>
  )
}