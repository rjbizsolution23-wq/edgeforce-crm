'use client'
import { useState } from 'react'
import { Calendar, Clock, Users, Video, MapPin, Plus, ChevronLeft, ChevronRight, Search, Check, X, Edit2, Trash2 } from 'lucide-react'
import { clsx } from 'clsx'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const TIMES = ['9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM']

const demoMeetings = [
  { id: '1', title: 'Product Demo', contact: 'John Smith', type: 'video', date: '2026-03-29', time: '10:00 AM', duration: 30, status: 'confirmed' },
  { id: '2', title: 'Discovery Call', contact: 'Sarah Chen', type: 'video', date: '2026-03-29', time: '2:00 PM', duration: 60, status: 'confirmed' },
  { id: '3', title: 'Contract Review', contact: 'Mike Johnson', type: 'in-person', date: '2026-03-30', time: '11:00 AM', duration: 45, status: 'pending' },
  { id: '4', title: 'Follow-up Meeting', contact: 'Emily Davis', type: 'phone', date: '2026-03-31', time: '3:30 PM', duration: 30, status: 'confirmed' },
]

const demoAvailability = {
  monday: ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'],
  tuesday: ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM'],
  wednesday: ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'],
  thursday: ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'],
  friday: ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM'],
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

export default function MeetingSchedulerPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [view, setView] = useState<'calendar' | 'list'>('calendar')

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const getMeetingsForDate = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return demoMeetings.filter(m => m.date === dateStr)
  }

  const calendarDays = []
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null)
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day)
  }

  const today = new Date()
  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Meeting Scheduler</h1>
          <p className="text-slate-400">
            Schedule and manage meetings with contacts
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSettingsModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition"
          >
            <Calendar className="h-4 w-4" />
            Availability
          </button>
          <button
            onClick={() => setShowBookingModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition"
          >
            <Plus className="h-4 w-4" />
            New Meeting
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="col-span-2 bg-slate-900/50 border border-slate-800 rounded-xl p-6">
          {/* Calendar Header */}
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

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Days Header */}
            {DAYS.map(day => (
              <div key={day} className="text-center text-sm text-slate-400 py-2 font-medium">
                {day}
              </div>
            ))}

            {/* Calendar Days */}
            {calendarDays.map((day, index) => {
              const meetings = day ? getMeetingsForDate(day) : []
              return (
                <div
                  key={index}
                  className={clsx(
                    'min-h-[80px] p-2 border border-slate-800/50 rounded-lg transition',
                    day ? 'hover:bg-slate-800/30 cursor-pointer' : 'bg-transparent',
                    isToday(day) && 'border-indigo-500 bg-indigo-500/10'
                  )}
                  onClick={() => day && setSelectedDate(`${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`)}
                >
                  {day && (
                    <>
                      <div className={clsx(
                        'text-sm font-medium mb-1',
                        isToday(day) ? 'text-indigo-400' : 'text-slate-300'
                      )}>
                        {day}
                      </div>
                      {meetings.slice(0, 2).map(meeting => (
                        <div
                          key={meeting.id}
                          className={clsx(
                            'text-xs px-1 py-0.5 rounded mb-1 truncate',
                            meeting.type === 'video' ? 'bg-purple-500/20 text-purple-400' :
                            meeting.type === 'in-person' ? 'bg-green-500/20 text-green-400' :
                            'bg-blue-500/20 text-blue-400'
                          )}
                        >
                          {meeting.time} {meeting.title}
                        </div>
                      ))}
                      {meetings.length > 2 && (
                        <div className="text-xs text-slate-500">+{meetings.length - 2} more</div>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Upcoming Meetings */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Upcoming Meetings</h3>
          <div className="space-y-3">
            {demoMeetings.map(meeting => (
              <div key={meeting.id} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-white">{meeting.title}</h4>
                  <span className={clsx(
                    'px-2 py-0.5 rounded-full text-xs',
                    meeting.status === 'confirmed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                  )}>
                    {meeting.status}
                  </span>
                </div>
                <p className="text-sm text-slate-400">{meeting.contact}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(meeting.date).split(',')[0]}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {meeting.time} ({meeting.duration}min)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <BookingModal
          onClose={() => setShowBookingModal(false)}
          selectedDate={selectedDate}
        />
      )}

      {/* Availability Settings Modal */}
      {showSettingsModal && (
        <AvailabilityModal
          onClose={() => setShowSettingsModal(false)}
        />
      )}
    </div>
  )
}

function BookingModal({ onClose, selectedDate }: any) {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    title: '',
    contactId: '',
    type: 'video',
    date: selectedDate || '',
    time: '',
    duration: 30,
    notes: '',
    inviteeName: '',
    inviteeEmail: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    setIsSubmitting(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg m-4">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Schedule Meeting</h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg">
              <X className="h-5 w-5 text-slate-400" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {step === 1 ? (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Meeting Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  placeholder="e.g., Product Demo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Contact</label>
                <select
                  value={formData.contactId}
                  onChange={(e) => setFormData({ ...formData, contactId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Select a contact...</option>
                  <option value="1">John Smith - TechStart Inc</option>
                  <option value="2">Sarah Chen - DataFlow Systems</option>
                  <option value="3">Mike Johnson - CloudFirst LLC</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Meeting Type</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'video', label: 'Video Call', icon: Video, color: 'text-purple-400' },
                    { id: 'phone', label: 'Phone Call', icon: Clock, color: 'text-blue-400' },
                    { id: 'in-person', label: 'In Person', icon: MapPin, color: 'text-green-400' },
                  ].map(type => (
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

              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition"
              >
                Next: Select Time
              </button>
            </>
          ) : (
            <>
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
                    {TIMES.map(time => (
                      <option key={time} value={time}>{time}</option>
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
                  <option value={90}>90 minutes</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Notes</label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  placeholder="Meeting agenda or notes..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Scheduling...' : 'Schedule'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  )
}

function AvailabilityModal({ onClose }: any) {
  const [availability, setAvailability] = useState(demoAvailability)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const toggleTime = (day: string, time: string) => {
    const dayAvailability = availability[day as keyof typeof availability] || []
    if (dayAvailability.includes(time)) {
      setAvailability({
        ...availability,
        [day]: dayAvailability.filter(t => t !== time),
      })
    } else {
      setAvailability({
        ...availability,
        [day]: [...dayAvailability, time].sort(),
      })
    }
  }

  const handleSave = async () => {
    setIsSubmitting(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    setIsSubmitting(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Set Your Availability</h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg">
              <X className="h-5 w-5 text-slate-400" />
            </button>
          </div>
          <p className="text-sm text-slate-400 mt-1">Select the times you're available for meetings</p>
        </div>

        <div className="p-6">
          {Object.entries(availability).map(([day, times]) => (
            <div key={day} className="mb-6">
              <h3 className="text-sm font-medium text-white mb-2 capitalize">{day}</h3>
              <div className="flex flex-wrap gap-2">
                {TIMES.map(time => (
                  <button
                    key={time}
                    onClick={() => toggleTime(day, time)}
                    className={clsx(
                      'px-3 py-1.5 rounded-lg text-sm transition',
                      times.includes(time)
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