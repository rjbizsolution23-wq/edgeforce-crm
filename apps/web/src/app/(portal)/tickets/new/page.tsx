'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  ArrowLeft,
  Send,
  AlertCircle,
  FileText,
  Zap
} from 'lucide-react'

export default function CreateTicketPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [form, setForm] = useState({
    subject: '',
    category: '',
    priority: 'medium',
    description: '',
  })

  const categories = [
    'Technical Support',
    'Billing & Payments',
    'Feature Request',
    'Account Management',
    'Integration Help',
    'General Inquiry',
  ]

  const priorities = [
    { value: 'low', label: 'Low', description: 'General question, no urgency' },
    { value: 'medium', label: 'Medium', description: 'Issue affecting my work' },
    { value: 'high', label: 'High', description: 'Significant impact on productivity' },
    { value: 'urgent', label: 'Urgent', description: 'Critical - system down or major issue' },
  ]

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!form.subject.trim()) newErrors.subject = 'Subject is required'
    if (!form.category) newErrors.category = 'Please select a category'
    if (!form.description.trim()) newErrors.description = 'Please describe your issue'
    return newErrors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setSubmitting(true)
    setErrors({})

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Redirect to tickets list with success message
    router.push('/portal/tickets?created=true')
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link href="/portal/tickets" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4" />
        Back to tickets
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <FileText className="w-5 h-5 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Submit a Support Ticket</h1>
        </div>
        <p className="text-slate-600">Describe your issue and our team will get back to you within 24 hours.</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
        {/* Subject */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Subject <span className="text-red-500">*</span>
          </label>
          <Input
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            placeholder="Brief description of your issue"
            className={errors.subject ? 'border-red-500' : ''}
          />
          {errors.subject && (
            <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.subject}
            </p>
          )}
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Category <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setForm({ ...form, category: cat })}
                className={`p-4 rounded-xl border text-left transition ${
                  form.category === cat
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          {errors.category && (
            <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.category}
            </p>
          )}
        </div>

        {/* Priority */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Priority</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {priorities.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setForm({ ...form, priority: p.value })}
                className={`p-4 rounded-xl border text-left transition ${
                  form.priority === p.value
                    ? p.value === 'urgent'
                      ? 'border-red-500 bg-red-50'
                      : p.value === 'high'
                      ? 'border-orange-500 bg-orange-50'
                      : p.value === 'medium'
                      ? 'border-yellow-500 bg-yellow-50'
                      : 'border-green-500 bg-green-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <span className={`text-sm font-semibold ${
                  form.priority === p.value
                    ? p.value === 'urgent'
                      ? 'text-red-700'
                      : p.value === 'high'
                      ? 'text-orange-700'
                      : p.value === 'medium'
                      ? 'text-yellow-700'
                      : 'text-green-700'
                    : 'text-slate-700'
                }`}>
                  {p.label}
                </span>
                <p className="text-xs text-slate-500 mt-1">{p.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Please describe your issue in detail. Include any error messages, steps to reproduce, and what you've already tried."
            rows={6}
            className={`w-full px-4 py-3 bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none ${
              errors.description ? 'border-red-500' : 'border-slate-200'
            }`}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.description}
            </p>
          )}
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <p className="text-sm text-slate-500 flex items-center gap-1">
            <Zap className="w-4 h-4" />
            Typical response time: within 24 hours
          </p>
          <Button
            type="submit"
            disabled={submitting}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {submitting ? (
              <>
                <span className="animate-spin mr-2">⟳</span>
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit Ticket
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Tips */}
      <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
        <h3 className="font-semibold text-amber-900 mb-2">Tips for faster resolution</h3>
        <ul className="text-sm text-amber-800 space-y-1">
          <li>• Include any error messages you're seeing</li>
          <li>• Describe the steps that led to the issue</li>
          <li>• Mention what you've already tried</li>
          <li>• If applicable, include your browser and operating system</li>
        </ul>
      </div>
    </div>
  )
}