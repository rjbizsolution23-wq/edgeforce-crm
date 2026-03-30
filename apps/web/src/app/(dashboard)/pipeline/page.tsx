'use client'
import { useState } from 'react'
import {
  Plus, MoreHorizontal, GripVertical, DollarSign,
  Users, Clock, CheckCircle, XCircle, ChevronDown, Filter,
  Search, Edit2, Trash2, Eye, ArrowUpRight, MoreVertical
} from 'lucide-react'
import { clsx } from 'clsx'

interface Deal {
  id: string
  name: string
  company: string
  value: number
  stage: string
  probability: number
  closeDate: string
  owner: string
  avatar?: string
}

const initialDeals: Deal[] = [
  { id: '1', name: 'Enterprise License', company: 'Acme Corp', value: 75000, stage: 'lead', probability: 10, closeDate: '2026-04-15', owner: 'Rick' },
  { id: '2', name: 'SaaS Subscription', company: 'TechStart', value: 24000, stage: 'lead', probability: 20, closeDate: '2026-04-20', owner: 'Sarah' },
  { id: '3', name: 'Consulting Package', company: 'BuildIt Inc', value: 45000, stage: 'qualified', probability: 40, closeDate: '2026-04-10', owner: 'Rick' },
  { id: '4', name: 'Annual Contract', company: 'DataFlow', value: 120000, stage: 'qualified', probability: 50, closeDate: '2026-04-25', owner: 'Mike' },
  { id: '5', name: 'Platform Migration', company: 'CloudNet', value: 95000, stage: 'proposal', probability: 60, closeDate: '2026-04-05', owner: 'Sarah' },
  { id: '6', name: 'Integration Services', company: 'AppWorks', value: 35000, stage: 'proposal', probability: 70, closeDate: '2026-04-12', owner: 'Rick' },
  { id: '7', name: 'Support Plan', company: 'SecureSys', value: 28000, stage: 'negotiation', probability: 80, closeDate: '2026-04-08', owner: 'Mike' },
  { id: '8', name: 'Full Suite License', company: 'MegaCorp', value: 250000, stage: 'negotiation', probability: 90, closeDate: '2026-04-01', owner: 'Rick' },
  { id: '9', name: 'Maintenance Contract', company: 'LocalBiz', value: 12000, stage: 'closed_won', probability: 100, closeDate: '2026-03-28', owner: 'Sarah' },
  { id: '10', name: 'Starter Package', company: 'NewCo', value: 8000, stage: 'closed_lost', probability: 0, closeDate: '2026-03-25', owner: 'Rick' },
]

const stages = [
  { id: 'lead', label: 'Lead', color: 'bg-slate-500' },
  { id: 'qualified', label: 'Qualified', color: 'bg-blue-500' },
  { id: 'proposal', label: 'Proposal', color: 'bg-yellow-500' },
  { id: 'negotiation', label: 'Negotiation', color: 'bg-orange-500' },
  { id: 'closed_won', label: 'Closed Won', color: 'bg-green-500' },
  { id: 'closed_lost', label: 'Closed Lost', color: 'bg-red-500' },
]

