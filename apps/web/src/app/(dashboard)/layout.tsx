'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import {
  LayoutDashboard, Users, DollarSign, CheckSquare, BarChart3,
  Settings, Bell, Search, ChevronDown, Menu, X, Plus, LogOut, Zap,
  Mail, FileText, GitBranch, Globe, Phone, Calendar, FileSignature,
  MessageSquare, Video, UserPlus, FileCheck, UsersRound, Target, CreditCard,
  Building2, Star, Smartphone, Headphones, Bot, Plug, Search as SearchIcon,
  Receipt, Check, Trash2
} from 'lucide-react'
import { clsx } from 'clsx'

interface NotificationItem {
  id: string
  type: string
  title: string
  message?: string
  read_at?: string
  created_at: string
  action_url?: string
}

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/contacts', icon: Users, label: 'Contacts' },
  { href: '/deals', icon: DollarSign, label: 'Deals' },
  { href: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { href: '/pipeline', icon: Target, label: 'Pipeline' },
  { href: '/email-templates', icon: Mail, label: 'Email Templates' },
  { href: '/email-sequences', icon: FileText, label: 'Sequences' },
  { href: '/sms', icon: MessageSquare, label: 'SMS' },
  { href: '/workflows-new', icon: GitBranch, label: 'Automation' },
  { href: '/forms', icon: FileCheck, label: 'Forms' },
  { href: '/landing-pages', icon: Globe, label: 'Landing Pages' },
  { href: '/seo', icon: SearchIcon, label: 'SEO' },
  { href: '/calendar', icon: Calendar, label: 'Calendar' },
  { href: '/calls', icon: Phone, label: 'Calls' },
  { href: '/meetings', icon: Video, label: 'Meetings' },
  { href: '/proposals', icon: FileSignature, label: 'Proposals' },
  { href: '/quotes', icon: FileText, label: 'Quotes' },
  { href: '/invoices', icon: Receipt, label: 'Invoices' },
  { href: '/notifications', icon: Bell, label: 'Notifications' },
  { href: '/ai-assistant', icon: Target, label: 'AI Assistant' },
  { href: '/helpdesk', icon: Headphones, label: 'Helpdesk' },
  { href: '/live-chat', icon: MessageSquare, label: 'Live Chat' },
  { href: '/chatbot-builder', icon: Bot, label: 'Chatbots' },
  { href: '/team', icon: UsersRound, label: 'Team' },
  { href: '/agency', icon: Building2, label: 'Agency' },
  { href: '/reviews', icon: Star, label: 'Reviews' },
  { href: '/integrations', icon: Plug, label: 'Integrations' },
  { href: '/mobile', icon: Smartphone, label: 'Mobile' },
  { href: '/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/settings', icon: Settings, label: 'Settings' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const notificationRef = useRef<HTMLDivElement>(null)

  // Demo notifications
  useEffect(() => {
    setNotifications([
      { id: '1', type: 'deal', title: 'Deal Moved to Won', message: 'Enterprise License deal has been marked as won', created_at: new Date().toISOString() },
      { id: '2', type: 'task', title: 'Task Reminder', message: 'Follow up with John Smith due today', created_at: new Date(Date.now() - 3600000).toISOString() },
      { id: '3', type: 'mention', title: 'You were mentioned', message: 'Sarah mentioned you in a comment', created_at: new Date(Date.now() - 7200000).toISOString() },
    ])
    setUnreadCount(2)
  }, [])

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })))
    setUnreadCount(0)
  }

  return (
    <div className="flex h-screen">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={clsx(
        'fixed lg:static inset-y-0 left-0 z-50 bg-slate-900 border-r border-slate-800 transition-all duration-300',
        collapsed ? 'w-16' : 'w-64',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-4 border-b border-slate-800">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Zap className="h-5 w-5 text-white" />
              </div>
              {!collapsed && <span className="font-bold text-lg">EdgeForce</span>}
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 hover:bg-slate-800 rounded">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all',
                    isActive ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white',
                    collapsed && 'justify-center'
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              )
            })}
          </nav>

          {/* User section */}
          <div className="p-3 border-t border-slate-800">
            <div className={clsx('flex items-center gap-3', collapsed && 'justify-center')}>
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                R
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">Rick Jefferson</p>
                  <p className="text-xs text-slate-500 truncate">Owner</p>
                </div>
              )}
            </div>
            {!collapsed && (
              <button className="mt-3 w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition">
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-slate-800 rounded">
                <Menu className="h-5 w-5" />
              </button>
              <button onClick={() => setCollapsed(!collapsed)} className="hidden lg:block p-2 hover:bg-slate-800 rounded">
                <Menu className="h-5 w-5" />
              </button>
              <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-slate-900 rounded-lg border border-slate-800 w-64">
                <Search className="h-4 w-4 text-slate-500" />
                <input type="text" placeholder="Search..." className="bg-transparent border-0 text-sm focus:outline-none w-full" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Notifications */}
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="relative p-2 hover:bg-slate-800 rounded"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 rounded-full text-xs flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
                {notificationsOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden z-50">
                    <div className="flex items-center justify-between p-4 border-b border-slate-800">
                      <h3 className="font-semibold">Notifications</h3>
                      {unreadCount > 0 && (
                        <button onClick={markAllAsRead} className="text-xs text-indigo-400 hover:text-indigo-300">
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-slate-400">
                          <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No notifications</p>
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            className={clsx(
                              'p-4 border-b border-slate-800 hover:bg-slate-800/50 transition cursor-pointer',
                              !notif.read_at && 'bg-indigo-600/10'
                            )}
                            onClick={() => markAsRead(notif.id)}
                          >
                            <div className="flex items-start gap-3">
                              <div className={clsx(
                                'h-2 w-2 rounded-full mt-2',
                                !notif.read_at ? 'bg-indigo-500' : 'bg-transparent'
                              )} />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm">{notif.title}</p>
                                {notif.message && (
                                  <p className="text-sm text-slate-400 truncate">{notif.message}</p>
                                )}
                                <p className="text-xs text-slate-500 mt-1">
                                  {new Date(notif.created_at).toLocaleTimeString()}
                                </p>
                              </div>
                              {!notif.read_at && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); markAsRead(notif.id) }}
                                  className="p-1 hover:bg-slate-700 rounded"
                                >
                                  <Check className="h-4 w-4 text-green-400" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <Link href="/notifications" className="block p-3 text-center text-sm text-indigo-400 hover:text-indigo-300 border-t border-slate-800">
                      View all notifications
                    </Link>
                  </div>
                )}
              </div>
              <button className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition">
                <Plus className="h-4 w-4" />
                New
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}