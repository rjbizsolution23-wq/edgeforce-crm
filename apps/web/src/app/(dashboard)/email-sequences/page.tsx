'use client'
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Plus, Search, Mail, Zap, Clock, ArrowRight, Trash2, Edit2, Play } from 'lucide-react'
import { clsx } from 'clsx'

export default function EmailSequencesPage() {
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingSequence, setEditingSequence] = useState<any>(null)
  const queryClient = useQueryClient()

  const { data: sequences, isLoading } = useQuery({
    queryKey: ['email-sequences'],
    queryFn: async () => {
      const result = await api.getEmailSequences()
      return result.data || []
    },
  })

  const handleDelete = async (id: string) => {
    if (confirm('Delete this email sequence?')) {
      await api.deleteEmailSequence(id)
      queryClient.invalidateQueries({ queryKey: ['email-sequences'] })
    }
  }

  const filteredSequences = (sequences || []).filter((s: any) =>
    s.name?.toLowerCase().includes(search.toLowerCase())
  )

  const demoSequences = [
    {
      id: '1',
      name: 'New Lead Nurture',
      subject: 'Welcome! Let\'s get started',
      body: 'Hi {{first_name}}, Thanks for your interest...',
      delay_days: 1,
      trigger: 'contact_created',
      steps: 3,
    },
    {
      id: '2',
      name: 'Demo Follow-up',
      subject: 'How was your demo?',
      body: 'Hi {{first_name}}, I hope you enjoyed the demo...',
      delay_days: 2,
      trigger: 'demo_scheduled',
      steps: 5,
    },
    {
      id: '3',
      name: 'Proposal Follow-up',
      subject: 'Your proposal is ready',
      body: 'Hi {{first_name}}, Based on our conversation...',
      delay_days: 3,
      trigger: 'proposal_sent',
      steps: 4,
    },
  ]

  const displaySequences = filteredSequences.length > 0 ? filteredSequences : demoSequences

  const getTriggerLabel = (trigger: string) => {
    const labels: Record<string, string> = {
      contact_created: 'New Contact',
      demo_scheduled: 'Demo Scheduled',
      proposal_sent: 'Proposal Sent',
      deal_stage_changed: 'Stage Changed',
      manual: 'Manual Only',
    }
    return labels[trigger] || trigger
  }

  const getTriggerColor = (trigger: string) => {
    if (trigger === 'manual') return 'bg-slate-500/20 text-slate-400'
    if (trigger.includes('demo')) return 'bg-purple-500/20 text-purple-400'
    if (trigger.includes('proposal')) return 'bg-yellow-500/20 text-yellow-400'
    return 'bg-green-500/20 text-green-400'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Email Sequences</h1>
          <p className="text-slate-400">
            Automate multi-step email campaigns with timing and triggers
          </p>
        </div>
        <button
          onClick={() => { setEditingSequence(null); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition"
        >
          <Plus className="h-4 w-4" />
          Create Sequence
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-900 rounded-lg border border-slate-800 max-w-md">
        <Search className="h-4 w-4 text-slate-500" />
        <input
          type="text"
          placeholder="Search sequences..."
          className="bg-transparent border-0 text-sm focus:outline-none w-full"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Sequences List */}
      <div className="space-y-4">
        {displaySequences.map((sequence: any) => (
          <div
            key={sequence.id}
            className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-indigo-500/50 transition"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 rounded-lg">
                  <Zap className="h-5 w-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{sequence.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium', getTriggerColor(sequence.trigger))}>
                      {getTriggerLabel(sequence.trigger)}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="h-3 w-3" />
                      {sequence.delay_days || 1} day delay
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setEditingSequence(sequence); setShowModal(true) }}
                  className="p-2 hover:bg-slate-800 rounded-lg transition"
                  title="Edit"
                >
                  <Edit2 className="h-4 w-4 text-slate-400" />
                </button>
                <button
                  onClick={() => handleDelete(sequence.id)}
                  className="p-2 hover:bg-red-500/20 rounded-lg transition"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4 text-red-400" />
                </button>
              </div>
            </div>

            {/* Visual Sequence Steps */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <div className="flex items-center gap-1 px-3 py-2 bg-green-500/20 rounded-lg border border-green-500/30">
                <Mail className="h-4 w-4 text-green-400" />
                <span className="text-sm text-green-400 font-medium">Step 1: Email</span>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-500 flex-shrink-0" />
              <div className="flex items-center gap-1 px-3 py-2 bg-yellow-500/20 rounded-lg border border-yellow-500/30">
                <Clock className="h-4 w-4 text-yellow-400" />
                <span className="text-sm text-yellow-400 font-medium">Wait {sequence.delay_days || 1}d</span>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-500 flex-shrink-0" />
              <div className="flex items-center gap-1 px-3 py-2 bg-indigo-500/20 rounded-lg border border-indigo-500/30">
                <Mail className="h-4 w-4 text-indigo-400" />
                <span className="text-sm text-indigo-400 font-medium">Step 2: Follow-up</span>
              </div>
              {(sequence.steps || 3) > 2 && (
                <>
                  <ArrowRight className="h-4 w-4 text-slate-500 flex-shrink-0" />
                  <div className="flex items-center gap-1 px-3 py-2 bg-slate-500/20 rounded-lg border border-slate-500/30">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-400">+{sequence.steps - 2} more</span>
                  </div>
                </>
              )}
            </div>

            {/* Subject Preview */}
            <p className="text-sm text-slate-400 mt-4">
              <span className="text-slate-500">Subject:</span> {sequence.subject}
            </p>
          </div>
        ))}
      </div>

      {/* Sequence Modal */}
      {showModal && (
        <SequenceModal
          sequence={editingSequence}
          onClose={() => { setShowModal(false); setEditingSequence(null) }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['email-sequences'] })
            setShowModal(false)
            setEditingSequence(null)
          }}
        />
      )}
    </div>
  )
}

