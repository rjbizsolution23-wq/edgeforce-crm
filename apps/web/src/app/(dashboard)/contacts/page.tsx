'use client'
import { useState } from 'react'
import { Plus, Search, Filter, Mail, Phone, Calendar, MoreHorizontal, Star } from 'lucide-react'
import { clsx } from 'clsx'

const demoContacts = [
  { id: '1', firstName: 'John', lastName: 'Smith', email: 'john@techstart.io', company: 'TechStart Inc', phone: '+1 555-0123', leadScore: 85, status: 'qualified' },
  { id: '2', firstName: 'Sarah', lastName: 'Chen', email: 'sarah@dataflow.com', company: 'DataFlow Systems', phone: '+1 555-0124', leadScore: 72, status: 'contacted' },
  { id: '3', firstName: 'Mike', lastName: 'Johnson', email: 'mike@cloudfirst.io', company: 'CloudFirst LLC', phone: '+1 555-0125', leadScore: 91, status: 'new' },
  { id: '4', firstName: 'Emily', lastName: 'Davis', email: 'emily@innovatetech.com', company: 'InnovateTech', phone: '+1 555-0126', leadScore: 65, status: 'qualified' },
  { id: '5', firstName: 'Alex', lastName: 'Brown', email: 'alex@nextgen.io', company: 'NextGen Solutions', phone: '+1 555-0127', leadScore: 58, status: 'contacted' },
  { id: '6', firstName: 'Lisa', lastName: 'Wilson', email: 'lisa@digitalboost.co', company: 'DigitalBoost', phone: '+1 555-0128', leadScore: 78, status: 'new' },
  { id: '7', firstName: 'Tom', lastName: 'Harris', email: 'tom@acme.com', company: 'Acme Corp', phone: '+1 555-0129', leadScore: 95, status: 'converted' },
]

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? 'text-green-400 bg-green-500/20' : score >= 60 ? 'text-yellow-400 bg-yellow-500/20' : 'text-slate-400 bg-slate-500/20'
  return (
    <div className={clsx('flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', color)}>
      <Star className="h-3 w-3" />
      {score}
    </div>
  )
}

export default function ContactsPage() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const filteredContacts = demoContacts.filter(c => {
    const matchesSearch = c.firstName.toLowerCase().includes(search.toLowerCase()) ||
      c.lastName.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.company.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filter === 'all' || c.status === filter
    return matchesSearch && matchesFilter
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contacts</h1>
          <p className="text-slate-400">{filteredContacts.length} contacts in your workspace</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition">
          <Plus className="h-4 w-4" />
          Add Contact
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-900 rounded-lg border border-slate-800 flex-1 max-w-md">
          <Search className="h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search contacts..."
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
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="qualified">Qualified</option>
          <option value="converted">Converted</option>
        </select>
      </div>

      {/* Contacts Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-slate-800">
            <tr className="text-left text-sm text-slate-400">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Company</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Score</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium w-20"></th>
            </tr>
          </thead>
          <tbody>
            {filteredContacts.map((contact) => (
              <tr key={contact.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition cursor-pointer">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium">
                      {contact.firstName[0]}{contact.lastName[0]}
                    </div>
                    <div>
                      <p className="font-medium">{contact.firstName} {contact.lastName}</p>
                      <p className="text-xs text-slate-500">{contact.phone}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-slate-300">{contact.company}</td>
                <td className="px-4 py-3">
                  <a href={`mailto:${contact.email}`} className="text-sm text-indigo-400 hover:text-indigo-300">
                    {contact.email}
                  </a>
                </td>
                <td className="px-4 py-3">
                  <ScoreBadge score={contact.leadScore} />
                </td>
                <td className="px-4 py-3">
                  <span className={clsx(
                    'px-2 py-1 rounded-full text-xs font-medium',
                    contact.status === 'converted' ? 'bg-green-500/20 text-green-400' :
                    contact.status === 'qualified' ? 'bg-indigo-500/20 text-indigo-400' :
                    contact.status === 'contacted' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-slate-500/20 text-slate-400'
                  )}>
                    {contact.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button className="p-1 hover:bg-slate-800 rounded">
                    <MoreHorizontal className="h-4 w-4 text-slate-400" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}