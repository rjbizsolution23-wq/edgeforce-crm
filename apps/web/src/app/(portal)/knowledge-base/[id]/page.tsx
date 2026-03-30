'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  Clock,
  Eye,
  ChevronRight,
  Home,
  Printer,
  Share2
} from 'lucide-react'

const article = {
  id: '1',
  title: 'Getting Started Guide',
  category: 'Getting Started',
  views: 1245,
  lastUpdated: '2024-01-15',
  readTime: '5 min read',
  content: `
# Getting Started with EdgeForce CRM

Welcome to EdgeForce CRM! This guide will help you get up and running with your new CRM system.

## Step 1: Set Up Your Profile

After logging in, navigate to Settings and complete your profile:
- Add your photo
- Set your timezone
- Configure notification preferences

## Step 2: Import Your Contacts

You can import contacts from:
- CSV files
- Google Contacts
- LinkedIn connections
- Other CRM systems

Go to Contacts → Import to get started.

## Step 3: Create Your First Pipeline

Navigate to Pipeline to create your sales pipeline:
1. Click "New Pipeline"
2. Add your stages (e.g., Lead, Qualified, Proposal, Won)
3. Set up automation rules
4. Import existing deals

## Step 4: Invite Your Team

Go to Team Settings to invite your colleagues:
1. Click "Invite Team Member"
2. Enter their email address
3. Assign appropriate roles
4. Set permissions

## Need Help?

If you need assistance, our support team is here to help:
- Email: support@edgeforce-crm.com
- Submit a ticket: /portal/tickets/new
- Knowledge base: /portal/knowledge-base
  `.trim(),
  helpful: 98,
  relatedArticles: [
    { id: '2', title: 'How to reset your password' },
    { id: '3', title: 'Connecting Slack integration' },
    { id: '4', title: 'Understanding pipeline stages' },
  ],
}

export default function ArticleDetailPage({ params }: { params: { id: string } }) {
  const [feedback, setFeedback] = useState<'helpful' | 'not-helpful' | null>(null)

  const handleFeedback = async (type: 'helpful' | 'not-helpful') => {
    setFeedback(type)
    // In production, this would send feedback to the API
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-600">
        <Link href="/portal" className="hover:text-indigo-600">Dashboard</Link>
        <ChevronRight className="w-4 h-4" />
        <Link href="/portal/knowledge-base" className="hover:text-indigo-600">Knowledge Base</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-slate-900">Article</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-8">
            {/* Article Header */}
            <div className="mb-8 pb-6 border-b border-slate-200">
              <span className="px-3 py-1 bg-slate-100 text-slate-600 text-sm font-medium rounded-full">
                {article.category}
              </span>
              <h1 className="text-3xl font-bold text-slate-900 mt-4 mb-4">{article.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {article.views.toLocaleString()} views
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {article.lastUpdated}
                </span>
                <span>{article.readTime}</span>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <button className="p-2 hover:bg-slate-100 rounded-lg">
                  <Printer className="w-5 h-5 text-slate-600" />
                </button>
                <button className="p-2 hover:bg-slate-100 rounded-lg">
                  <Share2 className="w-5 h-5 text-slate-600" />
                </button>
              </div>
            </div>

            {/* Article Content */}
            <div className="prose prose-slate max-w-none">
              {article.content.split('\n').map((line, i) => {
                if (line.startsWith('## ')) {
                  return <h2 key={i} className="text-xl font-bold text-slate-900 mt-8 mb-4">{line.replace('## ', '')}</h2>
                } else if (line.startsWith('### ')) {
                  return <h3 key={i} className="text-lg font-semibold text-slate-900 mt-6 mb-3">{line.replace('### ', '')}</h3>
                } else if (line.startsWith('- ')) {
                  return <li key={i} className="ml-4 text-slate-700">{line.replace('- ', '')}</li>
                } else if (line.match(/^\d+\./)) {
                  return <li key={i} className="ml-4 text-slate-700">{line.replace(/^\d+\.\s/, '')}</li>
                } else if (line.trim()) {
                  return <p key={i} className="text-slate-700 mb-4">{line}</p>
                }
                return null
              })}
            </div>

            {/* Feedback */}
            <div className="mt-8 pt-6 border-t border-slate-200">
              <p className="text-sm text-slate-600 mb-3">Was this article helpful?</p>
              <div className="flex gap-3">
                <Button
                  variant={feedback === 'helpful' ? 'default' : 'outline'}
                  onClick={() => handleFeedback('helpful')}
                  className={feedback === 'helpful' ? 'bg-green-600 hover:bg-green-700' : ''}
                >
                  <ThumbsUp className="w-4 h-4 mr-2" />
                  Yes ({article.helpful}%)
                </Button>
                <Button
                  variant={feedback === 'not-helpful' ? 'default' : 'outline'}
                  onClick={() => handleFeedback('not-helpful')}
                >
                  <ThumbsDown className="w-4 h-4 mr-2" />
                  No
                </Button>
              </div>
              {feedback && (
                <p className="text-sm text-green-600 mt-2">
                  Thank you for your feedback!
                </p>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Link href="/portal/knowledge-base" className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
              <ArrowLeft className="w-4 h-4" />
              Back to Knowledge Base
            </Link>
            <Link
              href="/portal/tickets/new"
              className="flex items-center gap-2 text-indigo-600 font-medium hover:text-indigo-700"
            >
              Still need help?
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Need More Help?</h3>
            <p className="text-sm text-slate-600 mb-4">
              Can't find what you're looking for? Our support team is here to help.
            </p>
            <Link href="/portal/tickets/new">
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                Submit a Ticket
              </Button>
            </Link>
          </div>

          {article.relatedArticles.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Related Articles</h3>
              <div className="space-y-3">
                {article.relatedArticles.map((related) => (
                  <Link
                    key={related.id}
                    href={`/portal/knowledge-base/${related.id}`}
                    className="block p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition"
                  >
                    <p className="text-sm font-medium text-slate-900">{related.title}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}