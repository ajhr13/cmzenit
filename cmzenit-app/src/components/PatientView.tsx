'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useCMZenit } from '@/context/CMZenitContext'
import { Service, ClinicArea, MedicalRecord, PatientClinicalProfile, MembershipTier, MembershipBeneficiary } from '@/types/database.types'
import { MEMBERSHIP_PLANS } from '@/lib/membershipsData'
import { getDoctorsForService } from '@/lib/specialtyMatching'
import { RecipeModal } from '@/components/RecipeModal'
import { ImageLightboxModal } from '@/components/ImageLightboxModal'
import {
  Calendar,
  Clock,
  Search,
  CheckCircle,
  FileText,
  Download,
  Printer,
  Sparkles,
  Stethoscope,
  X,
  Send,
  ShieldAlert,
  ShieldCheck,
  Eye,
  ZoomIn,
  User,
  Activity,
  Save,
  AlertCircle,
  Heart,
  Plus,
  Award,
  Users,
  ArrowUpRight,
  CreditCard,
  History,
  TrendingUp,
  UserPlus,
  Trash2,
  QrCode,
  Smile,
  FlaskConical,
  HeartPulse,
} from 'lucide-react'

export function PatientView() {
  const {
    currentUser,
    services,
    doctors,
    appointments,
    medicalRecords,
    bookAppointment,
    requestCancellation,
    getPatientProfile,
    savePatientProfile,
    getPatientMembership,
    changeMembershipPlan,
    addBeneficiaryToMembership,
    removeBeneficiaryFromMembership,
    exchangeRate,
  } = useCMZenit()

  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams?.get('tab') as 'citas' | 'recipes' | 'perfil' | 'membresia' | 'catalogo' | 'agendar' | null
  const [activeTab, setActiveTab] = useState<'citas' | 'recipes' | 'perfil' | 'membresia' | 'catalogo' | 'agendar'>('citas')

  useEffect(() => {
    if (tabParam && ['citas', 'recipes', 'perfil', 'membresia', 'catalogo', 'agendar'].includes(tabParam)) {
      setActiveTab(tabParam)
      if (tabParam === 'agendar') {
        setIsBookingOpen(true)
      }
    }
  }, [tabParam])

  const handleTabChange = (newTab: 'citas' | 'recipes' | 'perfil' | 'membresia' | 'catalogo' | 'agendar') => {
    setActiveTab(newTab)
    router.replace(`/pacientes?tab=${newTab}`, { scroll: false })
  }

  // Estados de catálogo y filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [filterArea, setFilterArea] = useState<ClinicArea | 'all'>('all')

  // Estados de Membresía y Cobertura
  const patientMembership = getPatientMembership(currentUser?.cedula)
  const currentPlan = MEMBERSHIP_PLANS.find((p) => p.id === patientMembership?.tier)
  const [isChangePlanOpen, setIsChangePlanOpen] = useState(false)
  const [selectedNewTier, setSelectedNewTier] = useState<MembershipTier>('oro')
  const [changePlanCycle, setChangePlanCycle] = useState<'anual' | 'mensual'>('anual')
  const [changePlanSubmitting, setChangePlanSubmitting] = useState(false)
  const [changePlanFeedback, setChangePlanFeedback] = useState('')

  const [isAddBenModalOpen, setIsAddBenModalOpen] = useState(false)
  const [newBenName, setNewBenName] = useState('')
  const [newBenCedula, setNewBenCedula] = useState('')
  const [newBenRel, setNewBenRel] = useState('Cónyuge / Pareja')
  const [newBenPhone, setNewBenPhone] = useState('')
  const [addBenSubmitting, setAddBenSubmitting] = useState(false)
  const [addBenError, setAddBenError] = useState('')

  const handleChangePlanSubmit = async () => {
    if (!patientMembership) return
    setChangePlanSubmitting(true)
    setChangePlanFeedback('')
    const res = await changeMembershipPlan(
      patientMembership.titularCedula,
      selectedNewTier,
      changePlanCycle
    )
    setChangePlanSubmitting(false)
    setChangePlanFeedback(res.message || res.error || '')
    if (res.success) {
      setTimeout(() => {
        setIsChangePlanOpen(false)
        setChangePlanFeedback('')
      }, 2500)
    }
  }

  const handleAddBeneficiarySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!patientMembership) return
    if (!newBenName.trim() || !newBenCedula.trim()) {
      setAddBenError('Por favor ingresa nombre y cédula del beneficiario.')
      return
    }

    setAddBenSubmitting(true)
    setAddBenError('')
    const res = await addBeneficiaryToMembership(patientMembership.titularCedula, {
      name: newBenName.trim(),
      cedula: newBenCedula.trim(),
      relationship: newBenRel,
      phone: newBenPhone.trim(),
    })
    setAddBenSubmitting(false)

    if (res.success) {
      setNewBenName('')
      setNewBenCedula('')
      setNewBenPhone('')
      setIsAddBenModalOpen(false)
    } else {
      setAddBenError(res.error || 'Error al agregar beneficiario.')
    }
  }

  const handleRemoveBeneficiary = async (benCedula: string) => {
    if (!patientMembership) return
    if (confirm('¿Estás seguro de desvincular a este beneficiario de tu membresía?')) {
      await removeBeneficiaryFromMembership(patientMembership.titularCedula, benCedula)
    }
  }

  // Modal Agendamiento
  const [isBookingOpen, setIsBookingOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedDoctorId, setSelectedDoctorId] = useState('')
  const [bookingDate, setBookingDate] = useState('')
  const [todayDateStr, setTodayDateStr] = useState<string>('')

  useEffect(() => {
    setTodayDateStr(new Date().toISOString().split('T')[0])
  }, [])
  const [bookingTime, setBookingTime] = useState('09:00 AM')
  const [patientName, setPatientName] = useState(currentUser?.name || '')
  const [patientCedula, setPatientCedula] = useState(currentUser?.cedula || '')
  const [patientPhone, setPatientPhone] = useState(currentUser?.phone || '')
  const [bookingSuccess, setBookingSuccess] = useState(false)

  // Estados para Mi Perfil Clínico
  const [profileForm, setProfileForm] = useState<PatientClinicalProfile>(() =>
    getPatientProfile(currentUser?.cedula)
  )
  const [profileSavedSuccess, setProfileSavedSuccess] = useState(false)
  const [isSavingProfile, setIsSavingProfile] = useState(false)

  useEffect(() => {
    if (currentUser?.cedula) {
      setProfileForm(getPatientProfile(currentUser.cedula))
    }
  }, [currentUser?.cedula])

  // Cálculo en tiempo real de IMC
  const calculatedBmi = useMemo(() => {
    if (!profileForm.weightKg || !profileForm.heightCm || profileForm.heightCm <= 0) return null
    const heightM = profileForm.heightCm / 100
    const val = profileForm.weightKg / (heightM * heightM)
    const formatted = Math.round(val * 10) / 10
    let label = 'Peso Normal'
    let color = 'text-emerald-700 bg-emerald-50 border-emerald-200'
    if (val < 18.5) {
      label = 'Bajo Peso'
      color = 'text-amber-700 bg-amber-50 border-amber-200'
    } else if (val >= 25 && val < 30) {
      label = 'Sobrepeso'
      color = 'text-amber-700 bg-amber-50 border-amber-200'
    } else if (val >= 30) {
      label = 'Obesidad'
      color = 'text-rose-700 bg-rose-50 border-rose-200'
    }
    return { val: formatted, label, color }
  }, [profileForm.weightKg, profileForm.heightCm])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingProfile(true)
    await savePatientProfile(profileForm)
    setIsSavingProfile(false)
    setProfileSavedSuccess(true)
    setTimeout(() => {
      setProfileSavedSuccess(false)
    }, 3500)
  }

  const addPathologyChip = (condition: string) => {
    setProfileForm((prev) => {
      const current = prev.chronicDiseases ? prev.chronicDiseases.trim() : ''
      if (current.toLowerCase().includes(condition.toLowerCase())) return prev
      const updated = current ? `${current}, ${condition}` : condition
      return { ...prev, chronicDiseases: updated }
    })
  }

  const addAllergyChip = (allergy: string) => {
    setProfileForm((prev) => {
      const current = prev.allergies ? prev.allergies.trim() : ''
      if (current.toLowerCase().includes(allergy.toLowerCase())) return prev
      const updated = current ? `${current}, ${allergy}` : allergy
      return { ...prev, allergies: updated }
    })
  }

  const CLINIC_SLOTS = [
    '08:00 AM',
    '08:30 AM',
    '09:00 AM',
    '09:30 AM',
    '10:00 AM',
    '10:30 AM',
    '11:00 AM',
    '11:30 AM',
    '01:00 PM',
    '01:30 PM',
    '02:00 PM',
    '02:30 PM',
    '03:00 PM',
    '03:30 PM',
    '04:00 PM',
    '04:30 PM',
  ]

  const occupiedBookingSlots = appointments
    .filter(
      (a) =>
        a.doctor_id === selectedDoctorId &&
        a.appointment_date === bookingDate &&
        a.status !== 'cancelada'
    )
    .map((a) => a.appointment_time)

  // Modal Solicitar Cancelación
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [appointmentToCancelId, setAppointmentToCancelId] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false)
  const [selectedRecipeRecord, setSelectedRecipeRecord] = useState<MedicalRecord | null>(null)

  // Visor Lightbox para fotos de récipe, informes e imágenes
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)
  const [lightboxTitle, setLightboxTitle] = useState<string>('')
  const [lightboxType, setLightboxType] = useState<string>('')

  // Servicios filtrados
  const filteredServices = services.filter((s) => {
    const matchesArea =
      filterArea === 'all' ? true : s.category === filterArea
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(searchTerm.toLowerCase()))
    return s.is_active && matchesArea && matchesSearch
  })

  // Citas del paciente (coinciden por ID o por Cédula)
  const myAppointments = appointments.filter((apt) => {
    if (currentUser?.cedula && apt.patient_cedula === currentUser.cedula) return true
    if (currentUser?.id && apt.patient_id === currentUser.id) return true
    // Si no está logueado, muestra las citas de ejemplo para demostración
    return apt.patient_name === 'Juan Pérez'
  })

  // Fichas e historias del paciente
  const myRecords = medicalRecords.filter((rec) => {
    if (currentUser?.cedula && rec.patient_cedula === currentUser.cedula) return true
    return rec.patient_name === 'Juan Pérez'
  })

  const bookingMatchingDoctors = useMemo(() => {
    return getDoctorsForService(selectedService, doctors)
  }, [selectedService, doctors])

  const handleOpenBooking = (service?: Service) => {
    const srv = service || services[0]
    setSelectedService(srv)
    const matching = getDoctorsForService(srv, doctors)
    setSelectedDoctorId(matching[0]?.id || '')

    // Default fecha: mañana
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
    setBookingDate(tomorrow)
    setBookingSuccess(false)
    setIsBookingOpen(true)
  }

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedService || !bookingDate || !bookingTime) return

    const res = await bookAppointment({
      serviceId: selectedService.id,
      doctorId: selectedDoctorId || '',
      date: bookingDate,
      time: bookingTime,
      patientName: patientName || currentUser?.name || 'Paciente',
      patientCedula: patientCedula || currentUser?.cedula || 'V-000000',
      patientPhone: patientPhone || currentUser?.phone || '+58 412 0000000',
      area: selectedService.category,
      status: 'pendiente',
    })

    if (res.success) {
      setBookingSuccess(true)
      setTimeout(() => {
        setIsBookingOpen(false)
        setBookingSuccess(false)
      }, 2600)
    }
  }

  const handleOpenCancelModal = (appointmentId: string) => {
    setAppointmentToCancelId(appointmentId)
    setCancelReason('')
    setIsCancelModalOpen(true)
  }

  const handleSendCancelRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!appointmentToCancelId || !cancelReason.trim()) return

    await requestCancellation(appointmentToCancelId, cancelReason)
    setIsCancelModalOpen(false)
    setAppointmentToCancelId(null)
  }

  return (
    <div className="space-y-8 pb-16">
      {/* 1. SECCIÓN "MIS CITAS" (AISLADA) */}
      {activeTab === 'citas' && (
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
              Mis Citas Médicas & Tratamientos
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Control de asistencia, hora de llegada y reprogramación asistida
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
              {myAppointments.length} agendada(s)
            </span>
            <button
              type="button"
              onClick={() => handleOpenBooking()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#02B2C6] text-white hover:bg-[#029baa] shadow-sm transition active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>+ Agendar Cita</span>
            </button>
          </div>
        </div>

        {myAppointments.length === 0 ? (
          <div className="p-8 text-center bg-zinc-50 dark:bg-zinc-900/40 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
            <Calendar className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              No tienes citas programadas actualmente.
            </p>
            <p className="text-xs text-zinc-400 mt-1">
              Explora nuestro catálogo abajo y agenda con tu especialista de preferencia.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myAppointments.map((apt) => {
              const service = services.find((s) => s.id === apt.service_id)
              const doctor = doctors.find((d) => d.id === apt.doctor_id)

              // Estados
              const isEnSala = apt.status === 'en_sala'
              const isSolicitudCancel = apt.status === 'solicitud_cancelacion'
              const isCancelada = apt.status === 'cancelada'
              const isAtendida = apt.status === 'atendida'
              const isPendiente = apt.status === 'pendiente'

              return (
                <div
                  key={apt.id}
                  className={`bg-white dark:bg-zinc-900 border rounded-2xl p-5 shadow-sm transition space-y-4 ${
                    isPendiente
                      ? 'border-amber-300 dark:border-amber-700/60'
                      : isSolicitudCancel
                      ? 'border-amber-400/60 dark:border-amber-500/40'
                      : isEnSala
                      ? 'border-blue-400/60 dark:border-blue-500/40'
                      : 'border-zinc-200 dark:border-zinc-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                        {apt.area === 'estetica' ? 'Espacio Estética' : 'Salud Médica'}
                      </span>
                      <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                        {service?.name || 'Consulta Médica'}
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {doctor ? (
                          `${doctor.name} (${doctor.specialty_name})`
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400 font-semibold">
                            ⚠️ Especialista: Por asignar por Secretaría al validar
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Insignia de estado */}
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full ${
                        isEnSala
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 animate-pulse'
                          : isPendiente
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                          : isSolicitudCancel
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          : isCancelada
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          : isAtendida
                          ? 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}
                    >
                      {isEnSala
                        ? `En Sala (${apt.check_in_time})`
                        : isPendiente
                        ? '🟡 Pendiente Validación'
                        : isSolicitudCancel
                        ? 'Cancelación en Revisión'
                        : isCancelada
                        ? 'Cancelada'
                        : isAtendida
                        ? 'Atendida'
                        : 'Confirmada'}
                    </span>
                  </div>

                  {/* Alerta explicativa si está pendiente de validación */}
                  {isPendiente && (
                    <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-[11px] text-amber-800 dark:text-amber-300 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Validación Telefónica / WhatsApp en Proceso</span>
                      </div>
                      <p className="leading-relaxed text-[10.5px]">
                        Nuestra secretaría se comunicará contigo vía WhatsApp o llamada telefónica para validar que tomarás la cita y confirmar tu asistencia. Si tu consulta no tenía médico asignado, la secretaría te asignará un especialista colegiado al validar.
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-xs text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800/50 p-2.5 rounded-xl">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                      <span className="font-medium">{apt.appointment_date}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-zinc-400" />
                      <span className="font-medium">{apt.appointment_time}</span>
                    </div>
                  </div>

                  {/* Estado de Cobro / Pago de la Cita */}
                  <div className="flex items-center justify-between text-xs px-1">
                    <span className="text-[10px] uppercase font-bold text-zinc-400">Estado de Caja:</span>
                    {apt.payment_status === 'pagado' ? (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                        ✓ Pagado (${apt.payment_amount_usd}) • {apt.payment_method?.replace('_', ' ')}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                        Pendiente en Recepción (${service?.price || 40})
                      </span>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center justify-between pt-1">
                    {isSolicitudCancel ? (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium italic">
                        Solicitud enviada a Secretaría: &ldquo;{apt.cancellation_reason}&rdquo;
                      </p>
                    ) : isCancelada ? (
                      <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                        Cita cancelada con aviso previo de secretaría.
                      </p>
                    ) : isAtendida ? (
                      <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Consulta completada
                      </span>
                    ) : (
                      <button
                        onClick={() => handleOpenCancelModal(apt.id)}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:underline flex items-center gap-1"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        Solicitar Cancelación a Secretaría
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
      )}

      {/* 2. SECCIÓN "MIS RÉCIPES & CONSULTAS" (AISLADA) */}
      {activeTab === 'recipes' && (
      <section className="space-y-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
            Mis Récipes Médicos & Fichas Dermoestéticas
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Descarga tus récipes oficiales en PDF y consulta los resultados de tus exámenes
          </p>
        </div>

        <div className="space-y-4">
          {myRecords.map((rec) => (
            <div
              key={rec.id}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-950 text-[#02B2C6]">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      Evolución Médica & Tratamiento
                    </h4>
                    <p className="text-[11px] text-zinc-400">
                      Fecha de Ingreso: {rec.admission_date}{' '}
                      {rec.previous_consult_date && `| Consulta anterior: ${rec.previous_consult_date}`}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedRecipeRecord(rec)
                    setIsRecipeModalOpen(true)
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#02B2C6] text-white hover:bg-[#029baa] shadow-sm transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Ver / Imprimir Récipe Oficial</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1 bg-zinc-50 dark:bg-zinc-800/40 p-3 rounded-xl">
                  <span className="font-bold text-zinc-700 dark:text-zinc-300 uppercase text-[10px]">
                    Diagnóstico Clínico
                  </span>
                  <p className="text-zinc-800 dark:text-zinc-200">{rec.diagnosis}</p>
                </div>

                <div className="space-y-1 bg-zinc-50 dark:bg-zinc-800/40 p-3 rounded-xl">
                  <span className="font-bold text-zinc-700 dark:text-zinc-300 uppercase text-[10px]">
                    Prescripción / Tratamiento
                  </span>
                  <p className="text-zinc-800 dark:text-zinc-200">{rec.treatment}</p>
                </div>
              </div>

              {/* Signos Vitales de la Consulta */}
              {rec.vital_signs && (
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-100 dark:border-zinc-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">
                    Mis Constantes Vitales en Consulta:
                  </span>
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    {rec.vital_signs.blood_pressure && (
                      <span className="px-2 py-1 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 font-bold text-zinc-800 dark:text-zinc-200">
                        PA: {rec.vital_signs.blood_pressure}
                      </span>
                    )}
                    {rec.vital_signs.heart_rate && (
                      <span className="px-2 py-1 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 font-bold text-zinc-800 dark:text-zinc-200">
                        Pulso: {rec.vital_signs.heart_rate}
                      </span>
                    )}
                    {rec.vital_signs.temperature && (
                      <span className="px-2 py-1 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 font-bold text-zinc-800 dark:text-zinc-200">
                        Temp: {rec.vital_signs.temperature}
                      </span>
                    )}
                    {rec.vital_signs.oxygen_saturation && (
                      <span className="px-2 py-1 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 font-bold text-zinc-800 dark:text-zinc-200">
                        SpO2: {rec.vital_signs.oxygen_saturation}
                      </span>
                    )}
                    {rec.vital_signs.weight_kg && (
                      <span className="px-2 py-1 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 font-bold text-zinc-800 dark:text-zinc-200">
                        Peso: {rec.vital_signs.weight_kg} kg
                      </span>
                    )}
                    {rec.vital_signs.bmi && (
                      <span className="px-2 py-1 bg-cyan-50 dark:bg-cyan-950/80 rounded-lg border border-cyan-200 dark:border-cyan-800 font-black text-[#02B2C6]">
                        IMC: {rec.vital_signs.bmi}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Alergias Registradas */}
              {rec.allergies && rec.allergies.length > 0 && (
                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-900/40 text-xs flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-400 bg-rose-100 dark:bg-rose-900 px-2 py-0.5 rounded-md">
                    ⚠️ ALERGIAS NOTIFICADAS
                  </span>
                  <span className="font-bold text-rose-800 dark:text-rose-200">{rec.allergies.join(' • ')}</span>
                </div>
              )}

              {/* Exámenes Adjuntos */}
              {rec.exams_json && rec.exams_json.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                    Estudios y Exámenes de Laboratorio:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {rec.exams_json.map((exam, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/60 flex items-start justify-between gap-2 text-xs"
                      >
                        <div>
                          <p className="font-bold text-zinc-900 dark:text-zinc-100">{exam.name}</p>
                          <p className="text-[11px] text-zinc-500 mt-0.5">{exam.result}</p>
                          {exam.date && (
                            <span className="text-[10px] text-zinc-400 mt-1 block">
                              Realizado: {exam.date}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-semibold text-[#02B2C6] bg-cyan-50 dark:bg-cyan-950 px-2 py-0.5 rounded-md">
                          {exam.type || 'Informe'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Récipes, Informes y Fotografías Adjuntas */}
              {rec.attachments && rec.attachments.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block">
                    Récipes, Informes & Fotografías Adjuntas ({rec.attachments.length}):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {rec.attachments.map((att, idx) => {
                      const isImage = !att.name.toLowerCase().endsWith('.pdf') && !att.file_type?.includes('pdf')

                      return (
                        <div
                          key={idx}
                          className="p-2.5 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center gap-2.5 shadow-2xs hover:border-[#02B2C6] transition"
                        >
                          <div
                            onClick={() => {
                              setLightboxImage(att.file_url)
                              setLightboxTitle(att.name)
                              setLightboxType(att.file_type || (isImage ? 'image' : 'pdf'))
                            }}
                            className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center overflow-hidden shrink-0 cursor-pointer relative group"
                          >
                            {isImage ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={att.file_url}
                                alt={att.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition duration-200"
                              />
                            ) : (
                              <FileText className="w-5 h-5 text-rose-500" />
                            )}
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                              <Eye className="w-3.5 h-3.5" />
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                              {att.name}
                            </p>
                            <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                              <span>{att.size_kb} KB</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setLightboxImage(att.file_url)
                                  setLightboxTitle(att.name)
                                  setLightboxType(att.file_type || (isImage ? 'image' : 'pdf'))
                                }}
                                className="text-[#02B2C6] font-bold hover:underline cursor-pointer"
                              >
                                Ver documento
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
      )}

      {/* 3. SECCIÓN "MI PERFIL CLÍNICO" (AISLADA) */}
      {activeTab === 'perfil' && (
      <section className="space-y-6 pt-2">
        {/* Encabezado con Métricas Clave */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#02B2C6] text-white flex items-center justify-center font-bold shadow-sm">
                <User className="w-4 h-4" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
                Mi Perfil Clínico & Ficha Médica
              </h2>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Completa tus datos personales, biométricos y antecedentes para tu historia médica en Grupo Médico Zenit
            </p>
          </div>

          {profileForm.updatedAt && (
            <span className="text-[11px] font-medium text-slate-500 bg-slate-100 dark:bg-zinc-800 px-3 py-1.5 rounded-full border border-slate-200 dark:border-zinc-700 shrink-0">
              Última actualización: {new Date(profileForm.updatedAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          )}
        </div>

        {/* Banner de Confirmación de Guardado */}
        {profileSavedSuccess && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2.5">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                <strong>¡Perfil guardado con éxito!</strong> Tus datos personales, signos vitales y antecedentes médicos han sido actualizados y sincronizados con tu historia clínica.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setProfileSavedSuccess(false)}
              className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tarjetas Resumen de Biometría Rápida */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {/* Peso */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-4 rounded-xl shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#777777] block">
              Peso Corporal
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl sm:text-2xl font-black text-[#525862] dark:text-zinc-100">
                {profileForm.weightKg || '--'}
              </span>
              <span className="text-xs font-semibold text-[#02B2C6]">kg</span>
            </div>
          </div>

          {/* Altura */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-4 rounded-xl shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#777777] block">
              Estatura / Talla
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl sm:text-2xl font-black text-[#525862] dark:text-zinc-100">
                {profileForm.heightCm || '--'}
              </span>
              <span className="text-xs font-semibold text-[#02B2C6]">cm</span>
            </div>
          </div>

          {/* IMC Calculado */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-4 rounded-xl shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#777777] block">
              Índice Masa (IMC)
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl sm:text-2xl font-black text-[#525862] dark:text-zinc-100">
                {calculatedBmi ? calculatedBmi.val : '--'}
              </span>
              {calculatedBmi && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${calculatedBmi.color}`}>
                  {calculatedBmi.label}
                </span>
              )}
            </div>
          </div>

          {/* Grupo Sanguíneo */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-4 rounded-xl shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#777777] block">
              Tipo de Sangre
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl sm:text-2xl font-black text-[#02B2C6]">
                {profileForm.bloodType || 'O+'}
              </span>
              <span className="text-[10px] text-[#777777]">RH</span>
            </div>
          </div>
        </div>

        {/* Formulario Principal de Edición de Perfil */}
        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* 1. Datos Personales y de Identificación */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-6 sm:p-7 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-zinc-800">
              <User className="w-4 h-4 text-[#02B2C6]" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#525862] dark:text-zinc-100">
                1. Datos de Identificación y Contacto
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Nombre Completo */}
              <div className="space-y-1 sm:col-span-2 lg:col-span-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#525862] dark:text-zinc-300">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.fullName || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-[#525862] dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02B2C6]"
                  placeholder="Ej: Juan Carlos Pérez"
                />
              </div>

              {/* Cédula */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#525862] dark:text-zinc-300">
                  Cédula de Identidad *
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.cedula || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, cedula: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-mono font-medium text-[#525862] dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02B2C6]"
                  placeholder="Ej: V-18456789"
                />
              </div>

              {/* Sexo / Género */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#525862] dark:text-zinc-300">
                  Sexo / Género *
                </label>
                <select
                  value={profileForm.gender || 'Masculino'}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      gender: e.target.value as 'Masculino' | 'Femenino' | 'Otro',
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-[#525862] dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02B2C6]"
                >
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              {/* Teléfono Personal */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#525862] dark:text-zinc-300">
                  Teléfono / WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  value={profileForm.phone || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-[#525862] dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02B2C6]"
                  placeholder="+58 412 1234567"
                />
              </div>

              {/* Correo Electrónico */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#525862] dark:text-zinc-300">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={profileForm.email || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-[#525862] dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02B2C6]"
                  placeholder="paciente@correo.com"
                />
              </div>

              {/* Fecha de Nacimiento */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#525862] dark:text-zinc-300">
                  Fecha de Nacimiento
                </label>
                <input
                  type="date"
                  value={profileForm.birthDate || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, birthDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-[#525862] dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02B2C6]"
                />
              </div>
            </div>

            {/* Dirección de Habitación */}
            <div className="space-y-1 pt-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#525862] dark:text-zinc-300">
                Dirección de Habitación / Residencia *
              </label>
              <input
                type="text"
                required
                value={profileForm.address || ''}
                onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-[#525862] dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02B2C6]"
                placeholder="Av. Principal, Edificio / Casa, Número de Apto, Urbanización, Caracas"
              />
            </div>

            {/* Contacto de Emergencia */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#525862] dark:text-zinc-300">
                  Contacto de Emergencia (Nombre y Parentesco) *
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.emergencyContact || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, emergencyContact: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-[#525862] dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02B2C6]"
                  placeholder="Ej: María Pérez (Esposa / Madre / Familiar)"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#525862] dark:text-zinc-300">
                  Teléfono del Contacto de Emergencia *
                </label>
                <input
                  type="tel"
                  required
                  value={profileForm.emergencyPhone || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, emergencyPhone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-[#525862] dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02B2C6]"
                  placeholder="+58 414 9988776"
                />
              </div>
            </div>
          </div>

          {/* 2. Medidas Biométricas y Signos */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-6 sm:p-7 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-zinc-800">
              <Activity className="w-4 h-4 text-[#02B2C6]" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#525862] dark:text-zinc-100">
                2. Medidas Biométricas & Tipo de Sangre
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Peso en kg */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#525862] dark:text-zinc-300">
                  Peso Corporal (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="300"
                  value={profileForm.weightKg ?? ''}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      weightKg: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-[#525862] dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02B2C6]"
                  placeholder="Ej: 78.5"
                />
              </div>

              {/* Altura en cm */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#525862] dark:text-zinc-300">
                  Estatura / Altura (cm)
                </label>
                <input
                  type="number"
                  step="1"
                  min="40"
                  max="250"
                  value={profileForm.heightCm ?? ''}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      heightCm: e.target.value ? parseInt(e.target.value, 10) : undefined,
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-[#525862] dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02B2C6]"
                  placeholder="Ej: 176"
                />
              </div>

              {/* Tipo de Sangre */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#525862] dark:text-zinc-300">
                  Grupo Sanguíneo & Factor RH
                </label>
                <select
                  value={profileForm.bloodType || 'O+'}
                  onChange={(e) => setProfileForm({ ...profileForm, bloodType: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-[#525862] dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02B2C6]"
                >
                  <option value="O+">O Positivo (O+)</option>
                  <option value="O-">O Negativo (O-)</option>
                  <option value="A+">A Positivo (A+)</option>
                  <option value="A-">A Negativo (A-)</option>
                  <option value="B+">B Positivo (B+)</option>
                  <option value="B-">B Negativo (B-)</option>
                  <option value="AB+">AB Positivo (AB+)</option>
                  <option value="AB-">AB Negativo (AB-)</option>
                </select>
              </div>
            </div>
          </div>

          {/* 3. Historial de Patología, Enfermedades y Alergias */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-6 sm:p-7 shadow-sm space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-zinc-800">
              <Heart className="w-4 h-4 text-[#02B2C6]" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#525862] dark:text-zinc-100">
                3. Historial de Patologías, Enfermedades y Alergias
              </h3>
            </div>

            {/* Historial de Patologías y Enfermedades Crónicas */}
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#525862] dark:text-zinc-300">
                  Patologías y Enfermedades Diagnosticadas
                </label>
                <span className="text-[10px] text-slate-400">Selección rápida:</span>
              </div>

              {/* Chips de Selección Rápida de Patologías */}
              <div className="flex flex-wrap items-center gap-1.5 pb-1">
                {['Hipertensión', 'Diabetes', 'Asma', 'Hipotiroidismo', 'Gastritis', 'Artritis'].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => addPathologyChip(item)}
                    className="text-[10px] font-semibold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-zinc-800 hover:bg-[#02B2C6]/10 hover:text-[#02B2C6] text-[#525862] dark:text-zinc-300 transition flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-2.5 h-2.5" />
                    <span>{item}</span>
                  </button>
                ))}
              </div>

              <textarea
                rows={3}
                value={profileForm.chronicDiseases || ''}
                onChange={(e) => setProfileForm({ ...profileForm, chronicDiseases: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-[#525862] dark:text-zinc-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#02B2C6]"
                placeholder="Describe enfermedades crónicas, afecciones cardíacas, metabólicas o respiratorias en tratamiento..."
              />
            </div>

            {/* Alergias Médicas y Alimentarias */}
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                  <span>Alergias Conocidas (Medicamentos / Alimentos / Materiales)</span>
                </label>
                <span className="text-[10px] text-slate-400">Selección rápida:</span>
              </div>

              {/* Chips de Alergias */}
              <div className="flex flex-wrap items-center gap-1.5 pb-1">
                {['Penicilina', 'AINEs (Ibuprofeno/Aspirina)', 'Sulfas', 'Látex', 'Yodo', 'Mariscos'].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => addAllergyChip(item)}
                    className="text-[10px] font-semibold px-2.5 py-1 rounded-md bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 transition flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-2.5 h-2.5" />
                    <span>{item}</span>
                  </button>
                ))}
              </div>

              <textarea
                rows={2}
                value={profileForm.allergies || ''}
                onChange={(e) => setProfileForm({ ...profileForm, allergies: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-white dark:bg-zinc-800 text-xs text-[#525862] dark:text-zinc-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
                placeholder="Ej: Alergia a Penicilina, Dipirona, AINEs, alimentos o sustancias..."
              />
            </div>

            {/* Cirugías Previas y Medicación Habitual */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#525862] dark:text-zinc-300">
                  Cirugías Previas / Intervenciones
                </label>
                <textarea
                  rows={2}
                  value={profileForm.surgicalHistory || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, surgicalHistory: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-[#525862] dark:text-zinc-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#02B2C6]"
                  placeholder="Ej: Apendicectomía (2018), Cesárea (2021)..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#525862] dark:text-zinc-300">
                  Medicación Actual / Tratamientos Regulares
                </label>
                <textarea
                  rows={2}
                  value={profileForm.currentMedications || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, currentMedications: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-[#525862] dark:text-zinc-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#02B2C6]"
                  placeholder="Ej: Losartán 50mg cada 24h, Eutirox 50mcg en ayunas..."
                />
              </div>
            </div>
          </div>

          {/* Botón de Guardar Perfil */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <p className="text-xs text-[#777777] dark:text-zinc-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#02B2C6] shrink-0" />
              <span>Tus datos médicos se protegen bajo estricta confidencialidad médica MPPS.</span>
            </p>

            <button
              type="submit"
              disabled={isSavingProfile}
              className="w-full sm:w-auto px-7 py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-[#02B2C6] hover:bg-[#029baa] shadow-md shadow-cyan-600/20 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingProfile ? 'Guardando Perfil...' : 'Guardar y Actualizar Mi Perfil'}</span>
            </button>
          </div>
        </form>
      </section>
      )}

      {/* SECCIÓN "MI MEMBRESÍA & COBERTURA" */}
      {activeTab === 'membresia' && (
        <section className="space-y-8 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-50 dark:bg-cyan-950/40 text-[#02B2C6] text-xs font-bold uppercase tracking-wider mb-1">
                <Award className="w-3.5 h-3.5" />
                <span>Programa de Salud Zenit Vital</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
                Mi Membresía & Coberturas Clínicas
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Estado de tu plan, cupos de consultas restantes, beneficiarios anclados e historial de coberturas
              </p>
            </div>

            {patientMembership && !patientMembership.isBeneficiary && (
              <button
                onClick={() => {
                  setSelectedNewTier(patientMembership.tier === 'oro' ? 'plata' : 'oro')
                  setIsChangePlanOpen(true)
                }}
                className="px-4 py-2.5 rounded-xl bg-[#02B2C6] hover:bg-[#029baa] text-white text-xs font-bold uppercase tracking-wider shadow-sm transition active:scale-95 flex items-center gap-2 cursor-pointer self-start sm:self-auto"
              >
                <TrendingUp className="w-4 h-4" />
                <span>Subir / Cambiar Plan</span>
              </button>
            )}
          </div>

          {!patientMembership ? (
            /* Caso sin membresía activa */
            <div className="bg-gradient-to-br from-cyan-50/50 via-white to-slate-50 dark:from-zinc-900 dark:to-zinc-900 border-2 border-dashed border-[#02B2C6]/40 rounded-3xl p-8 sm:p-12 text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-[#02B2C6]/10 text-[#02B2C6] flex items-center justify-center mx-auto">
                <Award className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100">
                  Aún no estás afiliado a un Plan Zenit Vital
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Afíliate a nuestros planes <strong>Bronce</strong>, <strong>Plata</strong> u <strong>Oro</strong> para disfrutar de consultas 100% incluidas, descuentos permanentes en las 31 especialidades, laboratorio 24h y atención prioritaria en Sebucán.
                </p>
              </div>
              <button
                onClick={() => router.push('/afiliados')}
                className="px-6 py-3 rounded-xl bg-[#02B2C6] hover:bg-[#029baa] text-white text-xs font-black uppercase tracking-wider shadow-md transition active:scale-95 cursor-pointer"
              >
                Ver Planes de Afiliados
              </button>
            </div>
          ) : (
            /* Caso con membresía activa */
            <div className="space-y-8">
              {/* 1. Carnet Digital Zenit */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div
                  className="lg:col-span-2 relative rounded-3xl p-6 sm:p-8 text-white shadow-xl overflow-hidden flex flex-col justify-between min-h-[220px]"
                  style={{
                    background:
                      patientMembership.tier === 'oro'
                        ? 'linear-gradient(135deg, #B8860B 0%, #D4AF37 50%, #8B6508 100%)'
                        : patientMembership.tier === 'plata'
                        ? 'linear-gradient(135deg, #525862 0%, #02B2C6 100%)'
                        : 'linear-gradient(135deg, #7A4928 0%, #CD7F32 100%)',
                  }}
                >
                  <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />

                  {/* Header Carnet */}
                  <div className="flex items-start justify-between gap-4 relative z-10">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/logo-zenit.png"
                        alt="Zenit"
                        className="w-12 h-12 rounded-full bg-white p-1 shadow-md object-contain"
                      />
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-white/90">
                          Grupo Médico Zenit • Carnet Digital
                        </div>
                        <div className="text-xl sm:text-2xl font-black uppercase tracking-tight">
                          Plan {patientMembership.tier.toUpperCase()} VITAL
                        </div>
                      </div>
                    </div>

                    <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-black uppercase tracking-wider border border-white/30">
                      {patientMembership.status === 'activa' ? '● Cobertura Activa' : '● ' + patientMembership.status}
                    </span>
                  </div>

                  {/* Body Carnet */}
                  <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-white/70 block">
                        {patientMembership.isBeneficiary ? 'Beneficiario Anclado' : 'Titular de la Membresía'}
                      </span>
                      <strong className="text-base sm:text-lg font-black block">
                        {patientMembership.isBeneficiary
                          ? patientMembership.beneficiaryData?.name || currentUser?.name
                          : patientMembership.patientName}
                      </strong>
                      <span className="text-[11px] text-white/90 font-mono">
                        C.I: {patientMembership.isBeneficiary
                          ? patientMembership.beneficiaryData?.cedula || currentUser?.cedula
                          : patientMembership.patientCedula}
                      </span>
                      {patientMembership.isBeneficiary && (
                        <div className="mt-1 text-[10px] bg-white/20 inline-block px-2 py-0.5 rounded font-bold">
                          Anclado a Titular: {patientMembership.titularName} ({patientMembership.beneficiaryData?.relationship})
                        </div>
                      )}
                    </div>

                    <div className="sm:text-right space-y-1">
                      <span className="text-[10px] uppercase font-bold text-white/70 block">
                        Vigencia de Cobertura
                      </span>
                      <strong className="text-sm font-bold block">
                        Hasta: {patientMembership.expiryDate}
                      </strong>
                      <span className="text-[10px] text-white/80 block">
                        Ciclo: {patientMembership.billingCycle === 'anual' ? 'Anual (12 Meses)' : 'Mensual'} • Sede Sebucán
                      </span>
                    </div>
                  </div>
                </div>

                {/* Resumen rápido de descuentos */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                  <div className="space-y-3">
                    <span className="text-xs font-black uppercase tracking-wider text-[#525862] dark:text-zinc-400">
                      Descuentos Permanentes
                    </span>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-zinc-800/50">
                        <span className="text-[#777777] dark:text-zinc-400">Especialistas adicionales:</span>
                        <strong className="text-[#02B2C6] font-black">{currentPlan?.specialistDiscountPercent}% DESC.</strong>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-zinc-800/50">
                        <span className="text-[#777777] dark:text-zinc-400">Laboratorio 24 Horas:</span>
                        <strong className="text-emerald-600 font-black">{currentPlan?.labDiscountPercent}% DESC.</strong>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-zinc-800/50">
                        <span className="text-[#777777] dark:text-zinc-400">Espacio Estética Zenit:</span>
                        <strong className="text-pink-600 font-black">{currentPlan?.aestheticDiscountPercent}% DESC.</strong>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-zinc-800/50">
                        <span className="text-[#777777] dark:text-zinc-400">Hospitalización & Quirófano:</span>
                        <strong className="text-purple-600 font-black">{currentPlan?.hospitalizationDiscountPercent}% DESC.</strong>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-500">
                    Aplica ilimitadamente en cada atención médica durante la vigencia.
                  </div>
                </div>
              </div>

              {/* 2. Medidores de Cobertura Restante */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-[#02B2C6]" />
                      <span>Cupos de Cobertura Disponibles al 100%</span>
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Consultas y exámenes que puedes utilizar sin costo adicional durante el año (compartidas con el grupo familiar)
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                  {/* Medicina General */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between text-zinc-500 mb-2">
                      <Stethoscope className="w-4 h-4 text-[#02B2C6]" />
                      <span className="text-[10px] font-bold uppercase">General</span>
                    </div>
                    <div>
                      <div className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100">
                        {patientMembership.benefitsRemaining.general === 'ilimitadas'
                          ? 'ILIMITADAS'
                          : patientMembership.benefitsRemaining.general}
                      </div>
                      <span className="text-[10px] text-zinc-500 block leading-tight">
                        Medicina General / Familiar
                      </span>
                    </div>
                  </div>

                  {/* Especialistas */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between text-zinc-500 mb-2">
                      <Award className="w-4 h-4 text-emerald-500" />
                      <span className="text-[10px] font-bold uppercase">Especialistas</span>
                    </div>
                    <div>
                      <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                        {patientMembership.benefitsRemaining.specialist}
                      </div>
                      <span className="text-[10px] text-zinc-500 block leading-tight">
                        31 Especialidades Clínicas
                      </span>
                    </div>
                  </div>

                  {/* Odontología */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between text-zinc-500 mb-2">
                      <Smile className="w-4 h-4 text-cyan-500" />
                      <span className="text-[10px] font-bold uppercase">Odontología</span>
                    </div>
                    <div>
                      <div className="text-xl sm:text-2xl font-black text-cyan-600 dark:text-cyan-400">
                        {patientMembership.benefitsRemaining.dental}
                      </div>
                      <span className="text-[10px] text-zinc-500 block leading-tight">
                        Profilaxis ultrasónicas
                      </span>
                    </div>
                  </div>

                  {/* Laboratorio */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between text-zinc-500 mb-2">
                      <FlaskConical className="w-4 h-4 text-purple-500" />
                      <span className="text-[10px] font-bold uppercase">Laboratorio</span>
                    </div>
                    <div>
                      <div className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400">
                        {patientMembership.benefitsRemaining.lab}
                      </div>
                      <span className="text-[10px] text-zinc-500 block leading-tight">
                        Perfiles clínicos 24h
                      </span>
                    </div>
                  </div>

                  {/* Cardiología */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between text-zinc-500 mb-2">
                      <HeartPulse className="w-4 h-4 text-rose-500" />
                      <span className="text-[10px] font-bold uppercase">Cardio</span>
                    </div>
                    <div>
                      <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">
                        {patientMembership.benefitsRemaining.cardio}
                      </div>
                      <span className="text-[10px] text-zinc-500 block leading-tight">
                        ECG / Ecocardiograma
                      </span>
                    </div>
                  </div>

                  {/* Estética */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between text-zinc-500 mb-2">
                      <Sparkles className="w-4 h-4 text-pink-500" />
                      <span className="text-[10px] font-bold uppercase">Estética</span>
                    </div>
                    <div>
                      <div className="text-xl sm:text-2xl font-black text-pink-600 dark:text-pink-400">
                        {patientMembership.benefitsRemaining.aesthetic}
                      </div>
                      <span className="text-[10px] text-zinc-500 block leading-tight">
                        Hidrafacial / Tratamiento
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Beneficiarios Anclados (Grupo Familiar) */}
              <div className="space-y-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                  <div>
                    <h3 className="text-base font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <Users className="w-5 h-5 text-[#02B2C6]" />
                      <span>Grupo Familiar & Beneficiarios Anclados</span>
                    </h3>
                    <p className="text-xs text-zinc-500">
                      Capacidad del plan: {currentPlan?.affiliatesDescription} • Comparten la cuota de consultas del plan
                    </p>
                  </div>

                  {!patientMembership.isBeneficiary && (
                    <button
                      onClick={() => {
                        setAddBenError('')
                        setIsAddBenModalOpen(true)
                      }}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-[#02B2C6] hover:text-white text-xs font-bold transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Anclar Beneficiario</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* Titular Card */}
                  <div className="p-4 rounded-2xl bg-cyan-50/50 dark:bg-cyan-950/20 border border-cyan-200/60 dark:border-cyan-800/40 space-y-1">
                    <span className="text-[10px] font-extrabold uppercase text-[#02B2C6] tracking-wider block">
                      Titular Principal
                    </span>
                    <strong className="text-sm font-bold text-zinc-900 dark:text-zinc-100 block">
                      {patientMembership.patientName}
                    </strong>
                    <span className="text-xs text-zinc-500 block font-mono">
                      C.I: {patientMembership.patientCedula}
                    </span>
                    <span className="text-[11px] text-zinc-500 block">
                      {patientMembership.patientPhone}
                    </span>
                  </div>

                  {/* Lista de Beneficiarios */}
                  {(patientMembership.beneficiaries || []).map((ben, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 flex items-start justify-between gap-2"
                    >
                      <div className="space-y-1">
                        <span className="text-[10px] font-extrabold uppercase text-emerald-600 dark:text-emerald-400 tracking-wider block">
                          Beneficiario #{idx + 1} ({ben.relationship})
                        </span>
                        <strong className="text-sm font-bold text-zinc-900 dark:text-zinc-100 block">
                          {ben.name}
                        </strong>
                        <span className="text-xs text-zinc-500 block font-mono">
                          C.I: {ben.cedula}
                        </span>
                        {ben.phone && (
                          <span className="text-[11px] text-zinc-500 block">{ben.phone}</span>
                        )}
                      </div>

                      {!patientMembership.isBeneficiary && (
                        <button
                          onClick={() => handleRemoveBeneficiary(ben.cedula)}
                          title="Desvincular beneficiario"
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}

                  {/* Espacios disponibles para agregar familiares */}
                  {Array.from({
                    length: Math.max(
                      0,
                      (currentPlan?.affiliatesCount || 1) - 1 - (patientMembership.beneficiaries?.length || 0)
                    ),
                  }).map((_, i) => (
                    <div
                      key={i}
                      onClick={() => !patientMembership.isBeneficiary && setIsAddBenModalOpen(true)}
                      className="p-4 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-[#02B2C6] flex flex-col items-center justify-center text-center text-zinc-400 hover:text-[#02B2C6] transition cursor-pointer min-h-[100px]"
                    >
                      <UserPlus className="w-6 h-6 mb-1" />
                      <span className="text-xs font-bold">Cupo Disponible</span>
                      <span className="text-[10px]">Anclar familiar adicional</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. Historial de Coberturas Utilizadas */}
              <div className="space-y-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                  <div>
                    <h3 className="text-base font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <History className="w-5 h-5 text-[#02B2C6]" />
                      <span>Historial de Uso de Coberturas</span>
                    </h3>
                    <p className="text-xs text-zinc-500">
                      Registro de todas las consultas, exámenes y aranceles cubiertos por la membresía
                    </p>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                    {patientMembership.coverageHistory?.length || 0} consumos
                  </span>
                </div>

                {(!patientMembership.coverageHistory || patientMembership.coverageHistory.length === 0) ? (
                  <div className="py-8 text-center text-zinc-400 text-xs">
                    Aún no se registran consumos de cobertura en este período.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-zinc-800/80 text-[10.5px] uppercase font-bold text-zinc-500">
                        <tr>
                          <th className="py-3 px-4">Fecha</th>
                          <th className="py-3 px-4">Servicio / Atención</th>
                          <th className="py-3 px-4">Paciente (Titular / Beneficiario)</th>
                          <th className="py-3 px-4">Médico / Especialidad</th>
                          <th className="py-3 px-4">Tipo Cobertura</th>
                          <th className="py-3 px-4 text-right">Ahorro ($ USD)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {patientMembership.coverageHistory.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/40">
                            <td className="py-3 px-4 font-mono text-zinc-500 whitespace-nowrap">{item.date}</td>
                            <td className="py-3 px-4 font-bold text-zinc-900 dark:text-zinc-100">{item.serviceName}</td>
                            <td className="py-3 px-4">
                              <span className="font-medium text-zinc-800 dark:text-zinc-200">{item.consumedBy.name}</span>
                              <span className="text-[10px] text-zinc-500 block font-mono">
                                {item.consumedBy.isTitular ? 'Titular' : `Beneficiario (${item.consumedBy.relationship || 'Familiar'})`}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">{item.doctorName || 'Equipo Médico Zenit'}</td>
                            <td className="py-3 px-4">
                              {item.wasFullyCovered ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  ✓ 100% Exonerado
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-[#02B2C6]">
                                  {item.discountPercent}% Descuento
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                              + ${item.costSavedUsd?.toFixed(2)} USD
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* 5. Historial de Cambios de Plan */}
              {patientMembership.planHistory && patientMembership.planHistory.length > 0 && (
                <div className="space-y-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
                  <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#02B2C6]" />
                    <span>Historial de Planes & Upgrades</span>
                  </h3>
                  <div className="space-y-2">
                    {patientMembership.planHistory.map((ph, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div className="space-y-0.5">
                          <span className="font-bold text-zinc-800 dark:text-zinc-200 uppercase">
                            {ph.type === 'upgrade' ? '🚀 Upgrade de Plan' : ph.type === 'downgrade' ? '🔄 Cambio de Plan' : 'Afiliación'} ({ph.fromTier.toUpperCase()} → {ph.toTier.toUpperCase()})
                          </span>
                          <p className="text-[11px] text-zinc-500">{ph.note}</p>
                        </div>
                        <span className="text-[10.5px] font-mono text-zinc-400 whitespace-nowrap">{ph.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MODAL: CAMBIO / UPGRADE DE PLAN */}
          {isChangePlanOpen && patientMembership && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
              <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-zinc-200 dark:border-zinc-800 space-y-5">
                <div className="flex items-start justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                  <div>
                    <span className="text-[10px] font-black uppercase text-[#02B2C6] tracking-wider">
                      Gestión de Afiliación
                    </span>
                    <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100">
                      Subir o Cambiar de Plan Zenit
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsChangePlanOpen(false)}
                    className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-zinc-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Selecciona tu nuevo plan:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['bronce', 'plata', 'oro'] as MembershipTier[]).map((t) => {
                      const p = MEMBERSHIP_PLANS.find((x) => x.id === t)
                      const isCurrent = patientMembership.tier === t
                      const isSelected = selectedNewTier === t

                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setSelectedNewTier(t)}
                          className={`p-3 rounded-2xl border text-center transition cursor-pointer ${
                            isSelected
                              ? 'border-[#02B2C6] bg-cyan-50/50 dark:bg-cyan-950/30 text-[#02B2C6] font-bold shadow-sm'
                              : 'border-zinc-200 dark:border-zinc-700 hover:bg-slate-50'
                          }`}
                        >
                          <span className="text-xs uppercase font-extrabold block">{p?.name}</span>
                          <span className="text-sm font-black block mt-1">${p?.priceAnnual}/año</span>
                          {isCurrent && (
                            <span className="text-[9px] bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 px-1.5 py-0.5 rounded font-bold mt-1 inline-block">
                              Actual
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* ADVERTENCIA DE POLÍTICA: NO SE DEVUELVE EL DINERO */}
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                  <div className="flex items-center gap-1.5 font-black uppercase text-[10.5px]">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Políticas de Afiliación & Modificaciones</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Puedes subir o bajar de plan en cualquier momento. Al hacer upgrade se sumará la diferencia de coberturas. <strong>Conforme a los términos del programa, los cambios o descensos de plan no conllevan reembolso monetario.</strong>
                  </p>
                </div>

                {changePlanFeedback && (
                  <div className="p-3 rounded-xl bg-cyan-50 text-[#02B2C6] text-xs font-bold text-center">
                    {changePlanFeedback}
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsChangePlanOpen(false)}
                    className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={changePlanSubmitting || selectedNewTier === patientMembership.tier}
                    onClick={handleChangePlanSubmit}
                    className="px-5 py-2.5 rounded-xl bg-[#02B2C6] hover:bg-[#029baa] text-white text-xs font-black uppercase tracking-wider shadow-md transition disabled:opacity-50 cursor-pointer"
                  >
                    {changePlanSubmitting ? 'Actualizando...' : 'Confirmar Cambio de Plan'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODAL: ANCLAR BENEFICIARIO */}
          {isAddBenModalOpen && patientMembership && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
              <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 space-y-4">
                <div className="flex items-start justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                  <div>
                    <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider">
                      Grupo Familiar
                    </span>
                    <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100">
                      Anclar Nuevo Beneficiario
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsAddBenModalOpen(false)}
                    className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-zinc-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleAddBeneficiarySubmit} className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-zinc-500">Nombre Completo</label>
                    <input
                      type="text"
                      required
                      value={newBenName}
                      onChange={(e) => setNewBenName(e.target.value)}
                      placeholder="Ej. María Pérez"
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02B2C6]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-zinc-500">Cédula de Identidad</label>
                    <input
                      type="text"
                      required
                      value={newBenCedula}
                      onChange={(e) => setNewBenCedula(e.target.value)}
                      placeholder="Ej. V-20123456"
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02B2C6]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-zinc-500">Parentesco con el Titular</label>
                    <select
                      value={newBenRel}
                      onChange={(e) => setNewBenRel(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02B2C6]"
                    >
                      <option value="Cónyuge / Pareja">Cónyuge / Pareja</option>
                      <option value="Hijo / Hija">Hijo / Hija</option>
                      <option value="Padre / Madre">Padre / Madre</option>
                      <option value="Hermano / Hermana">Hermano / Hermana</option>
                      <option value="Familiar Directo">Familiar Directo</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-zinc-500">Teléfono (Opcional)</label>
                    <input
                      type="tel"
                      value={newBenPhone}
                      onChange={(e) => setNewBenPhone(e.target.value)}
                      placeholder="+58 412 0000000"
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02B2C6]"
                    />
                  </div>

                  {addBenError && (
                    <p className="text-xs text-rose-500 font-bold">{addBenError}</p>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setIsAddBenModalOpen(false)}
                      className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={addBenSubmitting}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider shadow-md transition disabled:opacity-50 cursor-pointer"
                    >
                      {addBenSubmitting ? 'Guardando...' : 'Anclar al Plan'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </section>
      )}

      {/* 4. SECCIÓN "CATÁLOGO DE SERVICIOS" (AISLADA) */}
      {(activeTab === 'catalogo' || activeTab === 'agendar') && (
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <span>Catálogo de Servicios & Procedimientos</span>
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Tarifas claras, tiempos estandarizados y especialistas certificados MPPS
            </p>
          </div>

          {/* Filtros de área */}
          <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-xl">
            <button
              onClick={() => setFilterArea('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterArea === 'all'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              Todos ({services.length})
            </button>
            <button
              onClick={() => setFilterArea('salud')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                filterArea === 'salud'
                  ? 'bg-[#02B2C6] text-white shadow-sm'
                  : 'text-zinc-500 hover:text-[#02B2C6]'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              Salud
            </button>
            <button
              onClick={() => setFilterArea('estetica')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                filterArea === 'estetica'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-zinc-500 hover:text-rose-600'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Estética
            </button>
          </div>
        </div>

        {/* Buscador */}
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Buscar por tratamiento o especialidad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#02B2C6]"
          />
        </div>

        {/* Tarjetas de Servicios */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredServices.map((srv) => (
            <div
              key={srv.id}
              className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                      'bg-cyan-50 text-[#02B2C6] dark:bg-cyan-950/60 dark:text-[#02B2C6] font-semibold'
                    }`}
                  >
                    {srv.category === 'estetica' ? 'Estética & Dermo' : 'Especialidad Médica'}
                  </span>

                  {srv.promo_tag && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                      ★ {srv.promo_tag}
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-[#02B2C6] dark:group-hover:text-[#02B2C6] transition">
                  {srv.name}
                </h3>

                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-3">
                  {srv.description}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between">
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs text-zinc-400 font-semibold">$</span>
                    <span className="text-xl font-black text-zinc-900 dark:text-zinc-100">
                      {srv.price.toFixed(2)}
                    </span>
                    <span className="text-[11px] text-zinc-400">USD</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-[#02B2C6] mt-0.5 font-semibold">
                    <ShieldCheck className="w-3 h-3 text-[#02B2C6]" />
                    <span>Especialidad MPPS</span>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenBooking(srv)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold text-white shadow-md transition active:scale-95 ${
                    'bg-[#02B2C6] hover:bg-[#029baa] shadow-cyan-600/20'
                  }`}
                >
                  Agendar Cita
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
      )}

            {/* MODAL: RESERVAR CITA */}
      {isBookingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl p-6 sm:p-8 overflow-hidden">
            <button
              onClick={() => setIsBookingOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#02B2C6]">
                Paso a Paso
              </span>
              <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100">
                Agendar Consulta Médica o Estética
              </h3>
            </div>

            {bookingSuccess ? (
              <div className="py-10 text-center space-y-3 animate-in zoom-in-95">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
                <h4 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  ¡Cita Pre-Agendada Exitosamente!
                </h4>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
                  Hemos notificado a Recepción. Nuestra secretaría se comunicará contigo vía WhatsApp o llamada telefónica para validar que tomarás la cita, confirmar tu turno y asignarte tu especialista definitivo.
                </p>
                <div className="pt-2 text-[11px] font-semibold text-[#02B2C6]">
                  Puedes verificar el estatus en tu sección &ldquo;Mis Citas&rdquo;.
                </div>
              </div>
            ) : (
              <form onSubmit={handleConfirmBooking} className="space-y-4">
                {/* Servicio */}
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">
                    Servicio o Tratamiento
                  </label>
                  <select
                    value={selectedService?.id || ''}
                    onChange={(e) => {
                      const s = services.find((x) => x.id === Number(e.target.value))
                      setSelectedService(s || null)
                      if (s) {
                        const matching = getDoctorsForService(s, doctors)
                        setSelectedDoctorId(matching[0]?.id || '')
                      } else {
                        setSelectedDoctorId('')
                      }
                    }}
                    className="w-full py-2.5 px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02B2C6]"
                  >
                    {services
                      .filter((s) => s.is_active)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} - ${s.price} USD ({s.category === 'estetica' ? 'Estética' : 'Salud'})
                        </option>
                      ))}
                  </select>
                </div>

                {/* Doctor */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold uppercase text-zinc-500">
                      Especialista
                    </label>
                    {bookingMatchingDoctors.length > 0 ? (
                      <span className="text-[10px] text-emerald-600 font-bold">
                        ✓ Coincide con {selectedService?.name ? 'el servicio' : 'la especialidad'} ({bookingMatchingDoctors.length})
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-600 font-bold">
                        ℹ️ Asignación por Secretaría
                      </span>
                    )}
                  </div>
                  <select
                    value={selectedDoctorId}
                    onChange={(e) => setSelectedDoctorId(e.target.value)}
                    className="w-full py-2.5 px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02B2C6]"
                  >
                    {bookingMatchingDoctors.length > 0 ? (
                      <>
                        {bookingMatchingDoctors.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} — {d.specialty_name}
                          </option>
                        ))}
                        <option value="">
                          -- Dejar en blanco (La clínica asignará un especialista al confirmar) --
                        </option>
                      </>
                    ) : (
                      <option value="">
                        -- Sin especialista asignado (La clínica le asignará uno al confirmar con secretaría) --
                      </option>
                    )}
                  </select>
                  {bookingMatchingDoctors.length === 0 && (
                    <p className="mt-1 text-[10.5px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg border border-amber-200 dark:border-amber-800/50">
                      ℹ️ Este servicio no tiene un especialista preasignado en agenda. La secretaría le asignará un profesional colegiado al validar su consulta vía WhatsApp o teléfono.
                    </p>
                  )}
                </div>

                {/* Fecha y Hora */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">
                      Fecha
                    </label>
                    <input
                      type="date"
                      required
                      min={todayDateStr || undefined}
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full py-2 px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">
                      Turno / Hora
                    </label>
                    <select
                      value={bookingTime}
                      onChange={(e) => setBookingTime(e.target.value)}
                      className="w-full py-2.5 px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100"
                    >
                      <option value="08:30 AM">08:30 AM</option>
                      <option value="09:15 AM">09:15 AM</option>
                      <option value="10:00 AM">10:00 AM</option>
                      <option value="11:30 AM">11:30 AM</option>
                      <option value="02:00 PM">02:00 PM</option>
                      <option value="03:30 PM">03:30 PM</option>
                      <option value="04:45 PM">04:45 PM</option>
                    </select>
                  </div>
                </div>

                {/* Datos del Paciente */}
                <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase">
                    Datos del Paciente
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Nombre"
                      required
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className="py-2 px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Cédula"
                      required
                      value={patientCedula}
                      onChange={(e) => setPatientCedula(e.target.value)}
                      className="py-2 px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
                    />
                    <input
                      type="tel"
                      placeholder="WhatsApp"
                      required
                      value={patientPhone}
                      onChange={(e) => setPatientPhone(e.target.value)}
                      className="py-2 px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl font-bold text-sm text-white bg-[#02B2C6] hover:bg-[#029baa] shadow-md shadow-cyan-600/20 transition active:scale-95 mt-4"
                >
                  Confirmar Agendamiento
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL: SOLICITAR CANCELACIÓN A SECRETARÍA */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl p-6 sm:p-8">
            <button
              onClick={() => setIsCancelModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                Solicitud de Cancelación a Secretaría
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Por políticas de CMZenit, las cancelaciones deben ser revisadas por Secretaría para
                liberar el cupo del especialista y coordinar tu reprogramación con prioridad.
              </p>
            </div>

            <form onSubmit={handleSendCancelRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">
                  Motivo de la cancelación *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Por favor indícanos el motivo y si deseas reprogramar para otra fecha..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCancelModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Regresar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-md shadow-amber-600/20 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  Enviar Solicitud a Secretaría
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL DE RÉCIPE MÉDICO OFICIAL IMPRIMIBLE */}
      <RecipeModal
        isOpen={isRecipeModalOpen}
        onClose={() => setIsRecipeModalOpen(false)}
        record={selectedRecipeRecord}
        doctor={doctors.find((d) => d.id === selectedRecipeRecord?.doctor_id)}
        patientName={currentUser?.name}
        patientCedula={currentUser?.cedula}
        patientPhone={currentUser?.phone}
      />

      {/* VISOR LIGHTBOX PARA FOTOS DE RÉCIPE, INFORMES Y ESTUDIOS */}
      <ImageLightboxModal
        isOpen={Boolean(lightboxImage)}
        onClose={() => setLightboxImage(null)}
        imageUrl={lightboxImage}
        title={lightboxTitle}
        fileType={lightboxType}
      />
    </div>
  )
}
