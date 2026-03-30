'use client'
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, CheckCircle, Circle, Clock, AlertCircle, Calendar, Phone, Mail, Loader2 } from 'lucide-react'
import { clsx } from 'clsx'
import { api } from '@/lib/api'
import CreateTaskModal from '@/components/modals/CreateTaskModal'

const demoTasks = [
  { id: '1', title: 'Call Johnson about proposal', type: 'call', priority: 'high', status: 'pending', dueDate: '2026-03-29', assignedTo: 'Rick Jefferson' },
  { id: '2', title: 'Send follow-up email to Acme', type: 'email', priority: 'medium', status: 'pending', dueDate: '2026-03-29', assignedTo: 'Sarah Chen' },
  { id: '3', title: 'Review Q2 pipeline', type: 'task', priority: 'low', status: 'pending', dueDate: '2026-03-30', assignedTo: 'Rick Jefferson' },
  { id: '4', title: 'Team meeting', type: 'meeting', priority: 'medium', status: 'pending', dueDate: '2026-03-29', assignedTo: 'All Team' },
  { id: '5', title: 'Demo with TechStart Inc', type: 'demo', priority: 'high', status: 'completed', dueDate: '2026-03-28', assignedTo: 'Mike Johnson' },
  { id: '6', title: 'Prepare quarterly report', type: 'task', priority: 'high', status: 'in_progress', dueDate: '2026-03-31', assignedTo: 'Rick Jefferson' },
]

const typeIcons: Record<string, any> = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  demo: Calendar,
  task: CheckCircle,
}

function TaskCard({ task, onToggle }: { task: any; onToggle: () => void }) {
  const TypeIcon = typeIcons[task.type] || CheckCircle
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed'

  return (
    <div className={clsx(
      'flex items-start gap-4 p-4 rounded-xl border transition',
      task.status === 'completed' ? 'bg-slate-900/30 border-slate-800/50' :
      isOverdue ? 'bg-red-950/20 border-red-800/30' : 'bg-slate-900/50 border-slate-800 hover:border-indigo-500/30'
    )}>
      <button onClick={onToggle} className="mt-0.5">
        {task.status === 'completed' ? (
          <CheckCircle className="h-5 w-5 text-green-400" />
        ) : task.status === 'in_progress' ? (
          <Clock className="h-5 w-5 text-yellow-400" />
        ) : (
          <Circle className="h-5 w-5 text-slate-500 hover:text-indigo-400 transition" />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <TypeIcon className="h-4 w-4 text-slate-500" />
          <h4 className={clsx('font-medium', task.status === 'completed' && 'line-through text-slate-500')}>
            {task.title}
          </h4>
        </div>
        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
          <span className={clsx(
            'px-2 py-0.5 rounded-full font-medium',
            task.priority === 'high' ? 'bg-red-500/20 text-red-400' :
            task.priority === 'urgent' ? 'bg-red-500/20 text-red-400' :
            task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-green-500/20 text-green-400'
          )}>
            {task.priority}
          </span>
          {task.dueDate && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(task.dueDate).toLocaleDateString()}
            </span>
          )}
          {task.assignedTo && <span>Assigned to {task.assignedTo}</span>}
        </div>
      </div>
      {isOverdue && (
        <div className="flex items-center gap-1 text-red-400 text-xs">
          <AlertCircle className="h-3 w-3" />
          Overdue
        </div>
      )}
    </div>
  )
}

export default function TasksPage() {
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState('all')
  const queryClient = useQueryClient()

  const { data: tasksData, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const result = await api.getTasks()
      return result.data || []
    }
  })

  // Convert API tasks to demo format
  const apiTasks = (tasksData || []).map((t: any) => ({
    id: t.id,
    title: t.title,
    type: t.type || 'task',
    priority: t.priority || 'medium',
    status: t.status === 'completed' || t.completed ? 'completed' : t.status || 'pending',
    dueDate: t.due_date || t.dueDate,
    assignedTo: t.assigned_to_name || t.assignedTo || ''
  }))

  const tasks = tasksData?.length ? apiTasks : demoTasks

  const filteredTasks = tasks.filter((t: any) => {
    if (filter === 'all') return true
    if (filter === 'completed') return t.status === 'completed'
    if (filter === 'pending') return t.status === 'pending' || t.status === 'in_progress'
    if (filter === 'overdue') return t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed'
    return true
  })

  const stats = {
    total: tasks.length,
    completed: tasks.filter((t: any) => t.status === 'completed').length,
    pending: tasks.filter((t: any) => t.status === 'pending' || t.status === 'in_progress').length,
    overdue: tasks.filter((t: any) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed').length,
  }

  const toggleTask = async (task: any) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed'
    await api.updateTask(task.id, { status: newStatus === 'completed' ? 'completed' : 'pending', completed: newStatus === 'completed' })
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="text-slate-400">{stats.pending} pending, {stats.overdue} overdue</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition">
          <Plus className="h-4 w-4" />
          Add Task
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, color: 'text-white' },
          { label: 'Pending', value: stats.pending, color: 'text-yellow-400' },
          { label: 'Completed', value: stats.completed, color: 'text-green-400' },
          { label: 'Overdue', value: stats.overdue, color: 'text-red-400' },
        ].map((stat) => (
          <div key={stat.label} className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 text-center">
            <p className={clsx('text-2xl font-bold', stat.color)}>{stat.value}</p>
            <p className="text-sm text-slate-400">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['all', 'pending', 'completed', 'overdue'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={clsx(
              'px-4 py-2 rounded-lg text-sm font-medium transition capitalize',
              filter === f ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Tasks List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task: any) => (
            <TaskCard key={task.id} task={task} onToggle={() => toggleTask(task)} />
          ))}
          {filteredTasks.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              No tasks found
            </div>
          )}
        </div>
      )}

      <CreateTaskModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['tasks'] })}
      />
    </div>
  )
}