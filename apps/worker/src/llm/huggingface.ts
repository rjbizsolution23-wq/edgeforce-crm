// ============================================================================
// HuggingFace LLM Client
// Access 1000s of free models via Inference API
// ============================================================================

// Environment types
interface Env {
  DB: D1Database
  AI: Ai
  KV: KVNamespace
}

// HuggingFace Inference API configuration
const HUGGINGFACE_API_BASE = 'https://api-inference.huggingface.co/models'
const HUGGINGFACE_TOKEN = 'YOUR_HUGGINGFACE_TOKEN' // Set via wranger secret

// Popular free models on HuggingFace
export const HUGGINGFACE_MODELS = {
  // Text Generation
  'meta-llama/Llama-2-7b-chat-hf': {
    name: 'Llama 2 7B Chat',
    task: 'text-generation',
    context: 4096,
    free: true
  },
  'mistralai/Mistral-7B-v0.1': {
    name: 'Mistral 7B',
    task: 'text-generation',
    context: 8192,
    free: true
  },
  'bigscience/bloom-560m': {
    name: 'BLOOM 560M',
    task: 'text-generation',
    context: 2048,
    free: true
  },
  'EleutherAI/gpt-neo-2.7B': {
    name: 'GPT-Neo 2.7B',
    task: 'text-generation',
    context: 2048,
    free: true
  },
  'google/flan-t5-large': {
    name: 'FLAN-T5 Large',
    task: 'text2text-generation',
    context: 512,
    free: true
  },
  'microsoft/phi-2': {
    name: 'Phi-2',
    task: 'text-generation',
    context: 2048,
    free: true
  },

  // Embeddings
  'sentence-transformers/all-MiniLM-L6-v2': {
    name: 'MiniLM L6 Embeddings',
    task: 'feature-extraction',
    context: 512,
    free: true
  },
  'sentence-transformers/all-mpnet-base-v2': {
    name: 'MPNet Embeddings',
    task: 'feature-extraction',
    context: 512,
    free: true
  },

  // Vision
  'microsoft/resnet-50': {
    name: 'ResNet-50',
    task: 'image-classification',
    free: true
  },
  'Salesforce/blip-image-captioning-base': {
    name: 'BLIP Image Captioning',
    task: 'image-to-text',
    free: true
  },

  // Speech
  'facebook/wav2vec2-base': {
    name: 'Wav2Vec2',
    task: 'automatic-speech-recognition',
    free: true
  }
}

// Request/Response types
export interface HuggingFaceRequest {
  inputs: string | object
  parameters?: {
    temperature?: number
    max_new_tokens?: number
    top_p?: number
    top_k?: number
    return_full_text?: boolean
  }
}

export interface HuggingFaceResponse {
  // Text generation response
  generated_text?: string
  // Embedding response
  embedding?: number[]
  // Error response
  error?: string
}

// HuggingFace Client Class
export class HuggingFaceClient {
  private token: string
  private baseUrl: string

  constructor(token: string) {
    this.token = token
    this.baseUrl = HUGGINGFACE_API_BASE
  }

  // Text generation
  async generate(model: string, prompt: string, options: {
    temperature?: number
    max_new_tokens?: number
    top_p?: number
  } = {}): Promise<string> {
    const response = await fetch(`${this.baseUrl}/${model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          temperature: options.temperature ?? 0.7,
          max_new_tokens: options.max_new_tokens ?? 500,
          top_p: options.top_p ?? 0.9,
          return_full_text: false
        }
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`HuggingFace API error: ${response.status} - ${error}`)
    }

    const data = await response.json() as HuggingFaceResponse[]
    return data[0]?.generated_text || ''
  }

  // Get embeddings
  async embeddings(model: string, text: string): Promise<number[]> {
    const response = await fetch(`${this.baseUrl}/${model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: text
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`HuggingFace API error: ${response.status} - ${error}`)
    }

    const data = await response.json() as { embedding: number[] }[]
    return data[0]?.embedding || []
  }

  // Image captioning
  async imageCaption(model: string, imageUrl: string): Promise<string> {
    const response = await fetch(imageUrl)
    const imageBuffer = await response.arrayBuffer()

    const formData = new FormData()
    formData.append('file', new Blob([imageBuffer]), 'image.jpg')

    const apiResponse = await fetch(`${this.baseUrl}/${model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`
      },
      body: formData
    })

    if (!apiResponse.ok) {
      const error = await apiResponse.text()
      throw new Error(`HuggingFace API error: ${apiResponse.status} - ${error}`)
    }

    const data = await apiResponse.json() as { generated_text: string }[]
    return data[0]?.generated_text || ''
  }

  // List available models (filtered)
  async listModels(task?: string): Promise<typeof HUGGINGFACE_MODELS> {
    const url = task
      ? `https://huggingface.co/api/models?task=${task}&sort=downloads&direction=-1&limit=10`
      : 'https://huggingface.co/api/models?sort=downloads&direction=-1&limit=10'

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    })

    if (!response.ok) {
      return HUGGINGFACE_MODELS
    }

    const data = await response.json()
    return data
  }
}

// Factory function
export function createHuggingFaceClient(token: string): HuggingFaceClient {
  return new HuggingFaceClient(token)
}

// Helper to select best model for task
export function selectHuggingFaceModel(task: 'generation' | 'embeddings' | 'vision'): string {
  const models = {
    generation: 'meta-llama/Llama-2-7b-chat-hf',
    embeddings: 'sentence-transformers/all-MiniLM-L6-v2',
    vision: 'Salesforce/blip-image-captioning-base'
  }
  return models[task]
}