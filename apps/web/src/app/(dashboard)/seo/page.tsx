'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Search,
  Globe,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  XCircle,
  BarChart3,
  FileText,
  Link2,
  Image,
  Smartphone,
  Clock,
  Target,
  Zap
} from 'lucide-react'

const sitePages = [
  { url: '/', title: 'Homepage', status: 'indexed', score: 92, issues: 0, lastChecked: '2 hours ago' },
  { url: '/features', title: 'Features', status: 'indexed', score: 88, issues: 1, lastChecked: '2 hours ago' },
  { url: '/pricing', title: 'Pricing', status: 'indexed', score: 95, issues: 0, lastChecked: '2 hours ago' },
  { url: '/about', title: 'About Us', status: 'indexed', score: 85, issues: 2, lastChecked: '2 hours ago' },
  { url: '/contact', title: 'Contact', status: 'indexed', score: 78, issues: 3, lastChecked: '2 hours ago' },
  { url: '/blog', title: 'Blog', status: 'indexed', score: 91, issues: 0, lastChecked: '2 hours ago' },
  { url: '/demo', title: 'Request Demo', status: 'indexed', score: 82, issues: 2, lastChecked: '2 hours ago' },
]

const keywords = [
  { keyword: 'CRM software', position: 3, volume: 12100, difficulty: 'Hard', trend: 'up', change: 2 },
  { keyword: 'sales automation', position: 7, volume: 5400, difficulty: 'Medium', trend: 'up', change: 1 },
  { keyword: 'pipeline management', position: 12, volume: 3200, difficulty: 'Medium', trend: 'stable', change: 0 },
  { keyword: 'lead tracking', position: 15, volume: 2900, difficulty: 'Easy', trend: 'up', change: 3 },
  { keyword: 'contact management', position: 8, volume: 8100, difficulty: 'Hard', trend: 'down', change: -2 },
  { keyword: 'deal tracking', position: 22, volume: 1900, difficulty: 'Easy', trend: 'up', change: 5 },
]

const seoIssues = [
  { type: 'error', message: 'Missing H1 tag on /contact page', page: '/contact', impact: 'High' },
  { type: 'error', message: 'Image without alt text on /features', page: '/features', impact: 'Medium' },
  { type: 'warning', message: 'Meta description too short on /about', page: '/about', impact: 'Low' },
  { type: 'warning', message: 'Low word count on /pricing', page: '/pricing', impact: 'Low' },
  { type: 'warning', message: 'Missing internal links on /demo', page: '/demo', impact: 'Medium' },
]

const backlinks = [
  { domain: 'techcrunch.com', authority: 92, links: 12, anchor: 'CRM solution', type: 'dofollow' },
  { domain: 'forbes.com', authority: 95, links: 3, anchor: 'sales software', type: 'dofollow' },
  { domain: 'reddit.com', authority: 88, links: 45, anchor: 'EdgeForce review', type: 'nofollow' },
  { domain: 'linkedin.com', authority: 90, links: 28, anchor: 'company page', type: 'dofollow' },
  { domain: 'g2.com', authority: 85, links: 67, anchor: 'best CRM tools', type: 'dofollow' },
]

