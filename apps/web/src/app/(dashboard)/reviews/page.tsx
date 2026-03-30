'use client'
import { useState } from 'react'
import {
  Star, MessageSquare, ThumbsUp, ThumbsDown, Clock, CheckCircle2,
  AlertCircle, Send, Filter, MoreVertical, ExternalLink, Copy,
  BarChart3, TrendingUp, Users, Globe, Share2, ArrowUpRight, ArrowDownRight
} from 'lucide-react'
import { clsx } from 'clsx'

interface Review {
  id: string
  platform: 'google' | 'facebook' | 'yelp' | 'trustpilot'
  source: string
  rating: number
  author: string
  content: string
  response?: string
  status: 'pending' | 'responded' | 'flagged'
  sentiment: 'positive' | 'neutral' | 'negative'
  date: string
  businessName: string
}

interface ReviewRequest {
  id: string
  contactName: string
  contactEmail: string
  method: 'email' | 'sms'
  status: 'pending' | 'sent' | 'completed'
  sentAt?: string
  completedAt?: string
  rating?: number
}

const reviews: Review[] = [
  { id: '1', platform: 'google', source: 'Google Business', rating: 5, author: 'Sarah Chen', content: 'Absolutely fantastic service! The team went above and beyond to help us. Highly recommend to anyone looking for a CRM solution.', response: 'Thank you so much for your kind words, Sarah! We truly appreciate your support.', status: 'responded', sentiment: 'positive', date: '2026-03-28', businessName: 'Acme Corp' },
  { id: '2', platform: 'facebook', source: 'Facebook', rating: 4, author: 'Michael Ross', content: 'Great product overall. The automation features are incredibly useful. Only reason for 4 stars is the learning curve can be steep.', status: 'responded', sentiment: 'positive', date: '2026-03-27', businessName: 'TechStart Inc' },
  { id: '3', platform: 'yelp', source: 'Yelp', rating: 2, author: 'Emma Wilson', content: 'Had some issues with the initial setup. Customer support was helpful but response time could be faster.', response: undefined, status: 'pending', sentiment: 'negative', date: '2026-03-26', businessName: 'Global Sales Agency' },
  { id: '4', platform: 'trustpilot', source: 'Trustpilot', rating: 5, author: 'James Lee', content: 'EdgeForce has transformed how we manage our sales pipeline. The AI features are game-changing!', response: 'We\'re thrilled to hear that, James! Our team is always here to help you succeed.', status: 'responded', sentiment: 'positive', date: '2026-03-25', businessName: 'Startup XYZ' },
  { id: '5', platform: 'google', source: 'Google Business', rating: 3, author: 'Lisa Wang', content: 'Good product but some features could use improvement. The interface is clean though.', status: 'flagged', sentiment: 'neutral', date: '2026-03-24', businessName: 'Acme Corp' },
  { id: '6', platform: 'facebook', source: 'Facebook', rating: 1, author: 'Tom Harris', content: 'Very disappointing. Had constant issues and the support team was not helpful at all.', response: 'We\'re sorry to hear about your experience. Please reach out to us directly so we can make this right.', status: 'responded', sentiment: 'negative', date: '2026-03-22', businessName: 'TechStart Inc' },
]

const reviewRequests: ReviewRequest[] = [
  { id: '1', contactName: 'John Smith', contactEmail: 'john@acmecorp.com', method: 'email', status: 'completed', sentAt: '2026-03-25T10:00:00Z', completedAt: '2026-03-26T14:30:00Z', rating: 5 },
  { id: '2', contactName: 'Jane Doe', contactEmail: 'jane@company.io', method: 'sms', status: 'sent', sentAt: '2026-03-28T09:00:00Z' },
  { id: '3', contactName: 'Bob Wilson', contactEmail: 'bob@startup.co', method: 'email', status: 'pending' },
  { id: '4', contactName: 'Alice Brown', contactEmail: 'alice@enterprise.com', method: 'email', status: 'pending' },
]

