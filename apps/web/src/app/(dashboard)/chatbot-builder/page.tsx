'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Bot,
  MessageSquare,
  Zap,
  Settings,
  Play,
  Pause,
  Trash2,
  Copy,
  ExternalLink,
  Plus,
  MessageCircle,
  Brain,
  Layers,
  BarChart3,
  ChevronRight,
  Edit,
  Code,
  Eye
} from 'lucide-react'

interface Chatbot {
  id: string
  name: string
  description: string
  welcome_message: string
  fallback_message: string
  tone: string
  language: string
  is_active: number
  is_public: number
  version: number
  created_at: string
}

interface ChatbotFlow {
  id: string
  name: string
  trigger: string
  trigger_type: string
  response: string
  is_default: number
  priority: number
  is_active: number
}

export default function ChatbotBuilderPage() {
  const queryClient = useQueryClient()
  const [selectedChatbot, setSelectedChatbot] = useState<Chatbot | null>(null)
  const [showNewBotDialog, setShowNewBotDialog] = useState(false)
  const [showFlowDialog, setShowFlowDialog] = useState(false)
  const [newBot, setNewBot] = useState({
    name: '',
    description: '',
    welcome_message: 'Hi! How can I help you today?',
    fallback_message: 'Let me connect you with an agent.',
    tone: 'professional',
    language: 'en',
    is_public: false,
  })
  const [newFlow, setNewFlow] = useState({
    name: '',
    trigger: '',
    trigger_type: 'keyword',
    response: '',
    is_default: false,
    priority: 0,
  })

  const { data: chatbots, isLoading: chatbotsLoading } = useQuery({
    queryKey: ['ai-chatbots'],
    queryFn: async () => {
      const res = await api.get('/ai-chatbots')
      return res.data as Chatbot[]
    },
  })

  const { data: flows, isLoading: flowsLoading } = useQuery({
    queryKey: ['ai-chatbot-flows', selectedChatbot?.id],
    queryFn: async () => {
      if (!selectedChatbot) return []
      const res = await api.get(`/ai-chatbots/${selectedChatbot.id}/flows`)
      return res.data as ChatbotFlow[]
    },
    enabled: !!selectedChatbot,
  })

  const { data: conversations } = useQuery({
    queryKey: ['ai-chatbot-conversations', selectedChatbot?.id],
    queryFn: async () => {
      if (!selectedChatbot) return []
      const res = await api.get(`/ai-chatbots/${selectedChatbot.id}/conversations`)
      return res.data as any[]
    },
    enabled: !!selectedChatbot,
  })

  const createBot = useMutation({
    mutationFn: async (bot: typeof newBot) => {
      const res = await api.post('/ai-chatbots', bot)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-chatbots'] })
      setShowNewBotDialog(false)
      setNewBot({
        name: '',
        description: '',
        welcome_message: 'Hi! How can I help you today?',
        fallback_message: 'Let me connect you with an agent.',
        tone: 'professional',
        language: 'en',
        is_public: false,
      })
    },
  })

  const createFlow = useMutation({
    mutationFn: async (flow: typeof newFlow) => {
      if (!selectedChatbot) return
      const res = await api.post(`/ai-chatbots/${selectedChatbot.id}/flows`, flow)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-chatbot-flows', selectedChatbot?.id] })
      setShowFlowDialog(false)
      setNewFlow({ name: '', trigger: '', trigger_type: 'keyword', response: '', is_default: false, priority: 0 })
    },
  })

  const updateBot = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const res = await api.patch(`/ai-chatbots/${id}`, updates)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-chatbots'] })
    },
  })

  const deleteBot = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/ai-chatbots/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-chatbots'] })
      setSelectedChatbot(null)
    },
  })

  const getEmbedCode = (botId: string) => {
    return `<script src="https://edgeforce-crm.com/chatbot.js" data-bot-id="${botId}"></script>`
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white">AI Chatbot Builder</h1>
          <p className="text-slate-400">Create intelligent AI-powered chatbots</p>
        </div>
        <Dialog open={showNewBotDialog} onOpenChange={setShowNewBotDialog}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Chatbot
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-800">
            <DialogHeader>
              <DialogTitle>Create New Chatbot</DialogTitle>
              <DialogDescription>Configure your AI assistant</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400">Name</label>
                <Input
                  value={newBot.name}
                  onChange={(e) => setNewBot({ ...newBot, name: e.target.value })}
                  placeholder="Customer Support Bot"
                  className="bg-slate-800 border-slate-700"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400">Description</label>
                <Textarea
                  value={newBot.description}
                  onChange={(e) => setNewBot({ ...newBot, description: e.target.value })}
                  placeholder="Describe what this chatbot does..."
                  className="bg-slate-800 border-slate-700"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400">Welcome Message</label>
                <Textarea
                  value={newBot.welcome_message}
                  onChange={(e) => setNewBot({ ...newBot, welcome_message: e.target.value })}
                  className="bg-slate-800 border-slate-700"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400">Fallback Message</label>
                <Textarea
                  value={newBot.fallback_message}
                  onChange={(e) => setNewBot({ ...newBot, fallback_message: e.target.value })}
                  className="bg-slate-800 border-slate-700"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-400">Tone</label>
                  <Select value={newBot.tone} onValueChange={(v) => setNewBot({ ...newBot, tone: v })}>
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="formal">Formal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm text-slate-400">Language</label>
                  <Select value={newBot.language} onValueChange={(v) => setNewBot({ ...newBot, language: v })}>
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewBotDialog(false)}>Cancel</Button>
              <Button
                className="bg-indigo-600 hover:bg-indigo-700"
                onClick={() => createBot.mutate(newBot)}
                disabled={!newBot.name || createBot.isPending}
              >
                {createBot.isPending ? 'Creating...' : 'Create Chatbot'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="chatbots" className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <TabsList className="bg-slate-800">
            <TabsTrigger value="chatbots">Chatbots</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="chatbots" className="flex-1 flex overflow-hidden m-0">
          {/* Chatbots List */}
          <div className="w-1/3 border-r border-slate-800 overflow-y-auto">
            {chatbotsLoading ? (
              <div className="p-4 space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-32 bg-slate-800" />
                ))}
              </div>
            ) : chatbots?.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <Bot className="w-12 h-12 mb-4" />
                <p>No chatbots yet</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setShowNewBotDialog(true)}
                >
                  Create your first chatbot
                </Button>
              </div>
            ) : (
              chatbots?.map((bot) => (
                <div
                  key={bot.id}
                  onClick={() => setSelectedChatbot(bot)}
                  className={`p-4 border-b border-slate-800 cursor-pointer hover:bg-slate-800/50 ${
                    selectedChatbot?.id === bot.id ? 'bg-slate-800' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                        <Bot className="w-5 h-5 text-indigo-400" />
                      </div>
                      <div>
                        <h3 className="font-medium text-white">{bot.name}</h3>
                        <p className="text-xs text-slate-500">v{bot.version}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Badge className={bot.is_active ? 'bg-green-500' : 'bg-gray-500'} text-white>
                        {bot.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      {bot.is_public ? (
                        <Badge variant="outline" className="border-indigo-500 text-indigo-400">
                          Public
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                  <p className="text-sm text-slate-400 line-clamp-2">{bot.description}</p>
                </div>
              ))
            )}
          </div>

          {/* Chatbot Detail */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {selectedChatbot ? (
              <>
                <Tabs defaultValue="flows" className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex items-center justify-between p-4 border-b border-slate-800">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                        <Bot className="w-6 h-6 text-indigo-400" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white">{selectedChatbot.name}</h2>
                        <p className="text-sm text-slate-400">{selectedChatbot.description}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateBot.mutate({
                          id: selectedChatbot.id,
                          updates: { is_active: !selectedChatbot.is_active }
                        })}
                      >
                        {selectedChatbot.is_active ? (
                          <><Pause className="w-4 h-4 mr-2" /> Pause</>
                        ) : (
                          <><Play className="w-4 h-4 mr-2" /> Activate</>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-400 border-red-900 hover:bg-red-900/20"
                        onClick={() => deleteBot.mutate(selectedChatbot.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 border-b border-slate-800">
                    <TabsList className="bg-slate-800">
                      <TabsTrigger value="flows">Flows</TabsTrigger>
                      <TabsTrigger value="settings">Settings</TabsTrigger>
                      <TabsTrigger value="embed">Embed</TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="flows" className="flex-1 flex overflow-hidden m-0">
                    <div className="flex-1 p-6 overflow-y-auto">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white">Conversation Flows</h3>
                        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setShowFlowDialog(true)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Flow
                        </Button>
                      </div>

                      {flowsLoading ? (
                        <div className="space-y-3">
                          {[...Array(3)].map((_, i) => (
                            <Skeleton key={i} className="h-24 bg-slate-800" />
                          ))}
                        </div>
                      ) : flows?.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                          <Layers className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>No flows configured yet</p>
                          <p className="text-sm">Add conversation flows to handle different scenarios</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {flows?.map((flow) => (
                            <Card key={flow.id} className="bg-slate-800 border-slate-700">
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    {flow.is_default ? (
                                      <Badge className="bg-indigo-500 text-white">Default</Badge>
                                    ) : (
                                      <Badge variant="outline">{flow.priority}</Badge>
                                    )}
                                    <div>
                                      <h4 className="font-medium text-white">{flow.name}</h4>
                                      <p className="text-xs text-slate-500">
                                        {flow.trigger_type}: "{flow.trigger}"
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Badge className={flow.is_active ? 'bg-green-500' : 'bg-gray-500'} text-white>
                                      {flow.is_active ? 'Active' : 'Inactive'}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="mt-3 p-3 bg-slate-900 rounded-lg">
                                  <p className="text-sm text-slate-400">{flow.response}</p>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="settings" className="flex-1 p-6 overflow-y-auto m-0">
                    <Card className="bg-slate-800 border-slate-700 max-w-2xl">
                      <CardHeader>
                        <CardTitle className="text-white">Chatbot Settings</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <label className="text-sm text-slate-400">Welcome Message</label>
                          <Textarea
                            value={selectedChatbot.welcome_message}
                            onChange={(e) => updateBot.mutate({
                              id: selectedChatbot.id,
                              updates: { welcome_message: e.target.value }
                            })}
                            className="bg-slate-900 border-slate-700 mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-slate-400">Fallback Message</label>
                          <Textarea
                            value={selectedChatbot.fallback_message}
                            onChange={(e) => updateBot.mutate({
                              id: selectedChatbot.id,
                              updates: { fallback_message: e.target.value }
                            })}
                            className="bg-slate-900 border-slate-700 mt-1"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm text-slate-400">Tone</label>
                            <Select
                              value={selectedChatbot.tone}
                              onValueChange={(v) => updateBot.mutate({
                                id: selectedChatbot.id,
                                updates: { tone: v }
                              })}
                            >
                              <SelectTrigger className="bg-slate-900 border-slate-700 mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-800 border-slate-700">
                                <SelectItem value="professional">Professional</SelectItem>
                                <SelectItem value="friendly">Friendly</SelectItem>
                                <SelectItem value="casual">Casual</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-sm text-slate-400">Language</label>
                            <Select
                              value={selectedChatbot.language}
                              onValueChange={(v) => updateBot.mutate({
                                id: selectedChatbot.id,
                                updates: { language: v }
                              })}
                            >
                              <SelectTrigger className="bg-slate-900 border-slate-700 mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-800 border-slate-700">
                                <SelectItem value="en">English</SelectItem>
                                <SelectItem value="es">Spanish</SelectItem>
                                <SelectItem value="fr">French</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="embed" className="flex-1 p-6 overflow-y-auto m-0">
                    <Card className="bg-slate-800 border-slate-700 max-w-2xl">
                      <CardHeader>
                        <CardTitle className="text-white">Embed Code</CardTitle>
                        <CardDescription>Add this code to your website</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="p-4 bg-slate-900 rounded-lg font-mono text-sm text-slate-400 mb-4">
                          {getEmbedCode(selectedChatbot.id)}
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => copyToClipboard(getEmbedCode(selectedChatbot.id))}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Code
                        </Button>
                        <Button variant="outline" className="ml-2">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Open Preview
                        </Button>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <Bot className="w-16 h-16 mb-4 opacity-50" />
                <p>Select a chatbot to view details</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="flex-1 p-6 overflow-y-auto m-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Total Conversations</p>
                    <p className="text-3xl font-bold text-white">{conversations?.length || 0}</p>
                  </div>
                  <MessageCircle className="w-8 h-8 text-indigo-400" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Avg. Messages/Chat</p>
                    <p className="text-3xl font-bold text-white">8</p>
                  </div>
                  <MessageSquare className="w-8 h-8 text-green-400" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Resolution Rate</p>
                    <p className="text-3xl font-bold text-white">85%</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-yellow-400" />
                </div>
              </CardContent>
            </Card>
          </div>
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Recent Conversations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-slate-400">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Select a chatbot to view analytics</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="flex-1 p-6 overflow-y-auto m-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: 'Customer Support', description: 'Handle common support inquiries' },
              { name: 'Lead Qualification', description: 'Qualify leads with guided questions' },
              { name: 'FAQ Bot', description: 'Answer frequently asked questions' },
              { name: 'Appointment Booking', description: 'Schedule meetings and calls' },
              { name: 'Product Recommendation', description: 'Suggest products based on preferences' },
              { name: 'Onboarding', description: 'Guide new users through setup' },
            ].map((template, i) => (
              <Card key={i} className="bg-slate-800 border-slate-700">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-indigo-400" />
                    </div>
                    <h3 className="font-medium text-white">{template.name}</h3>
                  </div>
                  <p className="text-sm text-slate-400 mb-4">{template.description}</p>
                  <Button variant="outline" size="sm" className="w-full">
                    Use Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Flow Dialog */}
      <Dialog open={showFlowDialog} onOpenChange={setShowFlowDialog}>
        <DialogContent className="bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle>Add Conversation Flow</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-400">Flow Name</label>
              <Input
                value={newFlow.name}
                onChange={(e) => setNewFlow({ ...newFlow, name: e.target.value })}
                placeholder="Greeting"
                className="bg-slate-800 border-slate-700"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-400">Trigger Type</label>
                <Select value={newFlow.trigger_type} onValueChange={(v) => setNewFlow({ ...newFlow, trigger_type: v })}>
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="keyword">Keyword</SelectItem>
                    <SelectItem value="intent">Intent</SelectItem>
                    <SelectItem value="button">Button</SelectItem>
                    <SelectItem value="always">Always</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-slate-400">Priority</label>
                <Input
                  type="number"
                  value={newFlow.priority}
                  onChange={(e) => setNewFlow({ ...newFlow, priority: parseInt(e.target.value) })}
                  className="bg-slate-800 border-slate-700"
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-slate-400">Trigger</label>
              <Input
                value={newFlow.trigger}
                onChange={(e) => setNewFlow({ ...newFlow, trigger: e.target.value })}
                placeholder="hello"
                className="bg-slate-800 border-slate-700"
              />
            </div>
            <div>
              <label className="text-sm text-slate-400">Response</label>
              <Textarea
                value={newFlow.response}
                onChange={(e) => setNewFlow({ ...newFlow, response: e.target.value })}
                placeholder="Hello! How can I help you today?"
                className="bg-slate-800 border-slate-700"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFlowDialog(false)}>Cancel</Button>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700"
              onClick={() => createFlow.mutate(newFlow)}
              disabled={!newFlow.name || createFlow.isPending}
            >
              {createFlow.isPending ? 'Adding...' : 'Add Flow'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
