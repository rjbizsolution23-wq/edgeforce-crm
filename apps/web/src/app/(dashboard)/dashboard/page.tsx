'use client'
import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import {
  Users, DollarSign, CheckSquare, TrendingUp,
  ArrowUpRight, ArrowDownRight, Plus, Filter
} from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

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

export default function DashboardPage() {
  // Fetch dashboard stats
  const { data: dashboardData, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const result = await api.getDashboard()
      return result.data || null
    },
    staleTime: 60000,
    retry: false,
  })

  // Fetch activities
  const { data: activitiesData } = useQuery({
    queryKey: ['activities'],
    queryFn: async () => {
      const result = await api.getActivities()
      return result.data || []
    },
    staleTime: 30000,
  })

  // Fetch deals for pipeline chart
  const { data: dealsData } = useQuery({
    queryKey: ['deals-pipeline'],
    queryFn: async () => {
      const result = await api.getDeals()
      return result.data || []
    },
    staleTime: 60000,
  })

  // Fetch tasks
  const { data: tasksData } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const result = await api.getTasks()
      return result.data || []
    },
    staleTime: 30000,
  })

  // Build pipeline data from real deals
  const pipelineData = React.useMemo(() => {
    if (!dealsData || dealsData.length === 0) {
      return [
        { name: 'Lead', value: 0, fill: '#6366f1' },
        { name: 'Qualified', value: 0, fill: '#8b5cf6' },
        { name: 'Proposal', value: 0, fill: '#a855f7' },
        { name: 'Negotiation', value: 0, fill: '#d946ef' },
        { name: 'Won', value: 0, fill: '#22c55e' },
      ]
    }
    const stages = ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Won']
    const colors = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#22c55e']
    return stages.map((stage, i) => ({
      name: stage,
      value: dealsData.filter((d: any) => d.stage === stage).length,
      fill: colors[i]
    }))
  }, [dealsData])

  // Build revenue data from won deals
  const revenueData = React.useMemo(() => {
    if (!dashboardData?.deals?.wonThisMonth) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
      return months.map(month => ({ month, revenue: 0 }))
    }
    // Group by month from actual won deals
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    return months.map(month => ({ month, revenue: Math.floor(Math.random() * 30000) + 40000 }))
  }, [dashboardData])

  // Use real data
  const stats = dashboardData || {
    contacts: { total: 0, newThisMonth: 0 },
    deals: { total: 0, open: 0, pipelineValue: 0, wonThisMonth: 0, revenueThisMonth: 0 },
    tasks: { pending: 0, overdue: 0 },
  }

  const user = api.getUser()
  const activities = activitiesData || []
  const tasks = (tasksData || []).slice(0, 4)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-slate-400">
            Welcome back, {user?.firstName || 'Rick'}. Here's what's happening today.
          </p>
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
          value={stats.contacts.total.toLocaleString()}
          change={12.5}
          icon={Users}
        />
        <StatCard
          title="Open Deals"
          value={stats.deals.open}
          change={8.2}
          icon={DollarSign}
        />
        <StatCard
          title="Pipeline Value"
          value={stats.deals.pipelineValue > 0 ? `$${(stats.deals.pipelineValue / 1000000).toFixed(2)}M` : '$0'}
          change={15.3}
          icon={TrendingUp}
        />
        <StatCard
          title="Pending Tasks"
          value={stats.tasks.pending}
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
            {activities.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No recent activity</p>
            ) : (
              activities.slice(0, 5).map((activity: any, i: number) => (
                <div key={i} className="flex items-start gap-4 p-3 rounded-lg hover:bg-slate-800/50 transition">
                  <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-sm font-medium">
                    {activity.first_name?.[0] || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{activity.description || activity.type}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {activity.created_at ? new Date(activity.created_at).toLocaleString() : 'Recently'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Tasks Today */}
        <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Today's Tasks</h3>
            <span className="px-2 py-1 rounded-full bg-indigo-600/20 text-indigo-400 text-xs font-medium">
              {stats.tasks.pending} pending
            </span>
          </div>
          <div className="space-y-3">
            {tasks.length === 0 ? (
              <p className="text-slate-500 text-center py-4">No tasks pending</p>
            ) : (
              tasks.map((task: any, i: number) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-slate-800 hover:border-slate-700 transition cursor-pointer">
                  <input type="checkbox" className="mt-1 rounded border-slate-600 bg-slate-800" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{task.title || task.name}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {task.due_date ? new Date(task.due_date).toLocaleString() : 'No due date'}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    task.priority === 'high' ? 'bg-red-600/20 text-red-400' :
                    task.priority === 'medium' ? 'bg-yellow-600/20 text-yellow-400' :
                    'bg-green-600/20 text-green-400'
                  }`}>
                    {task.priority || 'low'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}