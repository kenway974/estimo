'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Phone, Menu, X, Flame } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { href: '/', label: 'Accueil' },
  { href: '/estimation', label: 'Estimation gratuite', highlight: true },
  { href: '/blog', label: 'Conseils' },
  { href: '/avis', label: 'Avis clients' },
  { href: '/contact', label: 'Contact' },
]

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-brand-navy shadow-lg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="rounded-lg bg-brand-orange p-1.5">
              <Flame className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-heading font-bold text-white text-base leading-tight block">JP Clim</span>
              <span className="text-xs text-slate-400 leading-tight block">Chauffagiste</span>
            </div>
          </Link>

          {/* Nav desktop */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  link.highlight
                    ? 'bg-brand-orange text-white hover:bg-brand-orange-dark'
                    : 'text-slate-300 hover:text-white hover:bg-brand-navy-light'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* CTA phone */}
          <a
            href="tel:0652495290"
            className="hidden md:flex items-center gap-2 bg-white/10 hover:bg-white/20 transition-colors px-4 py-2 rounded-full text-white text-sm font-medium"
          >
            <Phone className="h-4 w-4 text-brand-orange" />
            06 52 49 52 90
          </a>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-slate-300 hover:text-white"
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-brand-navy-dark border-t border-white/10">
          <nav className="px-4 py-3 space-y-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'block px-3 py-2 rounded-md text-sm font-medium',
                  link.highlight
                    ? 'bg-brand-orange text-white'
                    : 'text-slate-300 hover:text-white hover:bg-brand-navy-light'
                )}
              >
                {link.label}
              </Link>
            ))}
            <a
              href="tel:0652495290"
              className="flex items-center gap-2 px-3 py-2 text-sm text-white font-medium"
            >
              <Phone className="h-4 w-4 text-brand-orange" />
              06 52 49 52 90
            </a>
          </nav>
        </div>
      )}
    </header>
  )
}