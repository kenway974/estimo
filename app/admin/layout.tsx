import type { Metadata } from 'next'
import Link from 'next/link'
import { LayoutDashboard, Users, Calendar, Star, FileText, LogOut } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Administration | JP Clim',
  robots: { index: false, follow: false },
}

const NAV = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/leads', icon: Users, label: 'Leads' },
  { href: '/admin/slots', icon: Calendar, label: 'Créneaux' },
  { href: '/admin/blog', icon: FileText, label: 'Blog' },
  { href: '/admin/avis', icon: Star, label: 'Avis' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100 flex">
      <aside className="w-56 bg-brand-navy text-white flex flex-col">
        <div className="p-5 border-b border-white/10">
          <div className="font-bold text-lg">JP Clim</div>
          <div className="text-xs text-slate-400">Administration</div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-white/10 hover:text-white transition-colors text-sm"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-3">
          <Link href="/" className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-white text-sm">
            <LogOut className="h-4 w-4" />
            Retour au site
          </Link>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  )
}
