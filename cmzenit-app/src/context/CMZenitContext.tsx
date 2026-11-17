'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import {
  UserRole,
  ClinicArea,
  Service,
  Doctor,
  Appointment,
  AppointmentStatus,
  MedicalRecord,
  PaymentStatus,
  PaymentMethod,
  VitalSigns,
  MedicalRecordAttachment,
  PatientClinicalProfile,
  MembershipTier,
  PatientMembership,
  MembershipBeneficiary,
  CoverageUsageItem,
  PlanChangeHistory,
} from '@/types/database.types'
import { MEMBERSHIP_PLANS, getInitialBenefitsForTier } from '@/lib/membershipsData'

export interface EnrichedPatientMembership extends PatientMembership {
  isBeneficiary: boolean
  beneficiaryData?: MembershipBeneficiary
  titularCedula: string
  titularName: string
}
import {
  isSupabaseConfigured,
  supabase,
  signInWithEmail as sbSignInWithEmail,
  signUpWithEmail as sbSignUpWithEmail,
  signInWithGoogle as sbSignInWithGoogle,
  signOut as sbSignOut,
  INITIAL_PRECONFIGURED_USERS,
  SystemUser,
  SignUpData,
} from '@/lib/supabase'

export interface AppNotification {
  id: string
  title: string
  message: string
  time: string
  type: 'cancellation_request' | 'appointment' | 'alert' | 'check_in'
  read: boolean
  appointmentId?: string
}

export interface CurrentUser {
  id: string
  name: string
  email: string
  cedula?: string
  phone?: string
  role: UserRole
  avatar?: string
  provider: 'google' | 'email'
}

interface CMZenitContextType {
  // Auth & Roles (RBAC)
  currentUser: CurrentUser | null
  activeRole: UserRole
  activeArea: ClinicArea
  setActiveArea: (area: ClinicArea) => void
  isAuthModalOpen: boolean
  authModalTab: 'signin' | 'signup' | 'forgot'
  openAuthModal: (tab?: 'signin' | 'signup' | 'forgot') => void
  closeAuthModal: () => void
  loginWithEmail: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>
  registerWithEmail: (data: SignUpData) => Promise<{ success: boolean; error?: string }>
  loginWithGoogle: () => Promise<void>
  loginAsPreconfiguredUser: (email: string) => void
  logout: () => Promise<void>
  resetPasswordForEmail: (email: string) => Promise<{ success: boolean; message?: string; tempCode?: string; error?: string }>
  updateUserPassword: (email: string, newPass: string) => Promise<{ success: boolean; error?: string }>

  // Gestión de Usuarios del Sistema (Para Dirección / Admin)
  systemUsers: SystemUser[]
  createSystemUser: (data: {
    full_name: string
    email: string
    password?: string
    cedula: string
    phone: string
    role: UserRole
  }) => Promise<{ success: boolean; user?: SystemUser; error?: string }>

  // Datos
  services: Service[]
  doctors: Doctor[]
  appointments: Appointment[]
  medicalRecords: MedicalRecord[]
  notifications: AppNotification[]

  // Acciones Citas
  bookAppointment: (params: {
    serviceId: number
    doctorId?: string | null
    date: string
    time: string
    patientName?: string
    patientCedula?: string
    patientPhone?: string
    area: ClinicArea
    status?: AppointmentStatus
  }) => Promise<{ success: boolean; appointment?: Appointment; error?: string }>
  validateAndConfirmAppointment: (
    appointmentId: string,
    assignedDoctorId?: string | null
  ) => Promise<{ success: boolean; appointment?: Appointment }>
  dismissUnconfirmedAppointment: (
    appointmentId: string,
    reason?: string
  ) => Promise<void>
  requestCancellation: (appointmentId: string, reason: string) => Promise<void>
  confirmCheckIn: (appointmentId: string) => Promise<void>
  cancelAppointmentWithNotice: (
    appointmentId: string,
    reason: string,
    sendWhatsApp?: boolean
  ) => Promise<{ success: boolean; waUrl?: string }>
  markAppointmentAttended: (appointmentId: string) => Promise<void>

  // Acciones Médicas y Admin
  addMedicalRecord: (
    record: Omit<MedicalRecord, 'id' | 'created_at'>
  ) => Promise<MedicalRecord>
  addDoctor: (doctor: Omit<Doctor, 'id' | 'created_at'>) => Promise<Doctor>
  addService: (service: Omit<Service, 'id' | 'created_at'>) => Promise<Service>
  toggleServiceActive: (id: number) => void
  toggleDoctorActive: (id: string) => void

  // Notificaciones
  markNotificationAsRead: (id: string) => void
  clearNotifications: () => void
  unreadNotificationsCount: number

  // Módulo de Caja y Tasa del Día
  exchangeRate: number
  setExchangeRate: (rate: number) => void
  updateAppointmentPayment: (
    appointmentId: string,
    payment: {
      status: PaymentStatus
      method?: PaymentMethod
      amount_usd?: number
      amount_bs?: number
      reference?: string
    }
  ) => Promise<void>

  // Módulo de Alergias Críticas
  patientAllergiesMap: Record<string, string[]>
  updatePatientAllergies: (patientCedula: string, allergies: string[]) => void

  // Módulo de Ficha y Perfil Clínico del Paciente
  patientProfiles: Record<string, PatientClinicalProfile>
  getPatientProfile: (cedula?: string) => PatientClinicalProfile
  savePatientProfile: (profile: PatientClinicalProfile) => Promise<void>

  // Subida de Archivos Médicos / Dermoestéticos
  uploadMedicalAttachment: (
    file: File
  ) => Promise<{ url: string; name: string; size_kb: number; type: string }>

  // Módulo de Membresías Zenit (Bronce, Plata, Oro)
  patientMemberships: Record<string, PatientMembership>
  getPatientMembership: (cedula?: string) => EnrichedPatientMembership | null
  subscribeToMembership: (data: {
    patientCedula: string
    patientName: string
    patientEmail: string
    patientPhone: string
    tier: MembershipTier
    billingCycle: 'anual' | 'mensual'
    beneficiaries?: Array<{ name: string; cedula: string; relationship: string; phone?: string }>
  }) => Promise<{ success: boolean; membership?: PatientMembership; error?: string }>
  changeMembershipPlan: (
    titularCedula: string,
    newTier: MembershipTier,
    billingCycle?: 'anual' | 'mensual'
  ) => Promise<{ success: boolean; message: string; isUpgrade: boolean; error?: string }>
  consumeMembershipBenefit: (params: {
    titularCedula: string
    benefitType: 'general' | 'specialist' | 'dental' | 'lab' | 'cardio' | 'aesthetic' | 'descuento'
    serviceName: string
    category?: ClinicArea | 'laboratorio' | 'odontologia' | 'cardiologia'
    consumedByName: string
    consumedByCedula: string
    isTitular: boolean
    relationship?: string
    doctorName?: string
    discountPercent?: number
    wasFullyCovered: boolean
    costSavedUsd: number
    notes?: string
  }) => Promise<{ success: boolean; error?: string }>
  addBeneficiaryToMembership: (
    titularCedula: string,
    beneficiary: { name: string; cedula: string; relationship: string; phone?: string }
  ) => Promise<{ success: boolean; error?: string }>
  removeBeneficiaryFromMembership: (
    titularCedula: string,
    beneficiaryCedula: string
  ) => Promise<{ success: boolean; error?: string }>
}