function SequenceModal({ sequence, onClose, onSuccess }: any) {
  const [formData, setFormData] = useState({
    name: sequence?.name || '',
    subject: sequence?.subject || '',
    body: sequence?.body || '',
    delayDays: sequence?.delay_days || 1,
    trigger: sequence?.trigger || 'manual',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      if (sequence?.id) {
        await api.updateEmailSequence(sequence.id, formData)
      } else {
        await api.createEmailSequence(formData)
      }
      onSuccess()
    } catch (error) {
      console.error('Failed to save sequence:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-xl font-semibold">{sequence ? 'Edit Sequence' : 'Create Email Sequence'}</h2>
          <p className="text-sm text-slate-400 mt-1">Create automated multi-step email campaigns</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Sequence Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              placeholder="e.g., New Lead Nurture Sequence"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Trigger</label>
              <select
                value={formData.trigger}
                onChange={(e) => setFormData({ ...formData, trigger: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="manual">Manual Only</option>
                <option value="contact_created">New Contact Created</option>
                <option value="demo_scheduled">Demo Scheduled</option>
                <option value="proposal_sent">Proposal Sent</option>
                <option value="deal_stage_changed">Deal Stage Changed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Delay (Days)</label>
              <input
                type="number"
                min="0"
                value={formData.delayDays}
                onChange={(e) => setFormData({ ...formData, delayDays: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Email Subject</label>
            <input
              type="text"
              required
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              placeholder="e.g., Welcome to {{company}}!"
            />
            <p className="text-xs text-slate-500 mt-1">Use {"{{variable}}"} for personalization</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Email Body</label>
            <textarea
              required
              rows={8}
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500 font-mono text-sm"
              placeholder="Hi {{first_name}},&#10;&#10;Your email content here..."
            />
          </div>

          {/* Visual Preview */}
          <div className="bg-slate-800/50 rounded-lg p-4">
            <p className="text-sm text-slate-400 mb-3">Sequence Preview</p>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-3 py-2 bg-green-500/20 rounded-lg border border-green-500/30">
                <Mail className="h-4 w-4 text-green-400" />
                <span className="text-sm text-green-400">Step 1: Initial Email</span>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-500" />
              <div className="flex items-center gap-1 px-3 py-2 bg-yellow-500/20 rounded-lg border border-yellow-500/30">
                <Clock className="h-4 w-4 text-yellow-400" />
                <span className="text-sm text-yellow-400">Wait {formData.delayDays}d</span>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-500" />
              <div className="flex items-center gap-1 px-3 py-2 bg-indigo-500/20 rounded-lg border border-indigo-500/30">
                <Mail className="h-4 w-4 text-indigo-400" />
                <span className="text-sm text-indigo-400">Step 2: Follow-up</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : sequence ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}