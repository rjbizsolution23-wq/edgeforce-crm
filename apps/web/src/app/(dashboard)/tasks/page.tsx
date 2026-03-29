'use client'
import { useState } from 'react'
import { Plus, Search, CheckCircle, Circle, Clock, AlertCircle, Calendar, Filter, Phone, Mail } from 'lucide-react'
import { clsx } from 'clsx'

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
  const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'completed'

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
            task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-green-500/20 text-green-400'
          )}>
            {task.priority}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(task.dueDate).toLocaleDateString()}
          </span>
          <span>Assigned to {task.assignedTo}</span>
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
  const [tasks, setTasks] = useState(demoTasks)
  const [filter, setFilter] = useState('all')

  const filteredTasks = tasks.filter(t => {
    if (filter === 'all') return true
    if (filter === 'completed') return t.status === 'completed'
    if (filter === 'pending') return t.status === 'pending'
    if (filter === 'overdue') return new Date(t.dueDate) < new Date() && t.status !== 'completed'
    return true
  })

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t =>
      t.id === id
        ? { ...t, status: t.status === 'completed' ? 'pending' : 'completed' }
        : t
    ))
  }

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    pending: tasks.filter(t => t.status === 'pending').length,
    overdue: tasks.filter(t => new Date(t.dueDate) < new Date() && t.status !== 'completed').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="text-slate-400">{stats.pending} pending, {stats.overdue} overdue</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition">
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
      <div className="space-y-3">
        {filteredTasks.map((task) => (
          <TaskCard key={task.id} task={task} onToggle={() => toggleTask(task.id)} />
        ))}
      </div>
    </div>
  )
}