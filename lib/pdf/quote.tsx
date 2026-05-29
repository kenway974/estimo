'use client'
import React from 'react'
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 10, color: '#1e293b', paddingTop: 40, paddingBottom: 40, paddingHorizontal: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24, borderBottom: 2, borderBottomColor: '#1a2744', paddingBottom: 16 },
  headerLeft: {},
  companyName: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: '#1a2744', marginBottom: 4 },
  companyTagline: { fontSize: 9, color: '#64748b' },
  headerRight: { textAlign: 'right' },
  docTitle: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#f97316', marginBottom: 4 },
  docDate: { fontSize: 9, color: '#64748b' },
  disclaimer: { backgroundColor: '#fef3c7', padding: 10, borderRadius: 4, marginBottom: 20, borderLeft: 3, borderLeftColor: '#f59e0b' },
  disclaimerText: { fontSize: 9, color: '#92400e' },
  sectionTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#1a2744', marginBottom: 8, marginTop: 16, borderBottom: 1, borderBottomColor: '#e2e8f0', paddingBottom: 4 },
  table: { border: 1, borderColor: '#e2e8f0', borderRadius: 4, marginBottom: 16 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#1a2744', padding: 8 },
  tableHeaderText: { color: '#fff', fontFamily: 'Helvetica-Bold', fontSize: 9 },
  tableRow: { flexDirection: 'row', padding: 8, borderTop: 1, borderTopColor: '#f1f5f9' },
  tableRowAlt: { backgroundColor: '#f8fafc' },
  col1: { flex: 3 },
  col2: { flex: 1, textAlign: 'right' },
  estimateBox: { backgroundColor: '#eff6ff', padding: 16, borderRadius: 4, borderLeft: 4, borderLeftColor: '#1a2744', marginBottom: 16 },
  estimateLabel: { fontSize: 9, color: '#64748b', marginBottom: 4 },
  estimateAmount: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: '#1a2744' },
  estimateNote: { fontSize: 8, color: '#64748b', marginTop: 4 },
  guideSection: { marginTop: 20 },
  guideCard: { backgroundColor: '#f0fdf4', padding: 12, borderRadius: 4, marginBottom: 8, borderLeft: 3, borderLeftColor: '#22c55e' },
  guideTitle: { fontFamily: 'Helvetica-Bold', fontSize: 10, color: '#166534', marginBottom: 6 },
  guideItem: { fontSize: 9, color: '#374151', marginBottom: 3, marginLeft: 8 },
  footer: { position: 'absolute', bottom: 20, left: 50, right: 50, borderTop: 1, borderTopColor: '#e2e8f0', paddingTop: 10 },
  footerText: { fontSize: 8, color: '#94a3b8', textAlign: 'center' },
  ctaBox: { backgroundColor: '#f97316', padding: 12, borderRadius: 4, marginTop: 16, textAlign: 'center' },
  ctaText: { color: '#fff', fontFamily: 'Helvetica-Bold', fontSize: 11 },
  ctaSub: { color: '#ffedd5', fontSize: 9, marginTop: 4 },
})

interface QuotePDFProps {
  firstName: string
  serviceType: string
  housingType: string
  surface?: number
  city: string
  estimateMin: number
  estimateMax: number
  details: string[]
  prospectId: string
  date: string
}

