'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, MessageSquare, Send, Clock, MoreVertical, Pencil, Trash2, ChevronDown } from 'lucide-react'
import { clsx } from 'clsx'
import { api } from '@/lib/api'

interface SMSTemplate {
  id: string
  name: string
  content: string
  variables: string[]
  createdAt: string
  updatedAt: string
}

interface SMSCampaign {
  id: string
  name: string
  templateId: string
  audienceFilter: {
    tags?: string[]
    pipelines?: string[]
    stage?: string
  }
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused'
  totalRecipients: number
  sentCount: number
  deliveredCount: number
  scheduledAt?: string
  createdAt: string
}

interface SMSLog {
  id: string
  contactId: string
  contactName: string
  phone: string
  message: string
  status: 'queued' | 'sent' | 'delivered' | 'failed'
  sentAt: string
  deliveredAt?: string
}

export default function SMSPage() {
  const [activeTab, setActiveTab] = useState<'templates' | 'campaigns' | 'logs'>('templates')
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [showCampaignModal, setShowCampaignModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<SMSTemplate | null>(null)
  const [selectedCampaign, setSelectedCampaign] = useState<SMSCampaign | null>(null)

  // Mock data for demonstration
  const templates: SMSTemplate[] = [
    {
      id: '1',
      name: 'Welcome Message',
      content: 'Hi {{contact.firstName}}! Welcome to {{business.name}}. We\'re excited to work with you!',
      variables: ['contact.firstName', 'business.name'],
      createdAt: '2026-03-20T10:00:00Z',
      updatedAt: '2026-03-20T10:00:00Z',
    },
    {
      id: '2',
      name: 'Follow-up Reminder',
      content: 'Hi {{contact.firstName}}, this is a reminder about our meeting {{meeting.time}} tomorrow. Reply STOP to unsubscribe.',
      variables: ['contact.firstName', 'meeting.time'],
      createdAt: '2026-03-18T14:30:00Z',
      updatedAt: '2026-03-19T09:15:00Z',
    },
    {
      id: '3',
      name: 'Deal Won Celebration',
      content: '🎉 Congratulations {{contact.firstName}}! Your deal for {{deal.value}} has been finalized. Thank you for choosing us!',
      variables: ['contact.firstName', 'deal.value'],
      createdAt: '2026-03-15T11:00:00Z',
      updatedAt: '2026-03-15T11:00:00Z',
    },
  ]

  const campaigns: SMSCampaign[] = [
    {
      id: '1',
      name: 'Spring Promo 2026',
      templateId: '1',
      audienceFilter: { tags: ['prospect', 'warm'] },
      status: 'sent',
      totalRecipients: 250,
      sentCount: 250,
      deliveredCount: 248,
      createdAt: '2026-03-15T08:00:00Z',
    },
    {
      id: '2',
      name: 'Product Launch Announcement',
      templateId: '2',
      audienceFilter: { tags: ['customer'] },
      status: 'scheduled',
      totalRecipients: 180,
      sentCount: 0,
      deliveredCount: 0,
      scheduledAt: '2026-03-30T09:00:00Z',
      createdAt: '2026-03-25T14:00:00Z',
    },
    {
      id: '3',
      name: 'Webinar Reminder',
      templateId: '2',
      audienceFilter: { pipelines: ['sales'], stage: 'proposal' },
      status: 'draft',
      totalRecipients: 45,
      sentCount: 0,
      deliveredCount: 0,
      createdAt: '2026-03-28T16:00:00Z',
    },
  ]

  const logs: SMSLog[] = [
    { id: '1', contactId: '1', contactName: 'Sarah Chen', phone: '+1-555-0123', message: 'Hi Sarah! Welcome to EdgeForce...', status: 'delivered', sentAt: '2026-03-28T10:30:00Z', deliveredAt: '2026-03-28T10:30:05Z' },
    { id: '2', contactId: '2', contactName: 'Michael Ross', phone: '+1-555-0456', message: 'Hi Michael, this is a reminder...', status: 'delivered', sentAt: '2026-03-28T09:00:00Z', deliveredAt: '2026-03-28T09:00:08Z' },
    { id: '3', contactId: '3', contactName: 'Emma Wilson', phone: '+1-555-0789', message: '🎉 Congratulations Emma!...', status: 'sent', sentAt: '2026-03-27T14:20:00Z' },
    { id: '4', contactId: '4', contactName: 'James Lee', phone: '+1-555-0321', message: 'Hi James! Welcome to EdgeForce...', status: 'failed', sentAt: '2026-03-26T11:00:00Z' },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-emerald-500/20 text-emerald-400'
      case 'sent': return 'bg-blue-500/20 text-blue-400'
      case 'queued': return 'bg-amber-500/20 text-amber-400'
      case 'failed': return 'bg-red-500/20 text-red-400'
      case 'draft': return 'bg-slate-500/20 text-slate-400'
      case 'scheduled': return 'bg-purple-500/20 text-purple-400'
      case 'sending': return 'bg-blue-500/20 text-blue-400'
      default: return 'bg-slate-500/20 text-slate-400'
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">SMS Marketing</h1>
          <p className="text-slate-400 mt-1">Send SMS campaigns to your contacts via Twilio</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowTemplateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition"
          >
            <Plus className="h-4 w-4" />
            New Template
          </button>
          <button
            onClick={() => setShowCampaignModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition"
          >
            <Send className="h-4 w-4" />
            New Campaign
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{campaigns.length}</p>
              <p className="text-xs text-slate-400">Active Campaigns</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <Send className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{logs.filter(l => l.status === 'delivered').length}</p>
              <p className="text-xs text-slate-400">Delivered Today</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{campaigns.filter(c => c.status === 'scheduled').length}</p>
              <p className="text-xs text-slate-400">Scheduled</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{templates.length}</p>
              <p className="text-xs text-slate-400">Templates</p>
            </div>
          </div>
        </div>
      </div>

      {/* Twilio Setup Banner */}
      <div className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-indigo-500/30 flex items-center justify-center shrink-0">
            <MessageSquare className="h-6 w-6 text-indigo-300" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">Connect Twilio for SMS</h3>
            <p className="text-slate-400 mt-1 text-sm">
              To send SMS campaigns, connect your Twilio account. You'll need your Account SID, Auth Token, and a Twilio phone number.
            </p>
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <div className="h-2 w-2 bg-amber-400 rounded-full" />
                Twilio not connected
              </div>
              <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition">
                Configure Twilio
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-800">
        <nav className="flex gap-6">
          {[
            { id: 'templates', label: 'Templates', count: templates.length },
            { id: 'campaigns', label: 'Campaigns', count: campaigns.length },
            { id: 'logs', label: 'Message Logs', count: logs.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={clsx(
                'pb-3 px-1 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.id
                  ? 'border-indigo-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              )}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition cursor-pointer group"
              onClick={() => setSelectedTemplate(template)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{template.name}</h3>
                    <p className="text-xs text-slate-400">{template.variables.length} variables</p>
                  </div>
                </div>
                <button className="p-1.5 rounded-lg hover:bg-slate-800 opacity-0 group-hover:opacity-100 transition">
                  <MoreVertical className="h-4 w-4 text-slate-400" />
                </button>
              </div>
              <p className="text-sm text-slate-400 line-clamp-3">{template.content}</p>
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-800">
                <span className={clsx('px-2 py-1 rounded text-xs font-medium', getStatusColor('draft'))}>
                  Active
                </span>
                <span className="text-xs text-slate-500">
                  Updated {new Date(template.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'campaigns' && (
        <div className="space-y-4">
          {campaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition cursor-pointer"
              onClick={() => setSelectedCampaign(campaign)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                    <Send className="h-5 w-5 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{campaign.name}</h3>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-sm text-slate-400">
                        {campaign.totalRecipients} recipients
                      </span>
                      {campaign.scheduledAt && (
                        <span className="text-sm text-slate-500">
                          Scheduled: {new Date(campaign.scheduledAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={clsx('px-3 py-1.5 rounded-lg text-xs font-medium', getStatusColor(campaign.status))}>
                    {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                  </span>
                  <button className="p-2 rounded-lg hover:bg-slate-800 transition">
                    <MoreVertical className="h-4 w-4 text-slate-400" />
                  </button>
                </div>
              </div>
              {campaign.status === 'sent' && (
                <div className="mt-4 pt-4 border-t border-slate-800">
                  <div className="flex items-center gap-8">
                    <div>
                      <p className="text-2xl font-bold text-white">{campaign.sentCount}</p>
                      <p className="text-xs text-slate-400">Sent</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-emerald-400">{campaign.deliveredCount}</p>
                      <p className="text-xs text-slate-400">Delivered</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-emerald-400">
                        {Math.round((campaign.deliveredCount / campaign.sentCount) * 100)}%
                      </p>
                      <p className="text-xs text-slate-400">Delivery Rate</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-800/50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Contact</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Phone</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Message</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Sent At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/30 transition">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-medium text-slate-300">
                        {log.contactName.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="font-medium text-white">{log.contactName}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-400 font-mono">{log.phone}</td>
                  <td className="px-5 py-4 text-sm text-slate-400 max-w-md truncate">{log.message}</td>
                  <td className="px-5 py-4">
                    <span className={clsx('px-2.5 py-1 rounded-lg text-xs font-medium', getStatusColor(log.status))}>
                      {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-400">
                    {new Date(log.sentAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}