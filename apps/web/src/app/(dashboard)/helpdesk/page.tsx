'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Ticket,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Plus,
  Filter,
  User,
  Calendar,
  Tag,
  Send,
  Paperclip,
  MoreHorizontal,
  ChevronRight,
  FilterIcon
} from 'lucide-react'

interface Ticket {
  id: string
  ticket_number: string
  subject: string
  description: string
  status: string
  priority: string
  category: string
  channel: string
  contact_id?: string
  assigned_to?: string
  sla_due_at?: string
  created_at: string
  updated_at: string
  tags: string[]
}

interface TicketMessage {
  id: string
  user_id: string
  contact_id?: string
  is_internal: boolean
  message: string
  attachments: string[]
  created_at: string
}

const priorityColors: Record<string, string> = {
  urgent: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-green-500',
  critical: 'bg-red-700',
}

const statusColors: Record<string, string> = {
  open: 'bg-blue-500',
  in_progress: 'bg-yellow-500',
  pending: 'bg-purple-500',
  resolved: 'bg-green-500',
  closed: 'bg-gray-500',
  spam: 'bg-gray-700',
}

export default function HelpdeskPage() {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [showNewTicketDialog, setShowNewTicketDialog] = useState(false)
  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: '',
    priority: 'medium',
    category: '',
    contact_id: '',
  })
  const [replyMessage, setReplyMessage] = useState('')

  const { data: tickets, isLoading: ticketsLoading } = useQuery({
    queryKey: ['helpdesk-tickets', statusFilter, priorityFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (priorityFilter !== 'all') params.append('priority', priorityFilter)
      const res = await api.get(`/helpdesk/tickets?${params}`)
      return res.data as Ticket[]
    },
  })

  const { data: ticketMessages, isLoading: messagesLoading } = useQuery({
    queryKey: ['helpdesk-ticket-messages', selectedTicket?.id],
    queryFn: async () => {
      if (!selectedTicket) return []
      const res = await api.get(`/helpdesk/tickets/${selectedTicket.id}`)
      return (res.data as any).messages || [] as TicketMessage[]
    },
    enabled: !!selectedTicket,
  })

  const { data: teams } = useQuery({
    queryKey: ['helpdesk-teams'],
    queryFn: async () => {
      const res = await api.get('/helpdesk/teams')
      return res.data as any[]
    },
  })

  const createTicket = useMutation({
    mutationFn: async (ticket: typeof newTicket) => {
      const res = await api.post('/helpdesk/tickets', ticket)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['helpdesk-tickets'] })
      setShowNewTicketDialog(false)
      setNewTicket({ subject: '', description: '', priority: 'medium', category: '', contact_id: '' })
    },
  })

  const updateTicket = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const res = await api.patch(`/helpdesk/tickets/${id}`, updates)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['helpdesk-tickets'] })
      if (selectedTicket) {
        queryClient.invalidateQueries({ queryKey: ['helpdesk-ticket-messages', selectedTicket.id] })
      }
    },
  })

  const sendMessage = useMutation({
    mutationFn: async ({ ticketId, message, isInternal }: { ticketId: string; message: string; isInternal?: boolean }) => {
      const res = await api.post(`/helpdesk/tickets/${ticketId}/messages`, {
        message,
        is_internal: isInternal || false,
      })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['helpdesk-ticket-messages', selectedTicket?.id] })
      setReplyMessage('')
    },
  })

  const filteredTickets = tickets?.filter(ticket =>
    ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.ticket_number.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const getTimeSince = (date: string) => {
    const now = new Date()
    const then = new Date(date)
    const diff = now.getTime() - then.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    return 'Just now'
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white">Helpdesk</h1>
          <p className="text-slate-400">Manage customer support tickets</p>
        </div>
        <Dialog open={showNewTicketDialog} onOpenChange={setShowNewTicketDialog}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" />
              New Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-800">
            <DialogHeader>
              <DialogTitle>Create New Ticket</DialogTitle>
              <DialogDescription>Enter the ticket details below</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400">Subject</label>
                <Input
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  placeholder="Brief description of the issue"
                  className="bg-slate-800 border-slate-700"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400">Description</label>
                <Textarea
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  placeholder="Detailed description..."
                  rows={4}
                  className="bg-slate-800 border-slate-700"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-400">Priority</label>
                  <Select value={newTicket.priority} onValueChange={(v) => setNewTicket({ ...newTicket, priority: v })}>
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm text-slate-400">Category</label>
                  <Select value={newTicket.category} onValueChange={(v) => setNewTicket({ ...newTicket, category: v })}>
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="billing">Billing</SelectItem>
                      <SelectItem value="sales">Sales</SelectItem>
                      <SelectItem value="feature_request">Feature Request</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewTicketDialog(false)}>Cancel</Button>
              <Button
                className="bg-indigo-600 hover:bg-indigo-700"
                onClick={() => createTicket.mutate(newTicket)}
                disabled={!newTicket.subject || createTicket.isPending}
              >
                {createTicket.isPending ? 'Creating...' : 'Create Ticket'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 p-4 border-b border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tickets..."
            className="pl-10 bg-slate-800 border-slate-700"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px] bg-slate-800 border-slate-700">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[150px] bg-slate-800 border-slate-700">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Ticket List */}
        <div className="w-1/3 border-r border-slate-800 overflow-y-auto">
          {ticketsLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-24 bg-slate-800" />
              ))}
            </div>
          ) : filteredTickets?.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <Ticket className="w-12 h-12 mb-4" />
              <p>No tickets found</p>
            </div>
          ) : (
            filteredTickets?.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className={`p-4 border-b border-slate-800 cursor-pointer hover:bg-slate-800/50 transition-colors ${
                  selectedTicket?.id === ticket.id ? 'bg-slate-800' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="text-xs text-slate-500">{ticket.ticket_number}</span>
                    <h3 className="font-medium text-white line-clamp-1">{ticket.subject}</h3>
                  </div>
                  <div className="flex gap-1">
                    <Badge className={`${priorityColors[ticket.priority]} text-white text-xs`}>
                      {ticket.priority}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <Badge variant="outline" className={`${statusColors[ticket.status]} text-white text-[10px] border-0`}>
                    {ticket.status.replace('_', ' ')}
                  </Badge>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {getTimeSince(ticket.created_at)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Ticket Detail */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedTicket ? (
            <>
              {/* Ticket Header */}
              <div className="p-6 border-b border-slate-800">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm text-slate-500">{selectedTicket.ticket_number}</span>
                      <Badge className={`${statusColors[selectedTicket.status]} text-white`}>
                        {selectedTicket.status.replace('_', ' ')}
                      </Badge>
                      <Badge className={`${priorityColors[selectedTicket.priority]} text-white`}>
                        {selectedTicket.priority}
                      </Badge>
                    </div>
                    <h2 className="text-xl font-bold text-white">{selectedTicket.subject}</h2>
                  </div>
                  <div className="flex gap-2">
                    <Select
                      value={selectedTicket.status}
                      onValueChange={(v) => updateTicket.mutate({ id: selectedTicket.id, updates: { status: v } })}
                    >
                      <SelectTrigger className="w-[140px] bg-slate-800 border-slate-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={selectedTicket.priority}
                      onValueChange={(v) => updateTicket.mutate({ id: selectedTicket.id, updates: { priority: v } })}
                    >
                      <SelectTrigger className="w-[140px] bg-slate-800 border-slate-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Created {formatDate(selectedTicket.created_at)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Updated {getTimeSince(selectedTicket.updated_at)}
                  </span>
                  {selectedTicket.sla_due_at && (
                    <span className="flex items-center gap-1 text-orange-400">
                      <AlertCircle className="w-4 h-4" />
                      SLA Due {formatDate(selectedTicket.sla_due_at)}
                    </span>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messagesLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-32 bg-slate-800" />
                    ))}
                  </div>
                ) : (
                  <>
                    {selectedTicket.description && (
                      <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                        <p className="text-slate-300 whitespace-pre-wrap">{selectedTicket.description}</p>
                        <p className="text-xs text-slate-500 mt-2">Original ticket</p>
                      </div>
                    )}
                    {ticketMessages?.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-4 rounded-lg ${
                          msg.is_internal
                            ? 'bg-orange-500/10 border border-orange-500/30'
                            : 'bg-slate-800/50 border border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {msg.is_internal && (
                            <Badge variant="outline" className="border-orange-500 text-orange-400">
                              Internal
                            </Badge>
                          )}
                          <span className="text-xs text-slate-500">
                            {formatDate(msg.created_at)}
                          </span>
                        </div>
                        <p className="text-slate-300 whitespace-pre-wrap">{msg.message}</p>
                      </div>
                    ))}
                  </>
                )}
              </div>

              {/* Reply */}
              <div className="p-4 border-t border-slate-800">
                <div className="flex gap-2 mb-2">
                  <Textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type your reply..."
                    className="bg-slate-800 border-slate-700 min-h-[100px]"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="border-slate-700">
                      <Paperclip className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-slate-700 text-orange-400"
                      onClick={() => sendMessage.mutate({
                        ticketId: selectedTicket.id,
                        message: replyMessage,
                        isInternal: true
                      })}
                      disabled={!replyMessage || sendMessage.isPending}
                    >
                      Internal Note
                    </Button>
                  </div>
                  <Button
                    className="bg-indigo-600 hover:bg-indigo-700"
                    onClick={() => sendMessage.mutate({ ticketId: selectedTicket.id, message: replyMessage })}
                    disabled={!replyMessage || sendMessage.isPending}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {sendMessage.isPending ? 'Sending...' : 'Send Reply'}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <MessageSquare className="w-16 h-16 mb-4 opacity-50" />
              <p>Select a ticket to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
