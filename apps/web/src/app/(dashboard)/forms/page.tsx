'use client'
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Plus, Search, FileText, Edit2, Trash2, Copy, ExternalLink, Eye } from 'lucide-react'
import { clsx } from 'clsx'

const FIELD_TYPES = [
  { id: 'text', label: 'Text Input', icon: 'Type' },
  { id: 'email', label: 'Email', icon: 'Mail' },
  { id: 'phone', label: 'Phone', icon: 'Phone' },
  { id: 'textarea', label: 'Text Area', icon: 'AlignLeft' },
  { id: 'select', label: 'Dropdown', icon: 'ChevronDown' },
  { id: 'checkbox', label: 'Checkbox', icon: 'CheckSquare' },
  { id: 'radio', label: 'Radio', icon: 'Circle' },
  { id: 'number', label: 'Number', icon: 'Hash' },
  { id: 'date', label: 'Date', icon: 'Calendar' },
]

export default function FormsPage() {
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingForm, setEditingForm] = useState<any>(null)
  const [previewMode, setPreviewMode] = useState(false)
  const queryClient = useQueryClient()

  const { data: forms, isLoading } = useQuery({
    queryKey: ['forms'],
    queryFn: async () => {
      const result = await api.getForms()
      return result.data || []
    },
  })

  const handleDelete = async (id: string) => {
    if (confirm('Delete this form?')) {
      await api.deleteForm(id)
      queryClient.invalidateQueries({ queryKey: ['forms'] })
    }
  }

  const getEmbedCode = (formId: string) => {
    return `<script src="https://edgeforce-crm.pages.dev/forms/embed/${formId}.js"></script>`
  }

  const filteredForms = (forms || []).filter((f: any) =>
    f.name?.toLowerCase().includes(search.toLowerCase())
  )

  const demoForms = [
    {
      id: '1',
      name: 'Contact Us',
      description: 'General contact form for website visitors',
      fields: [
        { type: 'text', label: 'First Name', required: true },
        { type: 'text', label: 'Last Name', required: true },
        { type: 'email', label: 'Email', required: true },
        { type: 'textarea', label: 'Message', required: true },
      ],
      submissions_count: 234,
      is_active: true,
    },
    {
      id: '2',
      name: 'Demo Request',
      description: 'Request a product demo',
      fields: [
        { type: 'text', label: 'Company', required: true },
        { type: 'email', label: 'Work Email', required: true },
        { type: 'phone', label: 'Phone', required: false },
        { type: 'select', label: 'Company Size', options: ['1-10', '11-50', '51-200', '200+'], required: true },
      ],
      submissions_count: 89,
      is_active: true,
    },
    {
      id: '3',
      name: 'Newsletter Signup',
      description: 'Subscribe to our newsletter',
      fields: [
        { type: 'email', label: 'Email', required: true },
        { type: 'checkbox', label: 'I agree to receive marketing emails', required: false },
      ],
      submissions_count: 567,
      is_active: true,
    },
  ]

  const displayForms = filteredForms.length > 0 ? filteredForms : demoForms

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Form Builder</h1>
          <p className="text-slate-400">
            Create embeddable forms for lead capture
          </p>
        </div>
        <button
          onClick={() => { setEditingForm(null); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition"
        >
          <Plus className="h-4 w-4" />
          Create Form
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-900 rounded-lg border border-slate-800 max-w-md">
        <Search className="h-4 w-4 text-slate-500" />
        <input
          type="text"
          placeholder="Search forms..."
          className="bg-transparent border-0 text-sm focus:outline-none w-full"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Forms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayForms.map((form: any) => {
          const fields = typeof form.fields === 'string' ? JSON.parse(form.fields) : form.fields || []
          return (
            <div
              key={form.id}
              className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 hover:border-indigo-500/50 transition"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-indigo-500/20 rounded-lg">
                  <FileText className="h-5 w-5 text-indigo-400" />
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { setEditingForm(form); setShowModal(true) }}
                    className="p-1.5 hover:bg-slate-800 rounded-lg transition"
                    title="Edit"
                  >
                    <Edit2 className="h-4 w-4 text-slate-400" />
                  </button>
                  <button
                    onClick={() => handleDelete(form.id)}
                    className="p-1.5 hover:bg-red-500/20 rounded-lg transition"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </button>
                </div>
              </div>
              <h3 className="font-semibold text-white mb-1">{form.name}</h3>
              <p className="text-sm text-slate-400 mb-3 line-clamp-2">{form.description || 'No description'}</p>

              {/* Field Preview */}
              <div className="flex items-center gap-2 mb-3">
                {fields.slice(0, 3).map((field: any, i: number) => (
                  <span key={i} className="px-2 py-0.5 bg-slate-700/50 rounded text-xs text-slate-300">
                    {field.label}
                  </span>
                ))}
                {fields.length > 3 && (
                  <span className="text-xs text-slate-400">+{fields.length - 3} more</span>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <span className={clsx(
                  'px-2 py-0.5 rounded-full text-xs font-medium',
                  form.is_active ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'
                )}>
                  {form.is_active ? 'Active' : 'Inactive'}
                </span>
                <span className="text-sm text-slate-400">{form.submissions_count || 0} submissions</span>
              </div>

              {/* Embed Code */}
              <div className="mt-3 p-2 bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <code className="text-xs text-slate-400 truncate flex-1">
                    forms/{form.id}
                  </code>
                  <button
                    onClick={() => navigator.clipboard.writeText(getEmbedCode(form.id))}
                    className="p-1 hover:bg-slate-700 rounded"
                    title="Copy embed code"
                  >
                    <Copy className="h-3 w-3 text-slate-400" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Form Modal */}
      {showModal && (
        <FormModal
          form={editingForm}
          onClose={() => { setShowModal(false); setEditingForm(null) }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['forms'] })
            setShowModal(false)
            setEditingForm(null)
          }}
        />
      )}
    </div>
  )
}

