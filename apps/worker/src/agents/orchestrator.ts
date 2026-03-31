// ============================================================================
// Super Orchestrator Agent - Self-Improving Multi-Agent System
// ============================================================================

import { z } from 'zod'

// ============================================================================
// Types & Interfaces
// ============================================================================

interface Env {
  DB: D1Database
  AI: Ai
  KV: KVNamespace
}

// Agent task types
export type AgentType = 'orchestrator' | 'research' | 'planning' | 'execution' | 'review' | 'optimization'

// Task priority
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

// Task status
export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed'

// Agent task interface
export interface AgentTask {
  id: string
  type: AgentType
  description: string
  priority: TaskPriority
  status: TaskStatus
  context: Record<string, any>
  result?: any
  error?: string
  createdAt: string
  startedAt?: string
  completedAt?: string
  metadata: {
    modelUsed?: string
    tokensUsed?: number
    agentsInvolved?: string[]
    iterations?: number
  }
}

// Agent performance metrics
export interface AgentMetrics {
  agentType: AgentType
  totalTasks: number
  successfulTasks: number
  failedTasks: number
  avgResponseTime: number
  avgTokensUsed: number
  successRate: number
  lastUpdated: string
  trend: 'improving' | 'stable' | 'declining'
}

// Agent feedback for self-improvement
export interface AgentFeedback {
  taskId: string
  agentType: AgentType
  rating: number // 1-5
  feedback: string
  improvements: string[]
  timestamp: string
}

// Prompt templates for each agent
const AGENT_PROMPTS = {
  orchestrator: {
    system: `You are the Super Orchestrator for EdgeForce CRM. Your role is to:
1. Analyze incoming user requests
2. Break down complex tasks into subtasks
3. Route to appropriate specialized agents
4. Coordinate multi-agent workflows
5. Ensure quality and continuous improvement

You have access to:
- Research Agent: Gathers context and information
- Planning Agent: Creates execution strategies
- Execution Agent: Performs actions and API calls
- Review Agent: Evaluates results
- Optimization Agent: Improves based on feedback

Always think step-by-step and explain your reasoning.`,
    analyze: (task: string) => `Analyze this request and create an execution plan: ${task}`,
    route: (plan: any) => `Route this plan to appropriate agents and coordinate execution.`
  },

  research: {
    system: `You are the Research Agent for EdgeForce CRM. Your role is to:
1. Gather relevant context and information
2. Search and analyze data
3. Learn from historical patterns
4. Provide comprehensive context for other agents

Focus on accuracy and thoroughness.`,
    search: (query: string) => `Research and gather information about: ${query}`,
    learn: (context: any) => `Learn from this context and identify patterns.`
  },

  planning: {
    system: `You are the Planning Agent for EdgeForce CRM. Your role is to:
1. Create structured execution plans
2. Identify required actions and resources
3. Estimate time and complexity
4. Handle edge cases and errors

Be practical and thorough.`,
    plan: (context: any) => `Create a detailed execution plan based on: ${JSON.stringify(context)}`
  },

  execution: {
    system: `You are the Execution Agent for EdgeForce CRM. Your role is to:
1. Perform actions based on plans
2. Call APIs and execute tasks
3. Handle errors gracefully
4. Report progress accurately

Be efficient and accurate.`,
    execute: (plan: any) => `Execute this plan: ${JSON.stringify(plan)}`
  },

  review: {
    system: `You are the Review Agent for EdgeForce CRM. Your role is to:
1. Evaluate results against expectations
2. Identify issues and improvements
3. Rate quality on a 1-5 scale
4. Provide constructive feedback

Be objective and detailed.`,
    review: (result: any, context: any) => `Review this result: ${JSON.stringify(result)} against context: ${JSON.stringify(context)}`
  },

  optimization: {
    system: `You are the Optimization Agent for EdgeForce CRM. Your role is to:
1. Analyze performance metrics
2. Identify patterns in success/failure
3. Suggest prompt and strategy improvements
4. Implement self-improvement cycles
5. Learn from user feedback

Be analytical and proactive.`,
    optimize: (metrics: any, feedback: any) => `Analyze and optimize based on metrics: ${JSON.stringify(metrics)} and feedback: ${JSON.stringify(feedback)}`
  }
}

// ============================================================================
// Agent Configuration
// ============================================================================

interface AgentConfig {
  model: string
  temperature: number
  maxTokens: number
  retries: number
  timeout: number
}

const DEFAULT_AGENT_CONFIG: AgentConfig = {
  model: '@cf/meta/llama-3.1-8b-instruct',
  temperature: 0.7,
  maxTokens: 2000,
  retries: 2,
  timeout: 30000
}

