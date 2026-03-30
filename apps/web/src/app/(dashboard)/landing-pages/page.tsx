'use client'
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Plus, Search, Globe, Edit2, Trash2, Copy, ExternalLink, Eye, Layout, Palette } from 'lucide-react'
import { clsx } from 'clsx'

const TEMPLATES = [
  { id: 'squeeze', name: 'Squeeze Page', description: 'Email capture with headline and CTA', color: 'from-blue-500 to-indigo-600' },
  { id: 'sales', name: 'Sales Page', description: 'Full feature showcase with pricing', color: 'from-purple-500 to-pink-600' },
  { id: 'webinar', name: 'Webinar Registration', description: 'Event signup with countdown', color: 'from-orange-500 to-red-600' },
  { id: 'blank', name: 'Blank Canvas', description: 'Start from scratch', color: 'from-slate-500 to-slate-600' },
]

export default function LandingPagesPage() {
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingPage, setEditingPage] = useState<any>(null)
  const queryClient = useQueryClient()

  // Demo landing pages data
  const demoPages = [
    {
      id: '1',
      name: 'Free CRM Trial',
      slug: 'free-crm-trial',
      template: 'squeeze',
      status: 'published',
      views: 2341,
      conversions: 156,
      lastViewed: '2026-03-28',
    },
    {
      id: '2',
      name: 'Product Demo Request',
      slug: 'demo',
      template: 'webinar',
      status: 'published',
      views: 892,
      conversions: 67,
      lastViewed: '2026-03-27',
    },
    {
      id: '3',
      name: 'Enterprise Features',
      slug: 'enterprise',
      template: 'sales',
      status: 'draft',
      views: 0,
      conversions: 0,
      lastViewed: null,
    },
  ]

  const displayPages = search ? demoPages.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.slug.toLowerCase().includes(search.toLowerCase())
  ) : demoPages

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Landing Pages</h1>
          <p className="text-slate-400">
            Create high-converting landing pages for campaigns
          </p>
        </div>
        <button
          onClick={() => { setEditingPage(null); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition"
        >
          <Plus className="h-4 w-4" />
          Create Page
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
          <p className="text-sm text-slate-400">Total Pages</p>
          <p className="text-2xl font-bold text-white mt-1">{demoPages.length}</p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
          <p className="text-sm text-slate-400">Published</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{demoPages.filter(p => p.status === 'published').length}</p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
          <p className="text-sm text-slate-400">Total Views</p>
          <p className="text-2xl font-bold text-indigo-400 mt-1">{demoPages.reduce((sum, p) => sum + p.views, 0).toLocaleString()}</p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
          <p className="text-sm text-slate-400">Conversions</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">{demoPages.reduce((sum, p) => sum + p.conversions, 0)}</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-900 rounded-lg border border-slate-800 max-w-md">
        <Search className="h-4 w-4 text-slate-500" />
        <input
          type="text"
          placeholder="Search pages..."
          className="bg-transparent border-0 text-sm focus:outline-none w-full"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Pages List */}
      <div className="space-y-4">
        {displayPages.map((page: any) => (
          <div
            key={page.id}
            className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-indigo-500/50 transition"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className={clsx(
                  'p-3 rounded-xl bg-gradient-to-br',
                  TEMPLATES.find(t => t.id === page.template)?.color || 'from-slate-500 to-slate-600'
                )}>
                  <Globe className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-lg">{page.name}</h3>
                  <p className="text-sm text-slate-400 mt-1">/{page.slug}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className={clsx(
                      'px-2 py-0.5 rounded-full text-xs font-medium',
                      page.status === 'published' ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'
                    )}>
                      {page.status}
                    </span>
                    <span className="text-xs text-slate-500">
                      Template: {TEMPLATES.find(t => t.id === page.template)?.name || page.template}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {page.status === 'published' && (
                  <a
                    href={`https://edgeforce-crm.pages.dev/lp/${page.slug}`}
                    target="_blank"
                    className="p-2 hover:bg-slate-800 rounded-lg transition"
                    title="View live"
                  >
                    <ExternalLink className="h-4 w-4 text-slate-400" />
                  </a>
                )}
                <button
                  onClick={() => { setEditingPage(page); setShowModal(true) }}
                  className="p-2 hover:bg-slate-800 rounded-lg transition"
                  title="Edit"
                >
                  <Edit2 className="h-4 w-4 text-slate-400" />
                </button>
                <button
                  className="p-2 hover:bg-slate-800 rounded-lg transition"
                  title="Duplicate"
                >
                  <Copy className="h-4 w-4 text-slate-400" />
                </button>
                <button
                  className="p-2 hover:bg-red-500/20 rounded-lg transition"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4 text-red-400" />
                </button>
              </div>
            </div>

            {/* Stats Row */}
            <div className="flex items-center gap-6 mt-4 pt-4 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-slate-500" />
                <span className="text-sm text-slate-300">{page.views.toLocaleString()} views</span>
              </div>
              <div className="flex items-center gap-2">
                <Layout className="h-4 w-4 text-slate-500" />
                <span className="text-sm text-slate-300">{page.conversions} conversions</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400">
                  {page.conversions > 0 ? `${((page.conversions / page.views) * 100).toFixed(1)}% conversion rate` : 'No conversions yet'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Landing Page Modal */}
      {showModal && (
        <LandingPageModal
          page={editingPage}
          onClose={() => { setShowModal(false); setEditingPage(null) }}
          onSuccess={() => {
            setShowModal(false)
            setEditingPage(null)
          }}
        />
      )}
    </div>
  )
}

