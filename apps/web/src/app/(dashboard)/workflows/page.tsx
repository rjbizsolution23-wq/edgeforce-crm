'use client'
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Plus, Search, Zap, Play, Pause, Trash2, Edit2, GitBranch, Clock, Mail, User, CheckCircle } from 'lucide-react'
import { clsx } from 'clsx'

const TRIGGERS = [
  { id: 'contact_created', label: 'Contact Created', icon: 'User' },
  { id: 'deal_created', label: 'Deal Created', icon: 'Zap' },
  { id: 'deal_stage_changed', label: 'Stage Changed', icon: 'GitBranch' },
  { id: 'task_completed', label: 'Task Completed', icon: 'CheckCircle' },
  { id: 'email_opened', label: 'Email Opened', icon: 'Mail' },
  { id: 'form_submitted', label: 'Form Submitted', icon: 'CheckCircle' },
]

const ACTIONS = [
  { id: 'send_email', label: 'Send Email', icon: 'Mail' },
  { id: 'create_task', label: 'Create Task', icon: 'CheckCircle' },
  { id: 'update_contact', label: 'Update Contact', icon: 'User' },
  { id: 'add_tag', label: 'Add Tag', icon: 'CheckCircle' },
  { id: 'notify_owner', label: 'Notify Owner', icon: 'Zap' },
  { id: 'delay', label: 'Wait/Delay', icon: 'Clock' },
]