// Datos semilla de respaldo
// Datos semilla de respaldo enriquecidos con la oferta médica y estética completa oficial
const INITIAL_SERVICES: Service[] = [
  // =========================================================================
  // 1. ATENCIÓN MÉDICA PRIMARIA & ESPECIALIDADES CLÍNICAS / QUIRÚRGICAS
  // =========================================================================
  {
    id: 1,
    name: 'Medicina General',
    category: 'salud',
    price: 30.0,
    duration: '30 min',
    description: 'Atención médica primaria, evaluación física integral, control preventivo, emisión de récipe digital y órdenes de laboratorio.',
    promo_tag: 'Atención Primaria',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    name: 'Medicina Interna',
    category: 'salud',
    price: 45.0,
    duration: '40 min',
    description: 'Diagnóstico y tratamiento integral del paciente adulto, manejo de hipertensión, diabetes, dislipidemias y patologías crónicas.',
    promo_tag: 'Más Solicitado',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    name: 'Pediatría',
    category: 'salud',
    price: 45.0,
    duration: '40 min',
    description: 'Control de crecimiento y desarrollo del niño sano, despistaje clínico, esquema de vacunación y atención de enfermedades infantiles.',
    promo_tag: 'Salud Infantil',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 4,
    name: 'Ginecología y Obstetricia',
    category: 'salud',
    price: 55.0,
    duration: '45 min',
    description: 'Control ginecológico preventivo, toma de citología (Papanicolau), control prenatal, ecografía pélvica y transvaginal.',
    promo_tag: 'Chequeo Mujer',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 5,
    name: 'Cardiología Adulta',
    category: 'salud',
    price: 55.0,
    duration: '45 min',
    description: 'Evaluación cardiovascular integral, electrocardiograma digital (ECG), ecocardiograma, riesgo quirúrgico y control de hipertensión.',
    promo_tag: 'Alta Especialidad',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 6,
    name: 'Cardiología Infantil',
    category: 'salud',
    price: 60.0,
    duration: '45 min',
    description: 'Detección y seguimiento de soplos, arritmias, cardiopatías congénitas y evaluación cardiovascular para niños y adolescentes.',
    promo_tag: 'Cardio Pediátrica',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 7,
    name: 'Cirugía General',
    category: 'salud',
    price: 50.0,
    duration: '40 min',
    description: 'Valoración quirúrgica, tratamiento de hernias, patología vesicular, lipomas, quistes y procedimientos ambulatorios menores.',
    promo_tag: 'Quirúrgico',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 8,
    name: 'Cirugía Cardiovascular',
    category: 'salud',
    price: 65.0,
    duration: '45 min',
    description: 'Diagnóstico y tratamiento de enfermedades vasculares periféricas, várices, trombosis, accesos vasculares y patología arterial.',
    promo_tag: 'Vascular',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 9,
    name: 'Cirugía Oncológica',
    category: 'salud',
    price: 65.0,
    duration: '45 min',
    description: 'Evaluación multidisciplinaria y resolución quirúrgica de lesiones tumorales de mama, partes blandas, piel y tracto digestivo.',
    promo_tag: 'Oncología',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 10,
    name: 'Traumatología / Cirugía de la Mano',
    category: 'salud',
    price: 50.0,
    duration: '40 min',
    description: 'Manejo de lesiones articulares, fracturas, esguinces, tendinitis, túnel carpiano y patologías reconstructivas de la mano.',
    promo_tag: null,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 11,
    name: 'Urología',
    category: 'salud',
    price: 50.0,
    duration: '40 min',
    description: 'Diagnóstico y manejo de patologías de próstata, litiasis renal (cálculos), infecciones urinarias y salud urogenital masculina y femenina.',
    promo_tag: null,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 12,
    name: 'Oftalmología / Cirugía Oculoplástica',
    category: 'salud',
    price: 50.0,
    duration: '40 min',
    description: 'Examen de agudeza visual, biomicroscopía con lámpara de hendidura, tonometría, fondo de ojo y cirugía funcional de párpados.',
    promo_tag: 'Salud Visual',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 13,
    name: 'Odontología / Ortodoncia',
    category: 'salud',
    price: 40.0,
    duration: '45 min',
    description: 'Profilaxis ultrasónica profunda, resinas estéticas nanohíbridas, blanqueamiento dental, frenillos y ortodoncia correctiva.',
    promo_tag: 'Salud Dental',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 14,
    name: 'Odontopediatría',
    category: 'salud',
    price: 45.0,
    duration: '40 min',
    description: 'Cuidado dental preventivo y restaurador adaptado a niños y bebés, sellantes de fosas, pulpotomías y manejo amigable del paciente pediátrico.',
    promo_tag: 'Dental Infantil',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 15,
    name: 'Patología Bucal',
    category: 'salud',
    price: 45.0,
    duration: '40 min',
    description: 'Detección, diagnóstico clínico e histopatológico de úlceras, lesiones de mucosa bucal, aftas crónicas y despistaje de cáncer oral.',
    promo_tag: null,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 16,
    name: 'Neumonología',
    category: 'salud',
    price: 50.0,
    duration: '40 min',
    description: 'Estudio de enfermedades del aparato respiratorio, asma, EPOC, bronquitis, secuelas post-infecciosas y evaluación de espirometría.',
    promo_tag: null,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 17,
    name: 'Gastroenterología',
    category: 'salud',
    price: 55.0,
    duration: '40 min',
    description: 'Evaluación y tratamiento de gastritis, reflujo gastroesofágico, colon irritable, hígado graso y solicitud de endoscopias diagnósticas.',
    promo_tag: null,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 18,
    name: 'Oncología Médica',
    category: 'salud',
    price: 65.0,
    duration: '45 min',
    description: 'Consulta médica oncológica, planes de quimioterapia, inmunoterapia, segunda opinión médica y seguimiento clínico especializado.',
    promo_tag: 'Oncología',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 19,
    name: 'Endocrinología',
    category: 'salud',
    price: 50.0,
    duration: '40 min',
    description: 'Diagnóstico de trastornos de tiroides, síndrome metabólico, diabetes mellitus, resistencia a la insulina y desbalances hormonales.',
    promo_tag: null,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 20,
    name: 'Neurología',
    category: 'salud',
    price: 55.0,
    duration: '45 min',
    description: 'Abordaje de cefaleas crónicas, migrañas, epilepsia, temblores, neuropatías, trastornos del sueño y afecciones cerebrovasculares.',
    promo_tag: null,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 21,
    name: 'Neurocirugía',
    category: 'salud',
    price: 70.0,
    duration: '45 min',
    description: 'Evaluación y manejo quirúrgico de hernias discales, patología de columna vertebral, compresión radicular y tumores del sistema nervioso.',
    promo_tag: 'Alta Cirugía',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 22,
    name: 'Nefrología / Diálisis',
    category: 'salud',
    price: 55.0,
    duration: '45 min',
    description: 'Control de función renal, insuficiencia renal aguda y crónica, glomerulopatías, nefropatía diabética y seguimiento de diálisis.',
    promo_tag: null,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 23,
    name: 'Infectología',
    category: 'salud',
    price: 50.0,
    duration: '40 min',
    description: 'Tratamiento de infecciones bacterianas, virales, micóticas complejas, enfermedades de transmisión sexual y asesoría en antibioticoterapia.',
    promo_tag: null,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 24,
    name: 'Dermatología',
    category: 'salud',
    price: 50.0,
    duration: '40 min',
    description: 'Diagnóstico clínico de enfermedades de piel, pelo y uñas: acné, dermatitis, psoriasis, rosácea, despistaje de lunares y biopsias.',
    promo_tag: 'Piel & Salud',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 25,
    name: 'Nutrición',
    category: 'salud',
    price: 35.0,
    duration: '45 min',
    description: 'Evaluación antropométrica y bioimpedancia, diseño de planes de alimentación personalizados para control de peso y soporte nutricional clínico.',
    promo_tag: 'Nutrición Clínica',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 26,
    name: 'Psicología',
    category: 'salud',
    price: 40.0,
    duration: '50 min',
    description: 'Atención psicológica individual, manejo de ansiedad, depresión, estrés, duelo, terapia cognitivo-conductual y apoyo emocional.',
    promo_tag: 'Salud Mental',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 27,
    name: 'Fisioterapia y Rehabilitación',
    category: 'salud',
    price: 35.0,
    duration: '50 min',
    description: 'Rehabilitación física osteomuscular, electroterapia, kinesioterapia, tratamiento para lumbalgias y recuperación funcional postoperatoria.',
    promo_tag: 'Rehabilitación',
    is_active: true,
    created_at: new Date().toISOString(),
  },

  // =========================================================================
  // 2. URGENCIAS Y SERVICIOS 24 HORAS
  // =========================================================================
  {
    id: 28,
    name: 'Emergencia 24h',
    category: 'salud',
    price: 50.0,
    duration: 'Inmediata',
    description: 'Atención médica continua las 24 horas, triaje de urgencias, estabilización de pacientes, suturas y terapia endovenosa rápida.',
    promo_tag: 'Servicio 24 Horas',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 29,
    name: 'Laboratorio Clínico 24h',
    category: 'salud',
    price: 25.0,
    duration: 'Toma inmediata',
    description: 'Toma de muestras y procesamiento de exámenes clínicos 24h: hematología completa, química sanguínea, perfil lipídico, uroanálisis y pruebas especiales.',
    promo_tag: 'Laboratorio 24h',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 30,
    name: 'Hospitalización & Cuidados Clínicos 24h',
    category: 'salud',
    price: 120.0,
    duration: '24 horas',
    description: 'Habitaciones individuales climatizadas con monitoreo multiparámetro, enfermería permanente 24/7 y administración de medicamentos endovenosos.',
    promo_tag: 'Hospitalización 24/7',
    is_active: true,
    created_at: new Date().toISOString(),
  },

  // =========================================================================
  // 3. MEDICINA ESTÉTICA & DERMOESTÉTICA INTEGRAL
  // =========================================================================
  {
    id: 31,
    name: 'Medicina Estética & Dermoestética',
    category: 'estetica',
    price: 60.0,
    duration: '45 min',
    description: 'Evaluación facial y corporal integral por médico especialista, armonización facial, toxina botulínica, ácido hialurónico y bioestimuladores de colágeno.',
    promo_tag: 'Médico Estético',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 32,
    name: 'Masajes Post-Operatorios (Drenaje Linfático)',
    category: 'estetica',
    price: 40.0,
    duration: '50 min',
    description: 'Drenaje linfático manual especializado postcirugía estética, alivio de edemas, prevención de fibrosis y aceleración de recuperación.',
    promo_tag: 'Post-Cirugía',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 33,
    name: 'Hidrafacial + Radiofrecuencia Facial',
    category: 'estetica',
    price: 65.0,
    duration: '60 min',
    description: 'Limpieza hidro-dermoabrasiva con succión vorticial, infusión de sueros de ácido hialurónico y radiofrecuencia tensora.',
    promo_tag: 'Piel Radiante',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 34,
    name: 'Tratamiento Anticelulítico & Moldeador 4 en 1',
    category: 'estetica',
    price: 70.0,
    duration: '60 min',
    description: 'Protocolo reductor intensivo combinado con ultracavitación, radiofrecuencia, criolipólisis y ultrasonido.',
    promo_tag: 'Combinado 4 en 1',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 35,
    name: 'Depilación Láser Diodo con Cabezal Frío',
    category: 'estetica',
    price: 45.0,
    duration: '30 min',
    description: 'Cabezal refrigerado con tecnología indolora para eliminación progresiva y definitiva del vello en cualquier fototipo cutáneo.',
    promo_tag: 'Láser Indoloro',
    is_active: true,
    created_at: new Date().toISOString(),
  },
]

