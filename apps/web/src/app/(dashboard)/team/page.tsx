'use client'
import { useState } from 'react'
import {
  Users, Plus, Search, MoreVertical, Shield, Mail, Phone, UserPlus,
  Settings, Crown, UserCheck, UserX, ChevronDown, LayoutGrid, List
} from 'lucide-react'
import { clsx } from 'clsx'

interface TeamMember {
  id: string
  name: string
  email: string
  role: 'owner' | 'admin' | 'manager' | 'member'
  status: 'active' | 'invited' | 'inactive'
  avatar?: string
  lastActive?: string
  joinedAt: string
  contactsAssigned: number
}

interface Invite {
  id: string
  email: string
  role: string
  invitedAt: string
  expiresAt: string
}

const teamMembers: TeamMember[] = [
  { id: '1', name: 'Rick Jefferson', email: 'rick@edgeforce.io', role: 'owner', status: 'active', lastActive: 'Just now', joinedAt: '2026-01-15', contactsAssigned: 245 },
  { id: '2', name: 'Sarah Chen', email: 'sarah@edgeforce.io', role: 'admin', status: 'active', lastActive: '5 min ago', joinedAt: '2026-02-01', contactsAssigned: 189 },
  { id: '3', name: 'Michael Ross', email: 'michael@edgeforce.io', role: 'manager', status: 'active', lastActive: '1 hour ago', joinedAt: '2026-02-10', contactsAssigned: 156 },
  { id: '4', name: 'Emma Wilson', email: 'emma@edgeforce.io', role: 'member', status: 'active', lastActive: '2 hours ago', joinedAt: '2026-03-01', contactsAssigned: 92 },
  { id: '5', name: 'James Lee', email: 'james@edgeforce.io', role: 'member', status: 'invited', lastActive: 'Never', joinedAt: '2026-03-28', contactsAssigned: 0 },
]

const pendingInvites: Invite[] = [
  { id: '1', email: 'david@prospect.com', role: 'member', invitedAt: '2026-03-27', expiresAt: '2026-04-03' },
  { id: '2', email: 'lisa@company.io', role: 'manager', invitedAt: '2026-03-28', expiresAt: '2026-04-04' },
]

const roles = [
  { id: 'admin', name: 'Admin', description: 'Full access to all settings and team management', icon: Shield },
  { id: 'manager', name: 'Manager', description: 'Can manage contacts, deals, and team members', icon: Users },
  { id: 'member', name: 'Member', description: 'Can view and edit assigned contacts and deals', icon: UserCheck },
]

