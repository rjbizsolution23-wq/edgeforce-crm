'use client'
import { useState } from 'react'
import { User, Building2, Bell, Shield, Palette, Users, CreditCard, Globe, Key, ChevronRight } from 'lucide-react'

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
  const [activeSection, setActiveSection] = useState('profile')

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
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition text-left ${
                activeSection === section.id
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
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
                  { name: 'Rick Jefferson', email: 'rick@rjbusinesssolutions.org', role: 'Owner' },
                  { name: 'Sarah Chen', email: 'sarah@rjbusinesssolutions.org', role: 'Admin' },
                  { name: 'Mike Johnson', email: 'mike@rjbusinesssolutions.org', role: 'Manager' },
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
                    <span className="px-3 py-1 rounded-full bg-slate-800 text-sm">{member.role}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'billing' && (
          <div className="space-y-6">
            <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50">
              <h3 className="text-lg font-semibold mb-4">Current Plan</h3>
              <div className="flex items-center justify-between p-4 rounded-lg bg-indigo-600/20 border border-indigo-600/30">
                <div>
                  <p className="text-xl font-bold">Pro Plan</p>
                  <p className="text-sm text-slate-400">$99/month • 10 team members</p>
                </div>
                <button className="px-4 py-2 border border-indigo-500 text-indigo-400 rounded-lg hover:bg-indigo-600/20 transition">
                  Upgrade
                </button>
              </div>
            </div>
          </div>
        )}

        {activeSection !== 'profile' && activeSection !== 'company' && activeSection !== 'team' && activeSection !== 'billing' && (
          <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50">
            <h3 className="text-lg font-semibold mb-4">{settingsSections.find(s => s.id === activeSection)?.label}</h3>
            <p className="text-slate-400">Settings panel for {activeSection} configuration.</p>
          </div>
        )}
      </div>
    </div>
  )
}