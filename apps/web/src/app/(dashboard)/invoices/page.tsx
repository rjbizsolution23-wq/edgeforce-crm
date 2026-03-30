'use client'
import { useState } from 'react'
import {
  Plus, Search, MoreHorizontal, FileText, Send, Copy, Download,
  Eye, Edit2, Trash2, Check, X, Clock, DollarSign, Receipt,
  User, Building2, Mail, Phone, MapPin, Calendar, ChevronDown,
  CreditCard, Banknote, AlertCircle
} from 'lucide-react'
import { clsx } from 'clsx'

interface LineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  total: number
}

interface Invoice {
  id: string
  number: string
  quoteId?: string
  title: string
  client: string
  clientEmail: string
  clientCompany: string
  clientAddress: string
  value: number
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' | 'refunded'
  items: LineItem[]
  issueDate: string
  dueDate: string
  paidDate?: string
  notes?: string
}

const demoInvoices: Invoice[] = [
  {
    id: '1',
    number: 'INV-2026-001',
    quoteId: '1',
    title: 'Enterprise Software License',
    client: 'John Smith',
    clientEmail: 'john@techstart.io',
    clientCompany: 'TechStart Inc',
    clientAddress: '123 Tech Blvd, San Francisco, CA 94105',
    value: 75000,
    status: 'paid',
    items: [
      { id: '1', description: 'Enterprise License (10 users)', quantity: 1, unitPrice: 50000, total: 50000 },
      { id: '2', description: 'Implementation Support', quantity: 20, unitPrice: 1250, total: 25000 },
    ],
    issueDate: '2026-03-15',
    dueDate: '2026-04-15',
    paidDate: '2026-03-20',
  },
  {
    id: '2',
    number: 'INV-2026-002',
    title: 'SaaS Subscription - March',
    client: 'Sarah Chen',
    clientEmail: 'sarah@dataflow.com',
    clientCompany: 'DataFlow Systems',
    clientAddress: '456 Data Way, Austin, TX 78701',
    value: 2000,
    status: 'paid',
    items: [
      { id: '1', description: 'Pro Plan - Monthly', quantity: 1, unitPrice: 2000, total: 2000 },
    ],
    issueDate: '2026-03-01',
    dueDate: '2026-03-31',
    paidDate: '2026-03-05',
  },
  {
    id: '3',
    number: 'INV-2026-003',
    title: 'Consulting Services',
    client: 'Mike Johnson',
    clientEmail: 'mike@cloudfirst.io',
    clientCompany: 'CloudFirst LLC',
    clientAddress: '789 Cloud St, Seattle, WA 98101',
    value: 15000,
    status: 'overdue',
    items: [
      { id: '1', description: 'Technical Consulting (30 hours)', quantity: 30, unitPrice: 500, total: 15000 },
    ],
    issueDate: '2026-02-15',
    dueDate: '2026-03-15',
  },
  {
    id: '4',
    number: 'INV-2026-004',
    title: 'Support Plan - Q2',
    client: 'Emily Davis',
    clientEmail: 'emily@innovatetech.com',
    clientCompany: 'InnovateTech',
    clientAddress: '321 Innovate Dr, Boston, MA 02101',
    value: 12000,
    status: 'sent',
    items: [
      { id: '1', description: 'Premium Support - Quarterly', quantity: 1, unitPrice: 12000, total: 12000 },
    ],
    issueDate: '2026-03-25',
    dueDate: '2026-04-25',
  },
  {
    id: '5',
    number: 'INV-2026-005',
    title: 'Additional Development Hours',
    client: 'Alex Brown',
    clientEmail: 'alex@nextgen.io',
    clientCompany: 'NextGen Solutions',
    clientAddress: '654 Next Ave, Denver, CO 80201',
    value: 8500,
    status: 'draft',
    items: [
      { id: '1', description: 'Development Hours', quantity: 17, unitPrice: 500, total: 8500 },
    ],
    issueDate: '2026-03-28',
    dueDate: '2026-04-28',
  },
]

const statusColors = {
  draft: 'bg-slate-500/20 text-slate-400',
  sent: 'bg-blue-500/20 text-blue-400',
  paid: 'bg-green-500/20 text-green-400',
  overdue: 'bg-red-500/20 text-red-400',
  cancelled: 'bg-slate-500/20 text-slate-500',
  refunded: 'bg-orange-500/20 text-orange-400',
}

