'use client'
import { useState } from 'react'
import {
  Smartphone, Download, Monitor, Globe, Bell, Camera, MapPin,
  Zap, Shield, Cloud, Check, ChevronRight, Star, Users, BarChart3,
  FileText, MessageSquare, Phone, Calendar, CheckSquare, Plus
} from 'lucide-react'
import { clsx } from 'clsx'

interface Feature {
  id: string
  title: string
  description: string
  icon: any
  status: 'available' | 'coming-soon'
}

const mobileFeatures: Feature[] = [
  { id: '1', title: 'Offline Mode', description: 'Access contacts and deals even without internet', icon: Cloud, status: 'available' },
  { id: '2', title: 'Push Notifications', description: 'Real-time alerts for new tasks and deals', icon: Bell, status: 'available' },
  { id: '3', title: 'Contact Scanner', description: 'Scan business cards with camera OCR', icon: Camera, status: 'coming-soon' },
  { id: '4', title: 'Location Check-ins', description: 'Log visits with GPS coordinates', icon: MapPin, status: 'coming-soon' },
  { id: '5', title: 'Call Logging', description: 'Auto-record and transcribe calls', icon: Phone, status: 'coming-soon' },
  { id: '6', title: 'Quick Actions', description: 'Swipe to complete tasks and update deals', icon: Check, status: 'available' },
]

const appPreview = {
  name: 'EdgeForce CRM',
  version: '2.1.0',
  bundleId: 'com.edgeforce.crm',
  lastUpdated: '2026-03-20',
}

