'use client'
import { useState } from 'react'
import { FileText, Plus, Search, Edit2, Trash2, Download, Send, Copy, DollarSign, Check, Eye, MoreHorizontal } from 'lucide-react'
import { clsx } from 'clsx'

const demoProposals = [
  {
    id: '1',
    title: 'Enterprise CRM Solution',
    contact: 'John Smith',
    company: 'TechStart Inc',
    value: 25000,
    status: 'sent',
    createdAt: '2026-03-25',
    expiresAt: '2026-04-08',
    items: [
      { name: 'Enterprise License (Annual)', quantity: 1, price: 18000 },
      { name: 'Implementation & Setup', quantity: 1, price: 4000 },
      { name: 'Training (8 hours)', quantity: 1, price: 2000 },
      { name: 'Premium Support', quantity: 1, price: 1000 },
    ],
  },
  {
    id: '2',
    title: 'Professional Plan Proposal',
    contact: 'Sarah Chen',
    company: 'DataFlow Systems',
    value: 8400,
    status: 'draft',
    createdAt: '2026-03-27',
    expiresAt: null,
    items: [
      { name: 'Professional License (Annual)', quantity: 1, price: 6000 },
      { name: 'Onboarding Service', quantity: 1, price: 2400 },
    ],
  },
  {
    id: '3',
    title: 'Startup Package',
    contact: 'Mike Johnson',
    company: 'CloudFirst LLC',
    value: 3600,
    status: 'accepted',
    createdAt: '2026-03-20',
    expiresAt: '2026-04-03',
    items: [
      { name: 'Starter License (Annual)', quantity: 1, price: 2400 },
      { name: 'Basic Onboarding', quantity: 1, price: 1200 },
    ],
  },
]

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

