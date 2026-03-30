'use client'
import { useState } from 'react'
import {
  Sparkles, Send, Mic, Image, Copy, Trash2, ThumbsUp, ThumbsDown,
  Zap, MessageSquare, BarChart3, Users, FileText, Lightbulb, TrendingUp,
  ChevronRight, Loader2, RefreshCw, Mail, Target
} from 'lucide-react'
import { clsx } from 'clsx'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  rating?: 'up' | 'down'
  suggestedActions?: string[]
}

interface AIFeature {
  id: string
  name: string
  description: string
  icon: any
  capabilities: string[]
  status: 'beta' | 'stable' | 'new'
}

const aiFeatures: AIFeature[] = [
  {
    id: 'email-writer',
    name: 'AI Email Writer',
    description: 'Generate personalized emails based on context and tone',
    icon: Mail,
    capabilities: ['Follow-up sequences', 'Cold outreach', 'Reply analysis'],
    status: 'stable',
  },
  {
    id: 'lead-scoring',
    name: 'Lead Scoring',
    description: 'Predict conversion probability using ML models',
    icon: Target,
    capabilities: ['Behavior analysis', 'Intent signals', 'Priority ranking'],
    status: 'new',
  },
  {
    id: 'summarizer',
    name: 'Meeting Summarizer',
    description: 'Auto-generate summaries and action items from calls',
    icon: MessageSquare,
    capabilities: ['Key points extraction', 'Action item detection', 'Follow-up drafts'],
    status: 'stable',
  },
  {
    id: 'insights',
    name: 'CRM Insights',
    description: 'Surface patterns and opportunities from your data',
    icon: Lightbulb,
    capabilities: ['Trend analysis', 'Anomaly detection', 'Recommendations'],
    status: 'beta',
  },
]

