'use client'
import { useState } from 'react'
import {
  Plus, Search, MoreHorizontal, FileText, Send, Copy, Download,
  Eye, Edit2, Trash2, Check, X, Clock, DollarSign, Package,
  User, Building2, Mail, Phone, MapPin, Calendar, ChevronDown
} from 'lucide-react'
import { clsx } from 'clsx'

interface LineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  total: number
}

interface Quote {
  id: string
  number: string
  title: string
  client: string
  clientEmail: string
  clientCompany: string
  value: number
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired'
  items: LineItem[]
  validUntil: string
  createdAt: string
  notes?: string
}

const demoQuotes: Quote[] = [
  {
    id: '1',
    number: 'QT-2026-001',
    title: 'Enterprise Software License',
    client: 'John Smith',
    clientEmail: 'john@techstart.io',
    clientCompany: 'TechStart Inc',
    value: 75000,
    status: 'accepted',
    items: [
      { id: '1', description: 'Enterprise License (10 users)', quantity: 1, unitPrice: 50000, total: 50000 },
      { id: '2', description: 'Implementation Support', quantity: 20, unitPrice: 1250, total: 25000 },
    ],
    validUntil: '2026-04-15',
    createdAt: '2026-03-15',
  },
  {
    id: '2',
    number: 'QT-2026-002',
    title: 'SaaS Annual Subscription',
    client: 'Sarah Chen',
    clientEmail: 'sarah@dataflow.com',
    clientCompany: 'DataFlow Systems',
    value: 24000,
    status: 'sent',
    items: [
      { id: '1', description: 'Pro Plan - Annual', quantity: 1, unitPrice: 24000, total: 24000 },
    ],
    validUntil: '2026-04-20',
    createdAt: '2026-03-20',
  },
  {
    id: '3',
    number: 'QT-2026-003',
    title: 'Consulting Package',
    client: 'Mike Johnson',
    clientEmail: 'mike@cloudfirst.io',
    clientCompany: 'CloudFirst LLC',
    value: 45000,
    status: 'viewed',
    items: [
      { id: '1', description: 'Technical Consulting (100 hours)', quantity: 100, unitPrice: 450, total: 45000 },
    ],
    validUntil: '2026-04-25',
    createdAt: '2026-03-22',
  },
  {
    id: '4',
    number: 'QT-2026-004',
    title: 'Platform Migration',
    client: 'Emily Davis',
    clientEmail: 'emily@innovatetech.com',
    clientCompany: 'InnovateTech',
    value: 95000,
    status: 'draft',
    items: [
      { id: '1', description: 'Migration Services', quantity: 1, unitPrice: 55000, total: 55000 },
      { id: '2', description: 'Training (5 days)', quantity: 5, unitPrice: 8000, total: 40000 },
    ],
    validUntil: '2026-05-01',
    createdAt: '2026-03-25',
  },
  {
    id: '5',
    number: 'QT-2026-005',
    title: 'Support Plan Renewal',
    client: 'Alex Brown',
    clientEmail: 'alex@nextgen.io',
    clientCompany: 'NextGen Solutions',
    value: 12000,
    status: 'expired',
    items: [
      { id: '1', description: 'Premium Support - Annual', quantity: 1, unitPrice: 12000, total: 12000 },
    ],
    validUntil: '2026-03-20',
    createdAt: '2026-02-20',
  },
]

