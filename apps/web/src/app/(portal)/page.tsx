'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Ticket,
  BookOpen,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  Star
} from 'lucide-react'

const recentTickets = [
  { id: '1', subject: 'Cannot access my dashboard', status: 'open', priority: 'high', updated: '2 hours ago' },
  { id: '2', subject: 'Billing question about last invoice', status: 'resolved', priority: 'medium', updated: '1 day ago' },
  { id: '3', subject: 'Feature request: Dark mode', status: 'pending', priority: 'low', updated: '3 days ago' },
]

const statusColors: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700 border-blue-200',
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  resolved: 'bg-green-100 text-green-700 border-green-200',
  closed: 'bg-slate-100 text-slate-700 border-slate-200',
}

const priorityIcons: Record<string, any> = {
  low: <AlertCircle className="w-4 h-4 text-green-500" />,
  medium: <AlertCircle className="w-4 h-4 text-yellow-500" />,
  high: <AlertCircle className="w-4 h-4 text-orange-500" />,
  urgent: <AlertCircle className="w-4 h-4 text-red-500" />,
}

export default function PortalDashboard() {
  const openTickets = recentTickets.filter(t => t.status === 'open').length
  const resolvedThisMonth = 12

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Welcome back, John!</h1>
        <p className="text-slate-600">How can we help you today?</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/portal/tickets?status=open" className="bg-white rounded-xl border border-slate-200 p-6 hover:border-indigo-300 transition">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Ticket className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-3xl font-bold text-slate-900">{openTickets}</span>
          </div>
          <p className="text-slate-600 font-medium">Open Tickets</p>
        </Link>

        <Link href="/portal/tickets?status=resolved" className="bg-white rounded-xl border border-slate-200 p-6 hover:border-indigo-300 transition">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-3xl font-bold text-slate-900">{resolvedThisMonth}</span>
          </div>
          <p className="text-slate-600 font-medium">Resolved This Month</p>
        </Link>

        <Link href="/portal/knowledge-base" className="bg-white rounded-xl border border-slate-200 p-6 hover:border-indigo-300 transition">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <BookOpen className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-3xl font-bold text-slate-900">24</span>
          </div>
          <p className="text-slate-600 font-medium">Knowledge Base Articles</p>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link href="/portal/tickets/new" className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition">
              <span className="font-medium text-slate-700">Submit a new ticket</span>
              <ArrowRight className="w-5 h-5 text-slate-400" />
            </Link>
            <Link href="/portal/knowledge-base" className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition">
              <span className="font-medium text-slate-700">Browse knowledge base</span>
              <ArrowRight className="w-5 h-5 text-slate-400" />
            </Link>
            <button className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition">
              <span className="font-medium text-slate-700">Start live chat</span>
              <MessageSquare className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Tickets</h2>
          <div className="space-y-3">
            {recentTickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/portal/tickets/${ticket.id}`}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition"
              >
                <div className="flex items-center gap-3">
                  {priorityIcons[ticket.priority]}
                  <div>
                    <p className="font-medium text-slate-700">{ticket.subject}</p>
                    <p className="text-xs text-slate-500">{ticket.updated}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full border ${statusColors[ticket.status]}`}>
                  {ticket.status}
                </span>
              </Link>
            ))}
          </div>
          <Link href="/portal/tickets" className="flex items-center justify-center gap-2 mt-4 text-indigo-600 font-medium hover:text-indigo-700">
            View all tickets <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Featured Articles */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Popular Articles</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: 'Getting Started Guide', views: 1234, rating: 4.8 },
            { title: 'How to reset your password', views: 892, rating: 4.9 },
            { title: 'Billing and subscription FAQ', views: 756, rating: 4.7 },
          ].map((article, i) => (
            <Link
              key={i}
              href={`/portal/knowledge-base/article-${i + 1}`}
              className="p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition"
            >
              <h3 className="font-medium text-slate-900 mb-2">{article.title}</h3>
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  {article.views} views
                </span>
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  {article.rating}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