export default function MobileAppPage() {
  const [activeTab, setActiveTab] = useState<'features' | 'preview' | 'pwa'>('features')

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Mobile App</h1>
          <p className="text-slate-400 mt-1">PWA-ready CRM for iOS and Android</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition">
            <Download className="h-4 w-4" />
            Testflight
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition">
            <Download className="h-4 w-4" />
            Android Beta
          </button>
        </div>
      </div>

      {/* PWA Status Banner */}
      <div className="bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border border-emerald-500/30 rounded-xl p-6">
        <div className="flex items-center gap-6">
          <div className="h-16 w-16 rounded-2xl bg-emerald-500/30 flex items-center justify-center shrink-0">
            <Smartphone className="h-8 w-8 text-emerald-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-white">Progressive Web App (PWA) Ready</h3>
            <p className="text-slate-400 mt-1 text-sm">
              Your CRM is PWA-enabled with offline support, push notifications, and home screen installation.
            </p>
            <div className="flex items-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400" />
                <span className="text-sm text-slate-300">Offline capable</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400" />
                <span className="text-sm text-slate-300">Installable</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400" />
                <span className="text-sm text-slate-300">Responsive</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
              <Download className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">2,847</p>
              <p className="text-xs text-slate-400">Total Installs</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <Users className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">1,203</p>
              <p className="text-xs text-slate-400">Active Users</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Star className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">4.8</p>
              <p className="text-xs text-slate-400">App Store Rating</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Zap className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">45ms</p>
              <p className="text-xs text-slate-400">Edge Response</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-800">
        <nav className="flex gap-6">
          {[
            { id: 'features', label: 'Mobile Features', count: mobileFeatures.length },
            { id: 'preview', label: 'App Preview', count: 0 },
            { id: 'pwa', label: 'PWA Settings', count: 0 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={clsx(
                'pb-3 px-1 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.id
                  ? 'border-indigo-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'features' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mobileFeatures.map((feature) => (
            <div
              key={feature.id}
              className={clsx(
                'bg-slate-900 border border-slate-800 rounded-xl p-5 transition',
                feature.status === 'available' ? 'hover:border-slate-700' : 'opacity-60'
              )}
            >
              <div className="flex items-start gap-4">
                <div className={clsx(
                  'h-12 w-12 rounded-xl flex items-center justify-center shrink-0',
                  feature.status === 'available' ? 'bg-indigo-500/20' : 'bg-slate-700/50'
                )}>
                  <feature.icon className={clsx(
                    'h-6 w-6',
                    feature.status === 'available' ? 'text-indigo-400' : 'text-slate-500'
                  )} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white">{feature.title}</h3>
                    <span className={clsx(
                      'px-2 py-0.5 rounded text-xs font-medium',
                      feature.status === 'available'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-amber-500/20 text-amber-400'
                    )}>
                      {feature.status === 'available' ? 'Available' : 'Coming Soon'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'preview' && (
        <div className="flex items-center justify-center gap-12 py-12">
          {/* iPhone Preview */}
          <div className="relative">
            <div className="w-72 bg-slate-900 border-4 border-slate-700 rounded-3xl p-2 overflow-hidden">
              {/* Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-2xl" />
              {/* Screen */}
              <div className="bg-slate-950 rounded-2xl pt-8 pb-4 px-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                      <Zap className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-semibold text-white text-sm">EdgeForce</span>
                  </div>
                  <Bell className="h-5 w-5 text-slate-400" />
                </div>
                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-6">
                  {[
                    { label: 'Contacts', value: '1.2K', color: 'indigo' },
                    { label: 'Deals', value: '$2.4M', color: 'emerald' },
                    { label: 'Tasks', value: '47', color: 'amber' },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-slate-800/50 rounded-xl p-3 text-center">
                      <p className={clsx(
                        'text-lg font-bold',
                        stat.color === 'indigo' ? 'text-indigo-400' :
                        stat.color === 'emerald' ? 'text-emerald-400' :
                        'text-amber-400'
                      )}>{stat.value}</p>
                      <p className="text-xs text-slate-500">{stat.label}</p>
                    </div>
                  ))}
                </div>
                {/* Quick Actions */}
                <div className="flex gap-2 mb-6">
                  {[
                    { icon: Phone, label: 'Call' },
                    { icon: MessageSquare, label: 'SMS' },
                    { icon: Calendar, label: 'Meet' },
                    { icon: CheckSquare, label: 'Task' },
                  ].map((action) => (
                    <button
                      key={action.label}
                      className="flex-1 bg-slate-800/50 rounded-xl py-3 flex flex-col items-center gap-1"
                    >
                      <action.icon className="h-5 w-5 text-indigo-400" />
                      <span className="text-xs text-slate-400">{action.label}</span>
                    </button>
                  ))}
                </div>
                {/* Recent Activity */}
                <div className="space-y-3">
                  <p className="text-xs text-slate-500 uppercase">Recent</p>
                  {[
                    { name: 'Sarah Chen', action: 'New deal added', time: '2m ago' },
                    { name: 'Mike Ross', action: 'Task completed', time: '15m ago' },
                  ].map((item) => (
                    <div key={item.name} className="flex items-center gap-3 bg-slate-800/30 rounded-xl p-3">
                      <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-medium text-slate-400">
                        {item.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-white">{item.name}</p>
                        <p className="text-xs text-slate-500">{item.action}</p>
                      </div>
                      <span className="text-xs text-slate-500">{item.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Android Preview */}
          <div className="relative">
            <div className="w-72 bg-slate-900 border-4 border-slate-700 rounded-3xl p-2 overflow-hidden">
              {/* Status bar */}
              <div className="absolute top-2 left-4 right-4 h-6 flex items-center justify-between px-2">
                <span className="text-xs text-slate-500">12:34</span>
                <div className="flex items-center gap-1">
                  <div className="h-1 w-1 bg-slate-400 rounded-full" />
                  <div className="h-1 w-1 bg-slate-400 rounded-full" />
                  <div className="h-1 w-1 bg-slate-400 rounded-full" />
                </div>
              </div>
              {/* Screen */}
              <div className="bg-slate-950 rounded-2xl pt-8 pb-4 px-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                      <Zap className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-semibold text-white text-sm">EdgeForce</span>
                  </div>
                  <Bell className="h-5 w-5 text-slate-400" />
                </div>
                {/* Pipeline */}
                <p className="text-xs text-slate-500 uppercase mb-3">Pipeline</p>
                <div className="space-y-3 mb-6">
                  {[
                    { stage: 'Lead', value: '$125K', count: 12 },
                    { stage: 'Qualified', value: '$340K', count: 8 },
                    { stage: 'Proposal', value: '$890K', count: 5 },
                  ].map((item) => (
                    <div key={item.stage} className="flex items-center gap-3 bg-slate-800/30 rounded-xl p-3">
                      <div className="h-8 w-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                        <div className="h-3 w-3 rounded-full bg-indigo-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-white">{item.stage}</p>
                        <p className="text-xs text-slate-500">{item.count} deals</p>
                      </div>
                      <p className="text-sm font-semibold text-emerald-400">{item.value}</p>
                    </div>
                  ))}
                </div>
                {/* FAB */}
                <button className="absolute bottom-6 right-6 h-14 w-14 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/30">
                  <Plus className="h-6 w-6 text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'pwa' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* PWA Manifest */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-4">PWA Manifest</h3>
              <div className="bg-slate-800/50 rounded-xl p-4 font-mono text-sm">
                <pre className="text-slate-400 whitespace-pre-wrap">{`{
  "name": "EdgeForce CRM",
  "short_name": "EdgeForce",
  "description": "CRM at the edge",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#0f172a",
  "theme_color": "#6366f1",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512"
    }
  ]
}`}</pre>
              </div>
            </div>

            {/* Service Worker */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-4">Service Worker</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-emerald-400" />
                    <span className="text-sm text-white">Cache Strategy</span>
                  </div>
                  <span className="text-xs text-slate-400">Stale-while-revalidate</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-emerald-400" />
                    <span className="text-sm text-white">Offline Page</span>
                  </div>
                  <span className="text-xs text-slate-400">Enabled</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-emerald-400" />
                    <span className="text-sm text-white">Background Sync</span>
                  </div>
                  <span className="text-xs text-slate-400">Enabled</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-emerald-400" />
                    <span className="text-sm text-white">Push Notifications</span>
                  </div>
                  <span className="text-xs text-slate-400">Cloudflare Push</span>
                </div>
              </div>
            </div>
          </div>

          {/* Install Prompt Preview */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="font-semibold text-white mb-4">Install Prompt Preview</h3>
            <div className="bg-slate-800/50 rounded-xl p-6 flex items-center gap-6">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-white">Install EdgeForce CRM</h4>
                <p className="text-sm text-slate-400 mt-1">Add to your home screen for quick access</p>
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium transition">
                  Not Now
                </button>
                <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition">
                  Install
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}