export default function WorkflowBuilderPage() {
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingWorkflow, setEditingWorkflow] = useState<any>(null)
  const queryClient = useQueryClient()

  const { data: workflows, isLoading } = useQuery({
    queryKey: ['automations'],
    queryFn: async () => {
      const result = await api.getAutomations()
      return result.data || []
    },
  })

  const handleDelete = async (id: string) => {
    if (confirm('Delete this workflow?')) {
      await api.deleteAutomation(id)
      queryClient.invalidateQueries({ queryKey: ['automations'] })
    }
  }

  const getTriggerIcon = (trigger: string) => {
    const t = TRIGGERS.find(t => t.id === trigger)
    if (!t) return <Zap className="h-4 w-4" />
    switch (t.icon) {
      case 'User': return <User className="h-4 w-4" />
      case 'Mail': return <Mail className="h-4 w-4" />
      case 'Clock': return <Clock className="h-4 w-4" />
      case 'CheckCircle': return <CheckCircle className="h-4 w-4" />
      default: return <Zap className="h-4 w-4" />
    }
  }

  const filteredWorkflows = (workflows || []).filter((w: any) =>
    w.name?.toLowerCase().includes(search.toLowerCase())
  )

  const demoWorkflows = [
    {
      id: '1',
      name: 'New Lead Welcome',
      trigger: 'contact_created',
      is_active: true,
      executions: 156,
      actions: [
        { type: 'send_email', config: { template: 'welcome' } },
        { type: 'delay', config: { days: 1 } },
        { type: 'create_task', config: { title: 'Follow up with new lead' } },
      ],
    },
    {
      id: '2',
      name: 'Deal Won Celebration',
      trigger: 'deal_stage_changed',
      is_active: true,
      executions: 89,
      actions: [
        { type: 'notify_owner', config: { message: 'Deal won!' } },
        { type: 'add_tag', config: { tag: 'won' } },
      ],
    },
    {
      id: '3',
      name: 'Stale Deal Follow-up',
      trigger: 'deal_created',
      is_active: false,
      executions: 42,
      actions: [
        { type: 'delay', config: { days: 7 } },
        { type: 'create_task', config: { title: 'Check on deal status' } },
        { type: 'send_email', config: { template: 'followup' } },
      ],
    },
  ]

  const displayWorkflows = filteredWorkflows.length > 0 ? filteredWorkflows : demoWorkflows

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Workflow Builder</h1>
          <p className="text-slate-400">
            Automate your sales process with visual workflows
          </p>
        </div>
        <button
          onClick={() => { setEditingWorkflow(null); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition"
        >
          <Plus className="h-4 w-4" />
          Create Workflow
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-900 rounded-lg border border-slate-800 max-w-md">
        <Search className="h-4 w-4 text-slate-500" />
        <input
          type="text"
          placeholder="Search workflows..."
          className="bg-transparent border-0 text-sm focus:outline-none w-full"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Workflows List */}
      <div className="space-y-4">
        {displayWorkflows.map((workflow: any) => {
          const actions = typeof workflow.actions === 'string' ? JSON.parse(workflow.actions) : workflow.actions || []
          const triggerLabel = TRIGGERS.find(t => t.id === workflow.trigger)?.label || workflow.trigger

          return (
            <div
              key={workflow.id}
              className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-indigo-500/50 transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={clsx(
                    'p-2 rounded-lg',
                    workflow.is_active ? 'bg-green-500/20' : 'bg-slate-500/20'
                  )}>
                    <Zap className={clsx('h-5 w-5', workflow.is_active ? 'text-green-400' : 'text-slate-400')} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{workflow.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-400">
                        {triggerLabel}
                      </span>
                      <span className="text-xs text-slate-400">
                        {workflow.executions || 0} executions
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className={clsx(
                      'p-2 rounded-lg transition',
                      workflow.is_active ? 'hover:bg-yellow-500/20' : 'hover:bg-green-500/20'
                    )}
                    title={workflow.is_active ? 'Pause' : 'Activate'}
                  >
                    {workflow.is_active ? (
                      <Pause className="h-4 w-4 text-yellow-400" />
                    ) : (
                      <Play className="h-4 w-4 text-green-400" />
                    )}
                  </button>
                  <button
                    onClick={() => { setEditingWorkflow(workflow); setShowModal(true) }}
                    className="p-2 hover:bg-slate-800 rounded-lg transition"
                  >
                    <Edit2 className="h-4 w-4 text-slate-400" />
                  </button>
                  <button
                    onClick={() => handleDelete(workflow.id)}
                    className="p-2 hover:bg-red-500/20 rounded-lg transition"
                  >
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </button>
                </div>
              </div>

              {/* Visual Workflow */}
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                <div className="flex items-center gap-1 px-4 py-2 bg-indigo-500/20 rounded-lg border border-indigo-500/30">
                  {getTriggerIcon(workflow.trigger)}
                  <span className="text-sm text-indigo-400 font-medium whitespace-nowrap">{triggerLabel}</span>
                </div>

                {actions.map((action: any, index: number) => {
                  const actionLabel = ACTIONS.find(a => a.id === action.type)?.label || action.type
                  return (
                    <div key={index} className="flex items-center gap-2">
                      <div className="flex items-center gap-1 px-3 py-2 bg-slate-700/50 rounded-lg border border-slate-600/30">
                        {action.type === 'delay' ? (
                          <Clock className="h-4 w-4 text-yellow-400" />
                        ) : action.type === 'send_email' ? (
                          <Mail className="h-4 w-4 text-green-400" />
                        ) : action.type === 'create_task' ? (
                          <CheckCircle className="h-4 w-4 text-blue-400" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-slate-400" />
                        )}
                        <span className="text-sm text-slate-300 whitespace-nowrap">{actionLabel}</span>
                      </div>
                      {index < actions.length - 1 && (
                        <>
                          <span className="text-slate-500">→</span>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Workflow Modal */}
      {showModal && (
        <WorkflowModal
          workflow={editingWorkflow}
          onClose={() => { setShowModal(false); setEditingWorkflow(null) }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['automations'] })
            setShowModal(false)
            setEditingWorkflow(null)
          }}
        />
      )}
    </div>
  )
}

function WorkflowModal({ workflow, onClose, onSuccess }: any) {
  const [formData, setFormData] = useState({
    name: workflow?.name || '',
    trigger: workflow?.trigger || 'contact_created',
    triggerConfig: {},
  })
  const [actions, setActions] = useState<any[]>(
    workflow?.actions ? (typeof workflow.actions === 'string' ? JSON.parse(workflow.actions) : workflow.actions) : []
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  const addAction = (actionType: string) => {
    setActions([...actions, {
      type: actionType,
      config: actionType === 'delay' ? { days: 1 } : {},
    }])
  }

  const removeAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const payload = {
        name: formData.name,
        trigger: formData.trigger,
        triggerConfig: formData.triggerConfig,
        actions,
        conditions: [],
      }
      if (workflow?.id) {
        await api.updateAutomation(workflow.id, payload)
      } else {
        await api.createAutomation(payload)
      }
      onSuccess()
    } catch (error) {
      console.error('Failed to save workflow:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto m-4">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-xl font-semibold">{workflow ? 'Edit Workflow' : 'Create Workflow'}</h2>
          <p className="text-sm text-slate-400 mt-1">Build automated workflows with triggers and actions</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Workflow Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Workflow Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              placeholder="e.g., New Lead Welcome Sequence"
            />
          </div>

          {/* Trigger */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">When this happens...</label>
            <div className="grid grid-cols-3 gap-2">
              {TRIGGERS.map((trigger) => (
                <button
                  key={trigger.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, trigger: trigger.id })}
                  className={clsx(
                    'p-3 rounded-lg border text-left transition',
                    formData.trigger === trigger.id
                      ? 'border-indigo-500 bg-indigo-500/20 text-indigo-400'
                      : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600'
                  )}
                >
                  <div className="flex items-center gap-2">
                    {getTriggerIcon(trigger.id)}
                    <span className="text-sm">{trigger.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Do this...</label>
            <div className="space-y-3">
              {actions.map((action, index) => {
                const actionDef = ACTIONS.find(a => a.id === action.type)
                return (
                  <div key={index} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                    <div className="flex items-center gap-2 flex-1">
                      {action.type === 'delay' ? (
                        <Clock className="h-5 w-5 text-yellow-400" />
                      ) : action.type === 'send_email' ? (
                        <Mail className="h-5 w-5 text-green-400" />
                      ) : action.type === 'create_task' ? (
                        <CheckCircle className="h-5 w-5 text-blue-400" />
                      ) : (
                        <CheckCircle className="h-5 w-5 text-slate-400" />
                      )}
                      <span className="text-white">{actionDef?.label || action.type}</span>
                    </div>
                    {action.type === 'delay' && (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          value={action.config?.days || 1}
                          onChange={(e) => {
                            const newActions = [...actions]
                            newActions[index].config.days = parseInt(e.target.value)
                            setActions(newActions)
                          }}
                          className="w-16 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm text-center"
                        />
                        <span className="text-sm text-slate-400">days</span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeAction(index)}
                      className="p-1 hover:bg-red-500/20 rounded"
                    >
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </button>
                  </div>
                )
              })}

              <div className="flex flex-wrap gap-2 pt-2">
                {ACTIONS.map((action) => (
                  <button
                    key={action.id}
                    type="button"
                    onClick={() => addAction(action.id)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-full text-sm text-slate-300 hover:border-indigo-500 hover:text-indigo-400 transition"
                  >
                    <Plus className="h-3 w-3" />
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-slate-800/50 rounded-lg p-4">
            <p className="text-sm text-slate-400 mb-3">Workflow Preview</p>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 px-3 py-2 bg-indigo-500/20 rounded-lg border border-indigo-500/30">
                <Zap className="h-4 w-4 text-indigo-400" />
                <span className="text-sm text-indigo-400">{TRIGGERS.find(t => t.id === formData.trigger)?.label}</span>
              </div>
              {actions.length > 0 && <span className="text-slate-500">→</span>}
              {actions.slice(0, 3).map((action, index) => {
                const label = ACTIONS.find(a => a.id === action.type)?.label || action.type
                return (
                  <div key={index} className="flex items-center gap-1 px-3 py-2 bg-slate-700/50 rounded-lg border border-slate-600/30">
                    <span className="text-sm text-slate-300">{label}</span>
                  </div>
                )
              })}
              {actions.length > 3 && (
                <span className="text-sm text-slate-400">+{actions.length - 3} more</span>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
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
              {isSubmitting ? 'Saving...' : workflow ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function getTriggerIcon(iconName: string) {
  switch (iconName) {
    case 'User': return <User className="h-4 w-4" />
    case 'Mail': return <Mail className="h-4 w-4" />
    case 'Clock': return <Clock className="h-4 w-4" />
    case 'CheckCircle': return <CheckCircle className="h-4 w-4" />
    default: return <Zap className="h-4 w-4" />
  }
}