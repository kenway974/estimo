export function LocalBusinessSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': 'https://www.jpclimchauffagiste.com/#organization',
    name: 'JP Clim Chauffagiste',
    description: 'Chauffagiste en Île-de-France. Installation, entretien et dépannage de chaudières, pompes à chaleur, climatisation, VMC, plomberie et électricité. Expérience depuis 2008.',
    url: 'https://www.jpclimchauffagiste.com',
    telephone: '+33652495290',
    email: 'jpclim.chauffagiste@gmail.com',
    address: {
      '@type': 'PostalAddress',
      addressRegion: 'Île-de-France',
      addressCountry: 'FR',
    },
    geo: {
      '@type': 'GeoCircle',
      geoMidpoint: { '@type': 'GeoCoordinates', latitude: 48.8566, longitude: 2.3522 },
      geoRadius: '80000',
    },
    areaServed: {
      '@type': 'AdministrativeArea',
      name: 'Île-de-France',
    },
    openingHoursSpecification: [
      { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], opens: '00:00', closes: '23:59' },
    ],
    sameAs: ['https://www.instagram.com/jpclim.chauffagiste'],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Services JP Clim',
      itemListElement: [
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Installation chaudière Île-de-France' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Installation pompe à chaleur Île-de-France' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Installation climatisation Île-de-France' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Entretien chaudière Île-de-France' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Dépannage chauffage urgence Île-de-France' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Installation VMC Île-de-France' } },
      ],
    },
    foundingDate: '2024',
    knowsAbout: ['Chauffage', 'Climatisation', 'VMC', 'Plomberie', 'Électricité', 'Pompe à chaleur', 'Chaudière gaz', 'Entretien'],
    priceRange: '€€',
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function FAQSchema({ faqs }: { faqs: { question: string; answer: string }[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer },
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function BlogPostSchema({ post }: {
  post: { title: string; excerpt: string; publishedAt: Date | null; slug: string; category: string }
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt?.toISOString(),
    author: {
      '@type': 'Organization',
      name: 'JP Clim Chauffagiste',
      url: 'https://www.jpclimchauffagiste.com',
    },
    publisher: {
      '@type': 'Organization',
      name: 'JP Clim Chauffagiste',
    },
    url: `https://www.jpclimchauffagiste.com/blog/${post.slug}`,
    articleSection: post.category,
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}