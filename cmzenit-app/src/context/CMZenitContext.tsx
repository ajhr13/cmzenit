'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import {
  UserRole,
  ClinicArea,
  Service,
  Doctor,
  Appointment,
  MedicalRecord,
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
    doctorId: string
    date: string
    time: string
    patientName?: string
    patientCedula?: string
    patientPhone?: string
    area: ClinicArea
  }) => Promise<{ success: boolean; appointment?: Appointment; error?: string }>
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

  // Rol activo derivado estrictamente del usuario logueado (o paciente si no hay sesión)
  const activeRole: UserRole = currentUser ? currentUser.role : 'paciente'

  // Cargar datos de Supabase si está configurado en producción
  useEffect(() => {
    async function loadSupabaseData() {
      if (!isSupabaseConfigured()) return

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
  }, [])

  const openAuthModal = (tab: 'signin' | 'signup' | 'forgot' = 'signin') => {
    setAuthModalTab(tab)
    setIsAuthModalOpen(true)
  }

  const closeAuthModal = () => setIsAuthModalOpen(false)

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
    closeAuthModal()
  }

  // Cerrar sesión: regresa al modo visitante público (currentUser = null)
  const logout = async () => {
    await sbSignOut()
    setCurrentUser(null)
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
    doctorId: string
    date: string
    time: string
    patientName?: string
    patientCedula?: string
    patientPhone?: string
    area: ClinicArea
  }) => {
    const patientName = params.patientName || currentUser?.name || 'Paciente Invitado'
    const patientCedula = params.patientCedula || currentUser?.cedula || 'V-S/C'
    const patientPhone = params.patientPhone || currentUser?.phone || '+58 412 0000000'

    const newApt: Appointment = {
      id: 'apt-' + Date.now(),
      patient_id: currentUser?.id || 'pat-' + Date.now(),
      patient_name: patientName,
      patient_cedula: patientCedula,
      patient_phone: patientPhone,
      doctor_id: params.doctorId,
      service_id: params.serviceId,
      area: params.area,
      appointment_date: params.date,
      appointment_time: params.time,
      status: 'confirmada',
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
          doctor_id: params.doctorId,
          service_id: params.serviceId,
          area: params.area,
          appointment_date: params.date,
          appointment_time: params.time,
          status: 'confirmada',
        })
      } catch (e) {
        console.warn('Error guardando en Supabase:', e)
      }
    }

    setAppointments((prev) => [newApt, ...prev])

    // Agregar notificación para Secretaría
    const newNotif: AppNotification = {
      id: 'notif-' + Date.now(),
      title: 'Nueva Cita Agendada',
      message: `${patientName} agendó para el ${params.date} a las ${params.time}.`,
      time: 'Justo ahora',
      type: 'appointment',
      read: false,
      appointmentId: newApt.id,
    }
    setNotifications((prev) => [newNotif, ...prev])

    return { success: true, appointment: newApt }
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