export default function TeamPage() {
  const [activeTab, setActiveTab] = useState<'members' | 'roles' | 'settings'>('members')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-500/20 text-purple-400'
      case 'admin': return 'bg-red-500/20 text-red-400'
      case 'manager': return 'bg-blue-500/20 text-blue-400'
      default: return 'bg-slate-500/20 text-slate-400'
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-500/20 text-emerald-400'
      case 'invited': return 'bg-amber-500/20 text-amber-400'
      default: return 'bg-slate-500/20 text-slate-400'
    }
  }

  const filteredMembers = teamMembers.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Team Management</h1>
          <p className="text-slate-400 mt-1">Manage your team members and their permissions</p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition"
        >
          <UserPlus className="h-4 w-4" />
          Invite Member
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
              <Users className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{teamMembers.filter(m => m.status === 'active').length}</p>
              <p className="text-xs text-slate-400">Active Members</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Mail className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{pendingInvites.length}</p>
              <p className="text-xs text-slate-400">Pending Invites</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <UserCheck className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">582</p>
              <p className="text-xs text-slate-400">Contacts Assigned</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Shield className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">3</p>
              <p className="text-xs text-slate-400">Admin Roles</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800">
        <nav className="flex gap-6">
          {[
            { id: 'members', label: 'Members', count: teamMembers.length },
            { id: 'roles', label: 'Roles & Permissions', count: roles.length },
            { id: 'settings', label: 'Team Settings', count: 0 },
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
        {activeTab === 'members' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={clsx('p-2 rounded-lg transition', viewMode === 'grid' ? 'bg-indigo-600' : 'hover:bg-slate-800')}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={clsx('p-2 rounded-lg transition', viewMode === 'list' ? 'bg-indigo-600' : 'hover:bg-slate-800')}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {activeTab === 'members' && (
        <>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search team members..."
              className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          {/* Pending Invites */}
          {pendingInvites.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <Mail className="h-5 w-5 text-amber-400" />
                <h3 className="font-medium text-white">Pending Invitations</h3>
              </div>
              <div className="space-y-3">
                {pendingInvites.map((invite) => (
                  <div key={invite.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-medium text-slate-400">
                        {invite.email[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{invite.email}</p>
                        <p className="text-xs text-slate-400">Invited {new Date(invite.invitedAt).toLocaleDateString()} · Expires {new Date(invite.expiresAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-medium transition">
                        Resend
                      </button>
                      <button className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-xs font-medium transition">
                        Revoke
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Members Grid/List */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMembers.map((member) => (
                <div
                  key={member.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{member.name}</h3>
                        <p className="text-xs text-slate-400">{member.email}</p>
                      </div>
                    </div>
                    <button className="p-1.5 hover:bg-slate-800 rounded-lg transition">
                      <MoreVertical className="h-4 w-4 text-slate-400" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className={clsx('px-2 py-1 rounded text-xs font-medium', getRoleBadgeColor(member.role))}>
                      {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                    </span>
                    <span className={clsx('px-2 py-1 rounded text-xs font-medium', getStatusBadgeColor(member.status))}>
                      {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-sm">
                    <div>
                      <p className="text-xs text-slate-500">Last active</p>
                      <p className="text-slate-300">{member.lastActive}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Contacts</p>
                      <p className="text-slate-300">{member.contactsAssigned}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-800/50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Member</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Role</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Contacts</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Last Active</th>
                    <th className="px-5 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-slate-800/30 transition">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="font-medium text-white">{member.name}</p>
                            <p className="text-xs text-slate-400">{member.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={clsx('px-2 py-1 rounded text-xs font-medium', getRoleBadgeColor(member.role))}>
                          {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={clsx('px-2 py-1 rounded text-xs font-medium', getStatusBadgeColor(member.status))}>
                          {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-400">{member.contactsAssigned}</td>
                      <td className="px-5 py-4 text-sm text-slate-400">{member.lastActive}</td>
                      <td className="px-5 py-4 text-right">
                        <button className="p-2 hover:bg-slate-800 rounded-lg transition">
                          <MoreVertical className="h-4 w-4 text-slate-400" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {activeTab === 'roles' && (
        <div className="space-y-4">
          {roles.map((role) => (
            <div key={role.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-indigo-500/20 flex items-center justify-center shrink-0">
                  <role.icon className="h-6 w-6 text-indigo-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-white text-lg">{role.name}</h3>
                    <button className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-medium transition">
                      Edit Role
                    </button>
                  </div>
                  <p className="text-sm text-slate-400 mb-4">{role.description}</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs">View Contacts</span>
                    <span className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs">Edit Deals</span>
                    <span className={clsx('px-3 py-1.5 rounded-lg text-xs', role.id === 'owner' || role.id === 'admin' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700/50 text-slate-400')}>Manage Tasks</span>
                    <span className={clsx('px-3 py-1.5 rounded-lg text-xs', role.id === 'owner' || role.id === 'admin' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700/50 text-slate-400')}>View Analytics</span>
                    <span className={clsx('px-3 py-1.5 rounded-lg text-xs', role.id === 'owner' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700/50 text-slate-400')}>Billing</span>
                    <span className={clsx('px-3 py-1.5 rounded-lg text-xs', role.id === 'owner' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700/50 text-slate-400')}>Team Management</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="font-semibold text-white mb-4">Team Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                <div>
                  <p className="font-medium text-white">Allow team members to invite others</p>
                  <p className="text-xs text-slate-400">Members with Admin role can send invitations</p>
                </div>
                <button className="w-12 h-6 bg-indigo-600 rounded-full relative">
                  <div className="absolute right-1 top-1 h-4 w-4 bg-white rounded-full" />
                </button>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                <div>
                  <p className="font-medium text-white">Require email verification</p>
                  <p className="text-xs text-slate-400">New members must verify their email before accessing</p>
                </div>
                <button className="w-12 h-6 bg-indigo-600 rounded-full relative">
                  <div className="absolute right-1 top-1 h-4 w-4 bg-white rounded-full" />
                </button>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                <div>
                  <p className="font-medium text-white">Two-factor authentication</p>
                  <p className="text-xs text-slate-400">Require 2FA for all team members</p>
                </div>
                <button className="w-12 h-6 bg-slate-700 rounded-full relative">
                  <div className="absolute left-1 top-1 h-4 w-4 bg-white rounded-full" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-white mb-6">Invite Team Member</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition"
                >
                  <option value="member">Member</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-medium transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowInviteModal(false)
                    setInviteEmail('')
                  }}
                  className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-medium transition"
                >
                  Send Invite
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}