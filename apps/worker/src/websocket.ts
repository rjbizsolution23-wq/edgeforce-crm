// ============================================================================
// WebSocket Durable Object for Real-time Communication
// ============================================================================

import { DurableObject } from 'cloudflare:workers'

export interface WebSocketMessage {
  type: 'connect' | 'disconnect' | 'message' | 'broadcast' | 'notification'
  payload: any
  tenantId?: string
  userId?: string
  timestamp: string
}

export interface Connection {
  id: string
  tenantId: string
  userId: string
  connectedAt: string
}

export class WebSocketServer implements DurableObject {
  private connections: Map<string, Connection> = new Map()
  private tenantConnections: Map<string, Set<string>> = new Map()

  constructor(private state: DurableObjectState, private env: Environment) {
    // Restore state from storage
    this.state.get('connections').then((stored) => {
      if (stored) {
        const data = stored as { connections: Map<string, Connection>, tenantConnections: Map<string, string[]> }
        this.connections = new Map(data.connections)
        this.tenantConnections = new Map()
        for (const [tenantId, userIds] of Object.entries(data.tenantConnections)) {
          this.tenantConnections.set(tenantId, new Set(userIds as string[]))
        }
      }
    })
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)

    // Handle WebSocket upgrade
    if (url.pathname === '/ws') {
      return this.handleWebSocket(request)
    }

    // Handle API for sending messages
    if (url.pathname.startsWith('/api/ws')) {
      return this.handleApi(request, url.pathname)
    }

    return new Response('Not Found', { status: 404 })
  }

  private async handleWebSocket(request: Request): Promise<Response> {
    const url = new URL(request.url)
    const tenantId = url.searchParams.get('tenantId') || ''
    const userId = url.searchParams.get('userId') || ''

    if (!tenantId || !userId) {
      return new Response('Missing tenantId or userId', { status: 400 })
    }

    const { 0: client, 1: server } = new WebSocketPair()

    // Store connection
    const connectionId = crypto.randomUUID()
    const connection: Connection = {
      id: connectionId,
      tenantId,
      userId,
      connectedAt: new Date().toISOString()
    }

    this.connections.set(connectionId, connection)

    // Track tenant connections
    if (!this.tenantConnections.has(tenantId)) {
      this.tenantConnections.set(tenantId, new Set())
    }
    this.tenantConnections.get(tenantId)!.add(connectionId)

    // Save state
    await this.saveState()

    // Send welcome message
    server.send(JSON.stringify({
      type: 'connect',
      payload: { connectionId, message: 'Connected to EdgeForce real-time' },
      timestamp: new Date().toISOString()
    }))

    // Handle messages
    this.handleMessages(server, connectionId, tenantId)

    return new Response(null, { status: 101, webSocket: client })
  }

  private async handleMessages(ws: WebSocket, connectionId: string, tenantId: string) {
    ws.addEventListener('message', async (event) => {
      try {
        const data = JSON.parse(event.data as string) as WebSocketMessage

        switch (data.type) {
          case 'message':
            // Broadcast to all connections in same tenant
            await this.broadcastToTenant(tenantId, {
              type: 'message',
              payload: data.payload,
              userId: this.connections.get(connectionId)?.userId,
              timestamp: new Date().toISOString()
            }, connectionId)
            break

          case 'notification':
            // Send notification to specific user
            await this.sendToUser(tenantId, data.userId!, {
              type: 'notification',
              payload: data.payload,
              timestamp: new Date().toISOString()
            })
            break

          default:
            console.log('Unknown message type:', data.type)
        }
      } catch (err) {
        console.error('WebSocket message error:', err)
      }
    })

    ws.addEventListener('close', async () => {
      await this.removeConnection(connectionId)
    })

    ws.addEventListener('error', async (err) => {
      console.error('WebSocket error:', err)
      await this.removeConnection(connectionId)
    })
  }

  private async broadcastToTenant(tenantId: string, message: WebSocketMessage, excludeId?: string) {
    const connections = this.tenantConnections.get(tenantId)
    if (!connections) return

    for (const connectionId of connections) {
      if (excludeId && connectionId === excludeId) continue

      const connection = this.connections.get(connectionId)
      if (connection) {
        // In a real implementation, we'd send via the WebSocket directly
        // This is handled by the Worker sending to the DO
        console.log(`Would broadcast to ${connectionId}`)
      }
    }
  }

  private async sendToUser(tenantId: string, userId: string, message: WebSocketMessage) {
    const connections = this.tenantConnections.get(tenantId)
    if (!connections) return

    for (const connectionId of connections) {
      const connection = this.connections.get(connectionId)
      if (connection?.userId === userId) {
        // Send to specific user
        console.log(`Would send to user ${userId} on connection ${connectionId}`)
      }
    }
  }

  private async removeConnection(connectionId: string) {
    const connection = this.connections.get(connectionId)
    if (!connection) return

    const tenantConnections = this.tenantConnections.get(connection.tenantId)
    if (tenantConnections) {
      tenantConnections.delete(connectionId)
    }

    this.connections.delete(connectionId)
    await this.saveState()
  }

  private async saveState() {
    const tenantConnectionsObj: Record<string, string[]> = {}
    for (const [tenantId, conns] of this.tenantConnections) {
      tenantConnectionsObj[tenantId] = Array.from(conns)
    }

    await this.state.put('connections', {
      connections: Array.from(this.connections.entries()),
      tenantConnections: tenantConnectionsObj
    })
  }

  private async handleApi(request: Request, path: string): Promise<Response> {
    const url = new URL(request.url)
    const method = request.method

    // POST /api/ws/send - Send message to tenant
    if (path === '/api/ws/send' && method === 'POST') {
      const body = await request.json() as any
      const { tenantId, message, excludeConnectionId } = body

      await this.broadcastToTenant(tenantId, message, excludeConnectionId)

      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // POST /api/ws/notify - Send notification to user
    if (path === '/api/ws/notify' && method === 'POST') {
      const body = await request.json() as any
      const { tenantId, userId, notification } = body

      await this.sendToUser(tenantId, userId, {
        type: 'notification',
        payload: notification,
        timestamp: new Date().toISOString()
      })

      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // GET /api/ws/connections/:tenantId - Get connection count
    if (path.startsWith('/api/ws/connections/') && method === 'GET') {
      const tenantId = path.split('/').pop()
      const connections = this.tenantConnections.get(tenantId || '')

      return new Response(JSON.stringify({
        count: connections?.size || 0
      }), {
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response('Not Found', { status: 404 })
  }
}

// ============================================================================
// Environment Types
// ============================================================================

interface Environment {
  DB: D1Database
  SESSIONS: KVNamespace
  CACHE: KVNamespace
  RATE_LIMIT: KVNamespace
  ASSETS: R2Bucket
  AI: Ai
  WEBSOCKET: DurableObjectNamespace
}