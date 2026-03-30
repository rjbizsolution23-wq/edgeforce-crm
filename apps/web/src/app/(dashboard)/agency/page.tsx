'use client'
import { useState } from 'react'
import {
  Building2, Globe, Palette, Users, CreditCard, Settings, Plus, Check,
  ChevronRight, ExternalLink, Copy, Trash2, Eye, Edit, MoreVertical,
  BarChart3, TrendingUp, UserPlus, Zap, Shield, Rocket
} from 'lucide-react'
import { clsx } from 'clsx'

interface SubAccount {
  id: string
  name: string
  slug: string
  domain: string
  logo: string
  primaryColor: string
  plan: 'starter' | 'professional' | 'enterprise'
  status: 'active' | 'suspended' | 'trial'
  contacts: number
  users: number
  monthlyValue: number
  createdAt: string
  owner: {
    name: string
    email: string
  }
}

interface BrandingTemplate {
  id: string
  name: string
  preview: string
  primaryColor: string
}

const subAccounts: SubAccount[] = [
  {
    id: '1',
    name: 'Acme Corp',
    slug: 'acme',
    domain: 'crm.acmecorp.com',
    logo: '',
    primaryColor: '#3B82F6',
    plan: 'enterprise',
    status: 'active',
    contacts: 1247,
    users: 15,
    monthlyValue: 499,
    createdAt: '2026-01-15',
    owner: { name: 'John Smith', email: 'john@acmecorp.com' },
  },
  {
    id: '2',
    name: 'TechStart Inc',
    slug: 'techstart',
    domain: 'sales.techstart.io',
    logo: '',
    primaryColor: '#10B981',
    plan: 'professional',
    status: 'active',
    contacts: 423,
    users: 5,
    monthlyValue: 149,
    createdAt: '2026-02-01',
    owner: { name: 'Sarah Connor', email: 'sarah@techstart.io' },
  },
  {
    id: '3',
    name: 'Global Sales Agency',
    slug: 'gsa',
    domain: 'agency.globalsales.com',
    logo: '',
    primaryColor: '#8B5CF6',
    plan: 'enterprise',
    status: 'active',
    contacts: 2891,
    users: 32,
    monthlyValue: 499,
    createdAt: '2026-01-05',
    owner: { name: 'Mike Johnson', email: 'mike@globalsales.com' },
  },
  {
    id: '4',
    name: 'Startup XYZ',
    slug: 'startupxyz',
    domain: 'crm.startupxyz.co',
    logo: '',
    primaryColor: '#F59E0B',
    plan: 'starter',
    status: 'trial',
    contacts: 89,
    users: 3,
    monthlyValue: 49,
    createdAt: '2026-03-20',
    owner: { name: 'Lisa Wang', email: 'lisa@startupxyz.co' },
  },
]

const brandingTemplates: BrandingTemplate[] = [
  { id: '1', name: 'Modern Blue', preview: 'blue', primaryColor: '#3B82F6' },
  { id: '2', name: 'Forest Green', preview: 'green', primaryColor: '#10B981' },
  { id: '3', name: 'Royal Purple', preview: 'purple', primaryColor: '#8B5CF6' },
  { id: '4', name: 'Sunset Orange', preview: 'orange', primaryColor: '#F59E0B' },
  { id: '5', name: 'Crimson Red', preview: 'red', primaryColor: '#EF4444' },
]

const plans = [
  { id: 'starter', name: 'Starter', price: 49, features: ['500 contacts', '3 users', 'Basic analytics', 'Email support'] },
  { id: 'professional', name: 'Professional', price: 149, features: ['5,000 contacts', '10 users', 'Advanced analytics', 'Priority support', 'Custom fields'] },
  { id: 'enterprise', name: 'Enterprise', price: 499, features: ['Unlimited contacts', 'Unlimited users', 'White-label', 'API access', 'Dedicated support', 'Custom domain'] },
]