const INITIAL_DOCTORS: Doctor[] = [
  {
    id: 'doc-1',
    user_id: 'user-doc-1',
    name: 'Dr. Carlos Mendoza',
    area: 'salud',
    specialty_name: 'Cardiólogo - Ecocardiografista',
    mpps_license: 'MPPS 84.920 / CMDC 41.201',
    schedule_text: 'Lunes a Viernes: 8:00 AM - 1:00 PM',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'doc-2',
    user_id: 'user-doc-2',
    name: 'Dra. Valeria Santos',
    area: 'salud',
    specialty_name: 'Médico Internista & Hospitalización',
    mpps_license: 'MPPS 92.314 / CMDC 43.850',
    schedule_text: 'Lunes a Sábado: 8:00 AM - 4:00 PM',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'doc-5',
    user_id: 'user-doc-5',
    name: 'Dra. Mariana Castillo',
    area: 'salud',
    specialty_name: 'Ginecología & Obstetricia - Ecografía',
    mpps_license: 'MPPS 95.780 / CMDC 46.220',
    schedule_text: 'Lunes, Miércoles y Viernes: 8:30 AM - 2:00 PM',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'doc-6',
    user_id: 'user-doc-6',
    name: 'Dr. Roberto Blanco',
    area: 'salud',
    specialty_name: 'Oftalmólogo Clínico & Quirúrgico',
    mpps_license: 'MPPS 88.650 / CMO 32.140',
    schedule_text: 'Martes, Jueves y Sábados: 9:00 AM - 3:00 PM',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'doc-7',
    user_id: 'user-doc-7',
    name: 'Dra. Carmen Mendoza',
    area: 'salud',
    specialty_name: 'Médico Cirujano - Consulta General',
    mpps_license: 'MPPS 112.440 / CMDC 51.300',
    schedule_text: 'Lunes a Sábado: 8:00 AM - 5:00 PM',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'doc-3',
    user_id: 'user-doc-3',
    name: 'Dra. Sofía Rincón',
    area: 'estetica',
    specialty_name: 'Dermatóloga & Medicina Estética',
    mpps_license: 'MPPS 104.521 / CMM 50.119',
    schedule_text: 'Lunes a Sábado: 10:00 AM - 4:00 PM',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'doc-4',
    user_id: 'user-doc-4',
    name: 'Lic. Lorena Silva',
    area: 'estetica',
    specialty_name: 'Cosmiatra & Masoterapia Corporal',
    mpps_license: 'MPPS 78.432 / Estética Zenit',
    schedule_text: 'Lunes a Sábado: 9:00 AM - 6:00 PM',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'doc-8',
    user_id: 'user-doc-8',
    name: 'Dra. Elena Morales',
    area: 'salud',
    specialty_name: 'Odontóloga - Salud Bucal & Estética',
    mpps_license: 'MPPS 98.712 / ColOdont 14.502',
    schedule_text: 'Lunes a Viernes: 8:30 AM - 4:00 PM',
    is_active: true,
    created_at: new Date().toISOString(),
  },
]

const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt-1',
    patient_id: 'user-base-paciente',
    patient_name: 'Juan Pérez',
    patient_cedula: 'V-18456789',
    patient_phone: '+58 412 1234567',
    doctor_id: 'doc-1',
    service_id: 1,
    area: 'salud',
    appointment_date: new Date().toISOString().split('T')[0],
    appointment_time: '09:00 AM',
    status: 'en_sala',
    check_in_time: '08:48 AM',
    cancellation_reason: null,
    whatsapp_notified: true,
    payment_status: 'pagado',
    payment_method: 'pago_movil',
    payment_amount_usd: 30,
    payment_amount_bs: 1155,
    payment_reference: 'REF-94021',
    payment_date: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: 'apt-2',
    patient_id: 'user-pat-2',
    patient_name: 'Mariana Silva',
    patient_cedula: 'V-20112345',
    patient_phone: '+58 424 9876543',
    doctor_id: 'doc-3',
    service_id: 6,
    area: 'estetica',
    appointment_date: new Date().toISOString().split('T')[0],
    appointment_time: '11:00 AM',
    status: 'solicitud_cancelacion',
    check_in_time: null,
    cancellation_reason: 'Inconveniente laboral de última hora. Solicito reprogramar para la tarde.',
    whatsapp_notified: false,
    payment_status: 'pendiente',
    payment_amount_usd: 85,
    payment_amount_bs: 3272.5,
    created_at: new Date().toISOString(),
  },
  {
    id: 'apt-3',
    patient_id: 'user-base-paciente',
    patient_name: 'Juan Pérez',
    patient_cedula: 'V-18456789',
    patient_phone: '+58 412 1234567',
    doctor_id: 'doc-4',
    service_id: 4,
    area: 'estetica',
    appointment_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    appointment_time: '02:30 PM',
    status: 'confirmada',
    check_in_time: null,
    cancellation_reason: null,
    whatsapp_notified: true,
    payment_status: 'pendiente',
    payment_amount_usd: 60,
    payment_amount_bs: 2310,
    created_at: new Date().toISOString(),
  },
  {
    id: 'apt-4',
    patient_id: 'user-pat-3',
    patient_name: 'Carlos Alberto Gil',
    patient_cedula: 'V-14789654',
    patient_phone: '+58 416 3322110',
    doctor_id: 'doc-2',
    service_id: 2,
    area: 'salud',
    appointment_date: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0],
    appointment_time: '10:00 AM',
    status: 'atendida',
    check_in_time: '09:55 AM',
    cancellation_reason: null,
    whatsapp_notified: true,
    payment_status: 'pagado',
    payment_method: 'punto_venta',
    payment_amount_usd: 40,
    payment_amount_bs: 1540,
    payment_reference: 'POS-7741',
    payment_date: new Date(Date.now() - 86400000 * 5).toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: 'apt-5',
    patient_id: 'user-pat-val-1',
    patient_name: 'Valentina Colmenares',
    patient_cedula: 'V-24556778',
    patient_phone: '+58 414 2334455',
    doctor_id: 'doc-1', // Dr. Carlos Mendoza (Cardiólogo)
    service_id: 5, // Cardiología & Ecocardiografía
    area: 'salud',
    appointment_date: new Date().toISOString().split('T')[0],
    appointment_time: '10:30 AM',
    status: 'pendiente', // Por validar por secretaría
    check_in_time: null,
    cancellation_reason: null,
    whatsapp_notified: false,
    payment_status: 'pendiente',
    payment_amount_usd: 55,
    payment_amount_bs: 49500,
    created_at: new Date().toISOString(),
  },
  {
    id: 'apt-6',
    patient_id: 'user-pat-val-2',
    patient_name: 'Andrés Eloy Rivas',
    patient_cedula: 'V-19884521',
    patient_phone: '+58 412 8765432',
    doctor_id: null, // Sin especialista asignado (la clínica le asignará uno con la secretaria al confirmar)
    service_id: 3, // Oftalmología & Evaluación Visual
    area: 'salud',
    appointment_date: new Date().toISOString().split('T')[0],
    appointment_time: '01:45 PM',
    status: 'pendiente', // Por validar por secretaría
    check_in_time: null,
    cancellation_reason: null,
    whatsapp_notified: false,
    payment_status: 'pendiente',
    payment_amount_usd: 50,
    payment_amount_bs: 45000,
    created_at: new Date().toISOString(),
  },
]

const INITIAL_RECORDS: MedicalRecord[] = [
  {
    id: 'rec-1',
    appointment_id: 'apt-4',
    patient_cedula: 'V-18456789',
    patient_name: 'Juan Pérez',
    doctor_id: 'doc-1',
    area: 'salud',
    admission_date: new Date(Date.now() - 86400000 * 15).toISOString().split('T')[0],
    previous_consult_date: new Date(Date.now() - 86400000 * 45).toISOString().split('T')[0],
    symptoms: 'Palpitaciones ocasionales post-esfuerzo, mareos leves matutinos. Tensión arterial basal 135/88 mmHg.',
    diagnosis: 'Hipertensión Arterial Estadio 1 controlada. Bradicardia sinusal fisiológica.',
    treatment: 'Losartán Potásico 50mg (1 comprimido diario en ayunas). Dieta baja en sodio y actividad física moderada 30 min/día.',
    recipe_file_url: 'https://cmzenit.com/recipes/recipe_juan_perez_cardio.pdf',
    vital_signs: {
      blood_pressure: '135/88 mmHg',
      heart_rate: '72 lpm',
      respiratory_rate: '16 rpm',
      temperature: '36.6 °C',
      oxygen_saturation: '98 %',
      weight_kg: 81.5,
      height_cm: 176,
      bmi: 26.3,
    },
    allergies: ['Penicilina', 'AINEs (Ibuprofeno)'],
    attachments: [
      {
        name: 'Electrocardiograma_Trazado_12D.png',
        file_url: '/img/hero.png',
        file_type: 'image/png',
        size_kb: 340,
        uploaded_at: '2026-10-18',
      },
    ],
    exams_json: [
      {
        name: 'Electrocardiograma en Reposo (12 derivaciones)',
        type: 'Estudio Cardiológico',
        result: 'Trazado regular, eje normal, sin signos de isquemia aguda.',
        date: '2026-10-18',
      },
      {
        name: 'Perfil Lipídico Completo & Glicemia',
        type: 'Laboratorio de Sangre',
        result: 'Colesterol Total: 195 mg/dL, Triglicéridos: 140 mg/dL, Glicemia: 92 mg/dL.',
        date: '2026-10-16',
      },
    ],
    created_at: new Date().toISOString(),
  },
  {
    id: 'rec-2',
    appointment_id: 'apt-2',
    patient_cedula: 'V-18456789',
    patient_name: 'Juan Pérez',
    doctor_id: 'doc-3',
    area: 'estetica',
    admission_date: new Date(Date.now() - 86400000 * 30).toISOString().split('T')[0],
    previous_consult_date: null,
    symptoms: 'Deshidratación facial, comedones en zona T y fotoenvejecimiento leve.',
    diagnosis: 'Biotipo cutáneo mixto sensible con daño actínico incipiente.',
    treatment: 'Protocolo de Limpieza HydraFacial + Sérum Niacinamida al 10% y Fotoprotector SPF 50 toque seco cada 4 horas.',
    recipe_file_url: 'https://cmzenit.com/skincare/rutina_facial_juan_perez.pdf',
    vital_signs: {
      blood_pressure: '120/78 mmHg',
      heart_rate: '70 lpm',
      temperature: '36.4 °C',
      oxygen_saturation: '99 %',
      weight_kg: 62.0,
      height_cm: 165,
      bmi: 22.8,
    },
    allergies: ['Látex', 'Sulfas'],
    attachments: [
      {
        name: 'Registro_Dermatoscopico_Facial.jpg',
        file_url: '/img/hero.png',
        file_type: 'image/jpeg',
        size_kb: 512,
        uploaded_at: '2026-10-05',
      },
    ],
    exams_json: [
      {
        name: 'Dermatoscopia Facial Digital',
        type: 'Evaluación Cutánea',
        result: 'Sin lesiones melanocíticas atípicas. Poros dilatados en zona centrofacial.',
        date: '2026-10-05',
      },
    ],
    created_at: new Date().toISOString(),
  },
]

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    title: 'Solicitud de Cancelación',
    message: 'La paciente Mariana Silva solicita cancelar su cita de HydraFacial de hoy.',
    time: 'Hace 10 min',
    type: 'cancellation_request',
    read: false,
    appointmentId: 'apt-2',
  },
  {
    id: 'notif-2',
    title: 'Paciente en Sala',
    message: 'Juan Pérez ha realizado check-in (08:48 AM) para Cardiología.',
    time: 'Hace 35 min',
    type: 'check_in',
    read: false,
    appointmentId: 'apt-1',
  },
]

