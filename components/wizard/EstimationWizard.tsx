'use client'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, CheckCircle, Loader2 } from 'lucide-react'
import { WIZARD_STEPS } from './questions'
import { cn } from '@/lib/utils'

interface FormData {
  serviceType?: string
  housingType?: string
  surface?: number
  buildingAge?: string
  urgency?: string
  specificities: string[]
  firstName?: string
  phone?: string
  city?: string
  email?: string
}

const INITIAL_DATA: FormData = { specificities: [] }

export function EstimationWizard() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [data, setData] = useState<FormData>(INITIAL_DATA)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [surfaceInput, setSurfaceInput] = useState('')

  const currentStep = WIZARD_STEPS[step]
  const progress = ((step + 1) / WIZARD_STEPS.length) * 100

  const handleChoice = useCallback(
    (field: string, value: string) => {
      const updated = { ...data, [field]: value }
      setData(updated)
      if (step < WIZARD_STEPS.length - 1) {
        setTimeout(() => setStep((s) => s + 1), 200)
      }
    },
    [data, step]
  )

  const handleMultiSelect = useCallback(
    (value: string) => {
      const current = data.specificities || []
      const updated = current.includes(value) ? current.filter((v) => v !== value) : [...current, value]
      setData({ ...data, specificities: updated })
    },
    [data]
  )

  const handleNext = useCallback(() => {
    if (currentStep.type === 'number') {
      const val = parseInt(surfaceInput)
      if (!surfaceInput || isNaN(val) || val < (currentStep.min || 1)) {
        setError(`Veuillez saisir une surface valide (min. ${currentStep.min} m²)`)
        return
      }
      setData({ ...data, surface: val })
    }
    setError(null)
    setStep((s) => s + 1)
  }, [currentStep, surfaceInput, data])

  const handleSubmit = useCallback(async () => {
    if (!data.firstName || !data.phone || !data.city) {
      setError('Veuillez remplir tous les champs obligatoires')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Erreur serveur')
      const result = await res.json()
      router.push(`/estimation/resultat?lid=${result.leadId}&pid=${result.prospectId}`)
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }, [data, router])

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Barre de progression */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-slate-500">
            Étape {step + 1} sur {WIZARD_STEPS.length}
          </span>
          <span className="text-sm font-medium text-brand-orange">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-brand-orange to-brand-orange-light rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Contenu */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.25 }}
        >
          <h2 className="text-2xl font-heading font-bold text-brand-navy mb-2">
            {currentStep.question}
          </h2>
          {currentStep.subtitle && (
            <p className="text-slate-500 mb-6">{currentStep.subtitle}</p>
          )}

          {/* Choix unique */}
          {currentStep.type === 'choice' && (
            <div className={cn(
              'grid gap-3',
              (currentStep.options?.length ?? 0) <= 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'
            )}>
              {currentStep.options?.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleChoice(currentStep.field, opt.value)}
                  className={cn(
                    'p-4 rounded-xl border-2 text-left transition-all hover:border-brand-orange hover:shadow-md group',
                    (data as Record<string, unknown>)[currentStep.field] === opt.value
                      ? 'border-brand-orange bg-orange-50'
                      : 'border-slate-200 bg-white'
                  )}
                >
                  {opt.icon && <span className="text-2xl mb-2 block">{opt.icon}</span>}
                  <span className="font-semibold text-brand-navy block">{opt.label}</span>
                  {opt.description && (
                    <span className="text-xs text-slate-500 mt-1 block">{opt.description}</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Choix multiple */}
          {currentStep.type === 'multiselect' && (
            <div className="space-y-3">
              {currentStep.options?.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleMultiSelect(opt.value)}
                  className={cn(
                    'w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all hover:border-brand-orange',
                    data.specificities.includes(opt.value)
                      ? 'border-brand-orange bg-orange-50'
                      : 'border-slate-200 bg-white'
                  )}
                >
                  <span className="text-xl">{opt.icon}</span>
                  <span className="font-medium text-brand-navy">{opt.label}</span>
                  {data.specificities.includes(opt.value) && (
                    <CheckCircle className="ml-auto h-5 w-5 text-brand-orange" />
                  )}
                </button>
              ))}
              <button
                onClick={handleNext}
                className="mt-4 w-full bg-brand-navy text-white py-3 rounded-xl font-semibold hover:bg-brand-navy-light transition-colors flex items-center justify-center gap-2"
              >
                Continuer <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Numérique */}
          {currentStep.type === 'number' && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={currentStep.min}
                    max={currentStep.max}
                    value={surfaceInput}
                    onChange={(e) => setSurfaceInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                    placeholder="Ex : 65"
                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-lg focus:outline-none focus:border-brand-orange transition-colors"
                    autoFocus
                  />
                  <span className="text-slate-500 font-medium text-lg">m²</span>
                </div>
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
              </div>
              <button
                onClick={handleNext}
                className="w-full bg-brand-orange text-white py-3 rounded-xl font-semibold hover:bg-brand-orange-dark transition-colors flex items-center justify-center gap-2"
              >
                Continuer <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Contact */}
          {currentStep.type === 'contact' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Prénom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={data.firstName || ''}
                    onChange={(e) => setData({ ...data, firstName: e.target.value })}
                    placeholder="Marie"
                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-orange transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Ville <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={data.city || ''}
                    onChange={(e) => setData({ ...data, city: e.target.value })}
                    placeholder="Paris"
                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-orange transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Téléphone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={data.phone || ''}
                  onChange={(e) => setData({ ...data, phone: e.target.value })}
                  placeholder="06 XX XX XX XX"
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-orange transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email <span className="text-slate-400 text-xs">(pour recevoir votre devis PDF)</span>
                </label>
                <input
                  type="email"
                  value={data.email || ''}
                  onChange={(e) => setData({ ...data, email: e.target.value })}
                  placeholder="marie@email.fr"
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-orange transition-colors"
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-brand-orange text-white py-4 rounded-xl font-semibold text-lg hover:bg-brand-orange-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <><Loader2 className="h-5 w-5 animate-spin" /> Calcul en cours…</>
                ) : (
                  <>Voir mon estimation gratuite <ArrowRight className="h-5 w-5" /></>
                )}
              </button>
              <p className="text-xs text-slate-400 text-center">
                Vos données sont traitées conformément à notre{' '}
                <a href="/confidentialite" className="underline">politique de confidentialité</a>.
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      {step > 0 && currentStep.type !== 'contact' && (
        <button
          onClick={() => setStep((s) => s - 1)}
          className="mt-6 flex items-center gap-2 text-slate-500 hover:text-brand-navy transition-colors text-sm"
        >
          <ArrowLeft className="h-4 w-4" /> Étape précédente
        </button>
      )}
    </div>
  )
}