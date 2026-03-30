'use client'
import { useState } from 'react'
import { User, Building2, Bell, Shield, Palette, Users, CreditCard, Globe, Key, ChevronRight, Mail, Smartphone, Desktop, AlertTriangle, Copy, RefreshCw, Trash2, Plus, Check, X, Zap, CheckCircle2, Loader2 } from 'lucide-react'
import { clsx } from 'clsx'
import { createCheckoutSession, createPortalSession } from '@/lib/stripe'

const settingsSections = [
  { id: 'profile', label: 'Profile', icon: User, description: 'Manage your personal information' },
  { id: 'company', label: 'Company', icon: Building2, description: 'Organization details and branding' },
  { id: 'team', label: 'Team', icon: Users, description: 'Manage team members and roles' },
  { id: 'notifications', label: 'Notifications', icon: Bell, description: 'Configure alert preferences' },
  { id: 'security', label: 'Security', icon: Shield, description: 'Password, 2FA, and session settings' },
  { id: 'billing', label: 'Billing', icon: CreditCard, description: 'Subscription and payment methods' },
  { id: 'integrations', label: 'Integrations', icon: Globe, description: 'Connected apps and services' },
  { id: 'api', label: 'API Keys', icon: Key, description: 'Manage API access tokens' },
]

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('billing')
  const [loading, setLoading] = useState<string | null>(null)

  return (
    <div className="flex gap-6">
      {/* Sidebar */}
      <div className="w-64 shrink-0">
        <h2 className="text-lg font-semibold mb-4">Settings</h2>
        <nav className="space-y-1">
          {settingsSections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={clsx(
                'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition text-left',
                activeSection === section.id
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              )}
            >
              <section.icon className="h-5 w-5" />
              <span>{section.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1">
        {activeSection === 'profile' && (
          <div className="space-y-6">
            <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50">
              <h3 className="text-lg font-semibold mb-4">Profile Information</h3>
              <div className="grid gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                    R
                  </div>
                  <button className="px-4 py-2 border border-slate-700 rounded-lg hover:bg-slate-800 transition">
                    Change Photo
                  </button>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-400 mb-1 block">First Name</label>
                    <input type="text" defaultValue="Rick" className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 mb-1 block">Last Name</label>
                    <input type="text" defaultValue="Jefferson" className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-indigo-500" />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Email</label>
                  <input type="email" defaultValue="rick@rjbusinesssolutions.org" className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Phone</label>
                  <input type="tel" defaultValue="+1 (555) 123-4567" className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-indigo-500" />
                </div>
              </div>
              <button className="mt-6 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium transition">
                Save Changes
              </button>
            </div>
          </div>
        )}

        {activeSection === 'company' && (
          <div className="space-y-6">
            <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50">
              <h3 className="text-lg font-semibold mb-4">Company Information</h3>
              <div className="grid gap-4">
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Company Name</label>
                  <input type="text" defaultValue="RJ Business Solutions" className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-indigo-500" />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-400 mb-1 block">Website</label>
                    <input type="url" defaultValue="https://rjbusinesssolutions.org" className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 mb-1 block">Industry</label>
                    <select className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-indigo-500">
                      <option>Technology</option>
                      <option>Finance</option>
                      <option>Healthcare</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Brand Color</label>
                  <div className="flex items-center gap-4">
                    <input type="color" defaultValue="#6366f1" className="h-10 w-20 rounded border border-slate-700" />
                    <input type="text" defaultValue="#6366f1" className="flex-1 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-indigo-500" />
                  </div>
                </div>
              </div>
              <button className="mt-6 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium transition">
                Save Changes
              </button>
            </div>
          </div>
        )}

        {activeSection === 'team' && (
          <div className="space-y-6">
            <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Team Members</h3>
                <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium transition">
                  Invite Member
                </button>
              </div>
              <div className="space-y-3">
                {[
                  { name: 'Rick Jefferson', email: 'rick@rjbusinesssolutions.org', role: 'Owner', status: 'active' },
                  { name: 'Sarah Chen', email: 'sarah@rjbusinesssolutions.org', role: 'Admin', status: 'active' },
                  { name: 'Mike Johnson', email: 'mike@rjbusinesssolutions.org', role: 'Manager', status: 'active' },
                ].map((member, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-lg border border-slate-800">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center font-medium">
                        {member.name[0]}
                      </div>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-slate-400">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 rounded-full bg-slate-800 text-sm">{member.role}</span>
                      <span className="flex items-center gap-1 text-xs text-green-400">
                        <span className="h-2 w-2 rounded-full bg-green-400" />
                        Active
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'notifications' && (
          <div className="space-y-6">
            <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50">
              <h3 className="text-lg font-semibold mb-4">Notification Channels</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border border-slate-800">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-slate-400">Receive updates via email</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg border border-slate-800">
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="font-medium">Push Notifications</p>
                      <p className="text-sm text-slate-400">Browser push notifications</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg border border-slate-800">
                  <div className="flex items-center gap-3">
                    <Desktop className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="font-medium">Desktop Notifications</p>
                      <p className="text-sm text-slate-400">Desktop app notifications</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50">
              <h3 className="text-lg font-semibold mb-4">Notification Types</h3>
              <div className="space-y-3">
                {[
                  { label: 'New leads assigned', description: 'When a new lead is assigned to you' },
                  { label: 'Deal stage changed', description: 'When a deal moves to a new stage' },
                  { label: 'Task reminders', description: 'Reminders for upcoming tasks' },
                  { label: 'Mentioned in comments', description: 'When someone mentions you' },
                  { label: 'Weekly digest', description: 'Weekly summary of activity' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-slate-800">
                    <div>
                      <p className="font-medium">{item.label}</p>
                      <p className="text-sm text-slate-400">{item.description}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'security' && (
          <div className="space-y-6">
            <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50">
              <h3 className="text-lg font-semibold mb-4">Password</h3>
              <div className="grid gap-4 max-w-md">
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Current Password</label>
                  <input type="password" className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">New Password</label>
                  <input type="password" className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Confirm New Password</label>
                  <input type="password" className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-indigo-500" />
                </div>
              </div>
              <button className="mt-4 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium transition">
                Update Password
              </button>
            </div>

            <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Two-Factor Authentication</h3>
                  <p className="text-sm text-slate-400">Add an extra layer of security to your account</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-slate-800 text-sm">Disabled</span>
              </div>
              <button className="px-4 py-2 border border-slate-700 rounded-lg hover:bg-slate-800 transition">
                Enable 2FA
              </button>
            </div>

            <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50">
              <h3 className="text-lg font-semibold mb-4">Active Sessions</h3>
              <div className="space-y-3">
                {[
                  { device: 'MacBook Pro', location: 'Albuquerque, NM', current: true, lastActive: 'Now' },
                  { device: 'iPhone 15 Pro', location: 'Albuquerque, NM', current: false, lastActive: '2 hours ago' },
                ].map((session, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-lg border border-slate-800">
                    <div className="flex items-center gap-3">
                      <Smartphone className="h-5 w-5 text-slate-400" />
                      <div>
                        <p className="font-medium">
                          {session.device}
                          {session.current && <span className="ml-2 text-xs text-green-400">(Current)</span>}
                        </p>
                        <p className="text-sm text-slate-400">{session.location} • {session.lastActive}</p>
                      </div>
                    </div>
                    {!session.current && (
                      <button className="text-red-400 hover:text-red-300 text-sm">
                        Revoke
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'billing' && (
          <div className="space-y-6">
            {/* Current Plan */}
            <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50">
              <h3 className="text-lg font-semibold mb-4">Current Plan</h3>
              <div className="flex items-center justify-between p-4 rounded-lg bg-indigo-600/20 border border-indigo-600/30">
                <div>
                  <p className="text-xl font-bold">Pro Plan</p>
                  <p className="text-sm text-slate-400">$99/month • 10 team members</p>
                </div>
                <button
                  onClick={() => {
                    setLoading('upgrade')
                    createCheckoutSession('price_pro_monthly').catch(console.error).finally(() => setLoading(null))
                  }}
                  disabled={loading === 'upgrade'}
                  className="px-4 py-2 border border-indigo-500 text-indigo-400 rounded-lg hover:bg-indigo-600/20 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {loading === 'upgrade' && <Loader2 className="h-4 w-4 animate-spin" />}
                  Upgrade
                </button>
              </div>
            </div>

            {/* Subscription Plans */}
            <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50">
              <h3 className="text-lg font-semibold mb-4">Subscription Plans</h3>
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { name: 'Starter', price: 29, priceId: 'price_starter_monthly', features: ['5 team members', '1,000 contacts', 'Email support'], current: false },
                  { name: 'Pro', price: 99, priceId: 'price_pro_monthly', features: ['10 team members', '10,000 contacts', 'Priority support'], current: true },
                  { name: 'Enterprise', price: 299, priceId: 'price_enterprise_monthly', features: ['Unlimited users', 'Unlimited contacts', '24/7 support'], current: false },
                ].map((plan) => (
                  <div key={plan.name} className={`p-4 rounded-lg border ${plan.current ? 'border-indigo-500 bg-indigo-600/10' : 'border-slate-700'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-bold">{plan.name}</p>
                      {plan.current && <span className="text-xs bg-indigo-600 px-2 py-1 rounded">Current</span>}
                    </div>
                    <p className="text-2xl font-bold mb-3">${plan.price}<span className="text-sm font-normal text-slate-400">/mo</span></p>
                    <ul className="space-y-1 mb-4">
                      {plan.features.map((f, i) => (
                        <li key={i} className="text-sm text-slate-400 flex items-center gap-2">
                          <CheckCircle2 className="h-3 w-3 text-green-400" />{f}
                        </li>
                      ))}
                    </ul>
                    {!plan.current && (
                      <button
                        onClick={() => {
                          setLoading(`switch-${plan.name}`)
                          createCheckoutSession(plan.priceId).catch(console.error).finally(() => setLoading(null))
                        }}
                        disabled={loading === `switch-${plan.name}`}
                        className="w-full py-2 border border-slate-600 rounded-lg hover:bg-slate-800 transition text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {loading === `switch-${plan.name}` && <Loader2 className="h-4 w-4 animate-spin" />}
                        Switch to {plan.name}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Method */}
            <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50">
              <h3 className="text-lg font-semibold mb-4">Payment Method</h3>
              <div className="flex items-center justify-between p-4 rounded-lg border border-slate-800">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-6 w-6" />
                  <div>
                    <p className="font-medium">•••• •••• •••• 4242</p>
                    <p className="text-sm text-slate-400">Expires 12/2027</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setLoading('portal')
                    createPortalSession().catch(console.error).finally(() => setLoading(null))
                  }}
                  disabled={loading === 'portal'}
                  className="text-indigo-400 hover:text-indigo-300 text-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {loading === 'portal' && <Loader2 className="h-4 w-4 animate-spin" />}
                  Update
                </button>
              </div>
            </div>

            {/* Billing History */}
            <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50">
              <h3 className="text-lg font-semibold mb-4">Billing History</h3>
              <div className="space-y-2">
                {[
                  { date: 'Mar 1, 2026', amount: '$99.00', status: 'Paid' },
                  { date: 'Feb 1, 2026', amount: '$99.00', status: 'Paid' },
                  { date: 'Jan 1, 2026', amount: '$99.00', status: 'Paid' },
                ].map((invoice, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-slate-800">
                    <div>
                      <p className="font-medium">{invoice.date}</p>
                      <p className="text-sm text-slate-400">{invoice.amount}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-green-400 text-sm">{invoice.status}</span>
                      <button className="text-indigo-400 hover:text-indigo-300 text-sm">
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'integrations' && (
          <div className="space-y-6">
            <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50">
              <h3 className="text-lg font-semibold mb-4">Connected Apps</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { name: 'Slack', description: 'Team communication', connected: true, icon: '💬' },
                  { name: 'Google Workspace', description: 'Gmail, Calendar, Drive', connected: true, icon: '📧' },
                  { name: 'Microsoft 365', description: 'Outlook, Teams, OneDrive', connected: false, icon: '📎' },
                  { name: 'Zapier', description: 'Automation workflows', connected: true, icon: '⚡' },
                  { name: 'HubSpot', description: 'Marketing automation', connected: false, icon: '📊' },
                  { name: 'Salesforce', description: 'CRM sync', connected: false, icon: '☁️' },
                ].map((app, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-lg border border-slate-800">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{app.icon}</span>
                      <div>
                        <p className="font-medium">{app.name}</p>
                        <p className="text-sm text-slate-400">{app.description}</p>
                      </div>
                    </div>
                    {app.connected ? (
                      <button className="px-3 py-1 bg-green-600/20 text-green-400 rounded-full text-sm">
                        Connected
                      </button>
                    ) : (
                      <button className="px-3 py-1 border border-slate-700 rounded-full text-sm hover:bg-slate-800">
                        Connect
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'api' && (
          <div className="space-y-6">
            <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">API Keys</h3>
                  <p className="text-sm text-slate-400">Manage API access tokens for your integrations</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium transition">
                  <Plus className="h-4 w-4" />
                  Create Key
                </button>
              </div>
              <div className="space-y-3">
                {[
                  { name: 'Production Key', key: 'ef_live_***********************', created: 'Mar 1, 2026', lastUsed: '2 hours ago' },
                  { name: 'Development Key', key: 'ef_test_***********************', created: 'Feb 15, 2026', lastUsed: '1 week ago' },
                ].map((apiKey, i) => (
                  <div key={i} className="p-4 rounded-lg border border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium">{apiKey.name}</p>
                      <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-slate-800 rounded" title="Copy">
                          <Copy className="h-4 w-4" />
                        </button>
                        <button className="p-2 hover:bg-slate-800 rounded" title="Regenerate">
                          <RefreshCw className="h-4 w-4" />
                        </button>
                        <button className="p-2 hover:bg-slate-800 rounded text-red-400" title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm font-mono text-slate-400 mb-2">{apiKey.key}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>Created: {apiKey.created}</span>
                      <span>Last used: {apiKey.lastUsed}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50">
              <h3 className="text-lg font-semibold mb-4">API Rate Limits</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-lg border border-slate-800 text-center">
                  <p className="text-2xl font-bold text-indigo-400">1,000</p>
                  <p className="text-sm text-slate-400">Requests/hour</p>
                </div>
                <div className="p-4 rounded-lg border border-slate-800 text-center">
                  <p className="text-2xl font-bold text-green-400">847</p>
                  <p className="text-sm text-slate-400">Used this hour</p>
                </div>
                <div className="p-4 rounded-lg border border-slate-800 text-center">
                  <p className="text-2xl font-bold text-slate-400">153</p>
                  <p className="text-sm text-slate-400">Remaining</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