export default function AgencyPage() {
  const [activeTab, setActiveTab] = useState<'accounts' | 'branding' | 'billing' | 'settings'>('accounts')
  const [showNewAccountModal, setShowNewAccountModal] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<SubAccount | null>(null)
  const [activeAccountTab, setActiveAccountTab] = useState<'overview' | 'branding' | 'users' | 'billing'>('overview')

  const totalMRR = subAccounts.reduce((sum, acc) => sum + acc.monthlyValue, 0)
  const totalContacts = subAccounts.reduce((sum, acc) => sum + acc.contacts, 0)
  const totalUsers = subAccounts.reduce((sum, acc) => sum + acc.users, 0)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Agency Dashboard</h1>
          <p className="text-slate-400 mt-1">Manage your white-label sub-accounts</p>
        </div>
        <button
          onClick={() => setShowNewAccountModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition"
        >
          <Plus className="h-4 w-4" />
          New Sub-Account
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{subAccounts.length}</p>
              <p className="text-xs text-slate-400">Active Accounts</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">${totalMRR}</p>
              <p className="text-xs text-slate-400">Monthly Revenue</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Users className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{totalContacts.toLocaleString()}</p>
              <p className="text-xs text-slate-400">Total Contacts</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{totalUsers}</p>
              <p className="text-xs text-slate-400">Total Users</p>
            </div>
          </div>
        </div>
      </div>

      {/* White-Label Setup Banner */}
      <div className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 rounded-xl p-6">
        <div className="flex items-start gap-6">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
            <Rocket className="h-8 w-8 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-white">White-Label Your CRM</h3>
            <p className="text-slate-400 mt-2 text-sm max-w-2xl">
              Give your clients a fully branded CRM experience with custom domains, logos, and colors. Our edge network ensures sub-second load times globally.
            </p>
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Check className="h-4 w-4 text-emerald-400" />
                Custom domains
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Check className="h-4 w-4 text-emerald-400" />
                Branded login pages
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Check className="h-4 w-4 text-emerald-400" />
                Remove EdgeForce branding
              </div>
            </div>
          </div>
          <button className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-medium transition shrink-0">
            View Plans
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-800">
        <nav className="flex gap-6">
          {[
            { id: 'accounts', label: 'Sub-Accounts', count: subAccounts.length },
            { id: 'branding', label: 'Branding Templates', count: brandingTemplates.length },
            { id: 'billing', label: 'Billing & Invoices', count: 0 },
            { id: 'settings', label: 'Agency Settings', count: 0 },
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
              {tab.count > 0 && <span className="ml-2 text-xs text-slate-500">({tab.count})</span>}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'accounts' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Accounts List */}
          <div className="lg:col-span-1 space-y-3">
            {subAccounts.map((account) => (
              <div
                key={account.id}
                onClick={() => setSelectedAccount(account)}
                className={clsx(
                  'p-4 rounded-xl border cursor-pointer transition',
                  selectedAccount?.id === account.id
                    ? 'bg-indigo-600/20 border-indigo-500/50'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: account.primaryColor }}
                  >
                    {account.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white truncate">{account.name}</h3>
                    <p className="text-xs text-slate-400">{account.domain}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-800">
                  <span className={clsx(
                    'px-2 py-0.5 rounded text-xs font-medium',
                    account.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                    account.status === 'trial' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-red-500/20 text-red-400'
                  )}>
                    {account.plan.charAt(0).toUpperCase() + account.plan.slice(1)}
                  </span>
                  <span className="text-xs text-slate-500">
                    {account.contacts.toLocaleString()} contacts
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Account Details */}
          <div className="lg:col-span-2">
            {selectedAccount ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                {/* Account Header */}
                <div
                  className="p-6 border-b border-slate-800"
                  style={{ borderTopColor: selectedAccount.primaryColor, borderTopWidth: 4 }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className="h-16 w-16 rounded-xl flex items-center justify-center text-white font-bold text-xl"
                        style={{ backgroundColor: selectedAccount.primaryColor }}
                      >
                        {selectedAccount.name[0]}
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white">{selectedAccount.name}</h2>
                        <p className="text-sm text-slate-400">{selectedAccount.domain}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={clsx(
                            'px-2 py-1 rounded text-xs font-medium',
                            selectedAccount.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                            selectedAccount.status === 'trial' ? 'bg-amber-500/20 text-amber-400' :
                            'bg-red-500/20 text-red-400'
                          )}>
                            {selectedAccount.status}
                          </span>
                          <span className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-300">
                            {selectedAccount.plan}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-2 hover:bg-slate-800 rounded-lg transition">
                        <Eye className="h-5 w-5 text-slate-400" />
                      </button>
                      <button className="p-2 hover:bg-slate-800 rounded-lg transition">
                        <Settings className="h-5 w-5 text-slate-400" />
                      </button>
                      <button className="p-2 hover:bg-slate-800 rounded-lg transition">
                        <MoreVertical className="h-5 w-5 text-slate-400" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Account Tabs */}
                <div className="border-b border-slate-800 px-6">
                  <nav className="flex gap-4">
                    {[
                      { id: 'overview', label: 'Overview' },
                      { id: 'branding', label: 'Branding' },
                      { id: 'users', label: 'Users' },
                      { id: 'billing', label: 'Billing' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveAccountTab(tab.id as any)}
                        className={clsx(
                          'py-3 px-1 text-sm font-medium border-b-2 transition-colors',
                          activeAccountTab === tab.id
                            ? 'border-indigo-500 text-white'
                            : 'border-transparent text-slate-400 hover:text-slate-300'
                        )}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Account Content */}
                <div className="p-6">
                  {activeAccountTab === 'overview' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-slate-800/50 rounded-xl p-4">
                          <p className="text-2xl font-bold text-white">{selectedAccount.contacts.toLocaleString()}</p>
                          <p className="text-xs text-slate-400">Contacts</p>
                        </div>
                        <div className="bg-slate-800/50 rounded-xl p-4">
                          <p className="text-2xl font-bold text-white">{selectedAccount.users}</p>
                          <p className="text-xs text-slate-400">Users</p>
                        </div>
                        <div className="bg-slate-800/50 rounded-xl p-4">
                          <p className="text-2xl font-bold text-emerald-400">${selectedAccount.monthlyValue}</p>
                          <p className="text-xs text-slate-400">Monthly Value</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-slate-500">Owner</p>
                          <p className="text-white">{selectedAccount.owner.name}</p>
                          <p className="text-slate-400">{selectedAccount.owner.email}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Created</p>
                          <p className="text-white">{new Date(selectedAccount.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  {activeAccountTab === 'branding' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">Primary Color</label>
                          <div className="flex items-center gap-3">
                            <div
                              className="h-10 w-10 rounded-lg"
                              style={{ backgroundColor: selectedAccount.primaryColor }}
                            />
                            <input
                              type="text"
                              defaultValue={selectedAccount.primaryColor}
                              className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">Custom Domain</label>
                          <input
                            type="text"
                            defaultValue={selectedAccount.domain}
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                          />
                        </div>
                      </div>
                      <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition">
                        Save Branding Changes
                      </button>
                    </div>
                  )}
                  {activeAccountTab === 'users' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-400">{selectedAccount.users} users in this account</p>
                        <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition">
                          <UserPlus className="h-4 w-4" />
                          Add User
                        </button>
                      </div>
                      <div className="bg-slate-800/50 rounded-xl p-4">
                        <p className="text-sm text-slate-400">Owner: {selectedAccount.owner.name}</p>
                      </div>
                    </div>
                  )}
                  {activeAccountTab === 'billing' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl">
                        <div>
                          <p className="font-medium text-white">Current Plan: {selectedAccount.plan}</p>
                          <p className="text-sm text-slate-400">${selectedAccount.monthlyValue}/month</p>
                        </div>
                        <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition">
                          Change Plan
                        </button>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl">
                        <div>
                          <p className="font-medium text-white">Next billing date</p>
                          <p className="text-sm text-slate-400">April 15, 2026</p>
                        </div>
                        <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition">
                          View Invoice
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
                <Building2 className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Select a sub-account to view details</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'branding' && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {brandingTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition cursor-pointer group"
            >
              <div
                className="h-32 flex items-center justify-center"
                style={{ backgroundColor: `${template.primaryColor}20` }}
              >
                <div
                  className="h-12 w-12 rounded-xl"
                  style={{ backgroundColor: template.primaryColor }}
                />
              </div>
              <div className="p-4">
                <h3 className="font-medium text-white text-sm">{template.name}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <div
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: template.primaryColor }}
                  />
                  <span className="text-xs text-slate-400">{template.primaryColor}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'billing' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="font-semibold text-white mb-4">Agency Revenue</h3>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <p className="text-3xl font-bold text-white">${totalMRR}</p>
                <p className="text-sm text-slate-400">Monthly Recurring Revenue</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-emerald-400">+12%</p>
                <p className="text-sm text-slate-400">Growth this month</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-white">${totalMRR * 12}</p>
                <p className="text-sm text-slate-400">Annual Run Rate</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase">Sub-Account</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase">Plan</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase">Amount</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {subAccounts.map((account) => (
                  <tr key={account.id} className="hover:bg-slate-800/30">
                    <td className="px-5 py-4">
                      <p className="font-medium text-white">{account.name}</p>
                    </td>
                    <td className="px-5 py-4 text-slate-400">{account.plan}</td>
                    <td className="px-5 py-4 text-white">${account.monthlyValue}/mo</td>
                    <td className="px-5 py-4">
                      <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-xs">Paid</span>
                    </td>
                    <td className="px-5 py-4 text-slate-400">Mar 15, 2026</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="font-semibold text-white mb-6">Default Agency Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                <div>
                  <p className="font-medium text-white">Auto-provision new accounts</p>
                  <p className="text-xs text-slate-400">Automatically create accounts when payment is received</p>
                </div>
                <button className="w-12 h-6 bg-indigo-600 rounded-full relative">
                  <div className="absolute right-1 top-1 h-4 w-4 bg-white rounded-full" />
                </button>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                <div>
                  <p className="font-medium text-white">Default plan for new accounts</p>
                  <p className="text-xs text-slate-400">Set the starting plan for new sub-accounts</p>
                </div>
                <select className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm">
                  <option value="starter">Starter - $49/mo</option>
                  <option value="professional">Professional - $149/mo</option>
                  <option value="enterprise">Enterprise - $499/mo</option>
                </select>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                <div>
                  <p className="font-medium text-white">Commission rate</p>
                  <p className="text-xs text-slate-400">Your margin on each sub-account</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    defaultValue="20"
                    className="w-20 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm text-right"
                  />
                  <span className="text-slate-400">%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Account Modal */}
      {showNewAccountModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6">
            <h2 className="text-xl font-bold text-white mb-6">Create New Sub-Account</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Account Name</label>
                <input
                  type="text"
                  placeholder="Company Name"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Owner Email</label>
                <input
                  type="email"
                  placeholder="owner@company.com"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Custom Domain</label>
                <input
                  type="text"
                  placeholder="crm.company.com"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Plan</label>
                <select className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition">
                  <option value="starter">Starter - $49/mo</option>
                  <option value="professional">Professional - $149/mo</option>
                  <option value="enterprise">Enterprise - $499/mo</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowNewAccountModal(false)}
                  className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-medium transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowNewAccountModal(false)}
                  className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-medium transition"
                >
                  Create Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}