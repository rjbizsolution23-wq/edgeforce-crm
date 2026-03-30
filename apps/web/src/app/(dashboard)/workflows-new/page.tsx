'use client'
import { useState, useCallback, useMemo } from 'react'
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
  NodeToolbar,
  useReactFlow,
  Panel,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import {
  Zap, Mail, User, CheckCircle, Clock, MessageSquare, Phone, Bell,
  Plus, Play, Pause, Save, Trash2, Settings, ChevronDown, X, GripVertical
} from 'lucide-react'
import { clsx } from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'

// Node types
const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  condition: ConditionNode,
  delay: DelayNode,
}

// Trigger options
const TRIGGERS = [
  { id: 'contact_created', label: 'Contact Created', icon: User, color: 'bg-green-500' },
  { id: 'deal_created', label: 'Deal Created', icon: CheckCircle, color: 'bg-blue-500' },
  { id: 'deal_stage_changed', label: 'Stage Changed', icon: Settings, color: 'bg-purple-500' },
  { id: 'task_completed', label: 'Task Completed', icon: CheckCircle, color: 'bg-indigo-500' },
  { id: 'email_opened', label: 'Email Opened', icon: Mail, color: 'bg-yellow-500' },
  { id: 'form_submitted', label: 'Form Submitted', icon: MessageSquare, color: 'bg-cyan-500' },
  { id: 'call_completed', label: 'Call Completed', icon: Phone, color: 'bg-orange-500' },
  { id: 'manual', label: 'Manual Trigger', icon: Play, color: 'bg-slate-500' },
]

