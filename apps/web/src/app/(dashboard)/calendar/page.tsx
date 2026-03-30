'use client'
import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import {
  Calendar, Clock, Users, Video, MapPin, Plus, ChevronLeft, ChevronRight,
  Copy, Trash2, Edit2, ExternalLink, Check, X, Search, Settings
} from 'lucide-react'
import { clsx } from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const TIMES = [
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
  '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM'
]

const MEETING_TYPES = [
  { id: 'video', label: 'Video Call', icon: Video, color: 'text-purple-400', bg: 'bg-purple-500/20' },
  { id: 'phone', label: 'Phone Call', icon: Phone, color: 'text-blue-400', bg: 'bg-blue-500/20' },
  { id: 'in-person', label: 'In Person', icon: MapPin, color: 'text-green-400', bg: 'bg-green-500/20' },
]

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  )
}

export default function CalendarBookingPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [showEmbedModal, setShowEmbedModal] = useState(false)
  const queryClient = useQueryClient()

  // Demo bookings
  const demoBookings = [
    { id: '1', title: 'Product Demo', contact: 'John Smith', type: 'video', date: '2026-03-29', time: '10:00 AM', duration: 30, status: 'confirmed', meetingLink: 'https://meet.edgeforce.io/abc123' },
    { id: '2', title: 'Discovery Call', contact: 'Sarah Chen', type: 'phone', date: '2026-03-29', time: '2:00 PM', duration: 60, status: 'pending' },
    { id: '3', title: 'Contract Review', contact: 'Mike Johnson', type: 'in-person', date: '2026-03-30', time: '11:00 AM', duration: 45, status: 'confirmed', location: '123 Main St, NYC' },
  ]

  // Demo availability
  const [availability, setAvailability] = useState({
    monday: ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'],
    tuesday: ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM'],
    wednesday: ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'],
    thursday: ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'],
    friday: ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM'],
  })

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

  const getDayName = (dateStr: string) => {
    const day = new Date(dateStr).getDay()
    return ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][day]
  }

  const getBookingsForDate = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return demoBookings.filter(b => b.date === dateStr)
  }

  const getAvailableSlots = (dateStr: string) => {
    const dayName = getDayName(dateStr)
    const daySlots = availability[dayName as keyof typeof availability] || []
    const bookedTimes = demoBookings
      .filter(b => b.date === dateStr)
      .map(b => b.time)
    return daySlots.filter(slot => !bookedTimes.includes(slot))
  }

  const calendarDays = []
  for (let i = 0; i < firstDay; i++) calendarDays.push(null)
  for (let day = 1; day <= daysInMonth; day++) calendarDays.push(day)

  const today = new Date()
  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear()

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Calendar Booking</h1>
          <p className="text-slate-400">Let contacts schedule meetings with you</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowEmbedModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition"
          >
            <Copy className="h-4 w-4" />
            Get Embed Code
          </button>
          <button
            onClick={() => setShowSettingsModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition"
          >
            <Settings className="h-4 w-4" />
            Availability
          </button>
          <button
            onClick={() => { setSelectedDate(null); setShowBookingModal(true) }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition"
          >
            <Plus className="h-4 w-4" />
            New Booking
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="col-span-2 bg-slate-900/50 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex items-center gap-2">
              <button onClick={prevMonth} className="p-2 hover:bg-slate-800 rounded-lg transition">
                <ChevronLeft className="h-4 w-4 text-slate-400" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1 text-sm bg-slate-800 hover:bg-slate-700 rounded-lg transition"
              >
                Today
              </button>
              <button onClick={nextMonth} className="p-2 hover:bg-slate-800 rounded-lg transition">
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {DAYS.map(day => (
              <div key={day} className="text-center text-sm text-slate-400 py-2 font-medium">{day}</div>
            ))}
            {calendarDays.map((day, index) => {
              const dateStr = day ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : ''
              const bookings = day ? getBookingsForDate(day) : []
              const availableSlots = day ? getAvailableSlots(dateStr) : []
              return (
                <div
                  key={index}
                  className={clsx(
                    'min-h-[100px] p-2 border border-slate-800/50 rounded-lg transition',
                    day ? 'hover:bg-slate-800/30 cursor-pointer' : 'bg-transparent',
                    isToday(day) && 'border-indigo-500 bg-indigo-500/10'
                  )}
                  onClick={() => day && setSelectedDate(dateStr)}
                >
                  {day && (
                    <>
                      <div className={clsx(
                        'text-sm font-medium mb-1',
                        isToday(day) ? 'text-indigo-400' : 'text-slate-300'
                      )}>
                        {day}
                      </div>
                      {bookings.slice(0, 2).map(booking => (
                        <div
                          key={booking.id}
                          className={clsx(
                            'text-xs px-1.5 py-0.5 rounded mb-1 truncate',
                            booking.type === 'video' ? 'bg-purple-500/20 text-purple-400' :
                            booking.type === 'in-person' ? 'bg-green-500/20 text-green-400' :
                            'bg-blue-500/20 text-blue-400'
                          )}
                        >
                          {booking.time} {booking.title}
                        </div>
                      ))}
                      {bookings.length > 2 && (
                        <div className="text-xs text-slate-500">+{bookings.length - 2} more</div>
                      )}
                      {availableSlots.length > 0 && bookings.length === 0 && (
                        <div className="text-xs text-green-400">{availableSlots.length} slots open</div>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Booking Link */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <h3 className="font-semibold text-white mb-3">Your Booking Page</h3>
            <div className="flex items-center gap-2 p-3 bg-slate-800 rounded-lg mb-3">
              <Calendar className="h-5 w-5 text-indigo-400" />
              <span className="text-sm text-indigo-400 truncate">edgeforce-crm.pages.dev/book</span>
            </div>
            <button
              onClick={() => setShowEmbedModal(true)}
              className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm transition"
            >
              Copy Link / Embed
            </button>
          </div>

          {/* Upcoming */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <h3 className="font-semibold text-white mb-4">Upcoming Meetings</h3>
            <div className="space-y-3">
              {demoBookings.map(booking => (
                <div key={booking.id} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-white text-sm">{booking.title}</h4>
                    <span className={clsx(
                      'px-2 py-0.5 rounded-full text-xs',
                      booking.status === 'confirmed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                    )}>
                      {booking.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-2">{booking.contact}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(booking.date).split(',')[0]}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {booking.time}
                    </span>
                  </div>
                  {booking.meetingLink && (
                    <a
                      href={booking.meetingLink}
                      target="_blank"
                      className="flex items-center gap-1 mt-2 text-xs text-indigo-400 hover:text-indigo-300"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Join Meeting
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Date Detail Modal */}
      {selectedDate && (
        <DateDetailModal
          date={selectedDate}
          bookings={getBookingsForDate(selectedDate)}
          availableSlots={getAvailableSlots(selectedDate)}
          onClose={() => setSelectedDate(null)}
          onBook={(time) => {
            setSelectedTime(time)
            setShowBookingModal(true)
          }}
        />
      )}

      {/* Booking Modal */}
      {showBookingModal && (
        <BookingModal
          date={selectedDate}
          time={selectedTime}
          onClose={() => { setShowBookingModal(false); setSelectedTime(null) }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['bookings'] })
            setShowBookingModal(false)
            setSelectedTime(null)
            setSelectedDate(null)
          }}
        />
      )}

      {/* Availability Modal */}
      {showSettingsModal && (
        <AvailabilityModal
          availability={availability}
          onClose={() => setShowSettingsModal(false)}
          onSave={(newAvailability) => {
            setAvailability(newAvailability)
            setShowSettingsModal(false)
          }}
        />
      )}

      {/* Embed Modal */}
      {showEmbedModal && (
        <EmbedModal onClose={() => setShowEmbedModal(false)} />
      )}
    </div>
  )
}

function DateDetailModal({ date, bookings, availableSlots, onClose, onBook }: any) {
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg m-4">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-xl font-semibold">{formatDate(date)}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6">
          {bookings.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-slate-400 mb-3">Booked</h3>
              <div className="space-y-2">
                {bookings.map(booking => (
                  <div key={booking.id} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                    <div className={clsx(
                      'w-10 h-10 rounded-lg flex items-center justify-center',
                      booking.type === 'video' ? 'bg-purple-500/20' :
                      booking.type === 'in-person' ? 'bg-green-500/20' :
                      'bg-blue-500/20'
                    )}>
                      {booking.type === 'video' ? <Video className="h-5 w-5 text-purple-400" /> :
                       booking.type === 'in-person' ? <MapPin className="h-5 w-5 text-green-400" /> :
                       <PhoneIcon className="h-5 w-5 text-blue-400" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-white">{booking.time}</p>
                      <p className="text-sm text-slate-400">{booking.title} - {booking.contact}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {availableSlots.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-slate-400 mb-3">Available Times</h3>
              <div className="grid grid-cols-3 gap-2">
                {availableSlots.map(slot => (
                  <button
                    key={slot}
                    onClick={() => onBook(slot)}
                    className="px-3 py-2 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-lg text-sm transition"
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          )}

          {availableSlots.length === 0 && bookings.length === 0 && (
            <p className="text-center text-slate-400 py-4">No availability on this date</p>
          )}
        </div>
      </div>
    </div>
  )
}

function BookingModal({ date, time, onClose, onSuccess }: any) {
  const [formData, setFormData] = useState({
    title: '',
    contactId: '',
    contactName: '',
    contactEmail: '',
    type: 'video',
    date: date || '',
    time: time || '',
    duration: 30,
    notes: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    setIsSubmitting(false)
    onSuccess()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg m-4">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-xl font-semibold">Schedule Meeting</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Meeting Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              placeholder="Product Demo, Discovery Call, etc."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Contact Name</label>
              <input
                type="text"
                required
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
              <input
                type="email"
                required
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Meeting Type</label>
            <div className="grid grid-cols-3 gap-3">
              {MEETING_TYPES.map(type => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: type.id })}
                  className={clsx(
                    'p-3 rounded-lg border text-center transition',
                    formData.type === type.id
                      ? 'border-indigo-500 bg-indigo-500/20'
                      : 'border-slate-700 hover:border-slate-600'
                  )}
                >
                  <type.icon className={clsx('h-5 w-5 mx-auto mb-1', type.color)} />
                  <span className="text-sm text-slate-300">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Date</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Time</label>
              <select
                required
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">Select time...</option>
                {TIMES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Duration</label>
            <select
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition disabled:opacity-50"
            >
              {isSubmitting ? 'Scheduling...' : 'Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AvailabilityModal({ availability, onClose, onSave }: any) {
  const [edited, setEdited] = useState(availability)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const toggleTime = (day: string, time: string) => {
    const daySlots = edited[day as keyof typeof edited] || []
    if (daySlots.includes(time)) {
      setEdited({
        ...edited,
        [day]: daySlots.filter(t => t !== time),
      })
    } else {
      setEdited({
        ...edited,
        [day]: [...daySlots, time].sort(),
      })
    }
  }

  const handleSave = async () => {
    setIsSubmitting(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    setIsSubmitting(false)
    onSave(edited)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Set Your Availability</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6">
          <p className="text-sm text-slate-400 mb-4">Select the times you're available for meetings</p>
          {Object.entries(edited).map(([day, times]) => (
            <div key={day} className="mb-6">
              <h3 className="text-sm font-medium text-white mb-2 capitalize">{day}</h3>
              <div className="flex flex-wrap gap-2">
                {TIMES.map(time => (
                  <button
                    key={time}
                    onClick={() => toggleTime(day, time)}
                    className={clsx(
                      'px-3 py-1.5 rounded-lg text-sm transition',
                      (times as string[]).includes(time)
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    )}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="p-6 border-t border-slate-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSubmitting}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save Availability'}
          </button>
        </div>
      </div>
    </div>
  )
}

function EmbedModal({ onClose }: any) {
  const bookingLink = 'https://edgeforce-crm.pages.dev/book'
  const embedCode = `<iframe src="${bookingLink}/embed" width="100%" height="700" frameborder="0"></iframe>`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg m-4">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Embed Booking Widget</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Booking Page URL</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={bookingLink}
                className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
              />
              <button
                onClick={() => navigator.clipboard.writeText(bookingLink)}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Embed Code</label>
            <textarea
              readOnly
              rows={4}
              value={embedCode}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm font-mono"
            />
          </div>

          <div className="p-4 bg-slate-800/50 rounded-lg">
            <p className="text-sm text-slate-400">Preview your booking page:</p>
            <a
              href={bookingLink}
              target="_blank"
              className="flex items-center gap-2 mt-2 text-indigo-400 hover:text-indigo-300"
            >
              <ExternalLink className="h-4 w-4" />
              Open Booking Page
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}