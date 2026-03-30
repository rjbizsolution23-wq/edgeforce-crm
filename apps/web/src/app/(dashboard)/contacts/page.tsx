'use client'
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Plus, Search, MoreHorizontal, Star } from 'lucide-react'
import { clsx } from 'clsx'
import CreateContactModal from '@/components/modals/CreateContactModal'
import ContactDetail from '@/components/contacts/ContactDetail'

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? 'text-green-400 bg-green-500/20' : score >= 60 ? 'text-yellow-400 bg-yellow-500/20' : 'text-slate-400 bg-slate-500/20'
  return (
    <div className={clsx('flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', color)}>
      <Star className="h-3 w-3" />
      {score || 0}
    </div>
  )
}

export default function ContactsPage() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [selectedContact, setSelectedContact] = useState<any>(null)
  const queryClient = useQueryClient()

  const { data: contactsData, isLoading } = useQuery({
    queryKey: ['contacts', search, filter],
    queryFn: async () => {
      const result = await api.getContacts({
        search: search || undefined,
        status: filter !== 'all' ? filter : undefined,
      })
      return result.data || []
    },
    staleTime: 60000,
  })

  const contacts = contactsData || []

  // Demo fallback data
  const demoContacts = [
    { id: '1', first_name: 'John', last_name: 'Smith', email: 'john@techstart.io', company: 'TechStart Inc', phone: '+1 555-0123', lead_score: 85, status: 'qualified' },
    { id: '2', first_name: 'Sarah', last_name: 'Chen', email: 'sarah@dataflow.com', company: 'DataFlow Systems', phone: '+1 555-0124', lead_score: 72, status: 'contacted' },
    { id: '3', first_name: 'Mike', last_name: 'Johnson', email: 'mike@cloudfirst.io', company: 'CloudFirst LLC', phone: '+1 555-0125', lead_score: 91, status: 'new' },
    { id: '4', first_name: 'Emily', last_name: 'Davis', email: 'emily@innovatetech.com', company: 'InnovateTech', phone: '+1 555-0126', lead_score: 65, status: 'qualified' },
    { id: '5', first_name: 'Alex', last_name: 'Brown', email: 'alex@nextgen.io', company: 'NextGen Solutions', phone: '+1 555-0127', lead_score: 58, status: 'contacted' },
    { id: '6', first_name: 'Lisa', last_name: 'Wilson', email: 'lisa@digitalboost.co', company: 'DigitalBoost', phone: '+1 555-0128', lead_score: 78, status: 'new' },
    { id: '7', first_name: 'Tom', last_name: 'Harris', email: 'tom@acme.com', company: 'Acme Corp', phone: '+1 555-0129', lead_score: 95, status: 'converted' },
  ]

  const displayContacts = contacts.length > 0 ? contacts : demoContacts

  const filteredContacts = displayContacts.filter((c: any) => {
    const firstName = c.first_name || c.firstName || ''
    const lastName = c.last_name || c.lastName || ''
    const email = c.email || ''
    const company = c.company || ''

    const matchesSearch = firstName.toLowerCase().includes(search.toLowerCase()) ||
      lastName.toLowerCase().includes(search.toLowerCase()) ||
      email.toLowerCase().includes(search.toLowerCase()) ||
      company.toLowerCase().includes(search.toLowerCase())

    const status = c.lead_status || c.status || 'new'
    const matchesFilter = filter === 'all' || status === filter

    return matchesSearch && matchesFilter
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contacts</h1>
          <p className="text-slate-400">
            {isLoading ? 'Loading...' : `${filteredContacts.length} contacts in your workspace`}
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition">
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
            {filteredContacts.map((contact: any) => {
              const firstName = contact.first_name || contact.firstName || ''
              const lastName = contact.last_name || contact.lastName || ''
              const score = contact.lead_score || contact.leadScore || 0
              const status = contact.lead_status || contact.status || 'new'

              return (
                <tr key={contact.id} onClick={() => setSelectedContact(contact)} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition cursor-pointer">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium">
                        {firstName[0]}{lastName[0]}
                      </div>
                      <div>
                        <p className="font-medium">{firstName} {lastName}</p>
                        <p className="text-xs text-slate-500">{contact.phone || 'No phone'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-300">{contact.company || '-'}</td>
                  <td className="px-4 py-3">
                    <a href={`mailto:${contact.email}`} className="text-sm text-indigo-400 hover:text-indigo-300">
                      {contact.email || '-'}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <ScoreBadge score={score} />
                  </td>
                  <td className="px-4 py-3">
                    <span className={clsx(
                      'px-2 py-1 rounded-full text-xs font-medium',
                      status === 'converted' ? 'bg-green-500/20 text-green-400' :
                      status === 'qualified' ? 'bg-indigo-500/20 text-indigo-400' :
                      status === 'contacted' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-slate-500/20 text-slate-400'
                    )}>
                      {status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button className="p-1 hover:bg-slate-800 rounded">
                      <MoreHorizontal className="h-4 w-4 text-slate-400" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <CreateContactModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['contacts'] })}
      />

      {selectedContact && (
        <ContactDetail
          contact={selectedContact}
          onClose={() => setSelectedContact(null)}
        />
      )}
    </div>
  )
}