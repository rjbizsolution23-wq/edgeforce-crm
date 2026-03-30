'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import {
  Search,
  BookOpen,
  ArrowRight,
  Clock,
  ThumbsUp,
  Eye,
  FileText,
  ChevronRight,
  Home
} from 'lucide-react'

const categories = [
  { id: 'getting-started', name: 'Getting Started', icon: BookOpen, articleCount: 12 },
  { id: 'account', name: 'Account & Billing', icon: FileText, articleCount: 8 },
  { id: 'features', name: 'Features & How-To', icon: Eye, articleCount: 24 },
  { id: 'troubleshooting', name: 'Troubleshooting', icon: Clock, articleCount: 15 },
  { id: 'integrations', name: 'Integrations', icon: ArrowRight, articleCount: 10 },
]

const featuredArticles = [
  { id: '1', title: 'Getting Started Guide', category: 'Getting Started', views: 1245, helpful: 98, excerpt: 'Learn the basics of setting up your account and navigating the platform.' },
  { id: '2', title: 'How to reset your password', category: 'Account & Billing', views: 892, helpful: 99, excerpt: 'Step-by-step instructions for resetting your account password.' },
  { id: '3', title: 'Connecting Slack integration', category: 'Integrations', views: 756, helpful: 95, excerpt: 'Set up Slack notifications and team notifications in minutes.' },
  { id: '4', title: 'Understanding pipeline stages', category: 'Features & How-To', views: 634, helpful: 97, excerpt: 'Learn how to customize and optimize your sales pipeline.' },
  { id: '5', title: 'Email template basics', category: 'Features & How-To', views: 521, helpful: 96, excerpt: 'Create professional email templates that convert.' },
  { id: '6', title: 'Exporting your data', category: 'Account & Billing', views: 445, helpful: 94, excerpt: 'How to export contacts, deals, and reports in various formats.' },
]

export default function KnowledgeBasePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const filteredArticles = searchQuery
    ? featuredArticles.filter(a =>
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : featuredArticles

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-600">
        <Link href="/portal" className="hover:text-indigo-600">Dashboard</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-slate-900">Knowledge Base</span>
      </nav>

      {/* Header */}
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-8 h-8 text-indigo-600" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">How can we help?</h1>
        <p className="text-slate-600 mb-6">Search our knowledge base for answers</p>
        <div className="max-w-xl mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search articles..."
            className="pl-12 h-12 bg-white border-slate-200 text-lg"
          />
        </div>
      </div>

      {/* Categories */}
      {!searchQuery && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map((cat) => {
            const Icon = cat.icon
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className="bg-white rounded-xl border border-slate-200 p-4 hover:border-indigo-300 hover:shadow-md transition"
              >
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-slate-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">{cat.name}</h3>
                <p className="text-sm text-slate-500">{cat.articleCount} articles</p>
              </button>
            )
          })}
        </div>
      )}

      {/* Articles */}
      <div>
        {searchQuery ? (
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            {filteredArticles.length} result{filteredArticles.length !== 1 ? 's' : ''} for "{searchQuery}"
          </h2>
        ) : (
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Popular Articles</h2>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredArticles.map((article) => (
            <Link
              key={article.id}
              href={`/portal/knowledge-base/${article.id}`}
              className="bg-white rounded-xl border border-slate-200 p-6 hover:border-indigo-300 hover:shadow-md transition"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded">
                  {article.category}
                </span>
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">{article.title}</h3>
              <p className="text-sm text-slate-600 mb-4">{article.excerpt}</p>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {article.views} views
                </span>
                <span className="flex items-center gap-1">
                  <ThumbsUp className="w-4 h-4" />
                  {article.helpful}% helpful
                </span>
              </div>
            </Link>
          ))}
        </div>

        {filteredArticles.length === 0 && searchQuery && (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No articles found</h3>
            <p className="text-slate-600 mb-4">Try adjusting your search terms</p>
            <button
              onClick={() => setSearchQuery('')}
              className="text-indigo-600 font-medium hover:text-indigo-700"
            >
              Clear search
            </button>
          </div>
        )}
      </div>

      {/* Contact Support */}
      {!searchQuery && (
        <div className="bg-indigo-50 rounded-xl border border-indigo-200 p-6 text-center">
          <h3 className="font-semibold text-indigo-900 mb-2">Still need help?</h3>
          <p className="text-indigo-700 mb-4">Can't find what you're looking for? Our support team is here to help.</p>
          <Link
            href="/portal/tickets/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition"
          >
            <FileText className="w-4 h-4" />
            Submit a Ticket
          </Link>
        </div>
      )}
    </div>
  )
}