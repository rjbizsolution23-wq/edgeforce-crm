'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Ticket,
  Search,
  Filter,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  MessageSquare
} from 'lucide-react'

const tickets = [
  { id: 'TKT-ABC123', subject: 'Cannot access my dashboard', status: 'open', priority: 'high', category: 'Technical', created: '2024-01-15', messages: 3 },
  { id: 'TKT-DEF456', subject: 'Billing question about last invoice', status: 'resolved', priority: 'medium', category: 'Billing', created: '2024-01-14', messages: 5 },
  { id: 'TKT-GHI789', subject: 'Feature request: Dark mode', status: 'pending', priority: 'low', category: 'Feature Request', created: '2024-01-12', messages: 2 },
  { id: 'TKT-JKL012', subject: 'Integration with Slack not working', status: 'open', priority: 'urgent', category: 'Integration', created: '2024-01-10', messages: 8 },
  { id: 'TKT-MNO345', subject: 'How to export my data?', status: 'resolved', priority: 'low', category: 'General', created: '2024-01-08', messages: 1 },
]

const statusColors: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700 border-blue-200',
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  resolved: 'bg-green-100 text-green-700 border-green-200',
  closed: 'bg-slate-100 text-slate-700 border-slate-200',
}

const priorityColors: Record<string, string> = {
  low: 'text-green-600',
  medium: 'text-yellow-600',
  high: 'text-orange-600',
  urgent: 'text-red-600',
}

export default function PortalTicketsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const openCount = tickets.filter(t => t.status === 'open').length
  const pendingCount = tickets.filter(t => t.status === 'pending').length
  const resolvedCount = tickets.filter(t => t.status === 'resolved').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Tickets</h1>
          <p className="text-slate-600">Track and manage your support requests</p>
        </div>
        <Link href="/portal/tickets/new">
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" />
            New Ticket
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="flex gap-4">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-4 py-2 rounded-lg border transition ${
            statusFilter === 'all'
              ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          All <span className="ml-1 font-semibold">{tickets.length}</span>
        </button>
        <button
          onClick={() => setStatusFilter('open')}
          className={`px-4 py-2 rounded-lg border transition ${
            statusFilter === 'open'
              ? 'bg-blue-50 border-blue-200 text-blue-700'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Open <span className="ml-1 font-semibold">{openCount}</span>
        </button>
        <button
          onClick={() => setStatusFilter('pending')}
          className={`px-4 py-2 rounded-lg border transition ${
            statusFilter === 'pending'
              ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Pending <span className="ml-1 font-semibold">{pendingCount}</span>
        </button>
        <button
          onClick={() => setStatusFilter('resolved')}
          className={`px-4 py-2 rounded-lg border transition ${
            statusFilter === 'resolved'
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Resolved <span className="ml-1 font-semibold">{resolvedCount}</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search tickets..."
          className="pl-10 bg-white border-slate-200"
        />
      </div>

      {/* Tickets List */}
      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-200">
        {filteredTickets.length === 0 ? (
          <div className="p-12 text-center">
            <Ticket className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No tickets found</h3>
            <p className="text-slate-600 mb-4">Try adjusting your search or filters</p>
            <Link href="/portal/tickets/new">
              <Button variant="outline">Create a new ticket</Button>
            </Link>
          </div>
        ) : (
          filteredTickets.map((ticket) => (
            <Link
              key={ticket.id}
              href={`/portal/tickets/${ticket.id}`}
              className="flex items-center justify-between p-4 hover:bg-slate-50 transition"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <Ticket className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm text-slate-500">{ticket.id}</span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${statusColors[ticket.status]}`}>
                      {ticket.status}
                    </span>
                  </div>
                  <h3 className="font-medium text-slate-900">{ticket.subject}</h3>
                  <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                    <span className={priorityColors[ticket.priority]}>{ticket.priority}</span>
                    <span>{ticket.category}</span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      {ticket.messages}
                    </span>
                    <span>{ticket.created}</span>
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