const platforms = [
  { id: 'google', name: 'Google Business', icon: 'G', color: '#4285F4' },
  { id: 'facebook', name: 'Facebook', icon: 'f', color: '#1877F2' },
  { id: 'yelp', name: 'Yelp', icon: 'Y', color: '#FF1A1A' },
  { id: 'trustpilot', name: 'Trustpilot', icon: 'T', color: '#00B67B' },
]

export default function ReviewsPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'responded' | 'flagged'>('all')
  const [showResponseModal, setShowResponseModal] = useState(false)
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [responseText, setResponseText] = useState('')
  const [platformFilter, setPlatformFilter] = useState<string>('all')

  const filteredReviews = reviews.filter(r => {
    const matchesTab = activeTab === 'all' || r.status === activeTab
    const matchesPlatform = platformFilter === 'all' || r.platform === platformFilter
    return matchesTab && matchesPlatform
  })

  const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
  const positivePercentage = (reviews.filter(r => r.sentiment === 'positive').length / reviews.length) * 100
  const responseRate = (reviews.filter(r => r.status === 'responded').length / reviews.length) * 100

  const getPlatformIcon = (platform: string) => {
    const p = platforms.find(p => p.id === platform)
    return p ? { ...p } : { id: 'unknown', name: 'Unknown', icon: '?', color: '#666' }
  }

  const handleResponse = (review: Review) => {
    setSelectedReview(review)
    setResponseText('')
    setShowResponseModal(true)
  }

  const submitResponse = () => {
    setShowResponseModal(false)
    setSelectedReview(null)
    setResponseText('')
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Review Management</h1>
          <p className="text-slate-400 mt-1">Monitor and respond to reviews across all platforms</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition">
            <Share2 className="h-4 w-4" />
            Share Review Link
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition">
            <Send className="h-4 w-4" />
            Request Reviews
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Star className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{averageRating.toFixed(1)}</p>
              <p className="text-xs text-slate-400">Average Rating</p>
            </div>
          </div>
          <div className="flex items-center gap-1 mt-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={clsx('h-4 w-4', star <= Math.round(averageRating) ? 'text-amber-400 fill-amber-400' : 'text-slate-600')}
              />
            ))}
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-400">{positivePercentage.toFixed(0)}%</p>
              <p className="text-xs text-slate-400">Positive Reviews</p>
            </div>
          </div>
          <div className="flex items-center gap-1 mt-3">
            <div className="h-2 flex-1 bg-emerald-500 rounded-full" style={{ width: `${positivePercentage}%` }} />
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{responseRate.toFixed(0)}%</p>
              <p className="text-xs text-slate-400">Response Rate</p>
            </div>
          </div>
          <div className="flex items-center gap-1 mt-3">
            <div className="h-2 flex-1 bg-indigo-500 rounded-full" style={{ width: `${responseRate}%` }} />
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-red-500/20 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{reviews.filter(r => r.status === 'flagged').length}</p>
              <p className="text-xs text-slate-400">Flagged Reviews</p>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Connection Status */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="font-semibold text-white mb-4">Connected Platforms</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {platforms.map((platform) => (
            <div key={platform.id} className="bg-slate-800/50 rounded-xl p-4 flex items-center gap-3">
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: platform.color }}
              >
                {platform.icon}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{platform.name}</p>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                  <span className="text-xs text-slate-400">Connected</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="flex items-center justify-between border-b border-slate-800">
        <nav className="flex gap-6">
          {[
            { id: 'all', label: 'All Reviews', count: reviews.length },
            { id: 'pending', label: 'Pending', count: reviews.filter(r => r.status === 'pending').length },
            { id: 'responded', label: 'Responded', count: reviews.filter(r => r.status === 'responded').length },
            { id: 'flagged', label: 'Flagged', count: reviews.filter(r => r.status === 'flagged').length },
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
              {tab.label}
              <span className="ml-2 text-xs text-slate-500">({tab.count})</span>
            </button>
          ))}
        </nav>
        <select
          value={platformFilter}
          onChange={(e) => setPlatformFilter(e.target.value)}
          className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white"
        >
          <option value="all">All Platforms</option>
          {platforms.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.map((review) => {
          const platform = getPlatformIcon(review.platform)
          return (
            <div
              key={review.id}
              className={clsx(
                'bg-slate-900 border rounded-xl p-5 transition',
                review.status === 'flagged' ? 'border-red-500/50' : 'border-slate-800'
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div
                    className="h-12 w-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0"
                    style={{ backgroundColor: platform.color }}
                  >
                    {platform.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-white">{review.author}</h3>
                      <span className="text-sm text-slate-400">· {platform.name}</span>
                      <span className="text-xs text-slate-500">· {review.businessName}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={clsx('h-4 w-4', star <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-600')}
                          />
                        ))}
                      </div>
                      <span className={clsx(
                        'px-2 py-0.5 rounded text-xs font-medium',
                        review.sentiment === 'positive' ? 'bg-emerald-500/20 text-emerald-400' :
                        review.sentiment === 'negative' ? 'bg-red-500/20 text-red-400' :
                        'bg-slate-500/20 text-slate-400'
                      )}>
                        {review.sentiment}
                      </span>
                      <span className={clsx(
                        'px-2 py-0.5 rounded text-xs font-medium',
                        review.status === 'responded' ? 'bg-blue-500/20 text-blue-400' :
                        review.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-red-500/20 text-red-400'
                      )}>
                        {review.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">{review.content}</p>
                    {review.response && (
                      <div className="mt-4 pl-4 border-l-2 border-indigo-500">
                        <p className="text-xs text-slate-500 mb-1">Your response:</p>
                        <p className="text-sm text-slate-300">{review.response}</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">{new Date(review.date).toLocaleDateString()}</span>
                  {review.status !== 'responded' && (
                    <button
                      onClick={() => handleResponse(review)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-medium transition"
                    >
                      Respond
                    </button>
                  )}
                  <button className="p-2 hover:bg-slate-800 rounded-lg transition">
                    <MoreVertical className="h-4 w-4 text-slate-400" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Review Requests Section */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Review Requests</h2>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition">
            <Send className="h-4 w-4" />
            New Request
          </button>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-800/50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase">Contact</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase">Method</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase">Sent</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase">Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {reviewRequests.map((request) => (
                <tr key={request.id} className="hover:bg-slate-800/30 transition">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-medium text-slate-400">
                        {request.contactName.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-medium text-white">{request.contactName}</p>
                        <p className="text-xs text-slate-400">{request.contactEmail}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={clsx(
                      'px-2 py-1 rounded text-xs font-medium',
                      request.method === 'email' ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'
                    )}>
                      {request.method.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={clsx(
                      'px-2 py-1 rounded text-xs font-medium',
                      request.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                      request.status === 'sent' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-amber-500/20 text-amber-400'
                    )}>
                      {request.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-400">
                    {request.sentAt ? new Date(request.sentAt).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-5 py-4">
                    {request.rating ? (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                        <span className="text-white font-medium">{request.rating}</span>
                      </div>
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Response Modal */}
      {showResponseModal && selectedReview && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Respond to Review</h2>
            <div className="bg-slate-800/50 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: getPlatformIcon(selectedReview.platform).color }}>
                  {getPlatformIcon(selectedReview.platform).icon}
                </div>
                <span className="text-sm text-slate-400">{selectedReview.author}</span>
              </div>
              <p className="text-sm text-slate-300">{selectedReview.content}</p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">Your Response</label>
              <textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Write your response..."
                rows={4}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResponseModal(false)}
                className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={submitResponse}
                className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-medium transition"
              >
                Send Response
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}