// ============================================================================
// OpenRouter LLM Client
// Access 100+ models including many free tier models
// ============================================================================

import { z } from 'zod'

// Environment types
interface Env {
  DB: D1Database
  AI: Ai
  KV: KVNamespace
  OPENROUTER_API_KEY?: string
}

// OpenRouter API configuration
const OPENROUTER_API_BASE = 'https://openrouter.ai/api/v1'

// Model pricing (free models marked)
export const OPENROUTER_MODELS = {
  // Free Models (with daily credits)
  'meta-llama/llama-3.1-8b-instruct': {
    name: 'Llama 3.1 8B',
    context: 128000,
    pricing: { prompt: 0, completion: 0, free: true }
  },
  'meta-llama/llama-3.1-70b-instruct': {
    name: 'Llama 3.1 70B',
    context: 128000,
    pricing: { prompt: 0, completion: 0, free: true }
  },
  'mistralai/mistral-7b-instruct': {
    name: 'Mistral 7B',
    context: 32768,
    pricing: { prompt: 0, completion: 0, free: true }
  },
  'qwen/qwen-2-7b-instruct': {
    name: 'Qwen 2 7B',
    context: 32768,
    pricing: { prompt: 0, completion: 0, free: true }
  },
  'google/gemma-2-9b-it': {
    name: 'Gemma 2 9B',
    context: 8192,
    pricing: { prompt: 0, completion: 0, free: true }
  },
  'anthropic/claude-3-haiku': {
    name: 'Claude 3 Haiku',
    context: 200000,
    pricing: { prompt: 0.00000025, completion: 0.00000125, free: true }
  },

  // Premium Models
  'openai/gpt-4o': {
    name: 'GPT-4o',
    context: 128000,
    pricing: { prompt: 0.0000025, completion: 0.00001 }
  },
  'anthropic/claude-3.5-sonnet': {
    name: 'Claude 3.5 Sonnet',
    context: 200000,
    pricing: { prompt: 0.000003, completion: 0.000015 }
  },
  'google/gemini-pro-1.5': {
    name: 'Gemini Pro 1.5',
    context: 2000000,
    pricing: { prompt: 0.00000125, completion: 0.000005 }
  }
}

// Request/Response schemas
const chatCompletionSchema = z.object({
  model: z.string(),
  messages: z.array(z.object({
    role: z.enum(['system', 'user', 'assistant']),
    content: z.string()
  })),
  temperature: z.number().min(0).max(2).default(0.7),
  max_tokens: z.number().max(4000).default(2000),
  stream: z.boolean().default(false)
})

const chatResponseSchema = z.object({
  id: z.string(),
  model: z.string(),
  choices: z.array(z.object({
    message: z.object({
      role: z.string(),
      content: z.string()
    }),
    finish_reason: z.string()
  })),
  usage: z.object({
    prompt_tokens: z.number(),
    completion_tokens: z.number(),
    total_tokens: z.number()
  })
})

export type ChatCompletionRequest = z.infer<typeof chatCompletionSchema>
export type ChatCompletionResponse = z.infer<typeof chatResponseSchema>

// OpenRouter Client Class
export class OpenRouterClient {
  private apiKey: string
  private baseUrl: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
    this.baseUrl = OPENROUTER_API_BASE
  }

  // Chat completion
  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://edgeforce-crm.rjbusinesssolutions.org',
        'X-Title': 'EdgeForce CRM'
      },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        temperature: request.temperature,
        max_tokens: request.max_tokens,
        stream: request.stream
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OpenRouter API error: ${response.status} - ${error}`)
    }

    const data = await response.json()
    return chatResponseSchema.parse(data)
  }

  // Streaming chat completion
  async *streamChat(request: ChatCompletionRequest): AsyncGenerator<string> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://edgeforce-crm.rjbusinesssolutions.org',
        'X-Title': 'EdgeForce CRM'
      },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        temperature: request.temperature,
        max_tokens: request.max_tokens,
        stream: true
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OpenRouter API error: ${response.status} - ${error}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('No response body')

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') return

          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices?.[0]?.delta?.content
            if (content) yield content
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }
  }

  // Get available models
  async listModels(): Promise<typeof OPENROUTER_MODELS> {
    const response = await fetch(`${this.baseUrl}/models`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    })

    if (!response.ok) {
      // Return default models if API fails
      return OPENROUTER_MODELS
    }

    const data = await response.json()
    return data.data || []
  }
}

// Factory function to create client from env
export function createOpenRouterClient(env: Env): OpenRouterClient | null {
  if (!env.OPENROUTER_API_KEY) {
    console.warn('OPENROUTER_API_KEY not configured')
    return null
  }
  return new OpenRouterClient(env.OPENROUTER_API_KEY)
}

// Helper to get best free model
export function getFreeModel(): string {
  return 'meta-llama/llama-3.1-8b-instruct'
}

// Helper to select model based on task
export function selectModel(task: 'chat' | 'reasoning' | 'fast' | 'quality'): string {
  const models = {
    chat: 'meta-llama/llama-3.1-8b-instruct',
    reasoning: 'anthropic/claude-3-haiku',
    fast: 'mistralai/mistral-7b-instruct',
    quality: 'openai/gpt-4o'
  }
  return models[task]
}