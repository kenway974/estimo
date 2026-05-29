export type CRMEventType =
  | 'ESTIMATE_VIEWED'
  | 'QUOTE_EMAIL_SENT'
  | 'QUOTE_EMAIL_OPENED'
  | 'CALLBACK_REQUESTED'
  | 'APPOINTMENT_BOOKED'
  | 'CONTACT_FORM_SUBMITTED'
  | 'PHONE_CLICKED'

export interface ProspectData {
  prospectId: string
  firstName: string
  email?: string
  phone: string
  city: string
  serviceType: string
  housingType: string
  surface?: number
  urgency: string
  estimateMin: number
  estimateMax: number
  status: string
  source?: string
}

export interface CRMEvent {
  type: CRMEventType
  metadata?: Record<string, unknown>
  timestamp?: Date
}

export interface CRMAdapter {
  createProspect(data: ProspectData): Promise<string>
  updateProspect(prospectId: string, update: Partial<ProspectData>): Promise<void>
  trackEvent(prospectId: string, event: CRMEvent): Promise<void>
}