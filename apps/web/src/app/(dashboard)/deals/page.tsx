'use client'
import { useState } from 'react'
import { Plus, MoreHorizontal, DollarSign, Calendar, User } from 'lucide-react'
import { clsx } from 'clsx'

interface Deal {
  id: string
  name: string
  value: number
  contact: string
  probability: number
}

interface DealsByStage {
  [key: string]: Deal[]
}

const stages = [
  { id: 'Lead', name: 'Lead', color: '#6366f1' },
  { id: 'Qualified', name: 'Qualified', color: '#8b5cf6' },
  { id: 'Proposal', name: 'Proposal', color: '#a855f7' },
  { id: 'Negotiation', name: 'Negotiation', color: '#d946ef' },
  { id: 'Won', name: 'Won', color: '#22c55e' },
  { id: 'Lost', name: 'Lost', color: '#ef4444' },
]

const demoDeals: DealsByStage = {
  Lead: [
    { id: '1', name: 'TechStart Inc', value: 25000, contact: 'John Smith', probability: 20 },
    { id: '2', name: 'DataFlow Systems', value: 45000, contact: 'Sarah Chen', probability: 15 },
  ],
  Qualified: [
    { id: '3', name: 'CloudFirst LLC', value: 80000, contact: 'Mike Johnson', probability: 40 },
  ],
  Proposal: [
    { id: '4', name: 'InnovateTech', value: 120000, contact: 'Emily Davis', probability: 60 },
    { id: '5', name: 'NextGen Solutions', value: 55000, contact: 'Alex Brown', probability: 50 },
  ],
  Negotiation: [
    { id: '6', name: 'DigitalBoost', value: 95000, contact: 'Lisa Wilson', probability: 75 },
  ],
  Won: [
    { id: '7', name: 'Acme Corp', value: 45000, contact: 'Tom Harris', probability: 100 },
  ],
  Lost: [],
}

export default function DealsPage() {
  const [deals, setDeals] = useState(demoDeals)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Deals</h1>
          <p className="text-slate-400">Drag and drop to move deals through stages</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition">
          <Plus className="h-4 w-4" />
          New Deal
        </button>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <div
            key={stage.id}
            className="flex-shrink-0 w-72 bg-slate-900/50 rounded-xl border border-slate-800"
          >
            <div className="p-4 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: stage.color }} />
                  <h3 className="font-semibold">{stage.name}</h3>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-xs text-slate-400">
                  {deals[stage.id]?.length || 0}
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                ${deals[stage.id]?.reduce((sum: number, d: Deal) => sum + d.value, 0).toLocaleString() || '0'}
              </p>
            </div>
            <div className="p-3 space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
              {deals[stage.id]?.map((deal: Deal) => (
                <div
                  key={deal.id}
                  className="p-4 rounded-lg border border-slate-800 bg-slate-900 hover:border-indigo-500/50 cursor-grab transition group"
                >
                  <div className="flex items-start justify-between">
                    <h4 className="font-medium text-sm">{deal.name}</h4>
                    <button className="p-1 hover:bg-slate-800 rounded opacity-0 group-hover:opacity-100 transition">
                      <MoreHorizontal className="h-4 w-4 text-slate-400" />
                    </button>
                  </div>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <DollarSign className="h-3 w-3" />
                      ${deal.value.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <User className="h-3 w-3" />
                      {deal.contact}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Calendar className="h-3 w-3" />
                      Close by Mar 30
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="h-1.5 flex-1 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${deal.probability}%`, backgroundColor: stage.color }}
                      />
                    </div>
                    <span className="text-xs text-slate-500 ml-2">{deal.probability}%</span>
                  </div>
                </div>
              ))}
              {deals[stage.id]?.length === 0 && (
                <div className="text-center py-8 text-slate-500 text-sm">
                  No deals in this stage
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}