export default function SEOPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 2000)
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'keywords', label: 'Keywords', icon: Target },
    { id: 'issues', label: 'Issues', icon: AlertCircle },
    { id: 'backlinks', label: 'Backlinks', icon: Link2 },
  ]

  const overallScore = Math.round(sitePages.reduce((sum, p) => sum + p.score, 0) / sitePages.length)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">SEO Tools</h1>
          <p className="text-slate-400">Optimize your website for search engines</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Scan Now
          </button>
          <Link
            href="/landing-pages"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition"
          >
            <Globe className="h-4 w-4" />
            Landing Pages
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-800">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Score Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Overall Score</p>
                  <p className={`text-4xl font-bold mt-1 ${overallScore >= 80 ? 'text-green-400' : overallScore >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {overallScore}
                  </p>
                </div>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  overallScore >= 80 ? 'bg-green-500/20' : overallScore >= 60 ? 'bg-yellow-500/20' : 'bg-red-500/20'
                }`}>
                  {overallScore >= 80 ? (
                    <CheckCircle2 className="w-8 h-8 text-green-400" />
                  ) : overallScore >= 60 ? (
                    <AlertCircle className="w-8 h-8 text-yellow-400" />
                  ) : (
                    <XCircle className="w-8 h-8 text-red-400" />
                  )}
                </div>
              </div>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <p className="text-sm text-slate-400">Indexed Pages</p>
              <p className="text-4xl font-bold text-white mt-1">{sitePages.filter(p => p.status === 'indexed').length}</p>
              <p className="text-sm text-green-400 mt-1">All pages indexed</p>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <p className="text-sm text-slate-400">Total Keywords</p>
              <p className="text-4xl font-bold text-white mt-1">{keywords.length}</p>
              <p className="text-sm text-green-400 mt-1">+4 this month</p>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <p className="text-sm text-slate-400">Backlinks</p>
              <p className="text-4xl font-bold text-white mt-1">{backlinks.reduce((sum, b) => sum + b.links, 0)}</p>
              <p className="text-sm text-green-400 mt-1">+15 this month</p>
            </div>
          </div>

          {/* Pages Table */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800">
              <h3 className="font-semibold">Page Analysis</h3>
            </div>
            <table className="w-full">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="text-left text-xs font-medium text-slate-400 px-4 py-3">Page</th>
                  <th className="text-left text-xs font-medium text-slate-400 px-4 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-slate-400 px-4 py-3">Score</th>
                  <th className="text-left text-xs font-medium text-slate-400 px-4 py-3">Issues</th>
                  <th className="text-left text-xs font-medium text-slate-400 px-4 py-3">Last Checked</th>
                  <th className="text-left text-xs font-medium text-slate-400 px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {sitePages.map((page) => (
                  <tr key={page.url} className="hover:bg-slate-800/30">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-white">{page.title}</p>
                        <p className="text-xs text-slate-500">{page.url}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        page.status === 'indexed' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {page.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              page.score >= 80 ? 'bg-green-500' : page.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${page.score}%` }}
                          />
                        </div>
                        <span className={`text-sm font-medium ${
                          page.score >= 80 ? 'text-green-400' : page.score >= 60 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {page.score}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {page.issues > 0 ? (
                        <span className="flex items-center gap-1 text-red-400">
                          <AlertCircle className="w-4 h-4" />
                          {page.issues} issues
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-green-400">
                          <CheckCircle2 className="w-4 h-4" />
                          Optimized
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400">{page.lastChecked}</td>
                    <td className="px-4 py-3">
                      <button className="p-2 hover:bg-slate-700 rounded-lg">
                        <ExternalLink className="w-4 h-4 text-slate-400" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Keywords Tab */}
      {activeTab === 'keywords' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <p className="text-sm text-slate-400">Avg Position</p>
              <p className="text-3xl font-bold text-white mt-1">
                {(keywords.reduce((sum, k) => sum + k.position, 0) / keywords.length).toFixed(1)}
              </p>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <p className="text-sm text-slate-400">Total Search Volume</p>
              <p className="text-3xl font-bold text-white mt-1">
                {keywords.reduce((sum, k) => sum + k.volume, 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <p className="text-sm text-slate-400">Position Changes</p>
              <p className="text-3xl font-bold text-green-400 mt-1">
                +{keywords.reduce((sum, k) => sum + Math.max(0, k.change), 0)}
              </p>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-semibold">Keyword Rankings</h3>
              <button className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm">
                + Add Keyword
              </button>
            </div>
            <table className="w-full">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="text-left text-xs font-medium text-slate-400 px-4 py-3">Keyword</th>
                  <th className="text-left text-xs font-medium text-slate-400 px-4 py-3">Position</th>
                  <th className="text-left text-xs font-medium text-slate-400 px-4 py-3">Volume</th>
                  <th className="text-left text-xs font-medium text-slate-400 px-4 py-3">Difficulty</th>
                  <th className="text-left text-xs font-medium text-slate-400 px-4 py-3">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {keywords.map((kw, i) => (
                  <tr key={i} className="hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-medium text-white">{kw.keyword}</td>
                    <td className="px-4 py-3">
                      <span className={`font-bold ${
                        kw.position <= 3 ? 'text-green-400' : kw.position <= 10 ? 'text-yellow-400' : 'text-slate-400'
                      }`}>
                        #{kw.position}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{kw.volume.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        kw.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
                        kw.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {kw.difficulty}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {kw.trend === 'up' ? (
                          <TrendingUp className="w-4 h-4 text-green-400" />
                        ) : kw.trend === 'down' ? (
                          <TrendingDown className="w-4 h-4 text-red-400" />
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                        <span className={kw.change > 0 ? 'text-green-400' : kw.change < 0 ? 'text-red-400' : 'text-slate-400'}>
                          {kw.change > 0 ? '+' : ''}{kw.change}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Issues Tab */}
      {activeTab === 'issues' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center gap-3">
                <XCircle className="w-8 h-8 text-red-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{seoIssues.filter(i => i.type === 'error').length}</p>
                  <p className="text-sm text-slate-400">Errors</p>
                </div>
              </div>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-8 h-8 text-yellow-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{seoIssues.filter(i => i.type === 'warning').length}</p>
                  <p className="text-sm text-slate-400">Warnings</p>
                </div>
              </div>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center gap-3">
                <Zap className="w-8 h-8 text-green-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{sitePages.length - seoIssues.length}</p>
                  <p className="text-sm text-slate-400">Optimized</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {seoIssues.map((issue, i) => (
              <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${
                    issue.type === 'error' ? 'bg-red-500/20' : 'bg-yellow-500/20'
                  }`}>
                    {issue.type === 'error' ? (
                      <XCircle className="w-5 h-5 text-red-400" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-yellow-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-white">{issue.message}</p>
                    <p className="text-sm text-slate-400">{issue.page}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    issue.impact === 'High' ? 'bg-red-500/20 text-red-400' :
                    issue.impact === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-slate-500/20 text-slate-400'
                  }`}>
                    {issue.impact} Impact
                  </span>
                  <button className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm">
                    Fix
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Backlinks Tab */}
      {activeTab === 'backlinks' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <p className="text-sm text-slate-400">Total Backlinks</p>
              <p className="text-3xl font-bold text-white mt-1">{backlinks.reduce((sum, b) => sum + b.links, 0)}</p>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <p className="text-sm text-slate-400">Referring Domains</p>
              <p className="text-3xl font-bold text-white mt-1">{backlinks.length}</p>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <p className="text-sm text-slate-400">Avg Authority</p>
              <p className="text-3xl font-bold text-white mt-1">
                {Math.round(backlinks.reduce((sum, b) => sum + b.authority, 0) / backlinks.length)}
              </p>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <p className="text-sm text-slate-400">DoFollow Links</p>
              <p className="text-3xl font-bold text-green-400 mt-1">
                {backlinks.filter(b => b.type === 'dofollow').reduce((sum, b) => sum + b.links, 0)}
              </p>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800">
              <h3 className="font-semibold">Top Backlinks</h3>
            </div>
            <table className="w-full">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="text-left text-xs font-medium text-slate-400 px-4 py-3">Domain</th>
                  <th className="text-left text-xs font-medium text-slate-400 px-4 py-3">Authority</th>
                  <th className="text-left text-xs font-medium text-slate-400 px-4 py-3">Links</th>
                  <th className="text-left text-xs font-medium text-slate-400 px-4 py-3">Anchor Text</th>
                  <th className="text-left text-xs font-medium text-slate-400 px-4 py-3">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {backlinks.map((link, i) => (
                  <tr key={i} className="hover:bg-slate-800/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-slate-400" />
                        <span className="font-medium text-white">{link.domain}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full"
                            style={{ width: `${link.authority}%` }}
                          />
                        </div>
                        <span className="text-sm text-slate-300">{link.authority}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-white">{link.links}</td>
                    <td className="px-4 py-3 text-slate-300">{link.anchor}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        link.type === 'dofollow' ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'
                      }`}>
                        {link.type}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}