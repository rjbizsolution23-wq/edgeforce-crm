'use client'
import { BarChart3, TrendingUp, Users, DollarSign, Activity, Target } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'

const monthlyRevenue = [
  { month: 'Jan', revenue: 45000, deals: 12 },
  { month: 'Feb', revenue: 52000, deals: 15 },
  { month: 'Mar', revenue: 48000, deals: 11 },
  { month: 'Apr', revenue: 61000, deals: 18 },
  { month: 'May', revenue: 55000, deals: 14 },
  { month: 'Jun', revenue: 72000, deals: 22 },
]

const sourceBreakdown = [
  { name: 'Website', value: 35, color: '#6366f1' },
  { name: 'Referral', value: 28, color: '#8b5cf6' },
  { name: 'LinkedIn', value: 20, color: '#a855f7' },
  { name: 'Cold Outreach', value: 12, color: '#d946ef' },
  { name: 'Other', value: 5, color: '#64748b' },
]

const conversionFunnel = [
  { stage: 'Leads', count: 1500, fill: '#6366f1' },
  { stage: 'Qualified', count: 450, fill: '#8b5cf6' },
  { stage: 'Proposal', count: 180, fill: '#a855f7' },
  { stage: 'Negotiation', count: 60, fill: '#d946ef' },
  { stage: 'Won', count: 35, fill: '#22c55e' },
]

const teamPerformance = [
  { name: 'Rick', deals: 25, revenue: 125000 },
  { name: 'Sarah', deals: 20, revenue: 98000 },
  { name: 'Mike', deals: 18, revenue: 85000 },
  { name: 'Lisa', deals: 15, revenue: 72000 },
]

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-slate-400">Track your sales performance and team metrics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue YTD', value: '$333,000', change: 18.5, icon: DollarSign },
          { label: 'Deals Won', value: '35', change: 12.3, icon: Target },
          { label: 'Conversion Rate', value: '2.3%', change: 0.5, icon: TrendingUp },
          { label: 'Avg Deal Size', value: '$9,514', change: 8.2, icon: BarChart3 },
        ].map((kpi) => (
          <div key={kpi.label} className="p-6 rounded-xl border border-slate-800 bg-slate-900/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">{kpi.label}</p>
                <p className="text-3xl font-bold mt-1">{kpi.value}</p>
                <p className="text-sm text-green-400 mt-1">+{kpi.change}% vs last period</p>
              </div>
              <div className="p-3 rounded-lg bg-indigo-600/20">
                <kpi.icon className="h-6 w-6 text-indigo-400" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50">
          <h3 className="text-lg font-semibold mb-4">Revenue by Month</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `$${v/1000}k`} />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Source Breakdown */}
        <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50">
          <h3 className="text-lg font-semibold mb-4">Lead Sources</h3>
          <div className="h-64 flex items-center">
            <div className="w-1/2">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={sourceBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {sourceBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 space-y-2">
              {sourceBreakdown.map((source) => (
                <div key={source.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: source.color }} />
                    <span className="text-sm">{source.name}</span>
                  </div>
                  <span className="text-sm text-slate-400">{source.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Conversion Funnel */}
        <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50">
          <h3 className="text-lg font-semibold mb-4">Conversion Funnel</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={conversionFunnel}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis dataKey="stage" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {conversionFunnel.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Team Performance */}
        <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50">
          <h3 className="text-lg font-semibold mb-4">Team Performance</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={teamPerformance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={12} tickFormatter={(v) => `$${v/1000}k`} />
                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={12} width={50} />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}