export default function PipelinePage() {
  const [deals, setDeals] = useState<Deal[]>(initialDeals)
  const [draggedDeal, setDraggedDeal] = useState<Deal | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board')

  const handleDragStart = (deal: Deal) => {
    setDraggedDeal(deal)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (stage: string) => {
    if (draggedDeal) {
      setDeals(deals.map(d => d.id === draggedDeal.id ? { ...d, stage } : d))
      setDraggedDeal(null)
    }
  }

  const getStageDeals = (stageId: string) => {
    return deals.filter(d => d.stage === stageId &&
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.company.toLowerCase().includes(searchTerm.toLowerCase()))
  }

  const getStageValue = (stageId: string) => {
    return getStageDeals(stageId).reduce((sum, d) => sum + d.value, 0)
  }

  const getStageCount = (stageId: string) => {
    return getStageDeals(stageId).length
  }

  const totalValue = deals.reduce((sum, d) => sum + d.value, 0)
  const weightedValue = deals.reduce((sum, d) => sum + (d.value * d.probability / 100), 0)
  const wonValue = deals.filter(d => d.stage === 'closed_won').reduce((sum, d) => sum + d.value, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Pipeline</h1>
          <p className="text-slate-400">Manage your sales pipeline with drag-and-drop</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium transition">
            <Plus className="h-4 w-4" />
            New Deal
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-slate-400 text-sm">Total Pipeline Value</p>
          <p className="text-2xl font-bold mt-1">${totalValue.toLocaleString()}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-slate-400 text-sm">Weighted Value</p>
          <p className="text-2xl font-bold mt-1 text-blue-400">${weightedValue.toLocaleString()}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-slate-400 text-sm">Won This Month</p>
          <p className="text-2xl font-bold mt-1 text-green-400">${wonValue.toLocaleString()}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-slate-400 text-sm">Deals in Pipeline</p>
          <p className="text-2xl font-bold mt-1">{deals.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-900 rounded-lg border border-slate-800 flex-1 max-w-md">
          <Search className="h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search deals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-0 text-sm focus:outline-none w-full"
          />
        </div>
        <div className="flex items-center gap-1 bg-slate-900 rounded-lg border border-slate-800 p-1">
          <button
            onClick={() => setViewMode('board')}
            className={clsx('px-3 py-1.5 rounded text-sm font-medium transition', viewMode === 'board' ? 'bg-indigo-600' : 'hover:bg-slate-800')}
          >
            Board
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={clsx('px-3 py-1.5 rounded text-sm font-medium transition', viewMode === 'list' ? 'bg-indigo-600' : 'hover:bg-slate-800')}
          >
            List
          </button>
        </div>
        <button className="flex items-center gap-2 px-3 py-2 bg-slate-900 rounded-lg border border-slate-800 text-sm hover:bg-slate-800 transition">
          <Filter className="h-4 w-4" />
          Filter
        </button>
      </div>

      {/* Pipeline Board */}
      {viewMode === 'board' ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stages.map((stage) => (
            <div
              key={stage.id}
              className="flex-shrink-0 w-72"
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(stage.id)}
            >
              <div className="bg-slate-900 border border-slate-800 rounded-xl">
                {/* Stage Header */}
                <div className="p-3 border-b border-slate-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={clsx('w-3 h-3 rounded-full', stage.color)} />
                      <span className="font-medium">{stage.label}</span>
                      <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                        {getStageCount(stage.id)}
                      </span>
                    </div>
                    <button className="p-1 hover:bg-slate-800 rounded">
                      <MoreHorizontal className="h-4 w-4 text-slate-400" />
                    </button>
                  </div>
                  <p className="text-lg font-bold mt-2">${getStageValue(stage.id).toLocaleString()}</p>
                </div>

                {/* Deals */}
                <div className="p-2 space-y-2 max-h-[500px] overflow-y-auto">
                  {getStageDeals(stage.id).map((deal) => (
                    <div
                      key={deal.id}
                      draggable
                      onDragStart={() => handleDragStart(deal)}
                      className="bg-slate-800 border border-slate-700 rounded-lg p-3 cursor-move hover:border-indigo-500 transition group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{deal.name}</p>
                          <p className="text-sm text-slate-400 truncate">{deal.company}</p>
                        </div>
                        <button className="p-1 opacity-0 group-hover:opacity-100 hover:bg-slate-700 rounded">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <p className="font-bold text-green-400">${deal.value.toLocaleString()}</p>
                        <span className="text-xs text-slate-500">{deal.probability}%</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                        <Clock className="h-3 w-3" />
                        {deal.closeDate}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-800/50">
              <tr>
                <th className="text-left p-4 text-sm font-medium text-slate-400">Deal Name</th>
                <th className="text-left p-4 text-sm font-medium text-slate-400">Company</th>
                <th className="text-left p-4 text-sm font-medium text-slate-400">Value</th>
                <th className="text-left p-4 text-sm font-medium text-slate-400">Stage</th>
                <th className="text-left p-4 text-sm font-medium text-slate-400">Probability</th>
                <th className="text-left p-4 text-sm font-medium text-slate-400">Close Date</th>
                <th className="text-left p-4 text-sm font-medium text-slate-400">Owner</th>
                <th className="text-right p-4 text-sm font-medium text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {deals.map((deal) => (
                <tr key={deal.id} className="border-t border-slate-800 hover:bg-slate-800/50 transition">
                  <td className="p-4 font-medium">{deal.name}</td>
                  <td className="p-4 text-slate-400">{deal.company}</td>
                  <td className="p-4 font-bold text-green-400">${deal.value.toLocaleString()}</td>
                  <td className="p-4">
                    <span className={clsx(
                      'px-2 py-1 rounded-full text-xs font-medium',
                      deal.stage === 'lead' && 'bg-slate-500/20 text-slate-400',
                      deal.stage === 'qualified' && 'bg-blue-500/20 text-blue-400',
                      deal.stage === 'proposal' && 'bg-yellow-500/20 text-yellow-400',
                      deal.stage === 'negotiation' && 'bg-orange-500/20 text-orange-400',
                      deal.stage === 'closed_won' && 'bg-green-500/20 text-green-400',
                      deal.stage === 'closed_lost' && 'bg-red-500/20 text-red-400',
                    )}>
                      {stages.find(s => s.id === deal.stage)?.label}
                    </span>
                  </td>
                  <td className="p-4 text-slate-400">{deal.probability}%</td>
                  <td className="p-4 text-slate-400">{deal.closeDate}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-indigo-600 flex items-center justify-center text-xs">
                        {deal.owner[0]}
                      </div>
                      <span className="text-sm">{deal.owner}</span>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-2 hover:bg-slate-700 rounded">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="p-2 hover:bg-slate-700 rounded">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button className="p-2 hover:bg-slate-700 rounded text-red-400">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
