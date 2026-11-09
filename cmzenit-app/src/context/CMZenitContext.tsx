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
} from '@/types/database.types'
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
}

// Datos semilla de respaldo
// Datos semilla de respaldo enriquecidos con la oferta médica y estética completa
const INITIAL_SERVICES: Service[] = [
  // --- SALUD / ESPECIALIDADES CLÍNICAS ---
  {
    id: 1,
    name: 'Consulta General & Medicina Familiar',
    category: 'salud',
    price: 30.0,
    duration: '30 min',
    description: 'Evaluación médica integral, control de signos vitales, chequeo de salud general y emisión de récipe digital.',
    promo_tag: 'Atención Diaria',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    name: 'Hospitalización & Cuidados Clínicos',
    category: 'salud',
    price: 120.0,
    duration: '24 horas',
    description: 'Habitaciones individuales con monitoreo multiparámetro, atención de enfermería 24/7 y administración de tratamiento endovenoso.',
    promo_tag: 'Monitoreo 24/7',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    name: 'Oftalmología & Evaluación Visual',
    category: 'salud',
    price: 50.0,
    duration: '40 min',
    description: 'Examen de agudeza visual, biomicroscopía en lámpara de hendidura, tonometría (presión ocular) y fondo de ojo.',
    promo_tag: 'Salud Visual',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 4,
    name: 'Ginecología & Obstetricia Integral',
    category: 'salud',
    price: 55.0,
    duration: '45 min',
    description: 'Control ginecológico preventivo, toma de citología (Papanicolau), ecografía pélvica/transvaginal y control prenatal.',
    promo_tag: 'Chequeo Mujer',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 5,
    name: 'Cardiología & Ecocardiografía',
    category: 'salud',
    price: 55.0,
    duration: '45 min',
    description: 'Electrocardiograma digital, evaluación preoperatoria y control de presión arterial.',
    promo_tag: 'Más Solicitado',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 6,
    name: 'Medicina Interna',
    category: 'salud',
    price: 45.0,
    duration: '40 min',
    description: 'Diagnóstico integral del adulto, control de glicemia, perfil metabólico y chequeo preventivo.',
    promo_tag: null,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 19,
    name: 'Odontología Integral & Diseño de Sonrisa',
    category: 'salud',
    price: 40.0,
    duration: '45 min',
    description: 'Profilaxis ultrasónica, odontología estética, resinas de alta densidad, blanqueamiento dental y ortodoncia correctiva.',
    promo_tag: 'Sonrisa Perfecta',
    is_active: true,
    created_at: new Date().toISOString(),
  },

  // --- ESPACIO ESTÉTICA: MASAJES Y CORPORAL (Volante CMZenit) ---
  {
    id: 8,
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
    id: 9,
    name: 'Masajes Relajantes & Antiestrés',
    category: 'estetica',
    price: 35.0,
    duration: '50 min',
    description: 'Terapia manual corporal con aceites botánicos y aromaterapia para descargar tensiones musculares y restaurar el bienestar.',
    promo_tag: 'Bienestar',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 10,
    name: 'Tratamiento Anticelulítico & Moldeador',
    category: 'estetica',
    price: 70.0,
    duration: '60 min',
    description: 'Protocolo reductor intensivo combinado con ultracavitación, radiofrecuencia, criolipólisis y ultrasonido.',
    promo_tag: 'Combinado 4 en 1',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 11,
    name: 'Depilación Láser Diodo (Sesión)',
    category: 'estetica',
    price: 45.0,
    duration: '30 min',
    description: 'Cabezal refrigerado con tecnología indolora para eliminación progresiva del vello en cualquier fototipo cutáneo.',
    promo_tag: 'Paquete Disponible',
    is_active: true,
    created_at: new Date().toISOString(),
  },

  // --- ESPACIO ESTÉTICA: FACIAL (Volante CMZenit) ---
  {
    id: 12,
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
    id: 13,
    name: 'Dermoabrasión & Ultrasonido Facial',
    category: 'estetica',
    price: 50.0,
    duration: '45 min',
    description: 'Exfoliación mecánica profunda con punta de diamante y ondas ultrasónicas para renovar la capa córnea y limpiar poros.',
    promo_tag: 'Renovación',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 14,
    name: 'Peeling Ultrasónico Profundo',
    category: 'estetica',
    price: 40.0,
    duration: '40 min',
    description: 'Espátula ultrasónica de alta vibración para remover células muertas, comedones y exceso de sebo sin agredir la piel.',
    promo_tag: null,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 15,
    name: 'Terapia con Martillo en Frío (Crioterapia Facial)',
    category: 'estetica',
    price: 35.0,
    duration: '30 min',
    description: 'Cierre de poros con frío localizado, reducción de inflamación, sellado de nutrientes y efecto tensor inmediato.',
    promo_tag: 'Calmante',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 16,
    name: 'Fototerapia Facial con Máscara LED',
    category: 'estetica',
    price: 35.0,
    duration: '35 min',
    description: 'Luces terapéuticas espectrales (roja para colágeno, azul bactericida para acné y verde para despigmentación celular).',
    promo_tag: 'Fotónica',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 17,
    name: 'Protocolo de Hidratación & Protector Solar',
    category: 'estetica',
    price: 45.0,
    duration: '45 min',
    description: 'Velo hidratante concentrado, mascarilla hidroplástica regeneradora y sellado con protector solar dermatológico de amplio espectro.',
    promo_tag: 'Nutrición',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 18,
    name: 'Armonización Facial & Toxina Botulínica (Bótox)',
    category: 'estetica',
    price: 180.0,
    duration: '60 min',
    description: 'Perfilado labial con ácido hialurónico y atenuación suave de arrugas de expresión con toxina botulínica.',
    promo_tag: 'Médico Especialista',
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