const statusIcon = {
  draft: FileText,
  sent: Send,
  paid: Check,
  overdue: AlertCircle,
  cancelled: X,
  refunded: CreditCard,
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>(demoInvoices)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.title.toLowerCase().includes(search.toLowerCase()) ||
      inv.client.toLowerCase().includes(search.toLowerCase()) ||
      inv.number.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalValue = filteredInvoices.reduce((sum, inv) => sum + inv.value, 0)
  const paidValue = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.value, 0)
  const overdueValue = invoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + inv.value, 0)
  const outstandingValue = totalValue - paidValue

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Invoices</h1>
          <p className="text-slate-400">Create and track invoices for your clients</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium transition">
          <Plus className="h-4 w-4" />
          New Invoice
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-slate-400 text-sm">Total Invoices</p>
          <p className="text-2xl font-bold mt-1">{invoices.length}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-slate-400 text-sm">Total Value</p>
          <p className="text-2xl font-bold mt-1">${totalValue.toLocaleString()}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-slate-400 text-sm">Paid</p>
          <p className="text-2xl font-bold mt-1 text-green-400">${paidValue.toLocaleString()}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-slate-400 text-sm">Overdue</p>
          <p className="text-2xl font-bold mt-1 text-red-400">${overdueValue.toLocaleString()}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-slate-400 text-sm">Outstanding</p>
          <p className="text-2xl font-bold mt-1 text-yellow-400">${outstandingValue.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-900 rounded-lg border border-slate-800 flex-1 max-w-md">
          <Search className="h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search invoices..."
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
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
          <option value="cancelled">Cancelled</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      {/* Invoices Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-800/50">
            <tr>
              <th className="text-left p-4 text-sm font-medium text-slate-400">Invoice #</th>
              <th className="text-left p-4 text-sm font-medium text-slate-400">Title</th>
              <th className="text-left p-4 text-sm font-medium text-slate-400">Client</th>
              <th className="text-left p-4 text-sm font-medium text-slate-400">Amount</th>
              <th className="text-left p-4 text-sm font-medium text-slate-400">Status</th>
              <th className="text-left p-4 text-sm font-medium text-slate-400">Due Date</th>
              <th className="text-right p-4 text-sm font-medium text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.map((invoice) => {
              const StatusIcon = statusIcon[invoice.status]
              return (
                <tr key={invoice.id} className="border-t border-slate-800 hover:bg-slate-800/50 transition">
                  <td className="p-4">
                    <span className="font-mono text-sm">{invoice.number}</span>
                  </td>
                  <td className="p-4 font-medium">{invoice.title}</td>
                  <td className="p-4">
                    <div>
                      <p className="font-medium">{invoice.client}</p>
                      <p className="text-sm text-slate-400">{invoice.clientCompany}</p>
                    </div>
                  </td>
                  <td className="p-4 font-bold text-green-400">${invoice.value.toLocaleString()}</td>
                  <td className="p-4">
                    <span className={clsx('px-2 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1', statusColors[invoice.status])}>
                      <StatusIcon className="h-3 w-3" />
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className={invoice.status === 'overdue' ? 'text-red-400' : 'text-slate-400'}>
                      {invoice.dueDate}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setSelectedInvoice(invoice)}
                        className="p-2 hover:bg-slate-700 rounded"
                        title="View"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="p-2 hover:bg-slate-700 rounded" title="Edit">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button className="p-2 hover:bg-slate-700 rounded" title="Download PDF">
                        <Download className="h-4 w-4" />
                      </button>
                      {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                        <button className="p-2 hover:bg-slate-700 rounded text-green-400" title="Mark as Paid">
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                      <button className="p-2 hover:bg-slate-700 rounded text-red-400" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filteredInvoices.length === 0 && (
          <div className="p-12 text-center">
            <Receipt className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No invoices found</p>
          </div>
        )}
      </div>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedInvoice(null)}>
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-sm text-slate-400">{selectedInvoice.number}</p>
                  <h2 className="text-xl font-bold mt-1">{selectedInvoice.title}</h2>
                </div>
                <button onClick={() => setSelectedInvoice(null)} className="p-2 hover:bg-slate-800 rounded">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Client & Invoice Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border border-slate-800">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Bill To
                  </h3>
                  <p className="font-medium">{selectedInvoice.client}</p>
                  <p className="text-sm text-slate-400">{selectedInvoice.clientCompany}</p>
                  <p className="text-sm text-slate-400">{selectedInvoice.clientEmail}</p>
                  <p className="text-sm text-slate-400">{selectedInvoice.clientAddress}</p>
                </div>
                <div className="p-4 rounded-lg border border-slate-800">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Receipt className="h-4 w-4" />
                    Invoice Details
                  </h3>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Issue Date:</span>
                    <span>{selectedInvoice.issueDate}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Due Date:</span>
                    <span className={selectedInvoice.status === 'overdue' ? 'text-red-400' : ''}>
                      {selectedInvoice.dueDate}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Status:</span>
                    <span className={clsx('capitalize', statusColors[selectedInvoice.status].split(' ')[1])}>
                      {selectedInvoice.status}
                    </span>
                  </div>
                  {selectedInvoice.paidDate && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Paid Date:</span>
                      <span className="text-green-400">{selectedInvoice.paidDate}</span>
                    </div>
                  )}
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
                      {selectedInvoice.items.map((item) => (
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
                        <td colSpan={3} className="p-3 text-right font-semibold">Total Due</td>
                        <td className="p-3 text-right font-bold text-green-400 text-lg">
                          ${selectedInvoice.value.toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Payment Info */}
              <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-800">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Payment Information
                </h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-400">Bank Name</p>
                    <p className="font-medium">First National Bank</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Account Number</p>
                    <p className="font-medium">•••• •••• •••• 4242</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Routing Number</p>
                    <p className="font-medium">021000021</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Reference</p>
                    <p className="font-medium">{selectedInvoice.number}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <button className="px-4 py-2 border border-slate-700 rounded-lg hover:bg-slate-800 transition">
                    <Download className="h-4 w-4 inline mr-2" />
                    Download PDF
                  </button>
                  <button className="px-4 py-2 border border-slate-700 rounded-lg hover:bg-slate-800 transition">
                    <Send className="h-4 w-4 inline mr-2" />
                    Send Invoice
                  </button>
                </div>
                {selectedInvoice.status !== 'paid' && (
                  <button className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg font-medium transition">
                    <Check className="h-4 w-4 inline mr-2" />
                    Mark as Paid
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