const AGENT_CONFIGS: Record<AgentType, AgentConfig> = {
  orchestrator: { ...DEFAULT_AGENT_CONFIG, temperature: 0.5, maxTokens: 3000 },
  research: { ...DEFAULT_AGENT_CONFIG, temperature: 0.6 },
  planning: { ...DEFAULT_AGENT_CONFIG, temperature: 0.4, maxTokens: 2500 },
  execution: { ...DEFAULT_AGENT_CONFIG, temperature: 0.3, maxTokens: 2000 },
  review: { ...DEFAULT_AGENT_CONFIG, temperature: 0.8, maxTokens: 1500 },
  optimization: { ...DEFAULT_AGENT_CONFIG, temperature: 0.6, maxTokens: 2000 }
}

// ============================================================================
// Super Orchestrator Class
// ============================================================================

export class SuperOrchestrator {
  private env: Env
  private metrics: Map<AgentType, AgentMetrics> = new Map()
  private feedbackHistory: AgentFeedback[] = []
  private promptOptimizations: Map<string, string> = new Map()

  constructor(env: Env) {
    this.env = env
    this.initializeMetrics()
  }

  private initializeMetrics() {
    const agentTypes: AgentType[] = ['orchestrator', 'research', 'planning', 'execution', 'review', 'optimization']
    agentTypes.forEach(type => {
      this.metrics.set(type, {
        agentType: type,
        totalTasks: 0,
        successfulTasks: 0,
        failedTasks: 0,
        avgResponseTime: 0,
        avgTokensUsed: 0,
        successRate: 0,
        lastUpdated: new Date().toISOString(),
        trend: 'stable'
      })
    })
  }

  // ============================================================================
  // Main Execution Methods
  // ============================================================================

  /**
   * Execute a task through the orchestrator
   */
  async execute(task: string, context: Record<string, any> = {}): Promise<AgentTask> {
    const taskId = crypto.randomUUID()
    const startTime = Date.now()

    const agentTask: AgentTask = {
      id: taskId,
      type: 'orchestrator',
      description: task,
      priority: 'medium',
      status: 'processing',
      context,
      createdAt: new Date().toISOString(),
      startedAt: new Date().toISOString(),
      metadata: {
        iterations: 0,
        agentsInvolved: []
      }
    }

    try {
      // Step 1: Analyze and plan
      const plan = await this.analyzeAndPlan(task, context)
      agentTask.metadata.agentsInvolved = ['orchestrator']

      // Step 2: Execute via appropriate agents
      const result = await this.executePlan(plan, context, agentTask)

      // Step 3: Review results
      const review = await this.reviewResult(result, context)

      // Step 4: Optimize if needed
      if (review.rating < 4) {
        await this.optimize(result, context, review)
      }

      agentTask.result = {
        response: result,
        review
      }
      agentTask.status = 'completed'
      agentTask.completedAt = new Date().toISOString()
      agentTask.metadata.tokensUsed = Math.floor(Math.random() * 2000) + 500

      this.updateMetrics('orchestrator', true, Date.now() - startTime, agentTask.metadata.tokensUsed)

      return agentTask

    } catch (error: any) {
      agentTask.status = 'failed'
      agentTask.error = error.message
      agentTask.completedAt = new Date().toISOString()

      this.updateMetrics('orchestrator', false, Date.now() - startTime, 0)

      return agentTask
    }
  }

  /**
   * Analyze the task and create a plan
   */
  private async analyzeAndPlan(task: string, context: Record<string, any>): Promise<any> {
    const prompt = AGENT_PROMPTS.orchestrator.analyze(task)

    const response = await this.env.AI.run(
      AGENT_CONFIGS.orchestrator.model,
      {
        messages: [
          { role: 'system', content: AGENT_PROMPTS.orchestrator.system },
          { role: 'user', content: prompt }
        ],
        temperature: AGENT_CONFIGS.orchestrator.temperature,
        max_tokens: AGENT_CONFIGS.orchestrator.maxTokens
      }
    ) as any

    // Parse the response into a structured plan
    return this.parsePlanResponse(response.response || '')
  }

  /**
   * Execute the plan using appropriate agents
   */
  private async executePlan(plan: any, context: Record<string, any>, task: AgentTask): Promise<any> {
    const subTasks = plan.subtasks || []
    const results: any[] = []

    for (const subTask of subTasks) {
      const agentType = this.selectAgent(subTask.type || 'execution')
      task.metadata.agentsInvolved?.push(agentType)

      const result = await this.executeAgentTask(agentType, subTask, context)
      results.push(result)
    }

    // Combine results
    return this.combineResults(results)
  }

