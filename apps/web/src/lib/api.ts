const API_BASE = 'https://edgeforce-crm-worker.rickjefferson.workers.dev'

interface ApiResponse<T> {
  data?: T
  error?: string
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

class ApiClient {
  private token: string | null = null

  setToken(token: string) {
    this.token = token
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token)
    }
  }

  getToken(): string | null {
    if (this.token) return this.token
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token')
    }
    return null
  }

  clearToken() {
    this.token = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('refreshToken')
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = this.getToken()
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
      })

      const data = await response.json()

      if (!response.ok) {
        return { error: data.error || 'Request failed' }
      }

      return data
    } catch (error) {
      return { error: 'Network error. Please try again.' }
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const result = await this.request<{
      token: string
      refreshToken: string
      user: { id: string; email: string; firstName: string; lastName: string; tenantId: string }
    }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })

    if (result.data) {
      this.setToken(result.data.token)
      if (typeof window !== 'undefined') {
        localStorage.setItem('refreshToken', result.data.refreshToken)
        localStorage.setItem('user', JSON.stringify(result.data.user))
      }
    }

    return result
  }

  async register(data: {
    email: string
    password: string
    firstName: string
    lastName: string
    companyName?: string
  }) {
    const result = await this.request<{
      token: string
      refreshToken: string
      user: { id: string; email: string; firstName: string; lastName: string; tenantId: string }
    }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })

    if (result.data) {
      this.setToken(result.data.token)
      if (typeof window !== 'undefined') {
        localStorage.setItem('refreshToken', result.data.refreshToken)
        localStorage.setItem('user', JSON.stringify(result.data.user))
      }
    }

    return result
  }

  async refreshToken() {
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null
    if (!refreshToken) return { error: 'No refresh token' }

    const result = await this.request<{ token: string }>('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    })

    if (result.data) {
      this.setToken(result.data.token)
    }

    return result
  }

  logout() {
    this.clearToken()
  }

  // Contacts
  async getContacts(params?: {
    page?: number
    limit?: number
    search?: string
    status?: string
  }) {
    const query = new URLSearchParams()
    if (params?.page) query.set('page', String(params.page))
    if (params?.limit) query.set('limit', String(params.limit))
    if (params?.search) query.set('search', params.search)
    if (params?.status) query.set('status', params.status)

    const queryString = query.toString()
    return this.request<any[]>(`/api/contacts${queryString ? `?${queryString}` : ''}`)
  }

  async getContact(id: string) {
    return this.request<any>(`/api/contacts/${id}`)
  }

  async createContact(data: {
    firstName: string
    lastName: string
    email?: string
    phone?: string
    company?: string
    jobTitle?: string
  }) {
    return this.request<any>('/api/contacts', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Deals
  async getDeals(pipelineId?: string) {
    const query = pipelineId ? `?pipelineId=${pipelineId}` : ''
    return this.request<any[]>(`/api/deals${query}`)
  }

  async createDeal(data: {
    name: string
    pipelineId: string
    stage: string
    contactId?: string
    value?: number
    expectedCloseDate?: string
    probability?: number
  }) {
    return this.request<any>('/api/deals', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateDealStage(id: string, stage: string, probability?: number) {
    return this.request<any>(`/api/deals/${id}/stage`, {
      method: 'PATCH',
      body: JSON.stringify({ stage, probability }),
    })
  }

  // Pipelines
  async getPipelines() {
    return this.request<any[]>('/api/pipelines')
  }

  // Tasks
  async getTasks(params?: { status?: string; assignedTo?: string }) {
    const query = new URLSearchParams()
    if (params?.status) query.set('status', params.status)
    if (params?.assignedTo) query.set('assignedTo', params.assignedTo)

    const queryString = query.toString()
    return this.request<any[]>(`/api/tasks${queryString ? `?${queryString}` : ''}`)
  }

  async createTask(data: {
    title: string
    type?: string
    priority?: string
    dueDate?: string
    assignedTo?: string
    contactId?: string
    dealId?: string
  }) {
    return this.request<any>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateTask(id: string, data: { status?: string; completed?: boolean }) {
    return this.request<any>(`/api/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  // Analytics
  async getDashboard() {
    return this.request<{
      contacts: { total: number; newThisMonth: number }
      deals: { total: number; open: number; pipelineValue: number; wonThisMonth: number; revenueThisMonth: number }
      tasks: { pending: number; overdue: number }
      recentActivity: any[]
    }>('/api/analytics/dashboard')
  }

  // AI Lead Scoring
  async scoreLead(contactId: string) {
    return this.request<{
      contactId: string
      aiScore: number
      grade: string
      factors: string[]
      recommendations: string[]
    }>('/api/ai/score-lead', {
      method: 'POST',
      body: JSON.stringify({ contactId }),
    })
  }

  // Team
  async getTeam() {
    return this.request<any[]>('/api/team')
  }

  async inviteTeamMember(data: {
    email: string
    role: 'admin' | 'manager' | 'member' | 'viewer'
    firstName: string
    lastName: string
  }) {
    return this.request<{ id: string; email: string; role: string; tempPassword: string }>(
      '/api/team/invite',
      { method: 'POST', body: JSON.stringify(data) }
    )
  }

  // Email Templates
  async getEmailTemplates() {
    return this.request<any[]>('/api/email-templates')
  }

  async createEmailTemplate(data: {
    name: string
    subject: string
    body: string
    category?: string
  }) {
    return this.request<any>('/api/email-templates', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateEmailTemplate(id: string, data: any) {
    return this.request<any>(`/api/email-templates/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteEmailTemplate(id: string) {
    return this.request<any>(`/api/email-templates/${id}`, {
      method: 'DELETE',
    })
  }

  // Email Sequences
  async getEmailSequences() {
    return this.request<any[]>('/api/email-sequences')
  }

  async createEmailSequence(data: {
    name: string
    subject: string
    body: string
    delayDays?: number
    trigger?: string
  }) {
    return this.request<any>('/api/email-sequences', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateEmailSequence(id: string, data: any) {
    return this.request<any>(`/api/email-sequences/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteEmailSequence(id: string) {
    return this.request<any>(`/api/email-sequences/${id}`, {
      method: 'DELETE',
    })
  }

  // Automations / Workflows
  async getAutomations() {
    return this.request<any[]>('/api/automations')
  }

  async createAutomation(data: {
    name: string
    trigger: string
    triggerConfig?: any
    actions: any[]
    conditions?: any[]
  }) {
    return this.request<any>('/api/automations', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateAutomation(id: string, data: any) {
    return this.request<any>(`/api/automations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteAutomation(id: string) {
    return this.request<any>(`/api/automations/${id}`, {
      method: 'DELETE',
    })
  }

  // Forms
  async getForms() {
    return this.request<any[]>('/api/forms')
  }

  async createForm(data: {
    name: string
    fields?: any[]
    style?: any
    redirectUrl?: string
    thankYouMessage?: string
  }) {
    return this.request<any>('/api/forms', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateForm(id: string, data: any) {
    return this.request<any>(`/api/forms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteForm(id: string) {
    return this.request<any>(`/api/forms/${id}`, {
      method: 'DELETE',
    })
  }

  // SMS
  async getSmsTemplates() {
    return this.request<any[]>('/api/sms/templates')
  }

  async createSmsTemplate(data: { name: string; content: string; variables?: string[] }) {
    return this.request<any>('/api/sms/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getSmsCampaigns() {
    return this.request<any[]>('/api/sms/campaigns')
  }

  async createSmsCampaign(data: { name: string; templateId: string; audienceFilter?: any; scheduledAt?: string }) {
    return this.request<any>('/api/sms/campaigns', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getSmsLogs() {
    return this.request<any[]>('/api/sms/logs')
  }

  // AI Assistant
  async aiChat(message: string, context?: any) {
    return this.request<{ reply: string; timestamp: string; model: string }>('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, context }),
    })
  }

  async aiEmailWriter(type: 'follow-up' | 'cold-outreach' | 'welcome' | 'closing', contactName: string, context?: any) {
    return this.request<{ subject: string; body: string; type: string }>('/api/ai/email-writer', {
      method: 'POST',
      body: JSON.stringify({ type, contactName, context }),
    })
  }

  // Calendar & Bookings
  async getCalendarAvailability() {
    return this.request<any[]>('/api/calendar/availability')
  }

  async setCalendarAvailability(data: { dayOfWeek: number; startTime: string; endTime: string; isAvailable?: boolean }) {
    return this.request<any>('/api/calendar/availability', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async createBooking(data: {
    contactName: string
    contactEmail: string
    contactPhone?: string
    startTime: string
    endTime: string
    meetingType: 'video' | 'phone' | 'in-person'
    notes?: string
  }) {
    return this.request<any>('/api/calendar/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Calls
  async getCalls() {
    return this.request<any[]>('/api/calls')
  }

  async logCall(data: {
    contactId?: string
    direction: 'inbound' | 'outbound'
    duration?: number
    status: 'completed' | 'missed' | 'voicemail'
    notes?: string
  }) {
    return this.request<any>('/api/calls', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Meetings
  async getMeetings() {
    return this.request<any[]>('/api/meetings')
  }

  async createMeeting(data: {
    title: string
    startTime: string
    endTime: string
    contactId?: string
    attendees?: string[]
    meetingLink?: string
    notes?: string
  }) {
    return this.request<any>('/api/meetings', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Reviews
  async getReviews() {
    return this.request<any[]>('/api/reviews')
  }

  async respondToReview(reviewId: string, response: string) {
    return this.request<any>('/api/reviews/respond', {
      method: 'POST',
      body: JSON.stringify({ reviewId, response }),
    })
  }

  async requestReview(contactId: string, method: 'email' | 'sms') {
    return this.request<any>('/api/reviews/requests', {
      method: 'POST',
      body: JSON.stringify({ contactId, method }),
    })
  }

  // Agency / White-Label
  async getAgencyAccounts() {
    return this.request<any[]>('/api/agency/accounts')
  }

  async createAgencyAccount(data: {
    name: string
    domain: string
    ownerEmail: string
    ownerName: string
    plan: 'starter' | 'professional' | 'enterprise'
    primaryColor?: string
  }) {
    return this.request<any>('/api/agency/accounts', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Helpdesk / Support Tickets (internal)
  async getHelpdeskTickets(params?: { status?: string; priority?: string; assignedTo?: string }) {
    const query = new URLSearchParams()
    if (params?.status) query.set('status', params.status)
    if (params?.priority) query.set('priority', params.priority)
    if (params?.assignedTo) query.set('assignedTo', params.assignedTo)
    const queryString = query.toString()
    return this.request<any[]>(`/api/helpdesk/tickets${queryString ? `?${queryString}` : ''}`)
  }

  async createHelpdeskTicket(data: {
    subject: string
    description?: string
    priority?: string
    category?: string
    contactId?: string
  }) {
    return this.request<any>('/api/helpdesk/tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getHelpdeskTicket(id: string) {
    return this.request<any>(`/api/helpdesk/tickets/${id}`)
  }

  async updateHelpdeskTicket(id: string, data: any) {
    return this.request<any>(`/api/helpdesk/tickets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async getHelpdeskTicketMessages(ticketId: string) {
    return this.request<any[]>(`/api/helpdesk/tickets/${ticketId}/messages`)
  }

  async addHelpdeskTicketMessage(ticketId: string, data: { content: string; isInternal?: boolean }) {
    return this.request<any>(`/api/helpdesk/tickets/${ticketId}/messages`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getHelpdeskTeams() {
    return this.request<any[]>('/api/helpdesk/teams')
  }

  async getHelpdeskSlaPolicies() {
    return this.request<any[]>('/api/helpdesk/sla-policies')
  }

  async getKnowledgeBaseArticles(params?: { category?: string; search?: string }) {
    const query = new URLSearchParams()
    if (params?.category) query.set('category', params.category)
    if (params?.search) query.set('search', params.search)
    const queryString = query.toString()
    return this.request<any[]>('/api/helpdesk/kb/articles' + (queryString ? `?${queryString}` : ''))
  }

  // Live Chat (internal)
  async getLiveChatSessions(params?: { status?: string }) {
    const query = new URLSearchParams()
    if (params?.status) query.set('status', params.status)
    const queryString = query.toString()
    return this.request<any[]>(`/api/live-chat/sessions${queryString ? `?${queryString}` : ''}`)
  }

  async getLiveChatSession(id: string) {
    return this.request<any>(`/api/live-chat/sessions/${id}`)
  }

  async getLiveChatMessages(sessionId: string) {
    return this.request<any[]>(`/api/live-chat/sessions/${sessionId}/messages`)
  }

  async sendLiveChatMessage(sessionId: string, data: { content: string }) {
    return this.request<any>(`/api/live-chat/sessions/${sessionId}/messages`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getLiveChatWidgets() {
    return this.request<any[]>('/api/live-chat/widgets')
  }

  async createLiveChatWidget(data: { name: string; config?: any }) {
    return this.request<any>('/api/live-chat/widgets', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // AI Chatbots (internal)
  async getChatbots() {
    return this.request<any[]>('/api/chatbots')
  }

  async createChatbot(data: {
    name: string
    welcomeMessage?: string
    isActive?: boolean
  }) {
    return this.request<any>('/api/chatbots', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getChatbotFlows(chatbotId: string) {
    return this.request<any[]>(`/api/chatbots/${chatbotId}/flows`)
  }

  async updateChatbot(id: string, data: any) {
    return this.request<any>(`/api/chatbots/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteChatbot(id: string) {
    return this.request<any>(`/api/chatbots/${id}`, {
      method: 'DELETE',
    })
  }

  // Integrations
  async getIntegrations() {
    return this.request<any[]>('/api/integrations')
  }

  async connectIntegration(provider: string, config?: any) {
    return this.request<any>(`/api/integrations/${provider}`, {
      method: 'POST',
      body: JSON.stringify(config || {}),
    })
  }

  async updateIntegration(provider: string, data: any) {
    return this.request<any>(`/api/integrations/${provider}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async disconnectIntegration(provider: string) {
    return this.request<any>(`/api/integrations/${provider}`, {
      method: 'DELETE',
    })
  }

  async getIntegrationSyncLogs() {
    return this.request<any[]>('/api/integration-sync-logs')
  }

  // Workflows
  async getWorkflowTemplates() {
    return this.request<any[]>('/api/workflows/templates')
  }

  async createWorkflowTemplate(data: {
    name: string
    description?: string
    trigger: string
    steps: any[]
  }) {
    return this.request<any>('/api/workflows/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getWorkflowExecutions(params?: { status?: string }) {
    const query = new URLSearchParams()
    if (params?.status) query.set('status', params.status)
    const queryString = query.toString()
    return this.request<any[]>(`/api/workflows/executions${queryString ? `?${queryString}` : ''}`)
  }

  async getWorkflowStats() {
    return this.request<any>('/api/workflows/stats')
  }

// Public Portal API (no auth required)
  async getPublicKnowledgeBase(params?: { category?: string; search?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams()
    if (params?.category) query.set('category', params.category)
    if (params?.search) query.set('search', params.search)
    if (params?.page) query.set('page', String(params.page))
    if (params?.limit) query.set('limit', String(params.limit || 10))
    const queryString = query.toString()
    return this.request<any[]>(`/api/public/kb/articles${queryString ? `?${queryString}` : ''}`)
  }

  async getPublicArticle(id: string) {
    return this.request<any>(`/api/public/kb/articles/${id}`)
  }

  async getPublicKnowledgeBaseCategories() {
    return this.request<any[]>('/api/public/kb/categories')
  }

  async submitPublicTicket(data: {
    subject: string
    description?: string
    email: string
    name: string
    category?: string
    priority?: string
  }) {
    return this.request<{ id: string; ticket_number: string; status: string }>('/api/public/tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getPublicTicketStatus(ticketNumber: string, email: string) {
    return this.request<any>(`/api/public/tickets/${ticketNumber}?email=${encodeURIComponent(email)}`)
  }

  // Quotes
  async getQuotes(params?: { status?: string; search?: string }) {
    return this.request<{ data: any[] }>('/api/quotes', { params })
  }

  async getQuote(id: string) {
    return this.request<any>(`/api/quotes/${id}`)
  }

  async createQuote(data: {
    title: string
    clientId: string
    items: { description: string; quantity: number; unitPrice: number }[]
    validUntil: string
    notes?: string
  }) {
    return this.request<any>('/api/quotes', { method: 'POST', body: data })
  }

  async updateQuote(id: string, data: any) {
    return this.request<any>(`/api/quotes/${id}`, { method: 'PUT', body: data })
  }

  async deleteQuote(id: string) {
    return this.request<any>(`/api/quotes/${id}`, { method: 'DELETE' })
  }

  async sendQuote(id: string) {
    return this.request<any>(`/api/quotes/${id}/send`, { method: 'POST' })
  }

  async duplicateQuote(id: string) {
    return this.request<any>(`/api/quotes/${id}/duplicate`, { method: 'POST' })
  }

  // Invoices
  async getInvoices(params?: { status?: string; search?: string }) {
    return this.request<{ data: any[] }>('/api/invoices', { params })
  }

  async getInvoice(id: string) {
    return this.request<any>(`/api/invoices/${id}`)
  }

  async createInvoice(data: {
    title: string
    quoteId?: string
    clientId: string
    items: { description: string; quantity: number; unitPrice: number }[]
    issueDate: string
    dueDate: string
    notes?: string
  }) {
    return this.request<any>('/api/invoices', { method: 'POST', body: data })
  }

  async updateInvoice(id: string, data: any) {
    return this.request<any>(`/api/invoices/${id}`, { method: 'PUT', body: data })
  }

  async deleteInvoice(id: string) {
    return this.request<any>(`/api/invoices/${id}`, { method: 'DELETE' })
  }

  async sendInvoice(id: string) {
    return this.request<any>(`/api/invoices/${id}/send`, { method: 'POST' })
  }

  async markInvoicePaid(id: string) {
    return this.request<any>(`/api/invoices/${id}/paid`, { method: 'POST' })
  }

  // Payments
  async getPayments(invoiceId: string) {
    return this.request<any[]>(`/api/payments/invoice/${invoiceId}`)
  }

  async createPayment(data: { invoiceId: string; amount: number }) {
    return this.request<any>('/api/payments', { method: 'POST', body: data })
  }

  // Notifications
  async getNotifications(params?: { limit?: number; unread?: boolean }) {
    const query = new URLSearchParams()
    if (params?.limit) query.set('limit', String(params.limit))
    if (params?.unread) query.set('unread', 'true')
    const queryString = query.toString()
    return this.request<{ data: any[]; unreadCount: number }>(`/api/notifications${queryString ? `?${queryString}` : ''}`)
  }

  async createNotification(data: {
    userId: string
    type: string
    title: string
    message?: string
    data?: Record<string, unknown>
    actionUrl?: string
  }) {
    return this.request<any>('/api/notifications', { method: 'POST', body: data })
  }

  async markNotificationRead(notificationId: string) {
    return this.request<any>(`/api/notifications/${notificationId}/read`, { method: 'PUT' })
  }

  async markAllNotificationsRead() {
    return this.request<any>('/api/notifications/read-all', { method: 'POST' })
  }

  async deleteNotification(notificationId: string) {
    return this.request<any>(`/api/notifications/${notificationId}`, { method: 'DELETE' })
  }

  // Push Subscriptions
  async subscribeToPush(data: { endpoint: string; keys_p256dh: string; keys_auth: string; expiresAt?: string }) {
    return this.request<any>('/api/push/subscribe', { method: 'POST', body: data })
  }

  async unsubscribeFromPush(endpoint: string) {
    return this.request<any>('/api/push/unsubscribe', { method: 'DELETE', body: { endpoint } })
  }

  // Stripe
  async createStripeCheckout(priceId: string) {
    return this.request<{ sessionId: string; url: string }>('/api/stripe/checkout', {
      method: 'POST',
      body: { priceId },
    })
  }

  async createStripePortal() {
    return this.request<{ url: string }>('/api/stripe/portal', { method: 'POST' })
  }

  async getSubscriptionStatus() {
    return this.request<{ data: { plan: string; status: string; expiresAt?: string; customerId?: string } }>(
      '/api/stripe/subscription'
    )
  }

  // Check auth status
  isAuthenticated(): boolean {
    return !!this.getToken()
  }

  getUser(): { id: string; email: string; firstName: string; lastName: string; tenantId: string } | null {
    if (typeof window === 'undefined') return null
    const userStr = localStorage.getItem('user')
    return userStr ? JSON.parse(userStr) : null
  }
}

export const api = new ApiClient()
export default api