// Action options
const ACTIONS = [
  { id: 'send_email', label: 'Send Email', icon: Mail, color: 'text-green-400', bg: 'bg-green-500/20' },
  { id: 'send_sms', label: 'Send SMS', icon: MessageSquare, color: 'text-blue-400', bg: 'bg-blue-500/20' },
  { id: 'create_task', label: 'Create Task', icon: CheckCircle, color: 'text-indigo-400', bg: 'bg-indigo-500/20' },
  { id: 'add_tag', label: 'Add Tag', icon: Bell, color: 'text-purple-400', bg: 'bg-purple-500/20' },
  { id: 'update_contact', label: 'Update Contact', icon: User, color: 'text-pink-400', bg: 'bg-pink-500/20' },
  { id: 'notify_owner', label: 'Notify Owner', icon: Bell, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  { id: 'add_to_sequence', label: 'Add to Sequence', icon: Clock, color: 'text-orange-400', bg: 'bg-orange-500/20' },
  { id: 'move_deal', label: 'Move Deal Stage', icon: Settings, color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
  { id: 'delay', label: 'Wait/Delay', icon: Clock, color: 'text-slate-400', bg: 'bg-slate-500/20' },
  { id: 'ai_scoring', label: 'AI Lead Score', icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/20' },
]

// Conditions
const CONDITIONS = [
  { id: 'email_opened', label: 'Email Opened' },
  { id: 'link_clicked', label: 'Link Clicked' },
  { id: 'form_submitted', label: 'Form Submitted' },
  { id: 'deal_value_above', label: 'Deal Value >' },
  { id: 'contact_tag', label: 'Has Tag' },
  { id: 'lead_score_above', label: 'Lead Score >' },
  { id: 'time_on_page', label: 'Time on Page >' },
]

export default function WorkflowBuilderPage() {
  const [workflowName, setWorkflowName] = useState('My Workflow')
  const [selectedNode, setSelectedNode] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [showNodeMenu, setShowNodeMenu] = useState(false)
  const [nodeMenuPosition, setNodeMenuPosition] = useState({ x: 0, y: 0 })
  const queryClient = useQueryClient()

  // Initial nodes
  const initialNodes = [
    {
      id: 'trigger-1',
      type: 'trigger',
      position: { x: 250, y: 50 },
      data: { trigger: TRIGGERS[0] },
    },
  ]

  const initialEdges = []

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [workflowId, setWorkflowId] = useState<string | null>(null)

  const onConnect = useCallback(
    (params: any) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges]
  )

  const addNode = (type: string, data: any, position?: { x: number; y: number }) => {
    const id = `${type}-${Date.now()}`
    const newNode = {
      id,
      type,
      position: position || { x: 250, y: nodes.length * 150 + 100 },
      data,
    }
    setNodes((nds) => [...nds, newNode])
  }

  const handleAddNode = (type: string, config: any) => {
    const id = `${type}-${Date.now()}`
    const newNode = {
      id,
      type,
      position: { x: 250 + Math.random() * 100, y: nodes.length * 150 + 100 },
      data: config,
    }
    setNodes((nds) => [...nds, newNode])
    setShowNodeMenu(false)
  }

  const onNodeDragStop = useCallback((event: any, node: any) => {
    setNodes((nds) =>
      nds.map((n) => (n.id === node.id ? { ...n, position: node.position } : n))
    )
  }, [setNodes])

  const deleteNode = (nodeId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId))
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId))
    setSelectedNode(null)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const workflow = {
        name: workflowName,
        trigger: nodes.find(n => n.type === 'trigger')?.data.trigger?.id || 'manual',
        actions: nodes.filter(n => n.type === 'action').map(n => ({
          id: n.id,
          type: n.data.action?.id,
          config: n.data.config || {},
        })),
        conditions: nodes.filter(n => n.type === 'condition').map(n => ({
          id: n.id,
          type: n.data.condition?.id,
          value: n.data.value || '',
        })),
      }

      if (workflowId) {
        await api.updateWorkflow(workflowId, workflow)
      } else {
        const result = await api.createWorkflow(workflow)
        setWorkflowId(result.data?.id)
      }

      queryClient.invalidateQueries({ queryKey: ['workflows'] })
    } catch (error) {
      console.error('Failed to save workflow:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-500/20 rounded-lg">
              <Zap className="h-5 w-5 text-indigo-400" />
            </div>
            <input
              type="text"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="bg-transparent text-xl font-semibold text-white focus:outline-none border-b border-transparent focus:border-indigo-500"
            />
          </div>
          <span className="px-2 py-0.5 rounded-full text-xs bg-slate-500/20 text-slate-400">Draft</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNodeMenu(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition"
          >
            <Plus className="h-4 w-4" />
            Add Node
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 bg-slate-950">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDragStop={onNodeDragStop}
          onNodeClick={(e, node) => setSelectedNode(node)}
          nodeTypes={nodeTypes}
          fitView
          snapToGrid
          snapGrid={[20, 20]}
          defaultEdgeOptions={{ animated: true }}
        >
          <Controls />
          <Background color="#1e293b" gap={20} size={1} />

          {/* Node Palette */}
          <Panel position="top-left" className="!left-4 !top-20">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-xl">
              <p className="text-xs text-slate-400 mb-2 font-medium">TRIGGERS</p>
              <div className="space-y-1">
                {TRIGGERS.map((trigger) => (
                  <button
                    key={trigger.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('application/reactflow', JSON.stringify({
                        type: 'trigger',
                        data: { trigger }
                      }))
                    }}
                    onClick={() => handleAddNode('trigger', { trigger })}
                    className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg hover:bg-slate-800 text-sm text-slate-300 transition"
                  >
                    <div className={clsx('w-6 h-6 rounded flex items-center justify-center', trigger.color)}>
                      <trigger.icon className="h-3 w-3 text-white" />
                    </div>
                    {trigger.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-400 mb-2 mt-4 font-medium">ACTIONS</p>
              <div className="space-y-1">
                {ACTIONS.map((action) => (
                  <button
                    key={action.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('application/reactflow', JSON.stringify({
                        type: 'action',
                        data: { action }
                      }))
                    }}
                    onClick={() => handleAddNode('action', { action })}
                    className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg hover:bg-slate-800 text-sm text-slate-300 transition"
                  >
                    <div className={clsx('w-6 h-6 rounded flex items-center justify-center', action.bg)}>
                      <action.icon className={clsx('h-3 w-3', action.color)} />
                    </div>
                    {action.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-400 mb-2 mt-4 font-medium">LOGIC</p>
              <div className="space-y-1">
                <button
                  onClick={() => handleAddNode('condition', { condition: CONDITIONS[0] })}
                  className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg hover:bg-slate-800 text-sm text-slate-300 transition"
                >
                  <div className="w-6 h-6 rounded bg-slate-500/20 flex items-center justify-center">
                    <Settings className="h-3 w-3 text-slate-400" />
                  </div>
                  Condition / Split
                </button>
                <button
                  onClick={() => handleAddNode('delay', { delay: 1 })}
                  className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg hover:bg-slate-800 text-sm text-slate-300 transition"
                >
                  <div className="w-6 h-6 rounded bg-slate-500/20 flex items-center justify-center">
                    <Clock className="h-3 w-3 text-slate-400" />
                  </div>
                  Wait / Delay
                </button>
              </div>
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {/* Node Configuration Panel */}
      <AnimatePresence>
        {selectedNode && (
          <NodeConfigPanel
            node={selectedNode}
            onClose={() => setSelectedNode(null)}
            onUpdate={(data) => {
              setNodes((nds) =>
                nds.map((n) =>
                  n.id === selectedNode.id ? { ...n, data: { ...n.data, ...data } } : n
                )
              )
            }}
            onDelete={() => deleteNode(selectedNode.id)}
          />
        )}
      </AnimatePresence>

      {/* Add Node Modal */}
      <AnimatePresence>
        {showNodeMenu && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowNodeMenu(false)} />
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full m-4 relative z-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Add Node</h3>
                <button onClick={() => setShowNodeMenu(false)} className="p-1 hover:bg-slate-800 rounded">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-400">TRIGGERS</p>
                <div className="grid grid-cols-2 gap-2">
                  {TRIGGERS.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleAddNode('trigger', { trigger: t })}
                      className="flex items-center gap-2 p-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-left transition"
                    >
                      <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center', t.color)}>
                        <t.icon className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-sm text-white">{t.label}</span>
                    </button>
                  ))}
                </div>
                <p className="text-sm font-medium text-slate-400 mt-4">ACTIONS</p>
                <div className="grid grid-cols-2 gap-2">
                  {ACTIONS.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => handleAddNode('action', { action: a })}
                      className="flex items-center gap-2 p-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-left transition"
                    >
                      <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center', a.bg)}>
                        <a.icon className={clsx('h-4 w-4', a.color)} />
                      </div>
                      <span className="text-sm text-white">{a.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Trigger Node Component
function TriggerNode({ data }: { data: any }) {
  const trigger = data.trigger
  return (
    <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-xl p-4 min-w-[180px] shadow-lg shadow-green-500/20">
      <Handle type="source" position={Position.Bottom} className="!bg-green-400 !w-3 !h-3" />
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
          {trigger?.icon && <trigger.icon className="h-5 w-5 text-white" />}
        </div>
        <div>
          <p className="text-xs text-green-200 font-medium">TRIGGER</p>
          <p className="font-semibold text-white">{trigger?.label || 'Select trigger'}</p>
        </div>
      </div>
    </div>
  )
}

// Action Node Component
function ActionNode({ data }: { data: any }) {
  const action = data.action
  return (
    <div className="bg-slate-900 border-2 border-slate-700 rounded-xl p-4 min-w-[180px] hover:border-indigo-500 transition">
      <Handle type="target" position={Position.Top} className="!bg-slate-400 !w-3 !h-3" />
      <Handle type="source" position={Position.Bottom} className="!bg-slate-400 !w-3 !h-3" />
      <div className="flex items-center gap-3">
        <div className={clsx('w-10 h-10 rounded-lg flex items-center justify-center', action?.bg)}>
          {action?.icon && <action.icon className={clsx('h-5 w-5', action?.color)} />}
        </div>
        <div>
          <p className="text-xs text-slate-400 font-medium">ACTION</p>
          <p className="font-semibold text-white">{action?.label || 'Select action'}</p>
        </div>
      </div>
    </div>
  )
}

// Condition Node Component
function ConditionNode({ data }: { data: any }) {
  const condition = data.condition
  return (
    <div className="bg-slate-900 border-2 border-purple-600 rounded-xl p-4 min-w-[200px]">
      <Handle type="target" position={Position.Top} className="!bg-purple-400 !w-3 !h-3" />
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-purple-400 font-medium">SPLIT</p>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-green-400 rounded-full" />
          <div className="w-2 h-2 bg-red-400 rounded-full" />
        </div>
      </div>
      <p className="font-semibold text-white">{condition?.label || 'If/Else'}</p>
      <div className="flex gap-2 mt-3">
        <div className="px-2 py-1 bg-green-500/20 rounded text-xs text-green-400 font-medium">YES</div>
        <div className="px-2 py-1 bg-red-500/20 rounded text-xs text-red-400 font-medium">NO</div>
      </div>
      <Handle type="source" position={Position.Bottom} id="yes" className="!bg-green-400 !w-3 !h-3 !-left-4" style={{ left: '25%' }} />
      <Handle type="source" position={Position.Bottom} id="no" className="!bg-red-400 !w-3 !h-3 !-left-4" style={{ left: '75%' }} />
    </div>
  )
}

// Delay Node Component
function DelayNode({ data }: { data: any }) {
  return (
    <div className="bg-slate-900 border-2 border-yellow-600 rounded-xl p-4 min-w-[160px]">
      <Handle type="target" position={Position.Top} className="!bg-yellow-400 !w-3 !h-3" />
      <Handle type="source" position={Position.Bottom} className="!bg-yellow-400 !w-3 !h-3" />
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
          <Clock className="h-5 w-5 text-yellow-400" />
        </div>
        <div>
          <p className="text-xs text-yellow-400 font-medium">WAIT</p>
          <p className="font-semibold text-white">{data.delay || 1} day{data.delay !== 1 ? 's' : ''}</p>
        </div>
      </div>
    </div>
  )
}

// Node Configuration Panel
function NodeConfigPanel({ node, onClose, onUpdate, onDelete }: any) {
  const [config, setConfig] = useState(node.data.config || {})

  const handleSave = () => {
    onUpdate({ config })
    onClose()
  }

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25 }}
      className="fixed right-0 top-20 bottom-0 w-96 bg-slate-900 border-l border-slate-800 z-40 overflow-y-auto"
    >
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <h3 className="font-semibold text-white">Configure Node</h3>
        <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="p-4 space-y-4">
        {node.type === 'action' && node.data.action?.id === 'send_email' && (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Email Template</label>
              <select
                value={config.templateId || ''}
                onChange={(e) => setConfig({ ...config, templateId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
              >
                <option value="">Select template...</option>
                <option value="1">Welcome Email</option>
                <option value="2">Follow Up</option>
                <option value="3">Meeting Request</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Delay (hours)</label>
              <input
                type="number"
                value={config.delayHours || 0}
                onChange={(e) => setConfig({ ...config, delayHours: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
              />
            </div>
          </>
        )}

        {node.type === 'action' && node.data.action?.id === 'send_sms' && (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">SMS Message</label>
            <textarea
              rows={4}
              value={config.message || ''}
              onChange={(e) => setConfig({ ...config, message: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
              placeholder="Enter SMS message..."
            />
          </div>
        )}

        {node.type === 'action' && node.data.action?.id === 'create_task' && (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Task Title</label>
              <input
                type="text"
                value={config.title || ''}
                onChange={(e) => setConfig({ ...config, title: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                placeholder="Follow up with contact"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Priority</label>
              <select
                value={config.priority || 'medium'}
                onChange={(e) => setConfig({ ...config, priority: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </>
        )}

        {node.type === 'condition' && (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Condition Type</label>
            <select
              value={config.type || 'email_opened'}
              onChange={(e) => setConfig({ ...config, type: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
            >
              {CONDITIONS.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>
        )}

        {node.type === 'delay' && (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Wait Duration</label>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                value={config.days || 1}
                onChange={(e) => setConfig({ ...config, days: parseInt(e.target.value) || 1 })}
                className="w-20 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
              />
              <select
                value={config.unit || 'days'}
                onChange={(e) => setConfig({ ...config, unit: e.target.value })}
                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
              >
                <option value="minutes">Minutes</option>
                <option value="hours">Hours</option>
                <option value="days">Days</option>
              </select>
            </div>
          </div>
        )}
      </div>
      <div className="p-4 border-t border-slate-800 flex gap-3">
        <button
          onClick={onDelete}
          className="flex-1 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition"
        >
          Delete
        </button>
        <button
          onClick={handleSave}
          className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition"
        >
          Save
        </button>
      </div>
    </motion.div>
  )
}