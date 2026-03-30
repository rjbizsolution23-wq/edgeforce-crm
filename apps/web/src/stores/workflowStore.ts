import { create } from 'zustand'

interface WorkflowNode {
  id: string
  type: 'trigger' | 'action' | 'condition' | 'delay'
  position: { x: number; y: number }
  data: any
}

interface WorkflowEdge {
  id: string
  source: string
  target: string
  animated?: boolean
  label?: string
}

interface Workflow {
  id: string
  name: string
  trigger: string
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  executions: number
}

interface WorkflowStore {
  workflows: Workflow[]
  currentWorkflow: Workflow | null
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]

  setWorkflows: (workflows: Workflow[]) => void
  setCurrentWorkflow: (workflow: Workflow | null) => void
  addNode: (node: WorkflowNode) => void
  updateNode: (id: string, data: any) => void
  removeNode: (id: string) => void
  addEdge: (edge: WorkflowEdge) => void
  removeEdge: (id: string) => void
  clearCanvas: () => void

  // Workflow execution
  executeWorkflow: (workflowId: string, context: any) => Promise<void>
}

export const useWorkflowStore = create<WorkflowStore>((set, get) => ({
  workflows: [],
  currentWorkflow: null,
  nodes: [],
  edges: [],

  setWorkflows: (workflows) => set({ workflows }),

  setCurrentWorkflow: (workflow) => {
    if (workflow) {
      set({
        currentWorkflow: workflow,
        nodes: workflow.nodes,
        edges: workflow.edges,
      })
    } else {
      set({ currentWorkflow: null, nodes: [], edges: [] })
    }
  },

  addNode: (node) => set((state) => ({ nodes: [...state.nodes, node] })),

  updateNode: (id, data) => set((state) => ({
    nodes: state.nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...data } } : n)),
  })),

  removeNode: (id) => set((state) => ({
    nodes: state.nodes.filter((n) => n.id !== id),
    edges: state.edges.filter((e) => e.source !== id && e.target !== id),
  })),

  addEdge: (edge) => set((state) => ({ edges: [...state.edges, edge] })),

  removeEdge: (id) => set((state) => ({
    edges: state.edges.filter((e) => e.id !== id),
  })),

  clearCanvas: () => set({ nodes: [], edges: [] }),

  executeWorkflow: async (workflowId, context) => {
    const { currentWorkflow } = get()
    if (!currentWorkflow) return

    const triggerNode = currentWorkflow.nodes.find((n) => n.type === 'trigger')
    if (!triggerNode) return

    // Walk the graph and execute each node
    const visited = new Set<string>()
    const queue = [triggerNode.id]

    while (queue.length > 0) {
      const nodeId = queue.shift()
      if (visited.has(nodeId)) continue
      visited.add(nodeId)

      const node = currentWorkflow.nodes.find((n) => n.id === nodeId)
      if (!node) continue

      // Execute based on node type
      switch (node.type) {
        case 'trigger':
          // Just proceed to next nodes
          break
        case 'action':
          await executeAction(node.data)
          break
        case 'condition':
          const result = await evaluateCondition(node.data, context)
          const outgoingEdges = currentWorkflow.edges.filter((e) => e.source === nodeId)
          const nextEdge = result
            ? outgoingEdges.find((e) => e.label === 'yes')
            : outgoingEdges.find((e) => e.label === 'no')
          if (nextEdge) queue.push(nextEdge.target)
          break
        case 'delay':
          await new Promise((resolve) => setTimeout(resolve, getDelayMs(node.data.delay)))
          break
      }

      // Add outgoing edges to queue
      const outEdges = currentWorkflow.edges.filter((e) => e.source === nodeId)
      outEdges.forEach((e) => {
        if (!visited.has(e.target)) queue.push(e.target)
      })
    }
  },
}))

async function executeAction(data: any) {
  const action = data.action
  const config = data.config || {}

  switch (action?.id) {
    case 'send_email':
      // TODO: Integrate with email sending service
      console.log('Sending email with config:', config)
      break
    case 'send_sms':
      // TODO: Integrate with Twilio
      console.log('Sending SMS with config:', config)
      break
    case 'create_task':
      // TODO: Create task via API
      console.log('Creating task with config:', config)
      break
    case 'add_tag':
      // TODO: Add tag to contact
      console.log('Adding tag with config:', config)
      break
    case 'ai_scoring':
      // TODO: Call AI scoring endpoint
      console.log('Running AI scoring with config:', config)
      break
    default:
      console.log('Unknown action:', action)
  }
}

async function evaluateCondition(data: any, context: any) {
  // TODO: Implement actual condition evaluation
  return true
}

function getDelayMs(delay: any): number {
  const value = delay?.days || delay?.hours || delay?.minutes || 1
  const unit = delay?.unit || 'days'

  switch (unit) {
    case 'minutes':
      return value * 60 * 1000
    case 'hours':
      return value * 60 * 60 * 1000
    case 'days':
    default:
      return value * 24 * 60 * 60 * 1000
  }
}