const quickActions = [
  { label: 'Write a follow-up email', prompt: 'Write a follow-up email for a prospect who hasn\'t responded in 3 days. Keep it short and professional.' },
  { label: 'Score my top leads', prompt: 'Analyze my top 20 leads and score them by conversion probability based on engagement data.' },
  { label: 'Summarize recent deals', prompt: 'Give me a summary of all deals in the proposal stage and suggest next steps.' },
  { label: 'Find at-risk deals', prompt: 'Identify deals that might be at risk of falling through based on recent activity.' },
]

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hi! I\'m EdgeForce AI, your CRM assistant powered by Cloudflare Workers AI. I can help you with:\n\n• Writing emails and sequences\n• Scoring and prioritizing leads\n• Analyzing your pipeline\n• Generating meeting summaries\n\nWhat would you like help with today?',
      timestamp: new Date(),
      suggestedActions: ['Write a follow-up email', 'Score my leads', 'Analyze my pipeline'],
    },
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [activeFeature, setActiveFeature] = useState<string | null>(null)
  const [showFeaturePanel, setShowFeaturePanel] = useState(false)

  const sendMessage = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    // Simulate AI response
    setTimeout(() => {
      const responses = [
        'Based on your CRM data, I can see that leads from the "Enterprise" pipeline have a 34% higher conversion rate when contacted within 2 hours. I\'ve identified 5 such leads currently in your queue.',
        'I\'ve analyzed your email sequences. The best performing sequence has a 28% reply rate with this subject line: "Quick question about [Company Name]". I can help you apply this pattern to other sequences.',
        'Looking at your pipeline, I notice the proposal stage has an unusually high drop-off rate (67%). This typically indicates missing follow-up touchpoints. I recommend adding a check-in task at the 48-hour mark.',
        'Your top 10 leads by engagement score are currently inactive for more than 7 days. I\'ve drafted a re-engagement sequence that you can customize and send directly from EdgeForce.',
      ]
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date(),
        suggestedActions: ['Show me the leads', 'Create the sequence', 'Add follow-up tasks'],
      }
      setMessages(prev => [...prev, aiMessage])
      setIsTyping(false)
    }, 1500)
  }

  const rateMessage = (messageId: string, rating: 'up' | 'down') => {
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, rating } : m))
  }

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
  }

  return (
    <div className="flex h-full">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">AI Assistant</h1>
              <p className="text-sm text-slate-400">Powered by Cloudflare Workers AI</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 rounded-full">
              <div className="h-2 w-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-xs text-emerald-400 font-medium">Workers AI Active</span>
            </div>
            <button className="p-2 hover:bg-slate-800 rounded-lg transition">
              <RefreshCw className="h-5 w-5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={clsx('flex gap-4', message.role === 'user' && 'flex-row-reverse')}
            >
              <div className={clsx(
                'h-10 w-10 rounded-xl flex items-center justify-center shrink-0',
                message.role === 'assistant'
                  ? 'bg-gradient-to-br from-indigo-500 to-purple-600'
                  : 'bg-slate-700'
              )}>
                {message.role === 'assistant' ? (
                  <Sparkles className="h-5 w-5 text-white" />
                ) : (
                  <Users className="h-5 w-5 text-slate-300" />
                )}
              </div>
              <div className={clsx('max-w-2xl', message.role === 'user' && 'text-right')}>
                <div className={clsx(
                  'rounded-2xl px-5 py-4',
                  message.role === 'assistant'
                    ? 'bg-slate-900 border border-slate-800'
                    : 'bg-indigo-600 text-white'
                )}>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {message.content}
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {message.role === 'assistant' && (
                    <>
                      <button
                        onClick={() => copyMessage(message.content)}
                        className="p-1.5 hover:bg-slate-800 rounded-lg transition"
                        title="Copy"
                      >
                        <Copy className="h-4 w-4 text-slate-500" />
                      </button>
                      <button
                        onClick={() => rateMessage(message.id, 'up')}
                        className={clsx(
                          'p-1.5 rounded-lg transition',
                          message.rating === 'up' ? 'bg-emerald-500/20' : 'hover:bg-slate-800'
                        )}
                        title="Helpful"
                      >
                        <ThumbsUp className={clsx('h-4 w-4', message.rating === 'up' ? 'text-emerald-400' : 'text-slate-500')} />
                      </button>
                      <button
                        onClick={() => rateMessage(message.id, 'down')}
                        className={clsx(
                          'p-1.5 rounded-lg transition',
                          message.rating === 'down' ? 'bg-red-500/20' : 'hover:bg-slate-800'
                        )}
                        title="Not helpful"
                      >
                        <ThumbsDown className={clsx('h-4 w-4', message.rating === 'down' ? 'text-red-400' : 'text-slate-500')} />
                      </button>
                    </>
                  )}
                  <span className="text-xs text-slate-500 ml-2">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {message.suggestedActions && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {message.suggestedActions.map((action, i) => (
                      <button
                        key={i}
                        onClick={() => setInput(action)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-slate-300 transition flex items-center gap-1.5"
                      >
                        <ChevronRight className="h-3 w-3" />
                        {action}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-4">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-sm text-slate-400 ml-2">Thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="px-6 py-3 border-t border-slate-800">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {quickActions.map((action, i) => (
              <button
                key={i}
                onClick={() => setInput(action.prompt)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-slate-300 whitespace-nowrap transition"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 bg-slate-900 rounded-2xl border border-slate-800 px-4 py-3">
            <button className="p-2 hover:bg-slate-800 rounded-lg transition">
              <Image className="h-5 w-5 text-slate-400" />
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Ask me anything about your CRM data..."
              className="flex-1 bg-transparent border-0 text-white placeholder-slate-500 focus:outline-none text-sm"
            />
            <button className="p-2 hover:bg-slate-800 rounded-lg transition">
              <Mic className="h-5 w-5 text-slate-400" />
            </button>
            <button
              onClick={sendMessage}
              disabled={!input.trim()}
              className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition"
            >
              <Send className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Features Panel */}
      <div className={clsx(
        'w-80 border-l border-slate-800 bg-slate-900/50 p-4 overflow-auto transition-all',
        showFeaturePanel ? 'block' : 'hidden lg:block'
      )}>
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">AI Features</h3>
        <div className="space-y-3">
          {aiFeatures.map((feature) => (
            <div
              key={feature.id}
              className={clsx(
                'p-4 rounded-xl border transition cursor-pointer',
                activeFeature === feature.id
                  ? 'bg-indigo-600/20 border-indigo-500/50'
                  : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
              )}
              onClick={() => setActiveFeature(feature.id)}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                  <feature.icon className="h-5 w-5 text-indigo-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-white text-sm">{feature.name}</h4>
                    <span className={clsx(
                      'px-1.5 py-0.5 rounded text-[10px] font-medium',
                      feature.status === 'new' ? 'bg-emerald-500/20 text-emerald-400' :
                      feature.status === 'beta' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-slate-500/20 text-slate-400'
                    )}>
                      {feature.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{feature.description}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {feature.capabilities.map((cap) => (
                  <span key={cap} className="px-2 py-0.5 bg-slate-700/50 rounded text-xs text-slate-400">
                    {cap}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-6 p-4 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-xl border border-indigo-500/30">
          <h4 className="text-sm font-semibold text-white mb-4">AI Usage This Month</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Messages generated</span>
              <span className="text-sm font-semibold text-white">1,247</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Leads scored</span>
              <span className="text-sm font-semibold text-white">892</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Emails composed</span>
              <span className="text-sm font-semibold text-white">156</span>
            </div>
            <div className="pt-3 border-t border-indigo-500/30">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Workers AI inference time</span>
                <span className="text-sm font-semibold text-emerald-400">~45ms avg</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}