function FormModal({ form, onClose, onSuccess }: any) {
  const [formData, setFormData] = useState({
    name: form?.name || '',
    description: form?.description || '',
    redirectUrl: form?.redirect_url || '',
    thankYouMessage: form?.thank_you_message || 'Thank you for your submission!',
  })
  const [fields, setFields] = useState<any[]>(
    form?.fields ? (typeof form.fields === 'string' ? JSON.parse(form.fields) : form.fields) : []
  )
  const [previewMode, setPreviewMode] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const addField = (type: string) => {
    setFields([...fields, {
      type,
      label: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Field`,
      required: false,
      options: type === 'select' || type === 'radio' ? ['Option 1', 'Option 2'] : undefined,
    }])
  }

  const updateField = (index: number, updates: any) => {
    const newFields = [...fields]
    newFields[index] = { ...newFields[index], ...updates }
    setFields(newFields)
  }

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        fields,
        redirectUrl: formData.redirectUrl,
        thankYouMessage: formData.thankYouMessage,
      }
      if (form?.id) {
        await api.updateForm(form.id, payload)
      } else {
        await api.createForm(payload)
      }
      onSuccess()
    } catch (error) {
      console.error('Failed to save form:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">{form ? 'Edit Form' : 'Create Form'}</h2>
            <p className="text-sm text-slate-400 mt-1">Build embeddable forms for lead capture</p>
          </div>
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className={clsx(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg transition',
              previewMode ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            )}
          >
            <Eye className="h-4 w-4" />
            {previewMode ? 'Edit Mode' : 'Preview'}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {previewMode ? (
            /* Preview Mode */
            <div className="bg-white text-slate-900 rounded-xl p-8 max-w-xl mx-auto">
              <h3 className="text-xl font-bold mb-1">{formData.name || 'Form Name'}</h3>
              <p className="text-slate-600 mb-6">{formData.description || 'Form description'}</p>

              {fields.map((field, index) => (
                <div key={index} className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {field.type === 'text' && (
                    <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg" placeholder={field.label} />
                  )}
                  {field.type === 'email' && (
                    <input type="email" className="w-full px-3 py-2 border border-slate-300 rounded-lg" placeholder="email@example.com" />
                  )}
                  {field.type === 'phone' && (
                    <input type="tel" className="w-full px-3 py-2 border border-slate-300 rounded-lg" placeholder="+1 (555) 000-0000" />
                  )}
                  {field.type === 'textarea' && (
                    <textarea className="w-full px-3 py-2 border border-slate-300 rounded-lg" rows={3} placeholder={field.label} />
                  )}
                  {field.type === 'select' && (
                    <select className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                      <option value="">Select...</option>
                      {field.options?.map((opt: string, i: number) => (
                        <option key={i} value={opt}>{opt}</option>
                      ))}
                    </select>
                  )}
                  {field.type === 'checkbox' && (
                    <label className="flex items-center gap-2">
                      <input type="checkbox" />
                      <span className="text-sm">{field.label}</span>
                    </label>
                  )}
                  {field.type === 'number' && (
                    <input type="number" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                  )}
                  {field.type === 'date' && (
                    <input type="date" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                  )}
                </div>
              ))}

              <button type="button" className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition">
                Submit
              </button>
            </div>
          ) : (
            /* Edit Mode */
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Form Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                    placeholder="e.g., Contact Us"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                    placeholder="Brief description"
                  />
                </div>
              </div>

              {/* Fields */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Form Fields</label>
                <div className="space-y-3 mb-4">
                  {fields.map((field, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                      <div className="flex-1 grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) => updateField(index, { label: e.target.value })}
                          className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                          placeholder="Field label"
                        />
                        <select
                          value={field.type}
                          onChange={(e) => updateField(index, { type: e.target.value })}
                          className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                        >
                          {FIELD_TYPES.map((type) => (
                            <option key={type.id} value={type.id}>{type.label}</option>
                          ))}
                        </select>
                        <label className="flex items-center gap-2 px-2">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => updateField(index, { required: e.target.checked })}
                            className="rounded"
                          />
                          <span className="text-sm text-slate-400">Required</span>
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeField(index)}
                        className="p-1 hover:bg-red-500/20 rounded"
                      >
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </button>
                    </div>
                  ))}

                  {fields.length === 0 && (
                    <p className="text-sm text-slate-500 text-center py-4">No fields yet. Add fields below.</p>
                  )}
                </div>

                {/* Add Field Buttons */}
                <div className="flex flex-wrap gap-2">
                  {FIELD_TYPES.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => addField(type.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-full text-sm text-slate-300 hover:border-indigo-500 hover:text-indigo-400 transition"
                    >
                      <Plus className="h-3 w-3" />
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Thank You Message</label>
                  <input
                    type="text"
                    value={formData.thankYouMessage}
                    onChange={(e) => setFormData({ ...formData, thankYouMessage: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Redirect URL (optional)</label>
                  <input
                    type="url"
                    value={formData.redirectUrl}
                    onChange={(e) => setFormData({ ...formData, redirectUrl: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-800 mt-6">
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
              {isSubmitting ? 'Saving...' : form ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}