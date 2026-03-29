'use client'
import { useQuery } from '@tanstack/react-query'
import {
  Users, DollarSign, CheckSquare, TrendingUp, TrendingDown,
  ArrowUpRight, ArrowDownRight, Plus, Filter, RefreshCw
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://lil-api-worker.rickjefferson.workers.dev'

interface StatsCard {
  title: string
  value: string | number
  change: number
  icon: any
}

function StatCard({ title, value, change, icon: Icon }: StatsCard) {
  const isPositive = change >= 0
  return (
    <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
          <div className="flex items-center gap-1 mt-2">
            {isPositive ? (
              <ArrowUpRight className="h-4 w-4 text-green-400" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-red-400" />
            )}
            <span className={isPositive ? 'text-green-400' : 'text-red-400'}>
              {Math.abs(change)}%
            </span>
            <span className="text-slate-500 text-sm">vs last month</span>
          </div>
        </div>
        <div className="p-3 rounded-lg bg-slate-800">
          <Icon className="h-6 w-6 text-indigo-400" />
        </div>
      </div>
    </div>
  )
}

const pipelineData = [
  { name: 'Lead', value: 45, fill: '#6366f1' },
  { name: 'Qualified', value: 32, fill: '#8b5cf6' },
  { name: 'Proposal', value: 18, fill: '#a855f7' },
  { name: 'Negotiation', value: 12, fill: '#d946ef' },
  { name: 'Won', value: 8, fill: '#22c55e' },
]

const revenueData = [
  { month: 'Jan', revenue: 45000 },
  { month: 'Feb', revenue: 52000 },
  { month: 'Mar', revenue: 48000 },
  { month: 'Apr', revenue: 61000 },
  { month: 'May', revenue: 55000 },
  { month: 'Jun', revenue: 72000 },
]

const activityData = [
  { day: 'Mon', emails: 45, calls: 12 },
  { day: 'Tue', emails: 52, calls: 18 },
  { day: 'Wed', emails: 38, calls: 15 },
  { day: 'Thu', emails: 61, calls: 22 },
  { day: 'Fri', emails: 55, calls: 19 },
]

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/api/analytics/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      return res.json()
    },
    staleTime: 60000,
  })

  // Demo data for now
  const demoStats = {
    contacts: { total: 1247, newThisMonth: 89 },
    deals: { total: 156, open: 89, pipelineValue: 2450000, wonThisMonth: 12, revenueThisMonth: 156000 },
    tasks: { pending: 34, overdue: 7 },
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-slate-400">Welcome back, Rick. Here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-700 rounded-lg hover:bg-slate-800 transition">
            <Filter className="h-4 w-4" />
            Filter
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition">
            <Plus className="h-4 w-4" />
            Add Deal
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Contacts"
          value={demoStats.contacts.total.toLocaleString()}
          change={12.5}
          icon={Users}
        />
        <StatCard
          title="Open Deals"
          value={demoStats.deals.open}
          change={8.2}
          icon={DollarSign}
        />
        <StatCard
          title="Pipeline Value"
          value={`$${(demoStats.deals.pipelineValue / 1000000).toFixed(2)}M`}
          change={15.3}
          icon={TrendingUp}
        />
        <StatCard
          title="Pending Tasks"
          value={demoStats.tasks.pending}
          change={-3.1}
          icon={CheckSquare}
        />
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50">
          <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `$${v/1000}k`} />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                />
                <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pipeline Breakdown */}
        <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50">
          <h3 className="text-lg font-semibold mb-4">Pipeline Stages</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={12} width={80} />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Activity & Tasks Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 p-6 rounded-xl border border-slate-800 bg-slate-900/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Recent Activity</h3>
            <button className="text-sm text-indigo-400 hover:text-indigo-300">View all</button>
          </div>
          <div className="space-y-4">
            {[
              { type: 'deal_won', text: 'Acme Corp deal closed for $45,000', time: '2 hours ago', user: 'Sarah' },
              { type: 'email_opened', text: 'Lead opened email sequence "Follow Up"', time: '4 hours ago', user: 'Mike' },
              { type: 'task_completed', text: 'Called Johnson about proposal', time: '6 hours ago', user: 'Rick' },
              { type: 'contact_created', text: 'New contact added: Emily Chen', time: 'Yesterday', user: 'Sarah' },
              { type: 'meeting_scheduled', text: 'Demo scheduled with TechStart Inc', time: 'Yesterday', user: 'Mike' },
            ].map((activity, i) => (
              <div key={i} className="flex items-start gap-4 p-3 rounded-lg hover:bg-slate-800/50 transition">
                <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-sm font-medium">
                  {activity.user[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{activity.text}</p>
                  <p className="text-xs text-slate-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tasks Today */}
        <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Today's Tasks</h3>
            <span className="px-2 py-1 rounded-full bg-indigo-600/20 text-indigo-400 text-xs font-medium">
              {demoStats.tasks.pending} pending
            </span>
          </div>
          <div className="space-y-3">
            {[
              { title: 'Call Johnson about proposal', time: '10:00 AM', priority: 'high' },
              { title: 'Send follow-up email to Acme', time: '11:30 AM', priority: 'medium' },
              { title: 'Review Q2 pipeline', time: '2:00 PM', priority: 'low' },
              { title: 'Team meeting', time: '4:00 PM', priority: 'medium' },
            ].map((task, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-slate-800 hover:border-slate-700 transition cursor-pointer">
                <input type="checkbox" className="mt-1 rounded border-slate-600 bg-slate-800" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{task.title}</p>
                  <p className="text-xs text-slate-500 mt-1">{task.time}</p>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  task.priority === 'high' ? 'bg-red-600/20 text-red-400' :
                  task.priority === 'medium' ? 'bg-yellow-600/20 text-yellow-400' :
                  'bg-green-600/20 text-green-400'
                }`}>
                  {task.priority}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}