interface SupabaseDbClient {
  from: (table: string) => {
    select: (query?: string) => { order: (col: string) => Promise<{ data: unknown }> } & Promise<{ data: unknown }>
    insert: (values: unknown) => Promise<unknown>
    update: (values: unknown) => { eq: (col: string, val: string) => Promise<unknown> }
  }
}

const db = supabase as unknown as SupabaseDbClient

const CMZenitContext = createContext<CMZenitContextType | undefined>(undefined)

export function CMZenitProvider({ children }: { children: ReactNode }) {
  // POR DEFECTO: Sin sesión iniciada (currentUser === null). Modo público visitante.
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)

  // Lista de usuarios registrados del sistema (inicia con los 4 usuarios base)
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>(INITIAL_PRECONFIGURED_USERS)

  // Área activa: salud (Teal) o estética (Rose)
  const [activeArea, setActiveArea] = useState<ClinicArea>('salud')
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authModalTab, setAuthModalTab] = useState<'signin' | 'signup' | 'forgot'>('signin')

  // Datos reactivos
  const [services, setServices] = useState<Service[]>(INITIAL_SERVICES)
  const [doctors, setDoctors] = useState<Doctor[]>(INITIAL_DOCTORS)
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS)
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>(INITIAL_RECORDS)
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS)

  // Módulo de Caja y Tasa Oficial del Día (USD / Bs.)
  const [exchangeRate, setExchangeRateState] = useState<number>(38.50)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedRate = localStorage.getItem('cmzenit_rate')
      if (savedRate && !isNaN(Number(savedRate))) {
        setExchangeRateState(Number(savedRate))
      }
    }
  }, [])

  const setExchangeRate = (rate: number) => {
    setExchangeRateState(rate)
    if (typeof window !== 'undefined') {
      localStorage.setItem('cmzenit_rate', String(rate))
    }
  }

  // Módulo de Alergias Críticas por Paciente (indexado por Cédula)
  const [patientAllergiesMap, setPatientAllergiesMap] = useState<Record<string, string[]>>({
    'V-18456789': ['Penicilina', 'AINEs (Ibuprofeno)'],
    'V-20112345': ['Látex', 'Sulfas'],
    'V-14789654': ['Yodo / Contrastes'],
  })

  const updatePatientAllergies = (patientCedula: string, allergies: string[]) => {
    const key = patientCedula.trim().toUpperCase()
    setPatientAllergiesMap((prev) => ({
      ...prev,
      [key]: allergies,
    }))
  }

  // Módulo de Ficha y Perfil Clínico del Paciente
  const [patientProfiles, setPatientProfiles] = useState<Record<string, PatientClinicalProfile>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('cmzenit_patient_profiles')
        if (saved) return JSON.parse(saved)
      } catch (e) {
        console.error('Error loading patient profiles from localStorage', e)
      }
    }
    return {
      'V-18456789': {
        cedula: 'V-18456789',
        fullName: 'Juan Pérez (Paciente)',
        email: 'paciente@cmzenit.com',
        phone: '+58 412 1234567',
        gender: 'Masculino',
        birthDate: '1988-06-14',
        address: 'Av. Los Chorros con Transversal 10, Residencias Sebucán Plaza, Torre B, Apto 5-A, Caracas',
        emergencyContact: 'María Elena Pérez (Esposa)',
        emergencyPhone: '+58 414 9988776',
        weightKg: 78.5,
        heightCm: 176,
        bloodType: 'O+',
        chronicDiseases: 'Hipertensión arterial primaria controlada. Rinitis alérgica estacional.',
        allergies: 'Penicilina, AINEs (Ibuprofeno)',
        surgicalHistory: 'Apendicectomía laparoscópica (2018).',
        currentMedications: 'Losartán Potásico 50mg (1 tableta cada 24h).',
        updatedAt: '2026-03-15T10:00:00.000Z',
      },
    }
  })

  const getPatientProfile = (cedula?: string): PatientClinicalProfile => {
    const key = (cedula || currentUser?.cedula || 'V-18456789').trim().toUpperCase()
    if (patientProfiles[key]) {
      return patientProfiles[key]
    }
    return {
      cedula: key,
      fullName: currentUser?.name || 'Paciente',
      email: currentUser?.email || '',
      phone: currentUser?.phone || '',
      gender: 'Masculino',
      birthDate: '',
      address: '',
      emergencyContact: '',
      emergencyPhone: '',
      weightKg: undefined,
      heightCm: undefined,
      bloodType: 'O+',
      chronicDiseases: '',
      allergies: '',
      surgicalHistory: '',
      currentMedications: '',
      updatedAt: undefined,
    }
  }

  const savePatientProfile = async (profile: PatientClinicalProfile) => {
    const key = profile.cedula.trim().toUpperCase()
    const updated: PatientClinicalProfile = {
      ...profile,
      cedula: key,
      updatedAt: new Date().toISOString(),
    }
    setPatientProfiles((prev) => {
      const next = { ...prev, [key]: updated }
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('cmzenit_patient_profiles', JSON.stringify(next))
        } catch (e) {
          console.error('Error saving patient profiles to localStorage', e)
        }
      }
      return next
    })

    // Sincronizar mapa de alergias críticas
    if (updated.allergies) {
      const list = updated.allergies.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean)
      if (list.length > 0) {
        updatePatientAllergies(key, list)
      }
    }

    // Sincronizar datos básicos con currentUser si corresponde
    if (currentUser && (currentUser.cedula?.toUpperCase() === key || currentUser.id === 'user-base-paciente')) {
      setCurrentUser((prev) =>
        prev
          ? {
              ...prev,
              name: updated.fullName || prev.name,
              phone: updated.phone || prev.phone,
              cedula: key,
            }
          : null
      )
    }
  }

  // Módulo de Membresías de Salud Zenit (Bronce, Plata, Oro)
  const [patientMemberships, setPatientMemberships] = useState<Record<string, PatientMembership>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('cmzenit_patient_memberships')
        if (saved) return JSON.parse(saved)
      } catch (e) {
        console.error('Error loading patient memberships from localStorage', e)
      }
    }
    return {
      'V-18456789': {
        id: 'mem-zenit-001',
        patientCedula: 'V-18456789',
        patientName: 'Juan Pérez (Paciente)',
        patientEmail: 'paciente@cmzenit.com',
        patientPhone: '+58 412 1234567',
        tier: 'plata',
        billingCycle: 'anual',
        priceUsd: 140,
        startDate: '2026-01-15',
        expiryDate: '2027-01-15',
        status: 'activa',
        beneficiaries: [
          {
            id: 'ben-1',
            name: 'María Elena Pérez',
            cedula: 'V-20123456',
            relationship: 'Esposa / Pareja',
            phone: '+58 414 9988776',
            addedAt: '2026-01-15',
          },
          {
            id: 'ben-2',
            name: 'Sebastián Pérez',
            cedula: 'V-32456789',
            relationship: 'Hijo',
            phone: '+58 412 1234567',
            addedAt: '2026-01-15',
          },
        ],
        benefitsRemaining: {
          general: 3,
          specialist: 2,
          dental: 2,
          lab: 1,
          cardio: 1,
          aesthetic: 0,
        },
        consultsRemaining: {
          general: 3,
          specialist: 2,
        },
        coverageHistory: [
          {
            id: 'cov-1',
            date: '2026-02-10',
            serviceName: 'Medicina General',
            category: 'salud',
            consumedBy: { name: 'Juan Pérez', cedula: 'V-18456789', isTitular: true },
            doctorName: 'Dra. Carmen Mendoza',
            benefitType: 'general',
            wasFullyCovered: true,
            costSavedUsd: 30,
            notes: 'Consulta de rutina control de tensión arterial. Exonerado 100% por Membresía Plata.',
          },
          {
            id: 'cov-2',
            date: '2026-02-28',
            serviceName: 'Cardiología Adulta',
            category: 'salud',
            consumedBy: { name: 'Juan Pérez', cedula: 'V-18456789', isTitular: true },
            doctorName: 'Dr. Carlos Mendoza',
            benefitType: 'specialist',
            wasFullyCovered: true,
            costSavedUsd: 55,
            notes: 'Evaluación cardiológica anual y riesgo quirúrgico. Exonerado 100% por cuota de especialista.',
          },
          {
            id: 'cov-3',
            date: '2026-03-05',
            serviceName: 'Laboratorio Clínico 24h',
            category: 'laboratorio',
            consumedBy: { name: 'María Elena Pérez', cedula: 'V-20123456', isTitular: false, relationship: 'Esposa' },
            benefitType: 'lab',
            wasFullyCovered: true,
            costSavedUsd: 25,
            notes: 'Perfil 20 completo procesado en laboratorio 24h. Cubierto por cuota anual familiar.',
          },
        ],
        planHistory: [
          {
            date: '2026-01-15',
            fromTier: 'bronce',
            toTier: 'plata',
            type: 'upgrade',
            priceDifferenceUsd: 80,
            note: 'Upgrade familiar para incorporar a cónyuge e hijo. Cuota ampliada exitosamente.',
          },
        ],
      },
    }
  })

  const getPatientMembership = (cedula?: string): EnrichedPatientMembership | null => {
    const key = (cedula || currentUser?.cedula || 'V-18456789').trim().toUpperCase()
    if (patientMemberships[key]) {
      const m = patientMemberships[key]
      return {
        ...m,
        isBeneficiary: false,
        titularCedula: m.patientCedula,
        titularName: m.patientName,
      }
    }
    // Buscar si la cédula pertenece a un beneficiario anclado al titular
    for (const m of Object.values(patientMemberships)) {
      const foundBen = m.beneficiaries?.find(
        (b) => b.cedula.trim().toUpperCase() === key
      )
      if (foundBen) {
        return {
          ...m,
          isBeneficiary: true,
          beneficiaryData: foundBen,
          titularCedula: m.patientCedula,
          titularName: m.patientName,
        }
      }
    }
    return null
  }

  const subscribeToMembership = async (data: {
    patientCedula: string
    patientName: string
    patientEmail: string
    patientPhone: string
    tier: MembershipTier
    billingCycle: 'anual' | 'mensual'
    beneficiaries?: Array<{ name: string; cedula: string; relationship: string; phone?: string }>
  }) => {
    try {
      const key = data.patientCedula.trim().toUpperCase()
      const plan = MEMBERSHIP_PLANS.find((p) => p.id === data.tier)
      const price = data.billingCycle === 'anual' ? (plan?.priceAnnual || 140) : (plan?.priceMonthly || 14)
      const now = new Date()
      const expiry = new Date(now)
      if (data.billingCycle === 'anual') {
        expiry.setFullYear(now.getFullYear() + 1)
      } else {
        expiry.setMonth(now.getMonth() + 1)
      }

      const initialBenefits = getInitialBenefitsForTier(data.tier)

      const formattedBeneficiaries: MembershipBeneficiary[] = (data.beneficiaries || []).map((b, idx) => ({
        id: `ben-${Date.now()}-${idx}`,
        name: b.name,
        cedula: b.cedula.trim().toUpperCase(),
        relationship: b.relationship,
        phone: b.phone,
        addedAt: now.toISOString().split('T')[0],
      }))

      const newMembership: PatientMembership = {
        id: `mem-${Date.now()}`,
        patientCedula: key,
        patientName: data.patientName,
        patientEmail: data.patientEmail,
        patientPhone: data.patientPhone,
        tier: data.tier,
        billingCycle: data.billingCycle,
        priceUsd: price,
        startDate: now.toISOString().split('T')[0],
        expiryDate: expiry.toISOString().split('T')[0],
        status: 'activa',
        beneficiaries: formattedBeneficiaries,
        benefitsRemaining: initialBenefits,
        consultsRemaining: {
          general: initialBenefits.general,
          specialist: initialBenefits.specialist,
        },
        coverageHistory: [],
        planHistory: [
          {
            date: now.toISOString().split('T')[0],
            fromTier: data.tier,
            toTier: data.tier,
            type: 'renovacion',
            priceDifferenceUsd: 0,
            note: `Afiliación inicial al plan ${plan?.name} (${data.billingCycle === 'anual' ? 'Anual' : 'Mensual'}).`,
          },
        ],
      }

      setPatientMemberships((prev) => {
        const next = { ...prev, [key]: newMembership }
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('cmzenit_patient_memberships', JSON.stringify(next))
          } catch (e) {
            console.error('Error saving patient memberships to localStorage', e)
          }
        }
        return next
      })

      return { success: true, membership: newMembership }
    } catch (err: any) {
      return { success: false, error: err.message || 'Error al procesar la membresía' }
    }
  }

  const changeMembershipPlan = async (
    titularCedula: string,
    newTier: MembershipTier,
    billingCycle?: 'anual' | 'mensual'
  ): Promise<{ success: boolean; message: string; isUpgrade: boolean; error?: string }> => {
    try {
      const key = titularCedula.trim().toUpperCase()
      const existing = patientMemberships[key]
      if (!existing) {
        return { success: false, message: '', isUpgrade: false, error: 'No se encontró membresía para este titular.' }
      }

      const tierRanks: Record<MembershipTier, number> = { bronce: 1, plata: 2, oro: 3 }
      const oldRank = tierRanks[existing.tier]
      const newRank = tierRanks[newTier]
      const isUpgrade = newRank > oldRank
      const isDowngrade = newRank < oldRank

      const newPlan = MEMBERSHIP_PLANS.find((p) => p.id === newTier)
      const targetCycle = billingCycle || existing.billingCycle
      const newPrice = targetCycle === 'anual' ? (newPlan?.priceAnnual || 140) : (newPlan?.priceMonthly || 14)
      const priceDiff = Math.max(0, newPrice - existing.priceUsd)

      const initialNew = getInitialBenefitsForTier(newTier)
      const oldInitial = getInitialBenefitsForTier(existing.tier)

      let updatedBenefits = { ...existing.benefitsRemaining }

      if (isUpgrade) {
        const genDelta = (typeof initialNew.general === 'number' && typeof oldInitial.general === 'number')
          ? initialNew.general - oldInitial.general
          : 0
        const currentGen = typeof updatedBenefits.general === 'number' ? updatedBenefits.general : 0
        updatedBenefits = {
          general: newTier === 'oro' ? 'ilimitadas' : currentGen + genDelta,
          specialist: updatedBenefits.specialist + (initialNew.specialist - oldInitial.specialist),
          dental: updatedBenefits.dental + (initialNew.dental - oldInitial.dental),
          lab: updatedBenefits.lab + (initialNew.lab - oldInitial.lab),
          cardio: updatedBenefits.cardio + (initialNew.cardio - oldInitial.cardio),
          aesthetic: updatedBenefits.aesthetic + (initialNew.aesthetic - oldInitial.aesthetic),
        }
      } else if (isDowngrade) {
        // En downgrade: REGLA "pero no se devuelve el dinero", ajustamos el cupo
        updatedBenefits = {
          general: typeof initialNew.general === 'number' ? Math.min(typeof updatedBenefits.general === 'number' ? updatedBenefits.general : initialNew.general, initialNew.general) : 'ilimitadas',
          specialist: Math.min(updatedBenefits.specialist, initialNew.specialist),
          dental: Math.min(updatedBenefits.dental, initialNew.dental),
          lab: Math.min(updatedBenefits.lab, initialNew.lab),
          cardio: Math.min(updatedBenefits.cardio, initialNew.cardio),
          aesthetic: Math.min(updatedBenefits.aesthetic, initialNew.aesthetic),
        }
      }

      // Validar si el nuevo plan soporta el número de beneficiarios
      const maxAllowed = (newPlan?.affiliatesCount || 1) - 1
      let keptBeneficiaries = existing.beneficiaries || []
      if (keptBeneficiaries.length > maxAllowed) {
        keptBeneficiaries = keptBeneficiaries.slice(0, maxAllowed)
      }

      const historyItem: PlanChangeHistory = {
        date: new Date().toISOString().split('T')[0],
        fromTier: existing.tier,
        toTier: newTier,
        type: isUpgrade ? 'upgrade' : (isDowngrade ? 'downgrade' : 'renovacion'),
        priceDifferenceUsd: priceDiff,
        note: isUpgrade
          ? `Upgrade exitoso a ${newPlan?.name}. Nueva cuota de consultas y beneficios activada.`
          : `Cambio a ${newPlan?.name} procesado. Importante: Conforme a las políticas del programa, no aplica reembolso de dinero.`,
      }

      const updatedMembership: PatientMembership = {
        ...existing,
        tier: newTier,
        billingCycle: targetCycle,
        priceUsd: newPrice,
        beneficiaries: keptBeneficiaries,
        benefitsRemaining: updatedBenefits,
        consultsRemaining: {
          general: updatedBenefits.general,
          specialist: updatedBenefits.specialist,
        },
        planHistory: [historyItem, ...(existing.planHistory || [])],
      }

      setPatientMemberships((prev) => {
        const next = { ...prev, [key]: updatedMembership }
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('cmzenit_patient_memberships', JSON.stringify(next))
          } catch (e) {
            console.error('Error saving patient memberships to localStorage', e)
          }
        }
        return next
      })

      const msg = isUpgrade
        ? `¡Felicitaciones! Has subido al plan ${newPlan?.name}. Ya puedes disfrutar de mayor cobertura y descuentos.`
        : `Tu plan ha sido cambiado a ${newPlan?.name}. Recuerda que de acuerdo a las políticas de afiliación, no se realizan devoluciones de dinero.`

      return { success: true, message: msg, isUpgrade }
    } catch (err: any) {
      return { success: false, message: '', isUpgrade: false, error: err.message || 'Error al cambiar plan' }
    }
  }

  const consumeMembershipBenefit = async (params: {
    titularCedula: string
    benefitType: 'general' | 'specialist' | 'dental' | 'lab' | 'cardio' | 'aesthetic' | 'descuento'
    serviceName: string
    category?: ClinicArea | 'laboratorio' | 'odontologia' | 'cardiologia'
    consumedByName: string
    consumedByCedula: string
    isTitular: boolean
    relationship?: string
    doctorName?: string
    discountPercent?: number
    wasFullyCovered: boolean
    costSavedUsd: number
    notes?: string
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      const key = params.titularCedula.trim().toUpperCase()
      const existing = patientMemberships[key]
      if (!existing) {
        return { success: false, error: 'Membresía no encontrada para este titular' }
      }

      const updatedBenefits = { ...existing.benefitsRemaining }
      if (params.wasFullyCovered && params.benefitType !== 'descuento') {
        const currentVal = updatedBenefits[params.benefitType]
        if (typeof currentVal === 'number' && currentVal > 0) {
          updatedBenefits[params.benefitType] = currentVal - 1
        }
      }

      const usageItem: CoverageUsageItem = {
        id: `cov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        date: new Date().toISOString().split('T')[0],
        serviceName: params.serviceName,
        category: params.category || 'salud',
        consumedBy: {
          name: params.consumedByName,
          cedula: params.consumedByCedula,
          isTitular: params.isTitular,
          relationship: params.relationship,
        },
        doctorName: params.doctorName,
        benefitType: params.benefitType,
        discountPercent: params.discountPercent,
        wasFullyCovered: params.wasFullyCovered,
        costSavedUsd: params.costSavedUsd,
        notes: params.notes,
      }

      const updatedMembership: PatientMembership = {
        ...existing,
        benefitsRemaining: updatedBenefits,
        consultsRemaining: {
          general: updatedBenefits.general,
          specialist: updatedBenefits.specialist,
        },
        coverageHistory: [usageItem, ...(existing.coverageHistory || [])],
      }

      setPatientMemberships((prev) => {
        const next = { ...prev, [key]: updatedMembership }
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('cmzenit_patient_memberships', JSON.stringify(next))
          } catch (e) {
            console.error('Error saving patient memberships to localStorage', e)
          }
        }
        return next
      })

      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message || 'Error al registrar consumo de cobertura' }
    }
  }

  const addBeneficiaryToMembership = async (
    titularCedula: string,
    beneficiary: { name: string; cedula: string; relationship: string; phone?: string }
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const key = titularCedula.trim().toUpperCase()
      const existing = patientMemberships[key]
      if (!existing) return { success: false, error: 'Membresía no encontrada' }

      const plan = MEMBERSHIP_PLANS.find((p) => p.id === existing.tier)
      const maxBeneficiaries = (plan?.affiliatesCount || 1) - 1
      if ((existing.beneficiaries || []).length >= maxBeneficiaries) {
        return {
          success: false,
          error: `Tu plan ${plan?.name} permite un máximo de ${maxBeneficiaries} beneficiario(s). Realiza un upgrade a un plan superior para incluir más familiares.`,
        }
      }

      const newBen: MembershipBeneficiary = {
        id: `ben-${Date.now()}`,
        name: beneficiary.name,
        cedula: beneficiary.cedula.trim().toUpperCase(),
        relationship: beneficiary.relationship,
        phone: beneficiary.phone,
        addedAt: new Date().toISOString().split('T')[0],
      }

      const updatedMembership: PatientMembership = {
        ...existing,
        beneficiaries: [...(existing.beneficiaries || []), newBen],
      }

      setPatientMemberships((prev) => {
        const next = { ...prev, [key]: updatedMembership }
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('cmzenit_patient_memberships', JSON.stringify(next))
          } catch (e) {
            console.error('Error saving patient memberships to localStorage', e)
          }
        }
        return next
      })

      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message || 'Error al agregar beneficiario' }
    }
  }

  const removeBeneficiaryFromMembership = async (
    titularCedula: string,
    beneficiaryCedula: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const key = titularCedula.trim().toUpperCase()
      const existing = patientMemberships[key]
      if (!existing) return { success: false, error: 'Membresía no encontrada' }

      const updatedMembership: PatientMembership = {
        ...existing,
        beneficiaries: (existing.beneficiaries || []).filter(
          (b) => b.cedula.trim().toUpperCase() !== beneficiaryCedula.trim().toUpperCase()
        ),
      }

      setPatientMemberships((prev) => {
        const next = { ...prev, [key]: updatedMembership }
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('cmzenit_patient_memberships', JSON.stringify(next))
          } catch (e) {
            console.error('Error saving patient memberships to localStorage', e)
          }
        }
        return next
      })

      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message || 'Error al eliminar beneficiario' }
    }
  }

  // Registrar Cobro / Pago de Cita en Caja (Recepción)
  const updateAppointmentPayment = async (
    appointmentId: string,
    payment: {
      status: PaymentStatus
      method?: PaymentMethod
      amount_usd?: number
      amount_bs?: number
      reference?: string
    }
  ) => {
    const paymentDate = new Date().toISOString()
    const amountUsd = payment.amount_usd || 0
    const amountBs = payment.amount_bs || Math.round(amountUsd * exchangeRate * 100) / 100

    setAppointments((prev) =>
      prev.map((a) =>
        a.id === appointmentId
          ? {
              ...a,
              payment_status: payment.status,
              payment_method: payment.method,
              payment_amount_usd: amountUsd,
              payment_amount_bs: amountBs,
              payment_reference: payment.reference,
              payment_date: paymentDate,
            }
          : a
      )
    )

    if (isSupabaseConfigured()) {
      try {
        await db
          .from('appointments')
          .update({
            payment_status: payment.status,
            payment_method: payment.method,
            payment_amount_usd: amountUsd,
            payment_amount_bs: amountBs,
            payment_reference: payment.reference,
            payment_date: paymentDate,
          })
          .eq('id', appointmentId)
      } catch (e) {
        console.warn('Error sincronizando pago en Supabase:', e)
      }
    }

    const apt = appointments.find((a) => a.id === appointmentId)
    const newNotif: AppNotification = {
      id: 'notif-pay-' + Date.now(),
      title: 'Cobro de Cita Procesado',
      message: `Se registró pago de ${amountUsd} (Bs. ${amountBs.toLocaleString('es-VE')}) para ${apt?.patient_name || 'Paciente'} (${payment.method?.toUpperCase() || 'CAJA'}).`,
      time: 'Justo ahora',
      type: 'alert',
      read: false,
      appointmentId,
    }
    setNotifications((prev) => [newNotif, ...prev])
  }

  // Subida de Archivos Médicos (Supabase Storage con Fallback Base64 Local)
  const uploadMedicalAttachment = async (
    file: File
  ): Promise<{ url: string; name: string; size_kb: number; type: string }> => {
    const size_kb = Math.round(file.size / 1024)

    if (isSupabaseConfigured()) {
      try {
        const fileExt = file.name.split('.').pop()
        const cleanName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_')
        const filePath = `medical-docs/${Date.now()}_${cleanName}`

        const { data, error } = await supabase.storage
          .from('recipes')
          .upload(filePath, file, { upsert: true })

        if (!error && data) {
          const { data: pubData } = supabase.storage
            .from('recipes')
            .getPublicUrl(filePath)

          if (pubData?.publicUrl) {
            return {
              url: pubData.publicUrl,
              name: file.name,
              size_kb,
              type: file.type || 'application/octet-stream',
            }
          }
        }
      } catch (err) {
        console.warn('Error en upload Supabase Storage, usando base64 local:', err)
      }
    }

    // Fallback Offline / Local: Data URL Base64 para visualización inmediata en navegador
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        resolve({
          url: reader.result as string,
          name: file.name,
          size_kb,
          type: file.type || 'application/octet-stream',
        })
      }
      reader.onerror = (e) => reject(e)
      reader.readAsDataURL(file)
    })
  }

  // Rol activo derivado estrictamente del usuario logueado (o paciente si no hay sesión)
  const activeRole: UserRole = currentUser ? currentUser.role : 'paciente'

  // Cargar datos iniciales y activar sincronización en tiempo real (Supabase Realtime)
  useEffect(() => {
    if (!isSupabaseConfigured()) return

    async function loadSupabaseData() {
      try {
        const { data: srvs } = await supabase.from('services').select('*').order('id')
        if (srvs && srvs.length > 0) setServices(srvs)

        const { data: docs } = await supabase.from('doctors').select('*')
        if (docs && docs.length > 0) setDoctors(docs)

        const { data: apts } = await supabase.from('appointments').select('*').order('appointment_date')
        if (apts && apts.length > 0) setAppointments(apts)

        const { data: recs } = await supabase.from('medical_records').select('*')
        if (recs && recs.length > 0) setMedicalRecords(recs as MedicalRecord[])
      } catch (err) {
        console.warn('Conexión inicial Supabase usando fallback local:', err)
      }
    }

    loadSupabaseData()

    // 1. Canal Realtime para Citas y Check-in de Sala
    const appointmentsChannel = supabase
      .channel('realtime:appointments')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments' },
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            const newApt = payload.new as Appointment
            setAppointments((prev) => {
              if (prev.some((a) => a.id === newApt.id)) return prev
              return [newApt, ...prev]
            })
            setNotifications((prev) => [
              {
                id: 'notif-rt-' + Date.now(),
                title: 'Nueva Cita Registrada',
                message: `${newApt.patient_name} agendó para ${newApt.appointment_date} (${newApt.appointment_time}).`,
                time: 'Justo ahora',
                type: 'appointment',
                read: false,
                appointmentId: newApt.id,
              },
              ...prev,
            ])
          } else if (payload.eventType === 'UPDATE') {
            const updatedApt = payload.new as Appointment
            setAppointments((prev) =>
              prev.map((a) => (a.id === updatedApt.id ? updatedApt : a))
            )

            if (updatedApt.status === 'en_sala') {
              setNotifications((prev) => [
                {
                  id: 'notif-rt-' + Date.now(),
                  title: 'Paciente en Sala de Espera',
                  message: `${updatedApt.patient_name} acaba de registrar su llegada (Check-in: ${updatedApt.check_in_time || 'Ahora'}).`,
                  time: 'Justo ahora',
                  type: 'check_in',
                  read: false,
                  appointmentId: updatedApt.id,
                },
                ...prev,
              ])
            }
          } else if (payload.eventType === 'DELETE') {
            const oldId = payload.old?.id
            if (oldId) {
              setAppointments((prev) => prev.filter((a) => a.id !== oldId))
            }
          }
        }
      )
      .subscribe()

    // 2. Canal Realtime para Historias Médicas y Récipes
    const recordsChannel = supabase
      .channel('realtime:medical_records')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'medical_records' },
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            const newRec = payload.new as MedicalRecord
            setMedicalRecords((prev) => {
              if (prev.some((r) => r.id === newRec.id)) return prev
              return [newRec, ...prev]
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(appointmentsChannel)
      supabase.removeChannel(recordsChannel)
    }
  }, [])

  const openAuthModal = (tab: 'signin' | 'signup' | 'forgot' = 'signin') => {
    setAuthModalTab(tab)
    setIsAuthModalOpen(true)
  }

  const closeAuthModal = () => setIsAuthModalOpen(false)

  const syncRoleCookie = (role: UserRole | null) => {
    if (typeof document === 'undefined') return
    if (role) {
      document.cookie = `cmzenit_role=${role}; path=/; max-age=604800; SameSite=Lax`
    } else {
      document.cookie = 'cmzenit_role=; path=/; max-age=0; SameSite=Lax'
    }
  }

  // Iniciar sesión con Correo y Contraseña
  const loginWithEmail = async (email: string, pass: string) => {
    // 1. Verificar si coincide con algún usuario registrado en el sistema local
    const foundLocal = systemUsers.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    )

    if (foundLocal) {
      if (pass && foundLocal.password && pass !== foundLocal.password && pass !== '123456') {
        return { success: false, error: 'Contraseña incorrecta. (Clave demo: 123456)' }
      }

      const loggedUser: CurrentUser = {
        id: foundLocal.id,
        name: foundLocal.full_name,
        email: foundLocal.email,
        cedula: foundLocal.cedula,
        phone: foundLocal.phone,
        role: foundLocal.role,
        avatar: foundLocal.avatar,
        provider: foundLocal.provider,
      }

      setCurrentUser(loggedUser)
      syncRoleCookie(loggedUser.role)
      closeAuthModal()
      return { success: true }
    }

    // 2. Si no es local, intentar con Supabase si está configurado
    const res = await sbSignInWithEmail(email, pass)
    if (res.error) {
      return { success: false, error: res.error.message }
    }

    const userMeta = res.data.user?.user_metadata as Record<string, string | undefined>
    const newUser: CurrentUser = {
      id: res.data.user?.id || 'user-' + Date.now(),
      name: userMeta?.full_name || email.split('@')[0],
      email,
      cedula: userMeta?.cedula || 'V-00000000',
      phone: userMeta?.phone || '+58 412 0000000',
      role: (userMeta?.role || 'paciente') as UserRole,
      provider: 'email',
    }

    setCurrentUser(newUser)
    syncRoleCookie(newUser.role)
    closeAuthModal()
    return { success: true }
  }

  // Registro con Correo (Siempre asigna rol 'paciente' por defecto a nuevos visitantes)
  const registerWithEmail = async (data: SignUpData) => {
    const forcedPatientRole: UserRole = 'paciente'

    const res = await sbSignUpWithEmail({
      ...data,
      role: forcedPatientRole,
    })

    if (res.error) {
      return { success: false, error: res.error.message }
    }

    const newSysUser: SystemUser = {
      id: res.data?.user?.id || 'user-' + Date.now(),
      email: data.email,
      password: data.password,
      full_name: data.full_name,
      cedula: data.cedula,
      phone: data.phone,
      role: forcedPatientRole,
      provider: 'email',
      created_at: new Date().toISOString(),
    }

    // Agregar a la lista de usuarios del sistema
    setSystemUsers((prev) => [newSysUser, ...prev])

    // Iniciar sesión inmediatamente
    const newUser: CurrentUser = {
      id: newSysUser.id,
      name: newSysUser.full_name,
      email: newSysUser.email,
      cedula: newSysUser.cedula,
      phone: newSysUser.phone,
      role: forcedPatientRole,
      provider: 'email',
    }

    setCurrentUser(newUser)
    syncRoleCookie(newUser.role)
    closeAuthModal()
    return { success: true }
  }

  // Login con Google
  const loginWithGoogle = async () => {
    if (isSupabaseConfigured()) {
      await sbSignInWithGoogle()
    } else {
      // Inicia por defecto como paciente preconfigurado en modo demo
      loginAsPreconfiguredUser('paciente@cmzenit.com')
    }
  }

  // Iniciar sesión con un usuario preconfigurado directamente
  const loginAsPreconfiguredUser = (email: string) => {
    const user = systemUsers.find((u) => u.email.toLowerCase() === email.toLowerCase())
    if (!user) return

    const logged: CurrentUser = {
      id: user.id,
      name: user.full_name,
      email: user.email,
      cedula: user.cedula,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar,
      provider: user.provider,
    }

    setCurrentUser(logged)
    syncRoleCookie(logged.role)
    closeAuthModal()
  }

  // Cerrar sesión: regresa al modo visitante público (currentUser = null)
  const logout = async () => {
    await sbSignOut()
    setCurrentUser(null)
    syncRoleCookie(null)
  }

  // Recuperar contraseña enviando correo de restablecimiento
  const resetPasswordForEmail = async (userEmail: string) => {
    const cleanEmail = userEmail.trim().toLowerCase()
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'Por favor ingresa un correo electrónico válido.' }
    }

    try {
      const apiRes = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      })

      const apiData = await apiRes.json()

      if (isSupabaseConfigured()) {
        try {
          await supabase.auth.resetPasswordForEmail(cleanEmail, {
            redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/reset-password` : undefined,
          })
        } catch (sbErr) {
          console.warn('Supabase resetPasswordForEmail fallback:', sbErr)
        }
      }

      return {
        success: true,
        message: apiData.message || `Instrucciones de recuperación enviadas a ${cleanEmail}`,
        tempCode: apiData.tempCode || '948215',
      }
    } catch (err: unknown) {
      console.warn('Fallback local en resetPasswordForEmail:', err)
      return {
        success: true,
        message: `Se ha enviado el enlace de restablecimiento a ${cleanEmail}. Revisa tu bandeja de entrada o spam.`,
        tempCode: '948215',
      }
    }
  }

  // Actualizar la contraseña tras recuperación
  const updateUserPassword = async (userEmail: string, newPass: string) => {
    const cleanEmail = userEmail.trim().toLowerCase()
    if (!newPass || newPass.length < 6) {
      return { success: false, error: 'La nueva contraseña debe tener al menos 6 caracteres.' }
    }

    setSystemUsers((prev) =>
      prev.map((u) => (u.email.toLowerCase() === cleanEmail ? { ...u, password: newPass } : u))
    )

    // Actualizado en systemUsers

    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.updateUser({ password: newPass })
      } catch (err) {
        console.warn('Supabase updateUser password fallback:', err)
      }
    }

    return { success: true }
  }

  // Gestión de Usuarios por Dirección / Admin
  const createSystemUser = async (data: {
    full_name: string
    email: string
    password?: string
    cedula: string
    phone: string
    role: UserRole
  }) => {
    const exists = systemUsers.some(
      (u) => u.email.toLowerCase() === data.email.trim().toLowerCase()
    )

    if (exists) {
      return { success: false, error: 'Ya existe un usuario con este correo electrónico.' }
    }

    const newUser: SystemUser = {
      id: 'user-created-' + Date.now(),
      email: data.email.trim(),
      password: data.password || '123456',
      full_name: data.full_name.trim(),
      cedula: data.cedula.trim(),
      phone: data.phone.trim(),
      role: data.role,
      provider: 'email',
      created_at: new Date().toISOString(),
    }

    setSystemUsers((prev) => [newUser, ...prev])

    // Notificación informativa
    const newNotif: AppNotification = {
      id: 'notif-user-' + Date.now(),
      title: 'Nuevo Usuario Registrado',
      message: `${newUser.full_name} fue registrado con rol: ${newUser.role.toUpperCase()}.`,
      time: 'Justo ahora',
      type: 'alert',
      read: false,
    }
    setNotifications((prev) => [newNotif, ...prev])

    return { success: true, user: newUser }
  }

  // Agendar nueva cita
  const bookAppointment = async (params: {
    serviceId: number
    doctorId?: string | null
    date: string
    time: string
    patientName?: string
    patientCedula?: string
    patientPhone?: string
    area: ClinicArea
    status?: AppointmentStatus
  }) => {
    const patientName = params.patientName || currentUser?.name || 'Paciente Invitado'
    const patientCedula = params.patientCedula || currentUser?.cedula || 'V-S/C'
    const patientPhone = params.patientPhone || currentUser?.phone || '+58 412 0000000'
    const initialStatus: AppointmentStatus = params.status || 'pendiente'
    const finalDoctorId = params.doctorId && params.doctorId.trim() ? params.doctorId.trim() : null

    const newApt: Appointment = {
      id: 'apt-' + Date.now(),
      patient_id: currentUser?.id || 'pat-' + Date.now(),
      patient_name: patientName,
      patient_cedula: patientCedula,
      patient_phone: patientPhone,
      doctor_id: finalDoctorId,
      service_id: params.serviceId,
      area: params.area,
      appointment_date: params.date,
      appointment_time: params.time,
      status: initialStatus,
      check_in_time: null,
      cancellation_reason: null,
      whatsapp_notified: false,
      created_at: new Date().toISOString(),
    }

    // Persistir en Supabase si está disponible
    if (isSupabaseConfigured()) {
      try {
        await db.from('appointments').insert({
          patient_id: currentUser?.id,
          patient_name: patientName,
          patient_cedula: patientCedula,
          patient_phone: patientPhone,
          doctor_id: finalDoctorId,
          service_id: params.serviceId,
          area: params.area,
          appointment_date: params.date,
          appointment_time: params.time,
          status: initialStatus,
        })
      } catch (e) {
        console.warn('Error guardando en Supabase:', e)
      }
    }

    setAppointments((prev) => [newApt, ...prev])

    // Agregar notificación para Secretaría
    const newNotif: AppNotification = {
      id: 'notif-' + Date.now(),
      title: initialStatus === 'pendiente' ? 'Nueva Cita Pendiente de Validación' : 'Nueva Cita Agendada',
      message: `${patientName} solicitó cita para el ${params.date} a las ${params.time}. Validación telefónica / WhatsApp requerida.`,
      time: 'Justo ahora',
      type: 'appointment',
      read: false,
      appointmentId: newApt.id,
    }
    setNotifications((prev) => [newNotif, ...prev])

    return { success: true, appointment: newApt }
  }

  // Secretaría valida con el paciente (llamada/WhatsApp) y confirma la cita
  const validateAndConfirmAppointment = async (
    appointmentId: string,
    assignedDoctorId?: string | null
  ) => {
    let updatedApt: Appointment | undefined

    setAppointments((prev) =>
      prev.map((a) => {
        if (a.id === appointmentId) {
          const finalDocId =
            assignedDoctorId !== undefined
              ? (assignedDoctorId && assignedDoctorId.trim() ? assignedDoctorId.trim() : null)
              : a.doctor_id
          updatedApt = {
            ...a,
            status: 'confirmada',
            doctor_id: finalDocId,
            whatsapp_notified: true,
          }
          return updatedApt
        }
        return a
      })
    )

    if (isSupabaseConfigured()) {
      try {
        const updateData: any = { status: 'confirmada', whatsapp_notified: true }
        if (assignedDoctorId !== undefined) {
          updateData.doctor_id =
            assignedDoctorId && assignedDoctorId.trim() ? assignedDoctorId.trim() : null
        }
        await db.from('appointments').update(updateData).eq('id', appointmentId)
      } catch (e) {
        console.warn('Error confirmando cita en Supabase:', e)
      }
    }

    // Notificación
    const apt = appointments.find((a) => a.id === appointmentId)
    const newNotif: AppNotification = {
      id: 'notif-' + Date.now(),
      title: 'Cita Validada & Confirmada',
      message: `La secretaría validó la asistencia de ${apt?.patient_name || 'Paciente'} para el ${apt?.appointment_date || 'día programado'}.`,
      time: 'Justo ahora',
      type: 'appointment',
      read: false,
      appointmentId,
    }
    setNotifications((prev) => [newNotif, ...prev])

    return { success: true, appointment: updatedApt }
  }

  // Secretaría descarta una cita no confirmada (número falso, prueba o paciente desistió)
  const dismissUnconfirmedAppointment = async (
    appointmentId: string,
    reason?: string
  ) => {
    const finalReason =
      reason || 'Descartada por Secretaría: Registro de prueba / Sin confirmación telefónica o WhatsApp'
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === appointmentId
          ? { ...a, status: 'cancelada', cancellation_reason: finalReason }
          : a
      )
    )

    if (isSupabaseConfigured()) {
      try {
        await db
          .from('appointments')
          .update({
            status: 'cancelada',
            cancellation_reason: finalReason,
          })
          .eq('id', appointmentId)
      } catch (e) {
        console.warn('Error cancelando cita en Supabase:', e)
      }
    }
  }

  // Paciente solicita cancelación a secretaría
  const requestCancellation = async (appointmentId: string, reason: string) => {
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === appointmentId
          ? { ...a, status: 'solicitud_cancelacion', cancellation_reason: reason }
          : a
      )
    )

    if (isSupabaseConfigured()) {
      try {
        await db
          .from('appointments')
          .update({
            status: 'solicitud_cancelacion',
            cancellation_reason: reason,
          })
          .eq('id', appointmentId)
      } catch (e) {
        console.warn(e)
      }
    }

    const apt = appointments.find((a) => a.id === appointmentId)
    const newNotif: AppNotification = {
      id: 'notif-' + Date.now(),
      title: 'Alerta: Solicitud de Cancelación',
      message: `${apt?.patient_name || 'El paciente'} solicita cancelar su cita. Motivo: "${reason}"`,
      time: 'Justo ahora',
      type: 'cancellation_request',
      read: false,
      appointmentId,
    }
    setNotifications((prev) => [newNotif, ...prev])
  }

  // Secretaría marca ingreso del paciente (Check-in)
  const confirmCheckIn = async (appointmentId: string) => {
    const now = new Date()
    const checkInTime = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })

    setAppointments((prev) =>
      prev.map((a) =>
        a.id === appointmentId
          ? { ...a, status: 'en_sala', check_in_time: checkInTime }
          : a
      )
    )

    if (isSupabaseConfigured()) {
      try {
        await db
          .from('appointments')
          .update({
            status: 'en_sala',
            check_in_time: checkInTime,
          })
          .eq('id', appointmentId)
      } catch (e) {
        console.warn(e)
      }
    }

    const apt = appointments.find((a) => a.id === appointmentId)
    const newNotif: AppNotification = {
      id: 'notif-' + Date.now(),
      title: 'Paciente en Sala de Espera',
      message: `${apt?.patient_name || 'Paciente'} ingresó a la clínica a las ${checkInTime}.`,
      time: 'Justo ahora',
      type: 'check_in',
      read: false,
      appointmentId,
    }
    setNotifications((prev) => [newNotif, ...prev])
  }

  // Secretaría cancela con aviso previo y WhatsApp
  const cancelAppointmentWithNotice = async (
    appointmentId: string,
    reason: string,
    sendWhatsApp = true
  ) => {
    const apt = appointments.find((a) => a.id === appointmentId)
    const service = services.find((s) => s.id === apt?.service_id)
    const doctor = doctors.find((d) => d.id === apt?.doctor_id)

    let waUrl = ''

    if (sendWhatsApp && apt) {
      try {
        const res = await fetch('/api/whatsapp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: apt.patient_phone,
            patientName: apt.patient_name,
            doctorName: doctor?.name,
            serviceName: service?.name,
            date: apt.appointment_date,
            time: apt.appointment_time,
            reason,
            eventType: 'cancellation',
          }),
        })
        const data = await res.json()
        if (data.waUrl) {
          waUrl = data.waUrl
        }
      } catch (e) {
        console.warn('Error llamando a API WhatsApp:', e)
      }
    }

    setAppointments((prev) =>
      prev.map((a) =>
        a.id === appointmentId
          ? {
              ...a,
              status: 'cancelada',
              cancellation_reason: reason,
              whatsapp_notified: sendWhatsApp,
            }
          : a
      )
    )

    if (isSupabaseConfigured()) {
      try {
        await db
          .from('appointments')
          .update({
            status: 'cancelada',
            cancellation_reason: reason,
            whatsapp_notified: sendWhatsApp,
          })
          .eq('id', appointmentId)
      } catch (e) {
        console.warn(e)
      }
    }

    return { success: true, waUrl }
  }

  // Doctor marca cita como atendida
  const markAppointmentAttended = async (appointmentId: string) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === appointmentId ? { ...a, status: 'atendida' } : a))
    )

    if (isSupabaseConfigured()) {
      try {
        await db
          .from('appointments')
          .update({ status: 'atendida' })
          .eq('id', appointmentId)
      } catch (e) {
        console.warn(e)
      }
    }
  }

  // Doctor añade evolución médica / ficha estética
  const addMedicalRecord = async (
    record: Omit<MedicalRecord, 'id' | 'created_at'>
  ) => {
    const newRecord: MedicalRecord = {
      ...record,
      id: 'rec-' + Date.now(),
      created_at: new Date().toISOString(),
    }

    if (isSupabaseConfigured()) {
      try {
        await db.from('medical_records').insert(record)
      } catch (e) {
        console.warn(e)
      }
    }

    setMedicalRecords((prev) => [newRecord, ...prev])

    // Marcar cita asociada como atendida si existe
    if (record.appointment_id) {
      await markAppointmentAttended(record.appointment_id)
    }

    return newRecord
  }

  // Admin registra nuevo doctor
  const addDoctor = async (doctor: Omit<Doctor, 'id' | 'created_at'>) => {
    const newDoc: Doctor = {
      ...doctor,
      id: 'doc-' + Date.now(),
      created_at: new Date().toISOString(),
    }

    if (isSupabaseConfigured()) {
      try {
        await db.from('doctors').insert(doctor)
      } catch (e) {
        console.warn(e)
      }
    }

    setDoctors((prev) => [...prev, newDoc])
    return newDoc
  }

  // Admin registra nuevo servicio
  const addService = async (service: Omit<Service, 'id' | 'created_at'>) => {
    const newSrv: Service = {
      ...service,
      id: Date.now(),
      created_at: new Date().toISOString(),
    }

    if (isSupabaseConfigured()) {
      try {
        await db.from('services').insert(service)
      } catch (e) {
        console.warn(e)
      }
    }

    setServices((prev) => [...prev, newSrv])
    return newSrv
  }

  const toggleServiceActive = (id: number) => {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, is_active: !s.is_active } : s))
    )
  }

  const toggleDoctorActive = (id: string) => {
    setDoctors((prev) =>
      prev.map((d) => (d.id === id ? { ...d, is_active: !d.is_active } : d))
    )
  }

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  const clearNotifications = () => {
    setNotifications([])
  }

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length

  return (
    <CMZenitContext.Provider
      value={{
        currentUser,
        activeRole,
        activeArea,
        setActiveArea,
        isAuthModalOpen,
        authModalTab,
        openAuthModal,
        closeAuthModal,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        loginAsPreconfiguredUser,
        logout,
        resetPasswordForEmail,
        updateUserPassword,
        systemUsers,
        createSystemUser,
        services,
        doctors,
        appointments,
        medicalRecords,
        notifications,
        bookAppointment,
        validateAndConfirmAppointment,
        dismissUnconfirmedAppointment,
        requestCancellation,
        confirmCheckIn,
        cancelAppointmentWithNotice,
        markAppointmentAttended,
        addMedicalRecord,
        addDoctor,
        addService,
        toggleServiceActive,
        toggleDoctorActive,
        markNotificationAsRead,
        clearNotifications,
        unreadNotificationsCount,
        exchangeRate,
        setExchangeRate,
        updateAppointmentPayment,
        patientAllergiesMap,
        updatePatientAllergies,
        patientProfiles,
        getPatientProfile,
        savePatientProfile,
        uploadMedicalAttachment,
        patientMemberships,
        getPatientMembership,
        subscribeToMembership,
        changeMembershipPlan,
        consumeMembershipBenefit,
        addBeneficiaryToMembership,
        removeBeneficiaryFromMembership,
      }}
    >
      {children}
    </CMZenitContext.Provider>
  )
}

export function useCMZenit() {
  const context = useContext(CMZenitContext)
  if (!context) {
    throw new Error('useCMZenit debe ser usado dentro de un CMZenitProvider')
  }
  return context
}
