import Link from 'next/link'
import { ArrowRight, Zap, Shield, BarChart3, Users, Bot, Globe } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              EdgeForce
            </span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-sm text-slate-400 hover:text-white transition">
              Sign in
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-sm mb-6">
            <Zap className="h-3 w-3" />
            Powered by Cloudflare Edge
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Enterprise CRM
            </span>
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Built for Speed
            </span>
          </h1>
          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
            The world's fastest CRM running on Cloudflare's global edge network.
            AI-powered lead scoring, real-time collaboration, and enterprise-grade security
            — all in one platform.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="group px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-lg transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/25"
            >
              Start Free Trial
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 rounded-xl border border-slate-700 hover:border-slate-600 text-slate-300 font-medium text-lg transition"
            >
              View Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 border-t border-slate-800/50">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-4">Everything You Need to Close Deals</h2>
          <p className="text-slate-400 text-center mb-16 max-w-2xl mx-auto">
            From lead capture to revenue analytics, EdgeForce has every feature your sales team needs.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature cards */}
            {[
              { icon: Bot, title: 'AI Lead Scoring', desc: 'Workers AI analyzes contacts and prioritizes your best leads automatically.' },
              { icon: Users, title: 'Contact Management', desc: '360° view of every contact with activity timeline and custom fields.' },
              { icon: BarChart3, title: 'Pipeline Analytics', desc: 'Visual Kanban boards with drag-drop deal management.' },
              { icon: Shield, title: 'Enterprise Security', desc: 'Zero-trust architecture, SOC2 compliant, data encrypted at rest.' },
              { icon: Globe, title: 'Global Edge Speed', desc: 'Sub-50ms response times from 300+ locations worldwide.' },
              { icon: Zap, title: 'Smart Automation', desc: 'Email sequences, task reminders, and workflow automations.' },
            ].map((feature, i) => (
              <div key={i} className="group p-6 rounded-2xl border border-slate-800/50 bg-slate-900/50 hover:bg-slate-900 hover:border-indigo-500/30 transition-all">
                <feature.icon className="h-10 w-10 text-indigo-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-20 px-6 bg-slate-900/50 border-y border-slate-800/50">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-16">Why EdgeForce Beats the Giants</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-slate-400 mb-2">50ms</div>
              <div className="text-sm text-slate-500">Avg Response Time</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-indigo-400 mb-2">100K+</div>
              <div className="text-sm text-slate-500">Max Users</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-400 mb-2">99.99%</div>
              <div className="text-sm text-slate-500">Uptime SLA</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Sales?</h2>
          <p className="text-slate-400 text-lg mb-10">
            Join 10,000+ companies using EdgeForce to close more deals faster.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-lg transition-all shadow-lg shadow-indigo-500/25"
          >
            Start Your Free Trial
            <ArrowRight className="h-5 w-5" />
          </Link>
          <p className="text-slate-500 text-sm mt-4">No credit card required • 14-day free trial</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 py-8 px-6">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold">EdgeForce CRM</span>
          </div>
          <p className="text-slate-500 text-sm">
            Built by RJ Business Solutions • 2026
          </p>
        </div>
      </footer>
    </div>
  )
}