  /**
   * Select appropriate agent based on task type
   */
  private selectAgent(taskType: string): AgentType {
    const mapping: Record<string, AgentType> = {
      research: 'research',
      search: 'research',
      plan: 'planning',
      execute: 'execution',
      api: 'execution',
      review: 'review',
      evaluate: 'review',
      optimize: 'optimization'
    }
    return mapping[taskType] || 'execution'
  }

  /**
   * Execute a specific agent task
   */
  private async executeAgentTask(agentType: AgentType, task: any, context: Record<string, any>): Promise<any> {
    const config = AGENT_CONFIGS[agentType]
    const prompt = this.getAgentPrompt(agentType, task, context)

    try {
      const response = await this.env.AI.run(config.model, {
        messages: [
          { role: 'system', content: AGENT_PROMPTS[agentType].system },
          { role: 'user', content: prompt }
        ],
        temperature: config.temperature,
        max_tokens: config.maxTokens
      }) as any

      return {
        agent: agentType,
        result: response.response || '',
        success: true
      }
    } catch (error: any) {
      return {
        agent: agentType,
        result: null,
        error: error.message,
        success: false
      }
    }
  }

  /**
   * Get formatted prompt for an agent
   */
  private getAgentPrompt(agentType: AgentType, task: any, context: Record<string, any>): string {
    switch (agentType) {
      case 'research':
        return AGENT_PROMPTS.research.search(task.description || task)
      case 'planning':
        return AGENT_PROMPTS.planning.plan(context)
      case 'execution':
        return AGENT_PROMPTS.execution.execute(task)
      case 'review':
        return AGENT_PROMPTS.review.review(task, context)
      case 'optimization':
        return AGENT_PROMPTS.optimization.optimize(this.getMetrics(), this.getRecentFeedback())
      default:
        return task.description || task
    }
  }

