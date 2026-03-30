'use client'
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { X, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import { clsx } from 'clsx'

interface CreateDealModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function CreateDealModal({ isOpen, onClose, onSuccess }: CreateDealModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    pipelineId: '',
    stage: 'New',
    value: '',
    contactId: '',
    expectedCloseDate: '',
    notes: ''
  })

  const { data: pipelines } = useQuery({
    queryKey: ['pipelines'],
    queryFn: async () => {
      const result = await api.getPipelines()
      return result.data || []
    }
  })

  const { data: contacts } = useQuery({
    queryKey: ['contacts-select'],
    queryFn: async () => {
      const result = await api.getContacts({ limit: 100 })
      return result.data || []
    }
  })

  useEffect(() => {
    if (pipelines?.length && !form.pipelineId) {
      setForm(prev => ({ ...prev, pipelineId: pipelines[0].id }))
    }
  }, [pipelines, form.pipelineId])

  const currentPipeline = pipelines?.find(p => p.id === form.pipelineId)
  const stages = currentPipeline?.stages || ['New', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost']

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await api.createDeal({
        name: form.name,
        pipelineId: form.pipelineId,
        stage: form.stage,
        value: form.value ? parseFloat(form.value) : undefined,
        contactId: form.contactId || undefined,
        expectedCloseDate: form.expectedCloseDate || undefined
      })
      if (result.error) {
        setError(result.error)
      } else {
        setForm({ name: '', pipelineId: pipelines?.[0]?.id || '', stage: 'New', value: '', contactId: '', expectedCloseDate: '', notes: '' })
        onSuccess?.()
        onClose()
      }
    } catch (err) {
      setError('Failed to create deal')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Create New Deal</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded">
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Deal Name *</label>
            <input
              type="text"
              name="name"
              required
              value={form.name}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
              placeholder="Enterprise contract with Acme"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Pipeline</label>
              <select
                name="pipelineId"
                value={form.pipelineId}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
              >
                {pipelines?.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                )) || <option>Loading...</option>}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Stage</label>
              <select
                name="stage"
                value={form.stage}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
              >
                {stages.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Value ($)</label>
              <input
                type="number"
                name="value"
                value={form.value}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                placeholder="5000"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Expected Close</label>
              <input
                type="date"
                name="expectedCloseDate"
                value={form.expectedCloseDate}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Contact (optional)</label>
            <select
              name="contactId"
              value={form.contactId}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="">No contact</option>
              {contacts?.map(c => (
                <option key={c.id} value={c.id}>
                  {c.first_name || c.firstName} {c.last_name || c.lastName} {c.company ? `(${c.company})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Notes</label>
            <textarea
              name="notes"
              rows={3}
              value={form.notes}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500 resize-none"
              placeholder="Deal notes..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={clsx(
                'flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition flex items-center justify-center gap-2',
                loading && 'opacity-50 cursor-not-allowed'
              )}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Creating...' : 'Create Deal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}