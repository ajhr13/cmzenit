export type UserRole = 'paciente' | 'secretaria' | 'doctor' | 'admin'
export type ClinicArea = 'salud' | 'estetica'
export type MembershipTier = 'bronce' | 'plata' | 'oro'

export interface MembershipPlan {
  id: MembershipTier
  name: string
  tagline: string
  badge: string
  color: string
  borderClass: string
  bgLightClass: string
  accentColor: string
  priceAnnual: number
  priceMonthly: number
  affiliatesCount: number
  affiliatesDescription: string
  generalConsultsCount: number | 'Ilimitadas'
  specialistConsultsCount: number
  specialtiesCoveredText: string
  labDiscountPercent: number
  specialistDiscountPercent: number
  aestheticDiscountPercent: number
  hospitalizationDiscountPercent: number
  includedServices: string[]
  highlightedFeatures: string[]
  recommendedFor: string
}

export interface MembershipBeneficiary {
  id?: string
  name: string
  cedula: string
  relationship: string
  phone?: string
  birthDate?: string
  addedAt: string
}

export interface CoverageUsageItem {
  id: string
  date: string
  serviceName: string
  category: ClinicArea | 'laboratorio' | 'odontologia' | 'cardiologia'
  consumedBy: {
    name: string
    cedula: string
    isTitular: boolean
    relationship?: string
  }
  doctorName?: string
  benefitType: 'general' | 'specialist' | 'dental' | 'lab' | 'cardio' | 'aesthetic' | 'descuento'
  discountPercent?: number
  wasFullyCovered: boolean
  costSavedUsd: number
  notes?: string
}

export interface PlanChangeHistory {
  date: string
  fromTier: MembershipTier
  toTier: MembershipTier
  type: 'upgrade' | 'downgrade' | 'renovacion'
  priceDifferenceUsd: number
  note: string
}

export interface PatientMembership {
  id: string
  patientCedula: string
  patientName: string
  patientEmail: string
  patientPhone: string
  tier: MembershipTier
  billingCycle: 'anual' | 'mensual'
  priceUsd: number
  startDate: string
  expiryDate: string
  status: 'activa' | 'vencida' | 'pendiente_pago'
  beneficiaries: MembershipBeneficiary[]
  benefitsRemaining: {
    general: number | 'ilimitadas'
    specialist: number
    dental: number
    lab: number
    cardio: number
    aesthetic: number
  }
  consultsRemaining: {
    general: number | 'ilimitadas'
    specialist: number
  }
  coverageHistory: CoverageUsageItem[]
  planHistory: PlanChangeHistory[]
}
export type AppointmentStatus =
  | 'pendiente'
  | 'confirmada'
  | 'en_sala'
  | 'atendida'
  | 'solicitud_cancelacion'
  | 'cancelada'

export type PaymentStatus = 'pendiente' | 'pagado' | 'exonerado'
export type PaymentMethod =
  | 'pago_movil'
  | 'zelle'
  | 'transferencia'
  | 'punto_venta'
  | 'efectivo_usd'
  | 'efectivo_bs'

export interface VitalSigns {
  blood_pressure?: string // ej: "120/80 mmHg"
  heart_rate?: string // ej: "72 lpm"
  respiratory_rate?: string // ej: "16 rpm"
  temperature?: string // ej: "36.6 °C"
  oxygen_saturation?: string // ej: "98 %"
  weight_kg?: number // ej: 70
  height_cm?: number // ej: 172
  bmi?: number // ej: 23.7 (Calculado: peso / (talla/100)^2)
}

export interface MedicalRecordAttachment {
  name: string
  file_url: string
  file_type?: string
  size_kb?: number
  uploaded_at: string
}

export interface PatientClinicalProfile {
  cedula: string
  fullName: string
  email: string
  phone: string
  gender: 'Masculino' | 'Femenino' | 'Otro' | ''
  birthDate?: string
  address: string
  emergencyContact: string
  emergencyPhone?: string
  weightKg?: number
  heightCm?: number
  bloodType?: string
  chronicDiseases: string
  allergies: string
  surgicalHistory?: string
  currentMedications?: string
  updatedAt?: string
}

