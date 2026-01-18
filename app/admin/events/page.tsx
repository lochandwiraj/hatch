'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CalendarDaysIcon,
  TagIcon,
  LinkIcon,
  PhotoIcon
} from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'
import { formatDate } from '@/lib/utils'

interface Event {
  id: string
  title: string
  description: string
  event_link: string
  poster_image_url: string | null
  category: string
  tags: string[] | null
  event_date: string
  registration_deadline: string | null
  required_tier: 'free' | 'basic_99' | 'premium_149'
  status: 'draft' | 'published'
  is_early_access: boolean
  organizer: string
  prize_pool: string | null
  mode: string
  eligibility: string | null
  created_at: string
  updated_at: string
}

export default function AdminEventsPage() {
  const { user } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [filter, setFilter] = useState<'all' | 'draft' | 'published'>('all')

  // Check if user is admin
  const isAdmin = user?.email === 'dwiraj06@gmail.com' || 
                  user?.email === 'pokkalilochan@gmail.com' ||
                  user?.email === 'dwiraj@HATCH.in' || 
                  user?.email === 'lochan@HATCH.in'

  useEffect(() => {
    if (isAdmin) {
      loadEvents()
    }
  }, [isAdmin, filter])

  const loadEvents = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data, error } = await query

      if (error) throw error
      setEvents(data || [])
    } catch (error: any) {
      toast.error('Failed to load events')
      console.error('Error loading events:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId)

      if (error) throw error

      toast.success('Event deleted successfully!')
      loadEvents()
    } catch (error: any) {
      toast.error('Failed to delete event')
      console.error('Error deleting event:', error)
    }
  }

  const toggleEventStatus = async (eventId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published'
    
    try {
      const { error } = await supabase
        .from('events')
        .update({ status: newStatus })
        .eq('id', eventId)

      if (error) throw error

      toast.success(`Event ${newStatus === 'published' ? 'published' : 'unpublished'} successfully!`)
      loadEvents()
    } catch (error: any) {
      toast.error('Failed to update event status')
      console.error('Error updating event:', error)
    }
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
              <Link href="/admin/events" className="text-primary-600 font-medium">
                Admin Events
              </Link>
              <Link href="/admin/manage-events" className="text-neutral-600 hover:text-primary-600">
                Manage Events
              </Link>
              <Link href="/admin/payments" className="text-neutral-600 hover:text-primary-600">
                Admin Payments
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
              <h1 className="text-3xl font-bold text-neutral-900">Event Management</h1>
              <p className="text-neutral-600 mt-1">
                Create, edit, and manage events for HATCH
              </p>
              <div className="mt-2 text-sm text-warning-700 bg-warning-50 border border-warning-200 rounded p-2">
                💡 <strong>Note:</strong> New events are created as "Draft" by default. Click "Publish" to make them visible to users.
              </div>
              <div className="mt-2 text-sm text-info-700 bg-info-50 border border-info-200 rounded p-2">
                🎯 <strong>Attendance System:</strong> To enable event registration and attendance tracking, 
                run the <code>scripts/event-attendance-system.sql</code> schema in your Supabase SQL editor. 
                <Link href="/scripts/apply-attendance-system.md" className="underline hover:text-info-800">
                  View setup instructions
                </Link>
              </div>
            </div>
            <Button onClick={() => setShowAddModal(true)}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Add New Event
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="text-center">
              <CalendarDaysIcon className="h-8 w-8 text-primary-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-neutral-900">
                {events.length}
              </div>
              <p className="text-neutral-600">Total Events</p>
            </Card>
            
            <Card className="text-center">
              <EyeIcon className="h-8 w-8 text-success-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-neutral-900">
                {events.filter(e => e.status === 'published').length}
              </div>
              <p className="text-neutral-600">Published</p>
            </Card>
            
            <Card className="text-center">
              <PencilIcon className="h-8 w-8 text-warning-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-neutral-900">
                {events.filter(e => e.status === 'draft').length}
              </div>
              <p className="text-neutral-600">Drafts</p>
            </Card>
            
            <Card className="text-center">
              <TagIcon className="h-8 w-8 text-accent-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-neutral-900">
                {events.filter(e => e.is_early_access).length}
              </div>
              <p className="text-neutral-600">Early Access</p>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-neutral-700 mr-2">Filter by status:</span>
              {[
                { key: 'all', label: 'All Events' },
                { key: 'published', label: 'Published' },
                { key: 'draft', label: 'Drafts' }
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

          {/* Events List */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse h-32 bg-neutral-200 rounded-xl"></div>
              ))}
            </div>
          ) : events.length > 0 ? (
            <div className="space-y-4">
              {events.map((event) => (
                <Card key={event.id}>
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="text-lg font-semibold text-neutral-900 mr-3">
                          {event.title}
                        </h3>
                        <div className="flex gap-2">
                          <Badge 
                            variant={event.status === 'published' ? 'success' : 'warning'}
                          >
                            {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                          </Badge>
                          {event.is_early_access && (
                            <Badge variant="primary">Early Access</Badge>
                          )}
                          <Badge variant="default">
                            {event.required_tier === 'free' ? 'Free' : 
                             event.required_tier === 'basic_99' ? 'Explorer' : 'Professional'}
                          </Badge>
                        </div>
                      </div>
                      
                      <p className="text-neutral-600 mb-3 line-clamp-2">{event.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-neutral-600">
                        <div>
                          <span className="font-medium">Organizer:</span> {event.organizer}
                        </div>
                        <div>
                          <span className="font-medium">Category:</span> {event.category}
                        </div>
                        <div>
                          <span className="font-medium">Mode:</span> {event.mode}
                        </div>
                        <div>
                          <span className="font-medium">Date:</span> {formatDate(event.event_date)}
                        </div>
                      </div>

                      {event.tags && event.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {event.tags.map((tag, index) => (
                            <span key={index} className="bg-neutral-100 text-neutral-700 px-2 py-1 rounded text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2 mt-4 lg:mt-0">
                      {event.event_link && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => window.open(event.event_link, '_blank')}
                        >
                          <LinkIcon className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      )}
                      
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setEditingEvent(event)}
                      >
                        <PencilIcon className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      
                      <Button
                        variant={event.status === 'published' ? 'secondary' : 'primary'}
                        size="sm"
                        onClick={() => toggleEventStatus(event.id, event.status)}
                      >
                        {event.status === 'published' ? 'Unpublish' : '🚀 Publish Now'}
                      </Button>
                      
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => deleteEvent(event.id)}
                      >
                        <TrashIcon className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <div className="text-center py-12">
                <CalendarDaysIcon className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-neutral-900 mb-2">
                  No events found
                </h3>
                <p className="text-neutral-600 mb-4">
                  {filter === 'all' 
                    ? 'Get started by creating your first event'
                    : `No ${filter} events found`
                  }
                </p>
                <Button onClick={() => setShowAddModal(true)}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add New Event
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Add/Edit Event Modal */}
      {(showAddModal || editingEvent) && (
        <EventModal
          event={editingEvent}
          isOpen={showAddModal || !!editingEvent}
          onClose={() => {
            setShowAddModal(false)
            setEditingEvent(null)
          }}
          onSave={() => {
            loadEvents()
            setShowAddModal(false)
            setEditingEvent(null)
          }}
        />
      )}
    </div>
  )
}

// Event Modal Component
interface EventModalProps {
  event?: Event | null
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

function EventModal({ event, isOpen, onClose, onSave }: EventModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_link: '',
    poster_image_url: '',
    category: '',
    tags: '',
    event_date: '',
    registration_deadline: '',
    required_tier: 'free' as 'free' | 'basic_99' | 'premium_149',
    status: 'draft' as 'draft' | 'published',
    is_early_access: false,
    organizer: '',
    prize_pool: '',
    mode: '',
    eligibility: ''
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        description: event.description,
        event_link: event.event_link,
        poster_image_url: event.poster_image_url || '',
        category: event.category,
        tags: event.tags?.join(', ') || '',
        event_date: event.event_date.split('T')[0],
        registration_deadline: event.registration_deadline?.split('T')[0] || '',
        required_tier: event.required_tier,
        status: event.status,
        is_early_access: event.is_early_access,
        organizer: event.organizer,
        prize_pool: event.prize_pool || '',
        mode: event.mode,
        eligibility: event.eligibility || ''
      })
    } else {
      // Reset form for new event
      setFormData({
        title: '',
        description: '',
        event_link: '',
        poster_image_url: '',
        category: '',
        tags: '',
        event_date: '',
        registration_deadline: '',
        required_tier: 'free',
        status: 'draft',
        is_early_access: false,
        organizer: '',
        prize_pool: '',
        mode: '',
        eligibility: ''
      })
    }
  }, [event])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const eventData = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : null,
        event_date: new Date(formData.event_date).toISOString(),
        registration_deadline: formData.registration_deadline 
          ? new Date(formData.registration_deadline).toISOString() 
          : null,
        poster_image_url: formData.poster_image_url || null,
        prize_pool: formData.prize_pool || null,
        eligibility: formData.eligibility || null
      }

      if (event) {
        // Update existing event
        const { error } = await supabase
          .from('events')
          .update(eventData)
          .eq('id', event.id)

        if (error) throw error
        toast.success('Event updated successfully!')
      } else {
        // Create new event
        const { error } = await supabase
          .from('events')
          .insert([eventData])

        if (error) throw error
        toast.success('Event created successfully!')
      }

      onSave()
    } catch (error: any) {
      toast.error(`Failed to ${event ? 'update' : 'create'} event`)
      console.error('Error saving event:', error)
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-6">
            {event ? 'Edit Event' : 'Add New Event'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Description *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Organizer *
                </label>
                <input
                  type="text"
                  required
                  value={formData.organizer}
                  onChange={(e) => setFormData({...formData, organizer: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Category *
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select Category</option>
                  <option value="Hackathon">Hackathon</option>
                  <option value="Conference">Conference</option>
                  <option value="Workshop">Workshop</option>
                  <option value="Competition">Competition</option>
                  <option value="Networking">Networking</option>
                  <option value="Career Fair">Career Fair</option>
                  <option value="Webinar">Webinar</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Event Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.event_date}
                  onChange={(e) => setFormData({...formData, event_date: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Registration Deadline
                </label>
                <input
                  type="date"
                  value={formData.registration_deadline}
                  onChange={(e) => setFormData({...formData, registration_deadline: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Required Tier *
                </label>
                <select
                  required
                  value={formData.required_tier}
                  onChange={(e) => setFormData({...formData, required_tier: e.target.value as any})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="free">Free</option>
                  <option value="basic_99">Explorer (₹99)</option>
                  <option value="premium_149">Professional (₹199)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Mode *
                </label>
                <select
                  required
                  value={formData.mode}
                  onChange={(e) => setFormData({...formData, mode: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select Mode</option>
                  <option value="Online">Online</option>
                  <option value="Offline">Offline</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Event Link
                </label>
                <input
                  type="url"
                  value={formData.event_link}
                  onChange={(e) => setFormData({...formData, event_link: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({...formData, tags: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="React, JavaScript, Frontend"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Prize Pool
                </label>
                <input
                  type="text"
                  value={formData.prize_pool}
                  onChange={(e) => setFormData({...formData, prize_pool: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="₹50,000"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Eligibility
                </label>
                <input
                  type="text"
                  value={formData.eligibility}
                  onChange={(e) => setFormData({...formData, eligibility: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Open to all students"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="early_access"
                  checked={formData.is_early_access}
                  onChange={(e) => setFormData({...formData, is_early_access: e.target.checked})}
                  className="mr-2"
                />
                <label htmlFor="early_access" className="text-sm font-medium text-neutral-700">
                  Early Access Event
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" loading={saving}>
                {event ? 'Update Event' : 'Create Event'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}