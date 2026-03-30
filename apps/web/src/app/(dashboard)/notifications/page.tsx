'use client'
import { useState } from 'react'
import { Bell, Check, CheckCheck, Trash2, Filter, Search, X } from 'lucide-react'
import { clsx } from 'clsx'

interface Notification {
  id: string
  type: string
  title: string
  message?: string
  read_at?: string
  created_at: string
  action_url?: string
}

const demoNotifications: Notification[] = [
  { id: '1', type: 'deal', title: 'Deal Moved to Won', message: 'Enterprise License deal has been marked as won - $75,000', read_at: undefined, created_at: new Date().toISOString() },
  { id: '2', type: 'task', title: 'Task Reminder', message: 'Follow up with John Smith due today', read_at: undefined, created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: '3', type: 'mention', title: 'You were mentioned', message: 'Sarah mentioned you in a comment on "Project Alpha"', read_at: undefined, created_at: new Date(Date.now() - 7200000).toISOString() },
  { id: '4', type: 'invoice', title: 'Invoice Paid', message: 'INV-2026-001 has been paid by TechStart Inc', read_at: new Date().toISOString(), created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: '5', type: 'quote', title: 'Quote Viewed', message: 'Sarah Chen viewed QT-2026-002', read_at: new Date().toISOString(), created_at: new Date(Date.now() - 172800000).toISOString() },
  { id: '6', type: 'system', title: 'New Team Member', message: 'Mike Johnson joined your team as Manager', read_at: new Date().toISOString(), created_at: new Date(Date.now() - 259200000).toISOString() },
]

const typeIcons: Record<string, string> = {
  deal: '💰',
  task: '✅',
  mention: '💬',
  invoice: '📄',
  quote: '📝',
  system: '⚙️',
  chat: '💭',
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(demoNotifications)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [search, setSearch] = useState('')

  const filtered = notifications.filter(n => {
    const matchesFilter = filter === 'all' || !n.read_at
    const matchesSearch = search === '' || n.title.toLowerCase().includes(search.toLowerCase()) || n.message?.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const unreadCount = notifications.filter(n => !n.read_at).length

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })))
  }

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-slate-400">{unreadCount} unread of {notifications.length} total</p>
        </div>
        <button onClick={markAllAsRead} className="flex items-center gap-2 px-4 py-2 border border-slate-700 rounded-lg hover:bg-slate-800 transition">
          <CheckCheck className="h-4 w-4" />
          Mark all as read
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-900 rounded-lg border border-slate-800 flex-1 max-w-md">
          <Search className="h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search notifications..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-0 text-sm focus:outline-none w-full"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as 'all' | 'unread')}
          className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500"
        >
          <option value="all">All notifications</option>
          <option value="unread">Unread only</option>
        </select>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No notifications found</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {filtered.map((notif) => (
              <div
                key={notif.id}
                className={clsx(
                  'p-4 hover:bg-slate-800/50 transition',
                  !notif.read_at && 'bg-indigo-600/5'
                )}
              >
                <div className="flex items-start gap-4">
                  <div className="text-2xl">{typeIcons[notif.type] || '🔔'}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={clsx('font-medium', !notif.read_at && 'text-white')}>
                        {notif.title}
                      </p>
                      {!notif.read_at && (
                        <span className="h-2 w-2 bg-indigo-500 rounded-full" />
                      )}
                    </div>
                    {notif.message && (
                      <p className="text-sm text-slate-400 mt-1">{notif.message}</p>
                    )}
                    <p className="text-xs text-slate-500 mt-2">
                      {new Date(notif.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {!notif.read_at && (
                      <button
                        onClick={() => markAsRead(notif.id)}
                        className="p-2 hover:bg-slate-700 rounded"
                        title="Mark as read"
                      >
                        <Check className="h-4 w-4 text-green-400" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notif.id)}
                      className="p-2 hover:bg-slate-700 rounded"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}