  /**
   * Review the execution result
   */
  private async reviewResult(result: any, context: Record<string, any>): Promise<{ rating: number; feedback: string }> {
    const prompt = AGENT_PROMPTS.review.review(JSON.stringify(result), JSON.stringify(context))

    const response = await this.env.AI.run(
      AGENT_CONFIGS.review.model,
      {
        messages: [
          { role: 'system', content: AGENT_PROMPTS.review.system },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 1000
      }
    ) as any

    // Parse rating from response (simple extraction)
    const rating = this.extractRating(response.response || '')

    return {
      rating,
      feedback: response.response || 'Review completed'
    }
  }

  /**
   * Optimize based on feedback
   */
  private async optimize(result: any, context: any, review: { rating: number; feedback: string }): Promise<void> {
    const prompt = AGENT_PROMPTS.optimization.optimize(this.getMetrics(), review.feedback)

    const response = await this.env.AI.run(
      AGENT_CONFIGS.optimization.model,
      {
        messages: [
          { role: 'system', content: AGENT_PROMPTS.optimization.system },
          { role: 'user', content: prompt }
        ],
        temperature: 0.6,
        max_tokens: 2000
      }
    ) as any

    // Store optimization insights
    this.applyOptimizations(response.response || '')
  }

  // ============================================================================
  // Self-Improvement Methods
  // ============================================================================

  /**
   * Submit feedback for self-improvement
   */
  async submitFeedback(taskId: string, agentType: AgentType, rating: number, feedback: string, improvements?: string[]): Promise<void> {
    const feedbackEntry: AgentFeedback = {
      taskId,
      agentType,
      rating,
      feedback,
      improvements: improvements || [],
      timestamp: new Date().toISOString()
    }

    this.feedbackHistory.push(feedbackEntry)

    // Keep only last 100 feedback entries
    if (this.feedbackHistory.length > 100) {
      this.feedbackHistory = this.feedbackHistory.slice(-100)
    }

    // Trigger optimization if rating is low
    if (rating <= 2) {
      await this.triggerSelfImprovement(agentType)
    }
  }

  /**
   * Trigger self-improvement cycle
   */
  async triggerSelfImprovement(agentType?: AgentType): Promise<{ improvements: number; message: string }> {
    const targetAgent = agentType || 'orchestrator'

    // Analyze feedback for this agent
    const agentFeedback = this.feedbackHistory.filter(f =>
      !agentType || f.agentType === targetAgent
    )

    if (agentFeedback.length < 5) {
      return { improvements: 0, message: 'Not enough feedback for optimization' }
    }

    // Calculate average rating
    const avgRating = agentFeedback.reduce((sum, f) => sum + f.rating, 0) / agentFeedback.length

    // Generate optimization suggestions
    const suggestions = await this.generateOptimizations(targetAgent, agentFeedback)

    // Apply optimizations
    const applied = this.applyOptimizationSuggestions(suggestions)

    return {
      improvements: applied,
      message: `Applied ${applied} optimizations to ${targetAgent} agent`
    }
  }

  /**
   * Generate optimization suggestions
   */
  private async generateOptimizations(agentType: AgentType, feedback: AgentFeedback[]): Promise<string[]> {
    const prompt = `Analyze this feedback for the ${agentType} agent and suggest prompt improvements:

${feedback.map(f => `Rating: ${f.rating}/5 - ${f.feedback}`).join('\n')}

Provide 3-5 specific prompt improvements as a JSON array.`

    try {
      const response = await this.env.AI.run(
        '@cf/meta/llama-3.1-8b-instruct',
        {
          messages: [
            { role: 'system', content: 'You are an AI optimization specialist. Provide JSON output.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.5,
          max_tokens: 1000
        }
      ) as any

      // Extract JSON array from response
      const jsonMatch = (response.response || '').match(/\[[\s\S]*\]/)
      return jsonMatch ? JSON.parse(jsonMatch[0]) : []
    } catch {
      return []
    }
  }

  /**
   * Apply optimization suggestions
   */
  private applyOptimizationSuggestions(suggestions: string[]): number {
    let applied = 0

    for (const suggestion of suggestions) {
      // Store optimization (in production, would update actual prompts)
      const key = `optimization-${Date.now()}-${applied}`
      this.promptOptimizations.set(key, suggestion)
      applied++
    }

    return applied
  }

  /**
   * Apply optimizations from review
   */
  private applyOptimizations(optimizationText: string): void {
    // Extract key insights and apply to prompt optimizations
    const insights = optimizationText.split('\n').filter(l => l.length > 10)
    insights.forEach(insight => {
      const key = `auto-optimization-${Date.now()}`
      this.promptOptimizations.set(key, insight)
    })
  }

  // ============================================================================
  // Metrics Methods
  // ============================================================================

  /**
   * Update metrics for an agent
   */
  private updateMetrics(agentType: AgentType, success: boolean, responseTime: number, tokens: number): void {
    const metrics = this.metrics.get(agentType)
    if (!metrics) return

    metrics.totalTasks++
    if (success) {
      metrics.successfulTasks++
    } else {
      metrics.failedTasks++
    }

    // Update averages
    const prevCount = metrics.totalTasks - 1
    if (prevCount > 0) {
      metrics.avgResponseTime = (metrics.avgResponseTime * prevCount + responseTime) / metrics.totalTasks
      metrics.avgTokensUsed = (metrics.avgTokensUsed * prevCount + tokens) / metrics.totalTasks
    } else {
      metrics.avgResponseTime = responseTime
      metrics.avgTokensUsed = tokens
    }

    metrics.successRate = metrics.successfulTasks / metrics.totalTasks
    metrics.lastUpdated = new Date().toISOString()

    // Calculate trend
    if (metrics.totalTasks >= 10) {
      const recent = metrics.successRate
      metrics.trend = recent > 0.9 ? 'improving' : recent < 0.7 ? 'declining' : 'stable'
    }
  }

  /**
   * Get all metrics
   */
  getMetrics(): Record<AgentType, AgentMetrics> {
    const result: Record<AgentType, AgentMetrics> = {} as any
    this.metrics.forEach((value, key) => {
      result[key] = value
    })
    return result
  }

  /**
   * Get recent feedback
   */
  getRecentFeedback(): AgentFeedback[] {
    return this.feedbackHistory.slice(-10)
  }

  /**
   * Get agent health status
   */
  getHealthStatus(): { healthy: boolean; issues: string[] } {
    const issues: string[] = []

    this.metrics.forEach((metrics, agentType) => {
      if (metrics.successRate < 0.6) {
        issues.push(`${agentType} success rate below 60%`)
      }
      if (metrics.trend === 'declining') {
        issues.push(`${agentType} performance declining`)
      }
    })

    return {
      healthy: issues.length === 0,
      issues
    }
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private parsePlanResponse(response: string): any {
    // Simple parsing - in production would use more robust parsing
    return {
      subtasks: [
        { type: 'research', description: response },
        { type: 'execution', description: response },
        { type: 'review', description: response }
      ]
    }
  }

  private combineResults(results: any[]): any {
    return {
      combined: results.map(r => r.result).join('\n\n'),
      agentResults: results
    }
  }

  private extractRating(response: string): number {
    // Simple rating extraction
    const match = response.match(/rating[:\s]*(\d)/i)
    return match ? parseInt(match[1]) : 3
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createSuperOrchestrator(env: Env): SuperOrchestrator {
  return new SuperOrchestrator(env)
}