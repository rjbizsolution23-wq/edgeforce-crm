'use client'
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Plus, Search, Mail, Edit2, Trash2, Eye, Copy } from 'lucide-react'
import { clsx } from 'clsx'

export default function EmailTemplatesPage() {
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<any>(null)
  const queryClient = useQueryClient()

  const { data: templates, isLoading } = useQuery({
    queryKey: ['email-templates'],
    queryFn: async () => {
      const result = await api.getEmailTemplates()
      return result.data || []
    },
  })

  const handleDelete = async (id: string) => {
    if (confirm('Delete this email template?')) {
      await api.deleteEmailTemplate(id)
      queryClient.invalidateQueries({ queryKey: ['email-templates'] })
    }
  }

  const handleCopyTemplate = (template: any) => {
    navigator.clipboard.writeText(JSON.stringify({
      subject: template.subject,
      body: template.body,
    }))
  }

  const filteredTemplates = (templates || []).filter((t: any) =>
    t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.subject?.toLowerCase().includes(search.toLowerCase()) ||
    t.category?.toLowerCase().includes(search.toLowerCase())
  )

  const demoTemplates = [
    { id: '1', name: 'Welcome Email', subject: 'Welcome to {{company}}!', body: 'Hi {{first_name}},\n\nWelcome to our platform...', category: 'welcome' },
    { id: '2', name: 'Follow Up', subject: 'Following up on our conversation', body: 'Hi {{first_name}},\n\nI wanted to follow up...', category: 'followup' },
    { id: '3', name: 'Meeting Request', subject: 'Can we schedule a call?', body: 'Hi {{first_name}},\n\nWould you be available for a quick call...', category: 'meeting' },
    { id: '4', name: 'Proposal Send', subject: 'Your custom proposal is ready', body: 'Hi {{first_name}},\n\nBased on our discussion, here is your proposal...', category: 'proposal' },
  ]

  const displayTemplates = filteredTemplates.length > 0 ? filteredTemplates : demoTemplates

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Email Templates</h1>
          <p className="text-slate-400">
            {isLoading ? 'Loading...' : `${displayTemplates.length} templates in your workspace`}
          </p>
        </div>
        <button
          onClick={() => { setEditingTemplate(null); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition"
        >
          <Plus className="h-4 w-4" />
          Create Template
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-900 rounded-lg border border-slate-800 max-w-md">
        <Search className="h-4 w-4 text-slate-500" />
        <input
          type="text"
          placeholder="Search templates..."
          className="bg-transparent border-0 text-sm focus:outline-none w-full"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayTemplates.map((template: any) => (
          <div
            key={template.id}
            className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 hover:border-indigo-500/50 transition"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-indigo-400" />
                <span className={clsx(
                  'px-2 py-0.5 rounded-full text-xs font-medium',
                  template.category === 'welcome' ? 'bg-green-500/20 text-green-400' :
                  template.category === 'followup' ? 'bg-yellow-500/20 text-yellow-400' :
                  template.category === 'proposal' ? 'bg-purple-500/20 text-purple-400' :
                  'bg-slate-500/20 text-slate-400'
                )}>
                  {template.category || 'general'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleCopyTemplate(template)}
                  className="p-1.5 hover:bg-slate-800 rounded-lg transition"
                  title="Copy template"
                >
                  <Copy className="h-4 w-4 text-slate-400" />
                </button>
                <button
                  onClick={() => { setEditingTemplate(template); setShowModal(true) }}
                  className="p-1.5 hover:bg-slate-800 rounded-lg transition"
                  title="Edit"
                >
                  <Edit2 className="h-4 w-4 text-slate-400" />
                </button>
                <button
                  onClick={() => handleDelete(template.id)}
                  className="p-1.5 hover:bg-red-500/20 rounded-lg transition"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4 text-red-400" />
                </button>
              </div>
            </div>
            <h3 className="font-semibold text-white mb-1">{template.name}</h3>
            <p className="text-sm text-slate-400 mb-3 line-clamp-2">{template.subject}</p>
            <p className="text-xs text-slate-500 line-clamp-3">{template.body}</p>
          </div>
        ))}
      </div>

      {/* Template Modal */}
      {showModal && (
        <TemplateModal
          template={editingTemplate}
          onClose={() => { setShowModal(false); setEditingTemplate(null) }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['email-templates'] })
            setShowModal(false)
            setEditingTemplate(null)
          }}
        />
      )}
    </div>
  )
}

function TemplateModal({ template, onClose, onSuccess }: any) {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    subject: template?.subject || '',
    body: template?.body || '',
    category: template?.category || 'general',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      if (template?.id) {
        await api.updateEmailTemplate(template.id, formData)
      } else {
        await api.createEmailTemplate(formData)
      }
      onSuccess()
    } catch (error) {
      console.error('Failed to save template:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-xl font-semibold">{template ? 'Edit Template' : 'Create Template'}</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Template Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              placeholder="e.g., Welcome Email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Subject Line</label>
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
            <label className="block text-sm font-medium text-slate-300 mb-1">Body</label>
            <textarea
              required
              rows={10}
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500 font-mono text-sm"
              placeholder="Hi {{first_name}},&#10;&#10;Your email content here..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="general">General</option>
              <option value="welcome">Welcome</option>
              <option value="followup">Follow Up</option>
              <option value="meeting">Meeting</option>
              <option value="proposal">Proposal</option>
              <option value="newsletter">Newsletter</option>
            </select>
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
              {isSubmitting ? 'Saving...' : template ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}