'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { X, Mail, Phone, Building, MapPin, Star, Calendar, Edit2, Trash2, Loader2, Activity } from 'lucide-react'
import { clsx } from 'clsx'
import { api } from '@/lib/api'

interface ContactDetailProps {
  contact: any
  onClose: () => void
  onEdit?: () => void
}

export default function ContactDetail({ contact, onClose, onEdit }: ContactDetailProps) {
  const [activeTab, setActiveTab] = useState('info')

  const { data: activities, isLoading: loadingActivities } = useQuery({
    queryKey: ['contact-activities', contact.id],
    queryFn: async () => {
      const result = await api.request<any[]>('/api/activities?contactId=' + contact.id)
      return result.data || []
    },
    enabled: !!contact.id
  })

  const firstName = contact.first_name || contact.firstName || ''
  const lastName = contact.last_name || contact.lastName || ''
  const score = contact.lead_score || contact.leadScore || 0
  const status = contact.lead_status || contact.status || 'new'

  const scoreColor = score >= 80 ? 'text-green-400 bg-green-500/20' : score >= 60 ? 'text-yellow-400 bg-yellow-500/20' : 'text-slate-400 bg-slate-500/20'

  const tabs = [
    { id: 'info', label: 'Info', icon: Building },
    { id: 'activity', label: 'Activity', icon: Activity },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-800 rounded-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold">
                {firstName[0]}{lastName[0]}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">{firstName} {lastName}</h2>
                <p className="text-slate-400">{contact.job_title || contact.jobTitle || 'No title'}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className={clsx('flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', scoreColor)}>
                    <Star className="h-3 w-3" />
                    Score: {score}
                  </span>
                  <span className={clsx(
                    'px-2 py-1 rounded-full text-xs font-medium',
                    status === 'converted' ? 'bg-green-500/20 text-green-400' :
                    status === 'qualified' ? 'bg-indigo-500/20 text-indigo-400' :
                    status === 'contacted' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-slate-500/20 text-slate-400'
                  )}>
                    {status}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {onEdit && (
                <button onClick={onEdit} className="p-2 hover:bg-slate-800 rounded-lg transition">
                  <Edit2 className="h-4 w-4 text-slate-400" />
                </button>
              )}
              <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg transition">
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'flex items-center gap-2 px-6 py-3 text-sm font-medium transition border-b-2',
                activeTab === tab.id ? 'text-indigo-400 border-indigo-400' : 'text-slate-400 border-transparent hover:text-white'
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'info' && (
            <div className="space-y-6">
              {/* Contact Info */}
              <div>
                <h3 className="text-sm font-semibold text-slate-400 mb-3">CONTACT INFORMATION</h3>
                <div className="space-y-3">
                  {contact.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-slate-500" />
                      <a href={`mailto:${contact.email}`} className="text-indigo-400 hover:text-indigo-300">
                        {contact.email}
                      </a>
                    </div>
                  )}
                  {contact.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-slate-500" />
                      <span>{contact.phone}</span>
                    </div>
                  )}
                  {contact.company && (
                    <div className="flex items-center gap-3">
                      <Building className="h-4 w-4 text-slate-500" />
                      <span>{contact.company}</span>
                    </div>
                  )}
                  {contact.industry && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-slate-500" />
                      <span>{contact.industry}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-400 mb-2">Source</h3>
                  <p className="text-white capitalize">{contact.source || 'manual'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-400 mb-2">Created</h3>
                  <p className="text-white">
                    {contact.created_at ? new Date(contact.created_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                {contact.website && (
                  <div className="col-span-2">
                    <h3 className="text-sm font-semibold text-slate-400 mb-2">Website</h3>
                    <a href={contact.website} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300">
                      {contact.website}
                    </a>
                  </div>
                )}
              </div>

              {/* Notes */}
              {contact.notes && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-400 mb-2">Notes</h3>
                  <p className="text-slate-300 whitespace-pre-wrap">{contact.notes}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <div>
              {loadingActivities ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                </div>
              ) : activities?.length ? (
                <div className="space-y-4">
                  {activities.map((activity: any) => (
                    <div key={activity.id} className="flex items-start gap-4 p-4 rounded-lg bg-slate-800/50 border border-slate-800">
                      <div className="h-8 w-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                        <Activity className="h-4 w-4 text-indigo-400" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{activity.type?.replace('_', ' ')}</p>
                        {activity.subject && <p className="text-sm text-slate-400">{activity.subject}</p>}
                        {activity.body && <p className="text-sm text-slate-500 mt-1">{activity.body}</p>}
                        <p className="text-xs text-slate-600 mt-2">
                          {activity.created_at ? new Date(activity.created_at).toLocaleString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  No activity recorded yet
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}