const statusColors = {
  draft: 'bg-slate-500/20 text-slate-400',
  sent: 'bg-blue-500/20 text-blue-400',
  viewed: 'bg-yellow-500/20 text-yellow-400',
  accepted: 'bg-green-500/20 text-green-400',
  rejected: 'bg-red-500/20 text-red-400',
  expired: 'bg-orange-500/20 text-orange-400',
}

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>(demoQuotes)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)

  const filteredQuotes = quotes.filter(q => {
    const matchesSearch = q.title.toLowerCase().includes(search.toLowerCase()) ||
      q.client.toLowerCase().includes(search.toLowerCase()) ||
      q.number.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || q.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalValue = filteredQuotes.reduce((sum, q) => sum + q.value, 0)
  const acceptedValue = quotes.filter(q => q.status === 'accepted').reduce((sum, q) => sum + q.value, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Quotes</h1>
          <p className="text-slate-400">Create and manage price quotes for your clients</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium transition">
          <Plus className="h-4 w-4" />
          New Quote
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-slate-400 text-sm">Total Quotes</p>
          <p className="text-2xl font-bold mt-1">{quotes.length}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-slate-400 text-sm">Total Value</p>
          <p className="text-2xl font-bold mt-1">${totalValue.toLocaleString()}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-slate-400 text-sm">Accepted</p>
          <p className="text-2xl font-bold mt-1 text-green-400">${acceptedValue.toLocaleString()}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-slate-400 text-sm">Pending</p>
          <p className="text-2xl font-bold mt-1 text-yellow-400">
            ${(totalValue - acceptedValue).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-900 rounded-lg border border-slate-800 flex-1 max-w-md">
          <Search className="h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search quotes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-0 text-sm focus:outline-none w-full"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="viewed">Viewed</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {/* Quotes Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-800/50">
            <tr>
              <th className="text-left p-4 text-sm font-medium text-slate-400">Quote #</th>
              <th className="text-left p-4 text-sm font-medium text-slate-400">Title</th>
              <th className="text-left p-4 text-sm font-medium text-slate-400">Client</th>
              <th className="text-left p-4 text-sm font-medium text-slate-400">Value</th>
              <th className="text-left p-4 text-sm font-medium text-slate-400">Status</th>
              <th className="text-left p-4 text-sm font-medium text-slate-400">Valid Until</th>
              <th className="text-right p-4 text-sm font-medium text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredQuotes.map((quote) => (
              <tr key={quote.id} className="border-t border-slate-800 hover:bg-slate-800/50 transition">
                <td className="p-4">
                  <span className="font-mono text-sm">{quote.number}</span>
                </td>
                <td className="p-4 font-medium">{quote.title}</td>
                <td className="p-4">
                  <div>
                    <p className="font-medium">{quote.client}</p>
                    <p className="text-sm text-slate-400">{quote.clientCompany}</p>
                  </div>
                </td>
                <td className="p-4 font-bold text-green-400">${quote.value.toLocaleString()}</td>
                <td className="p-4">
                  <span className={clsx('px-2 py-1 rounded-full text-xs font-medium', statusColors[quote.status])}>
                    {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                  </span>
                </td>
                <td className="p-4 text-slate-400">{quote.validUntil}</td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => setSelectedQuote(quote)}
                      className="p-2 hover:bg-slate-700 rounded"
                      title="View"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="p-2 hover:bg-slate-700 rounded" title="Edit">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button className="p-2 hover:bg-slate-700 rounded" title="Duplicate">
                      <Copy className="h-4 w-4" />
                    </button>
                    <button className="p-2 hover:bg-slate-700 rounded" title="Download PDF">
                      <Download className="h-4 w-4" />
                    </button>
                    {quote.status === 'draft' && (
                      <button className="p-2 hover:bg-slate-700 rounded text-blue-400" title="Send">
                        <Send className="h-4 w-4" />
                      </button>
                    )}
                    <button className="p-2 hover:bg-slate-700 rounded text-red-400" title="Delete">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredQuotes.length === 0 && (
          <div className="p-12 text-center">
            <FileText className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No quotes found</p>
          </div>
        )}
      </div>

      {/* Quote Detail Modal */}
      {selectedQuote && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedQuote(null)}>
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-sm text-slate-400">{selectedQuote.number}</p>
                  <h2 className="text-xl font-bold mt-1">{selectedQuote.title}</h2>
                </div>
                <button onClick={() => setSelectedQuote(null)} className="p-2 hover:bg-slate-800 rounded">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Client Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border border-slate-800">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Bill To
                  </h3>
                  <p className="font-medium">{selectedQuote.client}</p>
                  <p className="text-sm text-slate-400">{selectedQuote.clientCompany}</p>
                  <p className="text-sm text-slate-400">{selectedQuote.clientEmail}</p>
                </div>
                <div className="p-4 rounded-lg border border-slate-800">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Quote Details
                  </h3>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Created:</span>
                    <span>{selectedQuote.createdAt}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Valid Until:</span>
                    <span>{selectedQuote.validUntil}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Status:</span>
                    <span className={clsx('capitalize', statusColors[selectedQuote.status].split(' ')[1])}>
                      {selectedQuote.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Line Items */}
              <div>
                <h3 className="font-semibold mb-3">Line Items</h3>
                <div className="border border-slate-800 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-800/50">
                      <tr>
                        <th className="text-left p-3 text-sm font-medium text-slate-400">Description</th>
                        <th className="text-right p-3 text-sm font-medium text-slate-400">Qty</th>
                        <th className="text-right p-3 text-sm font-medium text-slate-400">Unit Price</th>
                        <th className="text-right p-3 text-sm font-medium text-slate-400">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedQuote.items.map((item) => (
                        <tr key={item.id} className="border-t border-slate-800">
                          <td className="p-3">{item.description}</td>
                          <td className="p-3 text-right">{item.quantity}</td>
                          <td className="p-3 text-right">${item.unitPrice.toLocaleString()}</td>
                          <td className="p-3 text-right font-medium">${item.total.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-800/30">
                      <tr>
                        <td colSpan={3} className="p-3 text-right font-semibold">Total</td>
                        <td className="p-3 text-right font-bold text-green-400 text-lg">
                          ${selectedQuote.value.toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                <button className="px-4 py-2 border border-slate-700 rounded-lg hover:bg-slate-800 transition">
                  <Download className="h-4 w-4 inline mr-2" />
                  Download PDF
                </button>
                {selectedQuote.status === 'draft' && (
                  <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium transition">
                    <Send className="h-4 w-4 inline mr-2" />
                    Send to Client
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
