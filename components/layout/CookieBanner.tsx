'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { X, Cookie } from 'lucide-react'

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) setVisible(true)
  }, [])

  const accept = () => {
    localStorage.setItem('cookie-consent', 'accepted')
    setVisible(false)
    // Activer GA
    if (typeof window !== 'undefined' && (window as unknown as Record<string, unknown>).gtag) {
      ;(window as unknown as Record<string, Function>).gtag('consent', 'update', {
        analytics_storage: 'granted',
      })
    }
  }

  const decline = () => {
    localStorage.setItem('cookie-consent', 'declined')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-slide-up">
      <div className="mx-auto max-w-4xl bg-white rounded-xl shadow-2xl border border-slate-200 p-5">
        <div className="flex items-start gap-4">
          <Cookie className="h-6 w-6 text-brand-orange flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-slate-700">
              Nous utilisons des cookies pour mesurer l’audience (Google Analytics) et améliorer votre expérience.
              Vos données ne sont jamais vendues.{' '}
              <Link href="/confidentialite" className="underline text-brand-orange">
                En savoir plus
              </Link>
            </p>
            <div className="flex flex-wrap gap-3 mt-3">
              <button
                onClick={accept}
                className="bg-brand-orange text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-brand-orange-dark transition-colors"
              >
                Accepter
              </button>
              <button
                onClick={decline}
                className="bg-slate-100 text-slate-700 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
              >
                Refuser
              </button>
            </div>
          </div>
          <button onClick={decline} className="text-slate-400 hover:text-slate-600 flex-shrink-0">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}