export interface Profile {
  id: string
  full_name: string
  cedula: string | null
  email: string
  phone: string | null
  avatar_url: string | null
  auth_provider: string | null
  role: UserRole
  created_at: string
}

export interface Service {
  id: number
  name: string
  category: ClinicArea
  price: number
  duration: string
  description: string | null
  promo_tag: string | null
  is_active: boolean
  created_at: string
}

export interface Doctor {
  id: string
  user_id: string | null
  name: string
  area: ClinicArea
  specialty_name: string
  mpps_license: string
  schedule_text: string
  is_active: boolean
  created_at: string
}

export interface Appointment {
  id: string
  patient_id: string | null
  patient_name: string
  patient_cedula: string
  patient_phone: string
  doctor_id: string | null
  service_id: number | null
  area: ClinicArea
  appointment_date: string
  appointment_time: string
  status: AppointmentStatus
  check_in_time: string | null
  cancellation_reason: string | null
  whatsapp_notified: boolean
  // Módulo de Cobranzas y Pagos
  payment_status?: PaymentStatus
  payment_method?: PaymentMethod
  payment_amount_usd?: number
  payment_amount_bs?: number
  payment_reference?: string
  payment_date?: string
  created_at: string
}

export interface MedicalRecordExam {
  name: string
  type?: string
  result?: string
  file_url?: string
  date?: string
}

export interface MedicalRecord {
  id: string
  appointment_id: string | null
  patient_cedula: string
  patient_name: string
  doctor_id: string | null
  area: ClinicArea
  admission_date: string
  previous_consult_date: string | null
  symptoms: string
  diagnosis: string
  treatment: string
  recipe_file_url: string | null
  exams_json: MedicalRecordExam[]
  // Módulo de Signos Vitales y Alergias Críticas
  vital_signs?: VitalSigns
  allergies?: string[]
  // Módulo de Archivos Médicos y Dermoestéticos
  attachments?: MedicalRecordAttachment[]
  created_at: string
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: {
          id: string
          full_name: string
          email: string
          cedula?: string | null
          phone?: string | null
          avatar_url?: string | null
          auth_provider?: string | null
          role?: UserRole
          created_at?: string
        }
        Update: Partial<Profile>
        Relationships: []
      }
      services: {
        Row: Service
        Insert: {
          id?: number
          name: string
          category?: ClinicArea
          price: number
          duration: string
          description?: string | null
          promo_tag?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: Partial<Service>
        Relationships: []
      }
      doctors: {
        Row: Doctor
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          area?: ClinicArea
          specialty_name: string
          mpps_license: string
          schedule_text: string
          is_active?: boolean
          created_at?: string
        }
        Update: Partial<Doctor>
        Relationships: []
      }
      appointments: {
        Row: Appointment
        Insert: {
          id?: string
          patient_id?: string | null
          patient_name: string
          patient_cedula: string
          patient_phone: string
          doctor_id?: string | null
          service_id?: number | null
          area: ClinicArea
          appointment_date: string
          appointment_time: string
          status?: AppointmentStatus
          check_in_time?: string | null
          cancellation_reason?: string | null
          whatsapp_notified?: boolean
          payment_status?: PaymentStatus
          payment_method?: PaymentMethod
          payment_amount_usd?: number
          payment_amount_bs?: number
          payment_reference?: string
          payment_date?: string
          created_at?: string
        }
        Update: Partial<Appointment>
        Relationships: []
      }
      medical_records: {
        Row: MedicalRecord
        Insert: {
          id?: string
          appointment_id?: string | null
          patient_cedula: string
          patient_name: string
          doctor_id?: string | null
          area?: ClinicArea
          admission_date?: string
          previous_consult_date?: string | null
          symptoms: string
          diagnosis: string
          treatment: string
          recipe_file_url?: string | null
          exams_json?: MedicalRecordExam[] | Json
          vital_signs?: VitalSigns | Json
          allergies?: string[] | Json
          attachments?: MedicalRecordAttachment[] | Json
          created_at?: string
        }
        Update: Partial<MedicalRecord>
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: UserRole
      clinic_area: ClinicArea
      appointment_status: AppointmentStatus
      payment_status: PaymentStatus
      payment_method: PaymentMethod
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