function LandingPageModal({ page, onClose, onSuccess }: any) {
  const [step, setStep] = useState(page ? 2 : 1)
  const [formData, setFormData] = useState({
    name: page?.name || '',
    slug: page?.slug || '',
    template: page?.template || 'blank',
    status: page?.status || 'draft',
  })
  const [heroData, setHeroData] = useState({
    headline: 'Grow Your Business Faster',
    subheadline: 'Join thousands of companies using our platform to scale their operations',
    ctaText: 'Get Started Free',
    ctaLink: '/register',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSlugify = (text: string) => {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 500))
    setIsSubmitting(false)
    onSuccess()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-xl font-semibold">{page ? 'Edit Landing Page' : 'Create Landing Page'}</h2>
          <p className="text-sm text-slate-400 mt-1">
            {step === 1 ? 'Choose a template to get started' : 'Customize your landing page'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {step === 1 ? (
            /* Template Selection */
            <div className="grid grid-cols-2 gap-4">
              {TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, template: template.id })
                    setStep(2)
                  }}
                  className={clsx(
                    'p-6 rounded-xl border-2 text-left transition bg-gradient-to-br',
                    formData.template === template.id
                      ? `border-indigo-500 ${template.color}`
                      : 'border-slate-700 hover:border-slate-600'
                  )}
                >
                  <div className={clsx(
                    'w-12 h-12 rounded-lg flex items-center justify-center mb-4',
                    formData.template === template.id ? 'bg-white/20' : 'bg-slate-700'
                  )}>
                    <Layout className={clsx('h-6 w-6', formData.template === template.id ? 'text-white' : 'text-slate-300')} />
                  </div>
                  <h3 className={clsx(
                    'font-semibold mb-1',
                    formData.template === template.id ? 'text-white' : 'text-slate-200'
                  )}>
                    {template.name}
                  </h3>
                  <p className={clsx(
                    'text-sm',
                    formData.template === template.id ? 'text-white/80' : 'text-slate-400'
                  )}>
                    {template.description}
                  </p>
                </button>
              ))}
            </div>
          ) : (
            /* Page Configuration */
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Page Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                    placeholder="e.g., Free Trial Landing Page"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">URL Slug</label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500">edgeforce-crm.pages.dev/lp/</span>
                    <input
                      type="text"
                      required
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: handleSlugify(e.target.value) })}
                      className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                      placeholder="your-page-slug"
                    />
                  </div>
                </div>
              </div>

              {/* Hero Section */}
              <div className="bg-slate-800/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Layout className="h-5 w-5 text-indigo-400" />
                  <h3 className="font-medium text-white">Hero Section</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Headline</label>
                    <input
                      type="text"
                      value={heroData.headline}
                      onChange={(e) => setHeroData({ ...heroData, headline: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Subheadline</label>
                    <input
                      type="text"
                      value={heroData.subheadline}
                      onChange={(e) => setHeroData({ ...heroData, subheadline: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">CTA Button Text</label>
                      <input
                        type="text"
                        value={heroData.ctaText}
                        onChange={(e) => setHeroData({ ...heroData, ctaText: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">CTA Button Link</label>
                      <input
                        type="text"
                        value={heroData.ctaLink}
                        onChange={(e) => setHeroData({ ...heroData, ctaLink: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Publish Status</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, status: 'draft' })}
                    className={clsx(
                      'px-4 py-2 rounded-lg transition',
                      formData.status === 'draft'
                        ? 'bg-slate-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    )}
                  >
                    Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, status: 'published' })}
                    className={clsx(
                      'px-4 py-2 rounded-lg transition',
                      formData.status === 'published'
                        ? 'bg-green-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    )}
                  >
                    Published
                  </button>
                </div>
              </div>

              {/* Preview URL */}
              {formData.slug && (
                <div className="p-3 bg-slate-800/50 rounded-lg flex items-center justify-between">
                  <span className="text-sm text-slate-400">Live URL:</span>
                  <span className="text-sm text-indigo-400 font-mono">
                    edgeforce-crm.pages.dev/lp/{formData.slug}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between pt-6 border-t border-slate-800 mt-6">
            <div>
              {step === 2 && (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition"
                >
                  Back
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition"
              >
                Cancel
              </button>
              {step === 2 && (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : page ? 'Update' : 'Create'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}