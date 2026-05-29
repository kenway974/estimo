import type { Metadata, Viewport } from 'next'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { CookieBanner } from '@/components/layout/CookieBanner'
import { LocalBusinessSchema } from '@/components/seo/SchemaOrg'
import { Toaster } from 'react-hot-toast'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const plusJakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-plus-jakarta', display: 'swap' })

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.jpclimchauffagiste.com'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'JP Clim Chauffagiste — Installation, Entretien & Dépannage en Île-de-France',
    template: '%s | JP Clim Chauffagiste',
  },
  description: 'Chauffagiste en Île-de-France depuis 2008. Installation chaudière, pompe à chaleur, climatisation, VMC, plomberie. Devis gratuit en ligne. Disponible 24h/7j.',
  keywords: [
    'chauffagiste île-de-france', 'installation chaudière paris', 'pompe à chaleur idf',
    'climatisation réversible paris', 'entretien chaudière', 'dépannage chauffage urgence',
    'VMC installation île-de-france', 'plombier chauffagiste paris', 'génie climatique idf',
    'installation PAC île-de-france', 'plancher chauffant paris', 'remplacement chaudière gaz',
  ],
  authors: [{ name: 'JP Clim Chauffagiste' }],
  creator: 'JP Clim Chauffagiste',
  publisher: 'JP Clim Chauffagiste',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: SITE_URL,
    siteName: 'JP Clim Chauffagiste',
    title: 'JP Clim Chauffagiste — Ile-de-France',
    description: 'Chauffagiste en Île-de-France depuis 2008. Devis gratuit en ligne.',
    images: [{ url: '/images/og-image.jpg', width: 1200, height: 630, alt: 'JP Clim Chauffagiste Île-de-France' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JP Clim Chauffagiste — Île-de-France',
    description: 'Installation, entretien et dépannage en chauffage, climatisation et VMC en Île-de-France.',
    images: ['/images/og-image.jpg'],
  },
  alternates: { canonical: SITE_URL },
  verification: { google: 'ADD_GOOGLE_SEARCH_CONSOLE_TOKEN_HERE' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1a2744',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

  return (
    <html lang="fr" className={`${inter.variable} ${plusJakarta.variable}`}>
      <head>
        <LocalBusinessSchema />
        {gaId && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('consent', 'default', { analytics_storage: 'denied' });
                  gtag('config', '${gaId}', { page_path: window.location.pathname });
                `,
              }}
            />
          </>
        )}
      </head>
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
        <CookieBanner />
        <Toaster position="bottom-right" toastOptions={{ style: { borderRadius: '12px', fontFamily: 'var(--font-inter)' } }} />
      </body>
    </html>
  )
}