export function QuotePDF({
  firstName,
  serviceType,
  housingType,
  surface,
  city,
  estimateMin,
  estimateMax,
  details,
  prospectId,
  date,
}: QuotePDFProps) {
  return (
    <Document title={`Devis indicatif JP Clim — ${firstName}`} author="JP Clim Chauffagiste">
      <Page size="A4" style={styles.page}>
        {/* En-tête */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.companyName}>JP Clim Chauffagiste</Text>
            <Text style={styles.companyTagline}>Chauffage · Climatisation · VMC · Plomberie · Électricité</Text>
            <Text style={styles.companyTagline}>Île-de-France — 06 52 49 52 90</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.docTitle}>DEVIS INDICATIF</Text>
            <Text style={styles.docDate}>Date : {date}</Text>
            <Text style={styles.docDate}>Réf. : {prospectId}</Text>
          </View>
        </View>

        {/* Avertissement */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            ⚠️ CE DOCUMENT EST UN DEVIS INDICATIF ET NON CONTRACTUEL. Le tarif réel peut différer
            selon les particularités techniques du chantier, l'accessibilité, l'état des
            installations existantes et les matériaux choisis. Seule une visite sur site permet
            d'établir un devis définitif et contractuel.
          </Text>
        </View>

        {/* Informations client */}
        <Text style={styles.sectionTitle}>Informations de la demande</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.col1]}>Champ</Text>
            <Text style={[styles.tableHeaderText, styles.col2]}>Valeur</Text>
          </View>
          {[
            ['Client', firstName],
            ['Ville', city],
            ['Type de prestation', serviceType],
            ['Type de logement', housingType],
            ['Surface', surface ? `${surface} m²` : 'Non renseigné'],
          ].map(([label, value], i) => (
            <View key={label} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
              <Text style={styles.col1}>{label}</Text>
              <Text style={styles.col2}>{value}</Text>
            </View>
          ))}
        </View>

        {/* Estimation */}
        <Text style={styles.sectionTitle}>Estimation indicative</Text>
        <View style={styles.estimateBox}>
          <Text style={styles.estimateLabel}>Fourchette estimée (TTC, main d’œuvre + matériaux courants) :</Text>
          <Text style={styles.estimateAmount}>
            {estimateMin.toLocaleString('fr-FR')} € – {estimateMax.toLocaleString('fr-FR')} €
          </Text>
          <Text style={styles.estimateNote}>
            Facteurs pris en compte : {details.join(' · ')}
          </Text>
        </View>

        {/* Guide pratique */}
        <Text style={styles.sectionTitle}>🎁 Votre guide pratique offert</Text>

        <View style={styles.guideCard}>
          <Text style={styles.guideTitle}>✅ Entretien courant (gestes à faire vous-même)</Text>
          <Text style={styles.guideItem}>• Nettoyez les filtres de votre climatisation tous les 2 mois (eau tiède, brosse douce)</Text>
          <Text style={styles.guideItem}>• Purgez vos radiateurs en début de saison : tournez la vis en haut jusqu'au sifflement, puis refermez dès que l'eau coule</Text>
          <Text style={styles.guideItem}>• Vérifiez mensuellement que la pression de votre chaudière est entre 1 et 1,5 bar (cadran sur le boîtier)</Text>
          <Text style={styles.guideItem}>• Nettoyez les bouches VMC (désserrez, rincez à l'eau tiède, laissez sécher)</Text>
        </View>

        <View style={styles.guideCard}>
          <Text style={styles.guideTitle}>⚡ 5 réglages pour économiser jusqu'à 20% d'énergie</Text>
          <Text style={styles.guideItem}>1. Réduisez de 1°C la nuit et dans les pièces inutilisées (économie : ~7% par degré)</Text>
          <Text style={styles.guideItem}>2. Programmez votre chauffage : 19°C en journée, 17°C la nuit, 14°C en absence prolongée</Text>
          <Text style={styles.guideItem}>3. Ne couvrez pas vos radiateurs — les meubles trop proches réduisent l'efficacité de 30%</Text>
          <Text style={styles.guideItem}>4. Ventilez 10 minutes le matin plutôt que de laisser les fenêtres entrouvertes (perte thermique ×5)</Text>
          <Text style={styles.guideItem}>5. Installez des robinets thermostatiques sur vos radiateurs pour réguler pièce par pièce</Text>
        </View>

        <View style={styles.guideCard}>
          <Text style={styles.guideTitle}>🚨 Signaux d'alerte : appelez sans attendre</Text>
          <Text style={styles.guideItem}>• Odeur de gaz ou brülé → coupez le gaz et appelez immédiatement</Text>
          <Text style={styles.guideItem}>• Chaudière qui clignote ou s'éteint plusieurs fois par semaine → panne imminente</Text>
          <Text style={styles.guideItem}>• Bruit de claquement dans les canalisations → coup de bélier, risque de fuite</Text>
          <Text style={styles.guideItem}>• Climatisation qui ne refroidit plus malgré le nettoyage → fuite de fluide frigorigène</Text>
          <Text style={styles.guideItem}>• Moisissures sur les murs → VMC insuffisante, à vérifier de toute urgence</Text>
        </View>

        {/* CTA */}
        <View style={styles.ctaBox}>
          <Text style={styles.ctaText}>Prêt pour un devis réel sur site ? Appelez le 06 52 49 52 90</Text>
          <Text style={styles.ctaSub}>Ou prenez rendez-vous en ligne sur jpclimchauffagiste.com — Gratuit, sans engagement</Text>
        </View>

        {/* Pied de page */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            JP Clim Chauffagiste · Île-de-France · 06 52 49 52 90 · jpclim.chauffagiste@gmail.com
            {'\n'}Document indicatif non contractuel · Réf. {prospectId} · {date}
          </Text>
        </View>
      </Page>
    </Document>
  )
}