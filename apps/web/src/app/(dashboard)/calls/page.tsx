'use client'
import { useState } from 'react'
import { Phone, PhoneCall, PhoneMissed, Clock, User, Search, Plus, Filter, Play, Pause, Trash2, ExternalLink } from 'lucide-react'
import { clsx } from 'clsx'

const CALL_STATS = [
  { label: 'Total Calls', value: '1,234', icon: Phone, color: 'text-indigo-400' },
  { label: 'Connected', value: '987', icon: PhoneCall, color: 'text-green-400' },
  { label: 'Missed', value: '247', icon: PhoneMissed, color: 'text-red-400' },
  { label: 'Avg Duration', value: '4:32', icon: Clock, color: 'text-yellow-400' },
]

const demoCalls = [
  {
    id: '1',
    contact: { name: 'John Smith', company: 'TechStart Inc' },
    direction: 'outbound',
    status: 'completed',
    duration: 245,
    recording: null,
    notes: 'Discussed pricing options. Interested in Pro plan.',
    createdAt: '2026-03-28T14:30:00Z',
  },
  {
    id: '2',
    contact: { name: 'Sarah Chen', company: 'DataFlow Systems' },
    direction: 'inbound',
    status: 'completed',
    duration: 180,
    recording: null,
    notes: 'Product inquiry. Sent follow-up email with pricing.',
    createdAt: '2026-03-28T11:15:00Z',
  },
  {
    id: '3',
    contact: { name: 'Mike Johnson', company: 'CloudFirst LLC' },
    direction: 'outbound',
    status: 'missed',
    duration: 0,
    recording: null,
    notes: '',
    createdAt: '2026-03-27T16:45:00Z',
  },
  {
    id: '4',
    contact: { name: 'Emily Davis', company: 'InnovateTech' },
    direction: 'inbound',
    status: 'completed',
    duration: 320,
    recording: 'recording_4.mp3',
    notes: 'Demo follow-up. Very interested. Scheduled meeting.',
    createdAt: '2026-03-27T10:00:00Z',
  },
  {
    id: '5',
    contact: { name: 'Alex Brown', company: 'NextGen Solutions' },
    direction: 'outbound',
    status: 'completed',
    duration: 156,
    recording: null,
    notes: 'Quick check-in. Awaiting decision.',
    createdAt: '2026-03-26T15:30:00Z',
  },
]

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function formatTime(dateString: string) {
  return new Date(dateString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

export default function CallTrackingPage() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [selectedCall, setSelectedCall] = useState<any>(null)

  const filteredCalls = demoCalls.filter(call => {
    const matchesSearch = call.contact.name.toLowerCase().includes(search.toLowerCase()) ||
      call.contact.company.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filter === 'all' ||
      (filter === 'inbound' && call.direction === 'inbound') ||
      (filter === 'outbound' && call.direction === 'outbound') ||
      (filter === 'missed' && call.status === 'missed')
    return matchesSearch && matchesFilter
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Call Tracking</h1>
          <p className="text-slate-400">
            Track and analyze all your phone calls
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition"
        >
          <Plus className="h-4 w-4" />
          Log Call
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {CALL_STATS.map((stat) => (
          <div key={stat.label} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-800 rounded-lg">
                <stat.icon className={clsx('h-5 w-5', stat.color)} />
              </div>
              <div>
                <p className="text-sm text-slate-400">{stat.label}</p>
                <p className="text-xl font-bold text-white">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-900 rounded-lg border border-slate-800 flex-1 max-w-md">
          <Search className="h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by contact or company..."
            className="bg-transparent border-0 text-sm focus:outline-none w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="px-3 py-2 bg-slate-900 rounded-lg border border-slate-800 text-sm"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All Calls</option>
          <option value="inbound">Inbound</option>
          <option value="outbound">Outbound</option>
          <option value="missed">Missed</option>
        </select>
      </div>

      {/* Calls List */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-slate-800">
            <tr className="text-left text-sm text-slate-400">
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3 font-medium">Direction</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Duration</th>
              <th className="px-4 py-3 font-medium">Time</th>
              <th className="px-4 py-3 font-medium w-20"></th>
            </tr>
          </thead>
          <tbody>
            {filteredCalls.map((call) => (
              <tr
                key={call.id}
                onClick={() => setSelectedCall(call)}
                className="border-b border-slate-800/50 hover:bg-slate-800/30 transition cursor-pointer"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className={clsx(
                      'h-9 w-9 rounded-full flex items-center justify-center',
                      call.direction === 'inbound' ? 'bg-green-500/20' : 'bg-indigo-500/20'
                    )}>
                      <Phone className={clsx('h-4 w-4', call.direction === 'inbound' ? 'text-green-400' : 'text-indigo-400')} />
                    </div>
                    <div>
                      <p className="font-medium text-white">{call.contact.name}</p>
                      <p className="text-xs text-slate-500">{call.contact.company}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={clsx(
                    'px-2 py-1 rounded-full text-xs font-medium',
                    call.direction === 'inbound' ? 'bg-green-500/20 text-green-400' : 'bg-indigo-500/20 text-indigo-400'
                  )}>
                    {call.direction}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={clsx(
                    'px-2 py-1 rounded-full text-xs font-medium',
                    call.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  )}>
                    {call.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-300">
                  {call.duration > 0 ? formatDuration(call.duration) : '-'}
                </td>
                <td className="px-4 py-3 text-slate-400 text-sm">
                  {formatTime(call.createdAt)}
                </td>
                <td className="px-4 py-3">
                  {call.recording && (
                    <button className="p-1 hover:bg-slate-800 rounded" title="Play recording">
                      <Play className="h-4 w-4 text-slate-400" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Call Detail Modal */}
      {selectedCall && (
        <CallDetailModal
          call={selectedCall}
          onClose={() => setSelectedCall(null)}
        />
      )}

      {/* Log Call Modal */}
      {showModal && (
        <LogCallModal onClose={() => setShowModal(false)} />
      )}
    </div>
  )
}

function CallDetailModal({ call, onClose }: any) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg m-4">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Call Details</h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg">
              <span className="text-slate-400 text-xl">&times;</span>
            </button>
          </div>
        </div>
        <div className="p-6 space-y-4">
          {/* Contact Info */}
          <div className="flex items-center gap-4">
            <div className={clsx(
              'h-12 w-12 rounded-full flex items-center justify-center',
              call.direction === 'inbound' ? 'bg-green-500/20' : 'bg-indigo-500/20'
            )}>
              <Phone className={clsx('h-5 w-5', call.direction === 'inbound' ? 'text-green-400' : 'text-indigo-400')} />
            </div>
            <div>
              <p className="font-semibold text-white text-lg">{call.contact.name}</p>
              <p className="text-slate-400">{call.contact.company}</p>
            </div>
          </div>

          {/* Call Info Grid */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
            <div>
              <p className="text-sm text-slate-400">Direction</p>
              <p className="font-medium text-white capitalize">{call.direction}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Status</p>
              <p className={clsx(
                'font-medium capitalize',
                call.status === 'completed' ? 'text-green-400' : 'text-red-400'
              )}>
                {call.status}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Duration</p>
              <p className="font-medium text-white">
                {call.duration > 0 ? formatDuration(call.duration) : '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Time</p>
              <p className="font-medium text-white">{formatTime(call.createdAt)}</p>
            </div>
          </div>

          {/* Notes */}
          <div className="pt-4 border-t border-slate-800">
            <p className="text-sm text-slate-400 mb-2">Notes</p>
            <p className="text-white">
              {call.notes || 'No notes for this call.'}
            </p>
          </div>

          {/* Recording */}
          {call.recording && (
            <div className="pt-4 border-t border-slate-800">
              <p className="text-sm text-slate-400 mb-2">Recording</p>
              <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition">
                <Play className="h-4 w-4" />
                Play Recording
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function LogCallModal({ onClose }: any) {
  const [formData, setFormData] = useState({
    contactId: '',
    direction: 'outbound',
    status: 'completed',
    duration: 0,
    notes: '',
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
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md m-4">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-xl font-semibold">Log a Call</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Contact</label>
            <select
              required
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Direction</label>
              <select
                value={formData.direction}
                onChange={(e) => setFormData({ ...formData, direction: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="outbound">Outbound</option>
                <option value="inbound">Inbound</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="completed">Completed</option>
                <option value="missed">Missed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Duration (seconds)</label>
            <input
              type="number"
              min="0"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Notes</label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              placeholder="Call summary..."
            />
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
              {isSubmitting ? 'Saving...' : 'Log Call'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}