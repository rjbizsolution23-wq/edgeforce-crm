'use client'

import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import {
  MessageCircle,
  Users,
  Settings,
  Send,
  Phone,
  MapPin,
  Globe,
  Monitor,
  Calendar,
  Star,
  Search,
  Filter,
  MoreHorizontal,
  MessageSquare,
  X,
  Minimize2,
  Maximize2
} from 'lucide-react'

interface ChatSession {
  id: string
  visitor_id: string
  visitor_name: string
  visitor_email: string
  status: string
  assigned_to?: string
  messages: { id: string; sender_type: string; message: string; timestamp: string }[]
  started_at: string
  ended_at?: string
  rating?: number
  country?: string
  city?: string
  browser?: string
  os?: string
  current_page?: string
}

const statusColors: Record<string, string> = {
  waiting: 'bg-yellow-500',
  active: 'bg-green-500',
  ended: 'bg-gray-500',
}

export default function LiveChatPage() {
  const queryClient = useQueryClient()
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null)
  const [messageInput, setMessageInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['live-chat-sessions', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      const res = await api.get(`/live-chat/sessions?${params}`)
      return res.data as ChatSession[]
    },
  })

  const { data: widgets, isLoading: widgetsLoading } = useQuery({
    queryKey: ['live-chat-widgets'],
    queryFn: async () => {
      const res = await api.get('/live-chat/widgets')
      return res.data as any[]
    },
  })

  const { data: selectedSessionData, refetch: refetchSession } = useQuery({
    queryKey: ['live-chat-session', selectedSession?.id],
    queryFn: async () => {
      if (!selectedSession) return null
      const res = await api.get(`/live-chat/sessions/${selectedSession.id}`)
      return res.data as ChatSession
    },
    enabled: !!selectedSession,
  })

  const sendMessage = useMutation({
    mutationFn: async ({ sessionId, message, direction }: { sessionId: string; message: string; direction: string }) => {
      const res = await api.post(`/live-chat/sessions/${sessionId}/messages`, {
        sender_type: 'agent',
        sender_id: 'current-user',
        message,
        direction: 'outbound',
      })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['live-chat-sessions'] })
      queryClient.invalidateQueries({ queryKey: ['live-chat-session', selectedSession?.id] })
      setMessageInput('')
    },
  })

  const endChat = useMutation({
    mutationFn: async ({ sessionId, rating, feedback }: { sessionId: string; rating?: number; feedback?: string }) => {
      const res = await api.post(`/live-chat/sessions/${sessionId}/end`, { rating, feedback })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['live-chat-sessions'] })
      setSelectedSession(null)
    },
  })

  useEffect(() => {
    if (selectedSessionData) {
      setSelectedSession(selectedSessionData)
    }
  }, [selectedSessionData])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selectedSession?.messages])

  const filteredSessions = sessions?.filter(s =>
    s.visitor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.visitor_email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const activeSessions = sessions?.filter(s => s.status === 'active').length || 0
  const waitingSessions = sessions?.filter(s => s.status === 'waiting').length || 0
  const avgRating = sessions?.filter(s => s.rating).reduce((acc, s) => acc + (s.rating || 0), 0) /
    (sessions?.filter(s => s.rating).length || 1) || 0

  const formatDate = (date: string) => {
    return new Date(date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  const formatDuration = (start: string, end?: string) => {
    const startTime = new Date(start).getTime()
    const endTime = end ? new Date(end).getTime() : Date.now()
    const mins = Math.floor((endTime - startTime) / (1000 * 60))
    if (mins < 60) return `${mins}m`
    const hours = Math.floor(mins / 60)
    return `${hours}h ${mins % 60}m`
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white">Live Chat</h1>
          <p className="text-slate-400">Real-time customer conversations</p>
        </div>
        <div className="flex gap-3">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="flex items-center gap-3 p-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Users className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-xl font-bold text-white">{activeSessions}</p>
                <p className="text-xs text-slate-400">Active</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="flex items-center gap-3 p-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <MessageCircle className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-xl font-bold text-white">{waitingSessions}</p>
                <p className="text-xs text-slate-400">Waiting</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="flex items-center gap-3 p-3">
              <div className="p-2 bg-indigo-500/20 rounded-lg">
                <Star className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <p className="text-xl font-bold text-white">{avgRating.toFixed(1)}</p>
                <p className="text-xs text-slate-400">Avg Rating</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="conversations" className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <TabsList className="bg-slate-800">
            <TabsTrigger value="conversations">Conversations</TabsTrigger>
            <TabsTrigger value="widgets">Widgets</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search visitors..."
                className="pl-10 w-[200px] bg-slate-800 border-slate-700"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] bg-slate-800 border-slate-700">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="waiting">Waiting</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="ended">Ended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="conversations" className="flex-1 flex overflow-hidden m-0">
          {/* Sessions List */}
          <div className="w-1/3 border-r border-slate-800 overflow-y-auto">
            {sessionsLoading ? (
              <div className="p-4 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-24 bg-slate-800" />
                ))}
              </div>
            ) : filteredSessions?.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <MessageCircle className="w-12 h-12 mb-4" />
                <p>No conversations</p>
              </div>
            ) : (
              filteredSessions?.map((session) => (
                <div
                  key={session.id}
                  onClick={() => setSelectedSession(session)}
                  className={`p-4 border-b border-slate-800 cursor-pointer hover:bg-slate-800/50 ${
                    selectedSession?.id === session.id ? 'bg-slate-800' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-medium text-white">{session.visitor_name || 'Anonymous'}</h3>
                      <p className="text-xs text-slate-500">{session.visitor_email}</p>
                    </div>
                    <Badge className={`${statusColors[session.status]} text-white text-xs`}>
                      {session.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    {session.country && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {session.city}, {session.country}
                      </span>
                    )}
                    <span>
                      {formatDuration(session.started_at, session.ended_at)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Chat Window */}
          <div className="flex-1 flex flex-col">
            {selectedSession ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-slate-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                        <span className="text-indigo-400 font-bold">
                          {(selectedSession.visitor_name || 'A')[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium text-white">
                          {selectedSession.visitor_name || 'Anonymous'}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {selectedSession.visitor_email || 'No email'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedSession.rating && (
                        <div className="flex items-center gap-1 text-yellow-400">
                          <Star className="w-4 h-4 fill-current" />
                          <span className="text-sm">{selectedSession.rating}/5</span>
                        </div>
                      )}
                      {selectedSession.status !== 'ended' && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => endChat.mutate({ sessionId: selectedSession.id })}
                        >
                          End Chat
                        </Button>
                      )}
                    </div>
                  </div>
                  {selectedSession.current_page && (
                    <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      Viewing: {selectedSession.current_page}
                    </p>
                  )}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {selectedSession.messages?.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.sender_type === 'agent' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] p-3 rounded-lg ${
                          msg.sender_type === 'agent'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-800 text-slate-200'
                        }`}
                      >
                        <p>{msg.message}</p>
                        <p className={`text-xs mt-1 ${msg.sender_type === 'agent' ? 'text-indigo-200' : 'text-slate-500'}`}>
                          {formatDate(msg.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                {selectedSession.status !== 'ended' && (
                  <div className="p-4 border-t border-slate-800">
                    <div className="flex gap-2">
                      <Input
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            sendMessage.mutate({
                              sessionId: selectedSession.id,
                              message: messageInput,
                              direction: 'outbound',
                            })
                          }
                        }}
                        placeholder="Type a message..."
                        className="bg-slate-800 border-slate-700"
                      />
                      <Button
                        className="bg-indigo-600 hover:bg-indigo-700"
                        onClick={() => sendMessage.mutate({
                          sessionId: selectedSession.id,
                          message: messageInput,
                          direction: 'outbound',
                        })}
                        disabled={!messageInput || sendMessage.isPending}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <MessageCircle className="w-16 h-16 mb-4 opacity-50" />
                <p>Select a conversation to start chatting</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="widgets" className="flex-1 p-6 overflow-y-auto m-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-indigo-400" />
                  Chat Widget
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-400 text-sm mb-4">
                  Embeddable chat widget for your website
                </p>
                <div className="p-3 bg-slate-900 rounded-lg font-mono text-xs text-slate-400 mb-4">
                  {`<script src="https://edgeforce-crm.com/widget.js" data-tenant="YOUR_TENANT_ID"></script>`}
                </div>
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                  Customize Widget
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="flex-1 p-6 overflow-y-auto m-0">
          <Card className="bg-slate-800 border-slate-700 max-w-2xl">
            <CardHeader>
              <CardTitle className="text-white">Chat Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-slate-400">Offline Message</label>
                <Textarea
                  className="bg-slate-900 border-slate-700 mt-1"
                  placeholder="We're currently offline. Leave a message..."
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm text-slate-400">Greeting Message</label>
                <Input
                  className="bg-slate-900 border-slate-700 mt-1"
                  placeholder="Hi! How can we help you today?"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Enable Sounds</p>
                  <p className="text-slate-400 text-sm">Play sound for new messages</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Show Agent Avatars</p>
                  <p className="text-slate-400 text-sm">Display agent profile pictures</p>
                </div>
                <Switch />
              </div>
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                Save Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function Switch({ checked, onCheckedChange }: { checked?: boolean; onCheckedChange?: (v: boolean) => void }) {
  return (
    <div
      className="w-11 h-6 bg-slate-700 rounded-full relative cursor-pointer"
      onClick={() => onCheckedChange?.(!checked)}
    >
      <div className={`absolute w-4 h-4 bg-white rounded-full top-1 transition-transform ${checked ? 'translate-x-5' : 'left-1'}`} />
    </div>
  )
}

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import * as React from 'react'
import { Switch } from '@/components/ui/switch'