export default function ProposalsPage() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editingProposal, setEditingProposal] = useState<any>(null)

  const filteredProposals = demoProposals.filter(proposal => {
    const matchesSearch = proposal.title.toLowerCase().includes(search.toLowerCase()) ||
      proposal.contact.toLowerCase().includes(search.toLowerCase()) ||
      proposal.company.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filter === 'all' || proposal.status === filter
    return matchesSearch && matchesFilter
  })

  const totalValue = filteredProposals.reduce((sum, p) => sum + p.value, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Proposals</h1>
          <p className="text-slate-400">
            Create and manage proposals for your deals
          </p>
        </div>
        <button
          onClick={() => { setEditingProposal(null); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition"
        >
          <Plus className="h-4 w-4" />
          Create Proposal
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
          <p className="text-sm text-slate-400">Total Proposals</p>
          <p className="text-2xl font-bold text-white mt-1">{demoProposals.length}</p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
          <p className="text-sm text-slate-400">Draft</p>
          <p className="text-2xl font-bold text-yellow-400 mt-1">{demoProposals.filter(p => p.status === 'draft').length}</p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
          <p className="text-sm text-slate-400">Sent</p>
          <p className="text-2xl font-bold text-indigo-400 mt-1">{demoProposals.filter(p => p.status === 'sent').length}</p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
          <p className="text-sm text-slate-400">Total Value</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{formatCurrency(totalValue)}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-900 rounded-lg border border-slate-800 flex-1 max-w-md">
          <Search className="h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search proposals..."
            className="bg-transparent border-0 text-sm focus:outline-none w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="px-3 py-2 bg-slate-900 rounded-lg border border-slate-800 text-sm"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Proposals List */}
      <div className="space-y-4">
        {filteredProposals.map((proposal) => (
          <div
            key={proposal.id}
            className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-indigo-500/50 transition"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-indigo-500/20 rounded-xl">
                  <FileText className="h-6 w-6 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-lg">{proposal.title}</h3>
                  <p className="text-sm text-slate-400 mt-1">{proposal.contact} • {proposal.company}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={clsx(
                      'px-2 py-0.5 rounded-full text-xs font-medium',
                      proposal.status === 'draft' ? 'bg-yellow-500/20 text-yellow-400' :
                      proposal.status === 'sent' ? 'bg-indigo-500/20 text-indigo-400' :
                      proposal.status === 'accepted' ? 'bg-green-500/20 text-green-400' :
                      'bg-red-500/20 text-red-400'
                    )}>
                      {proposal.status}
                    </span>
                    <span className="text-sm text-green-400 font-medium">{formatCurrency(proposal.value)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {proposal.status === 'draft' && (
                  <button
                    onClick={() => { setEditingProposal(proposal); setShowModal(true) }}
                    className="p-2 hover:bg-slate-800 rounded-lg transition"
                    title="Edit"
                  >
                    <Edit2 className="h-4 w-4 text-slate-400" />
                  </button>
                )}
                {proposal.status !== 'draft' && (
                  <button className="p-2 hover:bg-slate-800 rounded-lg transition" title="Preview">
                    <Eye className="h-4 w-4 text-slate-400" />
                  </button>
                )}
                <button className="p-2 hover:bg-slate-800 rounded-lg transition" title="Download PDF">
                  <Download className="h-4 w-4 text-slate-400" />
                </button>
                {proposal.status === 'draft' && (
                  <button className="p-2 hover:bg-indigo-500/20 rounded-lg transition" title="Send">
                    <Send className="h-4 w-4 text-indigo-400" />
                  </button>
                )}
                <button className="p-2 hover:bg-red-500/20 rounded-lg transition" title="Delete">
                  <Trash2 className="h-4 w-4 text-red-400" />
                </button>
              </div>
            </div>

            {/* Line Items */}
            <div className="mt-4 pt-4 border-t border-slate-800">
              <div className="grid grid-cols-4 gap-2 text-sm text-slate-400 mb-2">
                <span className="col-span-2">Item</span>
                <span className="text-right">Qty</span>
                <span className="text-right">Price</span>
              </div>
              {proposal.items.slice(0, 3).map((item, index) => (
                <div key={index} className="grid grid-cols-4 gap-2 text-sm py-1">
                  <span className="col-span-2 text-slate-300">{item.name}</span>
                  <span className="text-right text-slate-400">{item.quantity}</span>
                  <span className="text-right text-white">{formatCurrency(item.price)}</span>
                </div>
              ))}
              {proposal.items.length > 3 && (
                <p className="text-sm text-slate-500">+{proposal.items.length - 3} more items</p>
              )}
              <div className="mt-3 pt-2 border-t border-slate-700 flex justify-between">
                <span className="text-slate-400">Total</span>
                <span className="font-semibold text-white">{formatCurrency(proposal.value)}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800 text-sm text-slate-500">
              <span>Created {proposal.createdAt}</span>
              {proposal.expiresAt && (
                <span>Expires {proposal.expiresAt}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Proposal Modal */}
      {showModal && (
        <ProposalModal
          proposal={editingProposal}
          onClose={() => { setShowModal(false); setEditingProposal(null) }}
          onSuccess={() => { setShowModal(false); setEditingProposal(null) }}
        />
      )}
    </div>
  )
}

function ProposalModal({ proposal, onClose, onSuccess }: any) {
  const [formData, setFormData] = useState({
    title: proposal?.title || '',
    contactId: proposal?.contactId || '',
    validDays: proposal?.validDays || 14,
  })
  const [items, setItems] = useState<any[]>(
    proposal?.items || [{ name: '', quantity: 1, price: 0 }]
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  const addItem = () => {
    setItems([...items, { name: '', quantity: 1, price: 0 }])
  }

  const updateItem = (index: number, updates: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], ...updates }
    setItems(newItems)
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const total = items.reduce((sum, item) => sum + (item.quantity * item.price), 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    setIsSubmitting(false)
    onSuccess()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto m-4">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-xl font-semibold">{proposal ? 'Edit Proposal' : 'Create Proposal'}</h2>
          <p className="text-sm text-slate-400 mt-1">Create a professional proposal for your contact</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Proposal Title</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                placeholder="e.g., Enterprise CRM Solution"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Contact</label>
              <select
                value={formData.contactId}
                onChange={(e) => setFormData({ ...formData, contactId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">Select a contact...</option>
                <option value="1">John Smith - TechStart Inc</option>
                <option value="2">Sarah Chen - DataFlow Systems</option>
                <option value="3">Mike Johnson - CloudFirst LLC</option>
              </select>
            </div>
          </div>

          {/* Line Items */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Line Items</label>
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => updateItem(index, { name: e.target.value })}
                    className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
                    placeholder="Item name"
                  />
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, { quantity: parseInt(e.target.value) || 1 })}
                    className="w-20 px-2 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm text-center"
                    placeholder="Qty"
                  />
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.price}
                      onChange={(e) => updateItem(index, { price: parseFloat(e.target.value) || 0 })}
                      className="w-28 pl-8 pr-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm text-right"
                      placeholder="Price"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="p-2 hover:bg-red-500/20 rounded"
                  >
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 hover:border-indigo-500 hover:text-indigo-400 transition"
              >
                <Plus className="h-4 w-4" />
                Add Line Item
              </button>
            </div>
          </div>

          {/* Total */}
          <div className="p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-lg flex items-center justify-between">
            <span className="text-lg font-medium text-slate-300">Total</span>
            <span className="text-2xl font-bold text-indigo-400">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(total)}</span>
          </div>

          {/* Valid Days */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Valid for (days)</label>
            <input
              type="number"
              min="1"
              value={formData.validDays}
              onChange={(e) => setFormData({ ...formData, validDays: parseInt(e.target.value) || 14 })}
              className="w-32 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
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
              {isSubmitting ? 'Saving...' : proposal ? 'Update' : 'Create Draft'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}