'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Plug,
  Check,
  X,
  ExternalLink,
  RefreshCw,
  Settings,
  Zap,
  Link2,
  CreditCard,
  MessageSquare,
  Calendar,
  ShoppingCart,
  FileText,
  Video,
  Mail,
  Phone,
  Users,
  BarChart3,
  AlertCircle,
  Clock
} from 'lucide-react'

interface Integration {
  id: string
  provider: string
  is_active: number
  created_at: string
}

const integrationProviders = [
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Payment processing and subscriptions',
    icon: CreditCard,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    category: 'payments',
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Team communication and notifications',
    icon: MessageSquare,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
    category: 'communication',
  },
  {
    id: 'google',
    name: 'Google Workspace',
    description: 'Calendar, Drive, and Gmail integration',
    icon: Calendar,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    category: 'productivity',
  },
  {
    id: 'shopify',
    name: 'Shopify',
    description: 'E-commerce and order management',
    icon: ShoppingCart,
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    category: 'ecommerce',
  },
  {
    id: 'quickbooks',
    name: 'QuickBooks',
    description: 'Accounting and invoicing',
    icon: FileText,
    color: 'text-green-600',
    bgColor: 'bg-green-600/20',
    category: 'accounting',
  },
  {
    id: 'zoom',
    name: 'Zoom',
    description: 'Video meetings and conferencing',
    icon: Video,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/20',
    category: 'communication',
  },
  {
    id: 'sendgrid',
    name: 'SendGrid',
    description: 'Email delivery and marketing',
    icon: Mail,
    color: 'text-teal-400',
    bgColor: 'bg-teal-500/20',
    category: 'email',
  },
  {
    id: 'twilio',
    name: 'Twilio',
    description: 'SMS, voice, and messaging',
    icon: Phone,
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    category: 'communication',
  },
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Connect 5,000+ apps with workflows',
    icon: Zap,
    color: 'text-orange-600',
    bgColor: 'bg-orange-600/20',
    category: 'automation',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    description: 'Business messaging and notifications',
    icon: MessageSquare,
    color: 'text-green-500',
    bgColor: 'bg-green-500/20',
    category: 'communication',
  },
  {
    id: 'telegram',
    name: 'Telegram',
    description: 'Bot notifications and messaging',
    icon: MessageSquare,
    color: 'text-sky-400',
    bgColor: 'bg-sky-500/20',
    category: 'communication',
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'Marketing automation and CRM sync',
    icon: Users,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/20',
    category: 'crm',
  },
]

export default function IntegrationsPage() {
  const queryClient = useQueryClient()
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  const { data: integrations, isLoading } = useQuery({
    queryKey: ['integrations'],
    queryFn: async () => {
      const res = await api.get('/integrations')
      return res.data as Integration[]
    },
  })

  const { data: syncLogs } = useQuery({
    queryKey: ['integration-sync-logs'],
    queryFn: async () => {
      const res = await api.get('/integration-sync-logs')
      return res.data as any[]
    },
  })

  const addIntegration = useMutation({
    mutationFn: async ({ provider, config }: { provider: string; config: any }) => {
      const res = await api.post('/integrations', { provider, ...config })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] })
    },
  })

  const updateIntegration = useMutation({
    mutationFn: async ({ provider, updates }: { provider: string; updates: any }) => {
      const res = await api.patch(`/integrations/${provider}`, updates)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] })
    },
  })

  const deleteIntegration = useMutation({
    mutationFn: async (provider: string) => {
      await api.delete(`/integrations/${provider}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] })
    },
  })

  const isConnected = (provider: string) => {
    return integrations?.some(i => i.provider === provider && i.is_active)
  }

  const categories = ['all', 'payments', 'communication', 'productivity', 'ecommerce', 'accounting', 'email', 'automation', 'crm']

  const filteredProviders = categoryFilter === 'all'
    ? integrationProviders
    : integrationProviders.filter(p => p.category === categoryFilter)

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white">Integrations</h1>
          <p className="text-slate-400">Connect your favorite tools and services</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Sync All
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <TabsList className="bg-slate-800">
            {categories.map(cat => (
              <TabsTrigger key={cat} value={cat} onClick={() => setCategoryFilter(cat)}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProviders.map((provider) => {
              const connected = isConnected(provider.id)
              const Icon = provider.icon

              return (
                <Card
                  key={provider.id}
                  className={`bg-slate-800 border-slate-700 transition-all ${
                    connected ? 'ring-2 ring-green-500/50' : ''
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl ${provider.bgColor} flex items-center justify-center`}>
                          <Icon className={`w-6 h-6 ${provider.color}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{provider.name}</h3>
                          <p className="text-xs text-slate-500 capitalize">{provider.category}</p>
                        </div>
                      </div>
                      {connected ? (
                        <Badge className="bg-green-500 text-white">
                          <Check className="w-3 h-3 mr-1" />
                          Connected
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-slate-600 text-slate-400">
                          Not Connected
                        </Badge>
                      )}
                    </div>

                    <p className="text-sm text-slate-400 mb-4">{provider.description}</p>

                    <div className="flex gap-2">
                      {connected ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => {
                              // Open configuration
                            }}
                          >
                            <Settings className="w-4 h-4 mr-2" />
                            Configure
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-400 border-red-900 hover:bg-red-900/20"
                            onClick={() => deleteIntegration.mutate(provider.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                          onClick={() => {
                            // Redirect to OAuth or show config
                            window.location.href = `/api/integrations/${provider.id}/auth`
                          }}
                        >
                          <Link2 className="w-4 h-4 mr-2" />
                          Connect
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Sync Logs */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-white mb-4">Recent Sync Activity</h2>
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-0">
                <div className="divide-y divide-slate-700">
                  {syncLogs?.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                      <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No sync activity yet</p>
                    </div>
                  ) : (
                    syncLogs?.map((log) => (
                      <div key={log.id} className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {log.status === 'success' ? (
                            <Check className="w-5 h-5 text-green-400" />
                          ) : log.status === 'failed' ? (
                            <X className="w-5 h-5 text-red-400" />
                          ) : (
                            <Clock className="w-5 h-5 text-yellow-400" />
                          )}
                          <div>
                            <p className="text-white font-medium capitalize">{log.integration_type} Sync</p>
                            <p className="text-xs text-slate-500">
                              {log.records_synced} records synced
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge
                            className={
                              log.status === 'success'
                                ? 'bg-green-500'
                                : log.status === 'failed'
                                ? 'bg-red-500'
                                : 'bg-yellow-500'
                            }
                          >
                            {log.status}
                          </Badge>
                          <p className="text-xs text-slate-500 mt-1">
                            {log.completed_at ? new Date(log.completed_at).toLocaleString() : 'In progress'}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Tabs>
    </div>
  )
}
