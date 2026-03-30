'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Send,
  Clock,
  User,
  MessageSquare,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'

const mockTicket = {
  id: 'TKT-ABC123',
  subject: 'Cannot access my dashboard',
  status: 'open',
  priority: 'high',
  category: 'Technical',
  created: '2024-01-15T10:30:00Z',
  updated: '2024-01-16T14:20:00Z',
  description: 'I\'ve been trying to access my dashboard since this morning but keep getting an error message. I\'ve tried clearing my browser cache and using a different browser but the issue persists.',
  contact: {
    name: 'John Doe',
    email: 'john@example.com',
  },
  assignedTo: {
    name: 'Support Team',
    avatar: 'ST',
  },
}

const mockMessages = [
  {
    id: '1',
    sender: 'customer',
    content: 'I\'ve been trying to access my dashboard since this morning but keep getting an error message. I\'ve tried clearing my browser cache and using a different browser but the issue persists.',
    timestamp: '2024-01-15T10:30:00Z',
    author: 'John Doe',
  },
  {
    id: '2',
    sender: 'agent',
    content: 'Hi John, thank you for reaching out. I\'m sorry to hear you\'re experiencing issues accessing your dashboard. Could you please share the exact error message you\'re seeing? Also, what browser are you currently using?',
    timestamp: '2024-01-15T11:15:00Z',
    author: 'Support Team',
  },
  {
    id: '3',
    sender: 'customer',
    content: 'The error says "Unable to load dashboard. Please try again later." I\'m using Chrome on Windows 11. I also tried Firefox with the same result.',
    timestamp: '2024-01-15T14:30:00Z',
    author: 'John Doe',
  },
  {
    id: '4',
    sender: 'agent',
    content: 'Thank you for that information, John. Our engineering team is aware of an issue affecting some users\' dashboards. We\'re actively working on a fix and expect it to be resolved within the next few hours. I\'ll keep you updated on our progress.',
    timestamp: '2024-01-15T15:00:00Z',
    author: 'Support Team',
  },
  {
    id: '5',
    sender: 'customer',
    content: 'Okay, thank you for the update. I\'ll wait for the fix.',
    timestamp: '2024-01-16T09:00:00Z',
    author: 'John Doe',
  },
  {
    id: '6',
    sender: 'agent',
    content: 'Great news, John! The issue has been resolved. Please try accessing your dashboard again. If you continue to experience any problems, please let us know.',
    timestamp: '2024-01-16T14:20:00Z',
    author: 'Support Team',
  },
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

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export default function TicketDetailPage({ params }: { params: { id: string } }) {
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reply.trim()) return

    setSending(true)
    // Simulate sending
    await new Promise(resolve => setTimeout(resolve, 1000))
    setSending(false)
    setReply('')
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link href="/portal/tickets" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4" />
        Back to tickets
      </Link>

      {/* Ticket Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm text-slate-500">{mockTicket.id}</span>
              <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${statusColors[mockTicket.status]}`}>
                {mockTicket.status}
              </span>
              <span className={`text-sm font-medium ${priorityColors[mockTicket.priority]} capitalize`}>
                {mockTicket.priority} priority
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{mockTicket.subject}</h1>
          </div>
          {mockTicket.status === 'resolved' && (
            <Button variant="outline" className="text-green-600 border-green-300">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Mark as Closed
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-slate-600">
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            Created {formatDate(mockTicket.created)}
          </span>
          <span className="flex items-center gap-1">
            <User className="w-4 h-4" />
            {mockTicket.contact.name}
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="w-4 h-4" />
            {mockTicket.category}
          </span>
        </div>
      </div>

      {/* Messages Thread */}
      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-200">
        {mockMessages.map((message) => (
          <div key={message.id} className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  message.sender === 'customer'
                    ? 'bg-indigo-100 text-indigo-600'
                    : 'bg-slate-800 text-white'
                }`}>
                  {message.author.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <span className="font-medium text-slate-900">{message.author}</span>
                  <span className="ml-2 text-xs text-slate-500">
                    {message.sender === 'customer' ? 'You' : 'Support Agent'}
                  </span>
                </div>
              </div>
              <span className="text-sm text-slate-500">{formatDate(message.timestamp)}</span>
            </div>
            <div className={`ml-11 p-4 rounded-xl ${
              message.sender === 'customer'
                ? 'bg-slate-50 border border-slate-200'
                : 'bg-indigo-50 border border-indigo-200'
            }`}>
              <p className="text-slate-700 whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Reply Form */}
      {mockTicket.status !== 'closed' && mockTicket.status !== 'resolved' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Add a Reply</h3>
          <form onSubmit={handleSubmitReply} className="space-y-4">
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Type your message..."
              rows={4}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">We typically respond within 24 hours</p>
              <Button
                type="submit"
                disabled={!reply.trim() || sending}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {sending ? (
                  <>
                    <span className="animate-spin mr-2">⟳</span>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Reply
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Resolved State */}
      {mockTicket.status === 'resolved' && (
        <div className="bg-green-50 rounded-xl border border-green-200 p-6 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <h3 className="font-semibold text-green-900 mb-2">This ticket has been resolved</h3>
          <p className="text-green-700 mb-4">If you need further assistance, feel free to reply and we'll reopen your ticket.</p>
        </div>
      )}
    </div>
  )
}