'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useCMZenit } from '@/context/CMZenitContext'
import { Appointment, ClinicArea, AppointmentStatus, PaymentMethod } from '@/types/database.types'
import { getDoctorsForService } from '@/lib/specialtyMatching'
import {
  Clock,
  Phone,
  PhoneCall,
  AlertTriangle,
  CheckCircle,
  CheckCircle2,
  MessageSquare,
  Search,
  X,
  Send,
  ExternalLink,
  ShieldAlert,
  DollarSign,
  CreditCard,
  Receipt,
  Printer,
  Check,
  UserCheck,
  ClipboardCheck,
  Users,
  UserPlus,
  Calendar,
  FileText,
  Stethoscope,
  Sparkles,
  ChevronRight,
  ArrowRight,
  Plus,
} from 'lucide-react'

export function SecretaryView() {
  const {
    appointments,
    services,
    doctors,
    confirmCheckIn,
    cancelAppointmentWithNotice,
    exchangeRate,
    setExchangeRate,
    updateAppointmentPayment,
    bookAppointment,
    validateAndConfirmAppointment,
    dismissUnconfirmedAppointment,
  } = useCMZenit()

  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams?.get('tab') as 'espera' | 'caja' | 'avisos' | 'nueva-cita' | null
  const [activeTab, setActiveTab] = useState<'espera' | 'caja' | 'avisos' | 'nueva-cita'>('espera')

  // Sub-menú especializado de Recepción & Admisión
  const [admissionTab, setAdmissionTab] = useState<'checkin' | 'validacion' | 'sala' | 'sin-cita' | 'agenda'>('checkin')

  // Búsqueda en vivo de Admisión Rápida (Check-In Express)
  const [quickAdmissionSearch, setQuickAdmissionSearch] = useState('')
  const [checkInSuccessAptId, setCheckInSuccessAptId] = useState<string | null>(null)

  // Estados para Admisión Sin Cita / Ventanilla Presencial
  const [walkInCedula, setWalkInCedula] = useState('')
  const [walkInName, setWalkInName] = useState('')
  const [walkInPhone, setWalkInPhone] = useState('')
  const [walkInArea, setWalkInArea] = useState<ClinicArea>('salud')
  const [walkInServiceId, setWalkInServiceId] = useState<number>(1)
  const [walkInDoctorId, setWalkInDoctorId] = useState<string>('doc-1')
  const [walkInReason, setWalkInReason] = useState('')
  const [isSubmittingWalkIn, setIsSubmittingWalkIn] = useState(false)
  const [walkInSuccessMsg, setWalkInSuccessMsg] = useState('')
  const [walkInErrorMsg, setWalkInErrorMsg] = useState('')

  // Estados para Validación Telefónica y WhatsApp de Citas Web (Filtro Anti-Pruebas)
  const [pendingDocAssignments, setPendingDocAssignments] = useState<Record<string, string>>({})
  const [validationSuccessMsg, setValidationSuccessMsg] = useState<string | null>(null)
  const [dismissModalApt, setDismissModalApt] = useState<Appointment | null>(null)
  const [dismissReason, setDismissReason] = useState('Cita de prueba / Teléfono no existe o ficticio')
  const [isValidatingId, setIsValidatingId] = useState<string | null>(null)

  const pendingValidationAppointments = useMemo(
    () => appointments.filter((a) => a.status === 'pendiente'),
    [appointments]
  )
  const pendingWithoutDoctorCount = useMemo(
    () => pendingValidationAppointments.filter((a) => !a.doctor_id).length,
    [pendingValidationAppointments]
  )
  const confirmedAppointmentsCount = useMemo(
    () => appointments.filter((a) => a.status === 'confirmada').length,
    [appointments]
  )

  const handleValidateAndConfirm = async (apt: Appointment) => {
    const assignedDoc =
      pendingDocAssignments[apt.id] !== undefined
        ? pendingDocAssignments[apt.id]
        : (apt.doctor_id || '')

    setIsValidatingId(apt.id)
    try {
      await validateAndConfirmAppointment(apt.id, assignedDoc)
      setValidationSuccessMsg(
        `¡Cita de ${apt.patient_name} validada y confirmada exitosamente! Ya está disponible en la Agenda Médica y lista para Check-In cuando el paciente arribe a la clínica.`
      )
      setTimeout(() => setValidationSuccessMsg(null), 5000)
    } catch (err) {
      console.error(err)
    } finally {
      setIsValidatingId(null)
    }
  }

  const handleDismissAppointment = async () => {
    if (!dismissModalApt) return
    try {
      await dismissUnconfirmedAppointment(dismissModalApt.id, dismissReason)
      setValidationSuccessMsg(
        `La cita de ${dismissModalApt.patient_name} ha sido descartada como no confirmada o registro de prueba.`
      )
      setDismissModalApt(null)
      setTimeout(() => setValidationSuccessMsg(null), 5000)
    } catch (err) {
      console.error(err)
    }
  }

  // Modal de Pase / Ticket de Admisión & Turno de Sala
  const [isPassModalOpen, setIsPassModalOpen] = useState(false)
  const [admissionPassApt, setAdmissionPassApt] = useState<Appointment | null>(null)

  useEffect(() => {
    if (tabParam && ['espera', 'caja', 'avisos', 'nueva-cita'].includes(tabParam)) {
      setActiveTab(tabParam)
      if (tabParam === 'nueva-cita') {
        setAdmissionTab('sin-cita')
      }
    }
  }, [tabParam])

  const handleTabChange = (newTab: 'espera' | 'caja' | 'avisos' | 'nueva-cita') => {
    setActiveTab(newTab)
    router.replace(`/recepcion?tab=${newTab}`, { scroll: false })
  }

  const [searchFilter, setSearchFilter] = useState('')
  const [areaFilter, setAreaFilter] = useState<ClinicArea | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'all'>('all')
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'pagado' | 'pendiente'>('all')

  // Control de Tasa Oficial del Día (BCV)
  const [isEditingRate, setIsEditingRate] = useState(false)
  const [tempRate, setTempRate] = useState(exchangeRate.toString())

  // Modal Cancelación con Aviso Previo
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [hasCalledPatient, setHasCalledPatient] = useState(false)
  const [sendingNotice, setSendingNotice] = useState(false)
  const [generatedWaUrl, setGeneratedWaUrl] = useState<string | null>(null)

  // Modal de Caja / Cobranza
  const [isPayModalOpen, setIsPayModalOpen] = useState(false)
  const [selectedPayAppointment, setSelectedPayAppointment] = useState<Appointment | null>(null)
  const [payMethod, setPayMethod] = useState<PaymentMethod>('pago_movil')
  const [payAmountUsd, setPayAmountUsd] = useState<number>(0)
  const [payReference, setPayReference] = useState('')
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)

  // Modal de Recibo Digital de Caja
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false)
  const [receiptApt, setReceiptApt] = useState<Appointment | null>(null)

  // Solicitudes prioritarias de cancelación
  const pendingCancelRequests = appointments.filter(
    (a) => a.status === 'solicitud_cancelacion'
  )

  // Filtrado de agenda
  const filteredAppointments = appointments.filter((apt) => {
    const matchesArea = areaFilter === 'all' || apt.area === areaFilter
    const matchesStatus = statusFilter === 'all' || apt.status === statusFilter
    const matchesPayment =
      paymentFilter === 'all' ||
      (paymentFilter === 'pagado' && apt.payment_status === 'pagado') ||
      (paymentFilter === 'pendiente' && apt.payment_status !== 'pagado')
    const matchesSearch =
      apt.patient_name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      apt.patient_cedula.toLowerCase().includes(searchFilter.toLowerCase()) ||
      apt.patient_phone.includes(searchFilter)

    return matchesArea && matchesStatus && matchesPayment && matchesSearch
  })

  // Métricas operativas
  const enSalaCount = appointments.filter((a) => a.status === 'en_sala').length
  const confirmadasCount = appointments.filter((a) => a.status === 'confirmada').length
  const atendidasCount = appointments.filter((a) => a.status === 'atendida').length

  // Métricas financieras de caja
  const totalCobradoUsd = appointments
    .filter((a) => a.payment_status === 'pagado')
    .reduce((acc, a) => acc + (a.payment_amount_usd || 0), 0)
  const totalCobradoBs = totalCobradoUsd * exchangeRate

  const totalPendienteUsd = appointments
    .filter((a) => a.payment_status !== 'pagado' && a.status !== 'cancelada')
    .reduce((acc, a) => {
      const srv = services.find((s) => s.id === a.service_id)
      return acc + (srv?.price || 40)
    }, 0)
  const totalPendienteBs = totalPendienteUsd * exchangeRate

  // Cancelación formal
  const handleOpenCancelModal = (apt: Appointment) => {
    setSelectedAppointment(apt)
    setCancelReason(apt.cancellation_reason || 'Requerimiento administrativo o médico')
    setHasCalledPatient(false)
    setGeneratedWaUrl(null)
    setIsCancelModalOpen(true)
  }

  const handleConfirmCancellation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAppointment || !hasCalledPatient) return

    setSendingNotice(true)
    const res = await cancelAppointmentWithNotice(
      selectedAppointment.id,
      cancelReason,
      true
    )
    setSendingNotice(false)

    if (res.waUrl) {
      setGeneratedWaUrl(res.waUrl)
    } else {
      setIsCancelModalOpen(false)
      setSelectedAppointment(null)
    }
  }

  // Cobro en Caja
  const handleOpenPayModal = (apt: Appointment) => {
    const srv = services.find((s) => s.id === apt.service_id)
    setSelectedPayAppointment(apt)
    setPayAmountUsd(srv?.price || 40)
    setPayMethod(apt.payment_method || 'pago_movil')
    setPayReference(apt.payment_reference || '')
    setIsPayModalOpen(true)
  }

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPayAppointment) return

    setIsProcessingPayment(true)
    const amountBs = Math.round(payAmountUsd * exchangeRate * 100) / 100
    const refCode = payReference.trim() || 'REG-' + Date.now().toString().slice(-5)

    await updateAppointmentPayment(selectedPayAppointment.id, {
      status: 'pagado',
      method: payMethod,
      amount_usd: payAmountUsd,
      amount_bs: amountBs,
      reference: refCode,
    })

    setIsProcessingPayment(false)
    setIsPayModalOpen(false)

    // Abrir recibo digital de inmediato para impresión / envío
    setReceiptApt({
      ...selectedPayAppointment,
      payment_status: 'pagado',
      payment_method: payMethod,
      payment_amount_usd: payAmountUsd,
      payment_amount_bs: amountBs,
      payment_reference: refCode,
      payment_date: new Date().toISOString(),
    })
    setIsReceiptModalOpen(true)
  }

  const handleOpenReceipt = (apt: Appointment) => {
    setReceiptApt(apt)
    setIsReceiptModalOpen(true)
  }

  // WhatsApp Helpers
  const handleSendReminderWhatsApp = (apt: Appointment) => {
    const doctor = doctors.find((d) => d.id === apt.doctor_id)
    const service = services.find((s) => s.id === apt.service_id)
    const text = `*RECORDATORIO DE CITA - GRUPO MÉDICO ZENIT*%0A%0AEstimado(a) *${apt.patient_name}*, le recordamos su cita:%0A📅 *Fecha:* ${apt.appointment_date}%0A⏰ *Hora:* ${apt.appointment_time}%0A🩺 *Servicio:* ${service?.name || 'Consulta Médica'}%0A👨‍⚕️ *Especialista:* ${doctor?.name || 'Dr. Especialista'}%0A📍 *Sede:* Centro Comercial Galerías Sebucán, Piso 1, Caracas.%0A%0APor favor confirme su asistencia respondiendo con *SÍ*, o avísenos con anticipación si desea reprogramar.`
    window.open(`https://api.whatsapp.com/send?phone=${encodeURIComponent(apt.patient_phone)}&text=${text}`, '_blank')
  }

  const handleNotifyTurnWhatsApp = (apt: Appointment) => {
    const doctor = doctors.find((d) => d.id === apt.doctor_id)
    const text = `*CENTRO MÉDICO ZENIT - SU TURNO ESTÁ LISTO*%0A%0AEstimado(a) *${apt.patient_name}*, su especialista el *${doctor?.name || 'médico tratante'}* ya se encuentra listo para atenderle en el consultorio. Por favor acérquese a la sala de espera.`
    window.open(`https://api.whatsapp.com/send?phone=${encodeURIComponent(apt.patient_phone)}&text=${text}`, '_blank')
  }

  const handleSaveRate = () => {
    const val = parseFloat(tempRate)
    if (!isNaN(val) && val > 0) {
      setExchangeRate(val)
      setIsEditingRate(false)
    }
  }

  // Listas filtradas para el formulario de Admisión Sin Cita (Especialistas coinciden con el servicio)
  const walkInServices = services.filter((s) => s.category === walkInArea && s.is_active)
  const selectedWalkInService = walkInServices.find((s) => s.id === walkInServiceId) || walkInServices[0]
  const walkInDoctors = useMemo(() => {
    return getDoctorsForService(selectedWalkInService, doctors)
  }, [selectedWalkInService, doctors])

  useEffect(() => {
    if (walkInServices.length > 0 && !walkInServices.find((s) => s.id === walkInServiceId)) {
      setWalkInServiceId(walkInServices[0].id)
    }
  }, [walkInArea, walkInServices, walkInServiceId])

  useEffect(() => {
    if (walkInDoctors.length > 0) {
      if (!walkInDoctors.find((d) => d.id === walkInDoctorId)) {
        setWalkInDoctorId(walkInDoctors[0].id)
      }
    } else {
      setWalkInDoctorId('')
    }
  }, [walkInDoctors, walkInDoctorId])

  // Coincidencias de búsqueda rápida para Check-In Express
  const quickAdmissionMatches = React.useMemo(() => {
    if (!quickAdmissionSearch.trim()) return []
    const term = quickAdmissionSearch.trim().toLowerCase()
    return appointments.filter(
      (a) =>
        a.patient_name.toLowerCase().includes(term) ||
        a.patient_cedula.toLowerCase().includes(term) ||
        a.patient_phone.includes(term)
    )
  }, [appointments, quickAdmissionSearch])

  // Pacientes en sala de espera en orden de llegada
  const waitingRoomList = React.useMemo(() => {
    return appointments.filter((a) => a.status === 'en_sala')
  }, [appointments])

  // Pacientes con cita hoy que aún no han hecho Check-in
  const pendingCheckInList = React.useMemo(() => {
    return appointments.filter((a) => a.status === 'confirmada' || a.status === 'pendiente')
  }, [appointments])

  // Ejecutar Check-In directo y emitir constancia
  const handleDirectCheckIn = async (apt: Appointment) => {
    await confirmCheckIn(apt.id)
    setCheckInSuccessAptId(apt.id)
    const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    setAdmissionPassApt({ ...apt, status: 'en_sala', check_in_time: nowTime })
    setTimeout(() => {
      setCheckInSuccessAptId(null)
    }, 3000)
  }

  // Registrar e ingresar de inmediato a un paciente sin cita
  const handleWalkInAdmission = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!walkInName.trim() || !walkInCedula.trim() || !walkInPhone.trim()) {
      setWalkInErrorMsg('Por favor completa el nombre, cédula y teléfono del paciente.')
      return
    }

    setIsSubmittingWalkIn(true)
    setWalkInErrorMsg('')
    try {
      const today = new Date().toISOString().split('T')[0]
      const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })

      const res = await bookAppointment({
        serviceId: walkInServiceId,
        doctorId: walkInDoctorId,
        date: today,
        time: nowTime,
        patientName: walkInName.trim(),
        patientCedula: walkInCedula.trim().toUpperCase(),
        patientPhone: walkInPhone.trim(),
        area: walkInArea,
      })

      if (res.success && res.appointment) {
        await confirmCheckIn(res.appointment.id)
        setWalkInSuccessMsg(`¡Paciente ${walkInName.trim()} admitido(a) y en Sala de Espera!`)
        setAdmissionPassApt({ ...res.appointment, status: 'en_sala', check_in_time: nowTime })
        setIsPassModalOpen(true)
        setWalkInName('')
        setWalkInCedula('')
        setWalkInPhone('')
        setWalkInReason('')
        setTimeout(() => {
          setWalkInSuccessMsg('')
          setAdmissionTab('sala')
        }, 3000)
      } else {
        setWalkInErrorMsg(res.error || 'No se pudo procesar la admisión.')
      }
    } catch (err) {
      console.error(err)
      setWalkInErrorMsg('Error inesperado al admitir al paciente en sala.')
    } finally {
      setIsSubmittingWalkIn(false)
    }
  }

  return (
    <div className="space-y-8 pb-16">
      {/* HEADER DE SECRETARÍA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-[#02B2C6] bg-cyan-50 dark:bg-cyan-950 px-2.5 py-1 rounded-full">
            Panel de Admisión, Sala & Caja
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 mt-1">
            Recepción, Caja & Secretaría Médica
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Control de asistencia en sala, cobranzas en caja, facturación y recordatorios WhatsApp
          </p>
        </div>

        {/* Tasa Oficial y Caja Diaria */}
        <div className="flex items-center gap-2">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-2.5 px-3.5 shadow-sm flex items-center gap-2 text-xs">
            <span className="text-[10px] font-extrabold uppercase text-zinc-400">Tasa Oficial:</span>
            {isEditingRate ? (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="0.01"
                  value={tempRate}
                  onChange={(e) => setTempRate(e.target.value)}
                  className="w-16 px-1.5 py-0.5 border border-[#02B2C6] rounded text-xs text-zinc-900 dark:text-zinc-100 font-bold"
                />
                <button
                  type="button"
                  onClick={handleSaveRate}
                  className="p-1 bg-[#02B2C6] text-white rounded hover:bg-[#029baa]"
                >
                  <Check className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="font-black text-zinc-900 dark:text-zinc-100">
                  {exchangeRate.toFixed(2)} Bs/USD
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setTempRate(exchangeRate.toString())
                    setIsEditingRate(true)
                  }}
                  className="text-[10px] text-[#02B2C6] hover:underline font-bold"
                >
                  (Editar)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DASHBOARD DE CAJA Y KPIS OPERATIVOS (SOLO VISIBLE CUANDO LA PESTAÑA PRINCIPAL ES 'caja') */}
      {activeTab === 'caja' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Recaudación Total Hoy */}
          <div className="p-5 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/40 dark:to-zinc-900 border border-emerald-200 dark:border-emerald-900/60 rounded-3xl shadow-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Total Cobrado en Caja Hoy
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300 flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-black text-emerald-800 dark:text-emerald-300">
              ${totalCobradoUsd.toLocaleString('en-US')}
            </p>
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              Bs. {totalCobradoBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          {/* Pendiente por Cobrar */}
          <div className="p-5 bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/40 dark:to-zinc-900 border border-amber-200 dark:border-amber-900/60 rounded-3xl shadow-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Pendiente por Cobrar
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-300 flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-black text-amber-800 dark:text-amber-300">
              ${totalPendienteUsd.toLocaleString('en-US')}
            </p>
            <p className="text-xs font-bold text-amber-600 dark:text-amber-400">
              Bs. {totalPendienteBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      )}

      {/* SUB-MENÚ ESPECIALIZADO DE RECEPCIÓN & ADMISIÓN (REEMPLAZA EL SUBMENÚ REPETIDO) */}
      {(activeTab === 'espera' || activeTab === 'nueva-cita') && (
        <div className="space-y-6">
          {/* BARRA DE PESTAÑAS DE RECEPCIÓN & ADMISIÓN */}
          <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 dark:bg-zinc-800/80 rounded-2xl border border-slate-200 dark:border-zinc-700">
            <button
              type="button"
              onClick={() => setAdmissionTab('checkin')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                admissionTab === 'checkin'
                  ? 'bg-[#02B2C6] text-white shadow-sm'
                  : 'text-[#525862] hover:text-[#02B2C6] hover:bg-white dark:text-zinc-300 dark:hover:bg-zinc-700'
              }`}
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>Admisión & Check-In Express</span>
            </button>

            <button
              type="button"
              onClick={() => setAdmissionTab('validacion')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer relative ${
                admissionTab === 'validacion'
                  ? 'bg-[#02B2C6] text-white shadow-sm'
                  : 'text-[#525862] hover:text-[#02B2C6] hover:bg-white dark:text-zinc-300 dark:hover:bg-zinc-700'
              }`}
            >
              <PhoneCall className="w-4 h-4" />
              <span>Validación & Confirmación</span>
              {pendingValidationAppointments.length > 0 && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    admissionTab === 'validacion'
                      ? 'bg-amber-400 text-slate-900'
                      : 'bg-amber-500 text-white animate-pulse'
                  }`}
                >
                  {pendingValidationAppointments.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setAdmissionTab('sala')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                admissionTab === 'sala'
                  ? 'bg-[#02B2C6] text-white shadow-sm'
                  : 'text-[#525862] hover:text-[#02B2C6] hover:bg-white dark:text-zinc-300 dark:hover:bg-zinc-700'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Sala de Espera & Turnos ({enSalaCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setAdmissionTab('sin-cita')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                admissionTab === 'sin-cita'
                  ? 'bg-[#02B2C6] text-white shadow-sm'
                  : 'text-[#525862] hover:text-[#02B2C6] hover:bg-white dark:text-zinc-300 dark:hover:bg-zinc-700'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Admisión Sin Cita / Ventanilla</span>
            </button>

            <button
              type="button"
              onClick={() => setAdmissionTab('agenda')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                admissionTab === 'agenda'
                  ? 'bg-[#02B2C6] text-white shadow-sm'
                  : 'text-[#525862] hover:text-[#02B2C6] hover:bg-white dark:text-zinc-300 dark:hover:bg-zinc-700'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Agenda General de Citas ({appointments.length})</span>
            </button>
          </div>

          {/* 1. VISTA: ADMISIÓN & CHECK-IN EXPRESS */}
          {admissionTab === 'checkin' && (
            <div className="space-y-6">
              {/* BUSCADOR DE ADMISIÓN INMEDIATA POR CÉDULA */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-[#02B2C6] text-white flex items-center justify-center shadow-sm">
                        <ClipboardCheck className="w-4 h-4" />
                      </div>
                      <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100">
                        Ventanilla de Admisión & Check-In Express
                      </h3>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">
                      Ingresa la cédula o nombre del paciente que acaba de llegar para confirmar su entrada a sala en 1 clic.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setAdmissionTab('sin-cita')}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-cyan-50 dark:bg-cyan-950 text-[#02B2C6] border border-cyan-200 dark:border-cyan-800 hover:bg-cyan-100 transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>¿Llegó sin cita? Registrar aquí</span>
                  </button>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    placeholder="Escribe la cédula o nombre del paciente en ventanilla (Ej: V-18456789 o Carlos)..."
                    value={quickAdmissionSearch}
                    onChange={(e) => setQuickAdmissionSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#02B2C6]"
                  />
                </div>

                {/* RESULTADO DE LA BÚSQUEDA RÁPIDA DE ADMISIÓN */}
                {quickAdmissionSearch.trim() && (
                  <div className="space-y-3 pt-2">
                    {quickAdmissionMatches.length === 0 ? (
                      <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>No se encontró cita programada con los datos ingresados: <strong>"{quickAdmissionSearch}"</strong></span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setWalkInCedula(quickAdmissionSearch.trim().toUpperCase())
                            setAdmissionTab('sin-cita')
                          }}
                          className="px-3 py-1.5 bg-[#02B2C6] hover:bg-[#029baa] text-white rounded-xl font-bold shrink-0 transition"
                        >
                          + Registrar Admisión Inmediata
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {quickAdmissionMatches.map((apt) => {
                          const doc = doctors.find((d) => d.id === apt.doctor_id)
                          const srv = services.find((s) => s.id === apt.service_id)
                          const isEnSala = apt.status === 'en_sala'
                          const isSuccess = checkInSuccessAptId === apt.id

                          return (
                            <div
                              key={apt.id}
                              className={`p-4 rounded-2xl border transition space-y-3 ${
                                isEnSala
                                  ? 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/60'
                                  : 'bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-700'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                                      {apt.patient_name}
                                    </span>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
                                      {apt.patient_cedula}
                                    </span>
                                  </div>
                                  <p className="text-xs text-zinc-500 pt-0.5">
                                    {srv?.name || 'Consulta'} con <strong>{doc?.name}</strong>
                                  </p>
                                </div>
                                <span className="text-xs font-black text-[#02B2C6] bg-white dark:bg-zinc-900 px-2.5 py-1 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xs">
                                  {apt.appointment_time}
                                </span>
                              </div>

                              <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-200 dark:border-zinc-700">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-zinc-400">Estado:</span>
                                  <span className={`font-black text-[10px] uppercase px-2 py-0.5 rounded-full ${
                                    isEnSala
                                      ? 'bg-emerald-100 text-emerald-800 animate-pulse'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}>
                                    {isEnSala ? `En Sala (${apt.check_in_time})` : 'Por Ingresar'}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  {!isEnSala ? (
                                    <button
                                      type="button"
                                      onClick={() => handleDirectCheckIn(apt)}
                                      className="px-3.5 py-1.5 bg-[#02B2C6] hover:bg-[#029baa] text-white rounded-xl font-bold text-xs shadow-md shadow-cyan-600/20 flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                                    >
                                      <Clock className="w-3.5 h-3.5" />
                                      <span>Admitir en Sala (Check-In)</span>
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setAdmissionPassApt(apt)
                                        setIsPassModalOpen(true)
                                      }}
                                      className="px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:bg-white dark:hover:bg-zinc-800 flex items-center gap-1 cursor-pointer"
                                    >
                                      <Printer className="w-3.5 h-3.5 text-[#02B2C6]" />
                                      <span>Pase</span>
                                    </button>
                                  )}
                                </div>
                              </div>

                              {isSuccess && (
                                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-1.5 animate-in fade-in">
                                  <CheckCircle className="w-4 h-4 shrink-0" />
                                  <span>¡Entrada confirmada! El paciente ha sido admitido a la Sala de Espera.</span>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* KPIS RESUMEN DE SALA */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 bg-gradient-to-br from-cyan-50 to-white dark:from-cyan-950/40 dark:to-zinc-900 border border-cyan-200 dark:border-cyan-900/60 rounded-3xl shadow-sm space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#02B2C6]">
                      En Sala de Espera
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-cyan-100 dark:bg-cyan-900 text-[#02B2C6] flex items-center justify-center">
                      <UserCheck className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-3xl font-black text-[#02B2C6]">{enSalaCount}</p>
                  <p className="text-xs text-zinc-500">Pacientes aguardando turno en este momento</p>
                </div>

                <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
                      Citas por Llegar Hoy
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center">
                      <Clock className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-3xl font-black text-zinc-800 dark:text-zinc-200">{confirmadasCount}</p>
                  <p className="text-xs text-zinc-500">Citas programadas pendientes de ingreso</p>
                </div>

                <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600">
                      Consultas Atendidas
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-3xl font-black text-emerald-700 dark:text-emerald-400">{atendidasCount}</p>
                  <p className="text-xs text-zinc-500">Pacientes evaluados por los especialistas</p>
                </div>
              </div>

              {/* LISTADO DE CITAS POR LLEGAR HOY (CHECK-IN RÁPIDO) */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-sm sm:text-base text-zinc-900 dark:text-zinc-100">
                      Próximas Citas por Llegar (Check-In Pendiente)
                    </h4>
                    <p className="text-xs text-zinc-400">
                      Haz clic en &quot;Admitir en Sala&quot; en cuanto el paciente se presente en la recepción.
                    </p>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                    {pendingCheckInList.length} en agenda
                  </span>
                </div>

                {pendingCheckInList.length === 0 ? (
                  <div className="p-6 text-center text-xs text-zinc-400 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl">
                    No hay citas pendientes por ingresar en este momento.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {pendingCheckInList.slice(0, 6).map((apt) => {
                      const doc = doctors.find((d) => d.id === apt.doctor_id)
                      const srv = services.find((s) => s.id === apt.service_id)

                      return (
                        <div
                          key={apt.id}
                          className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 flex items-center justify-between gap-3 hover:border-[#02B2C6]/50 transition"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                                {apt.patient_name}
                              </span>
                              <span className="text-[10px] text-zinc-400">{apt.patient_cedula}</span>
                            </div>
                            <p className="text-[11px] text-zinc-500">
                              {srv?.name || 'Consulta'} con {doc?.name} ({apt.appointment_time})
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDirectCheckIn(apt)}
                            className="px-3 py-1.5 bg-[#02B2C6] hover:bg-[#029baa] text-white rounded-xl font-bold text-xs shadow-sm flex items-center gap-1 transition active:scale-95 shrink-0 cursor-pointer"
                          >
                            <Clock className="w-3 h-3" />
                            <span>Check-In</span>
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. VISTA: VALIDACIÓN TELEFÓNICA Y WHATSAPP DE CITAS WEB (FILTRO ANTI-PRUEBAS) */}
          {admissionTab === 'validacion' && (
            <div className="space-y-6">
              {/* Encabezado explicativo del Protocolo de Secretaría */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shrink-0">
                      <PhoneCall className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100">
                          Validación Telefónica & WhatsApp de Citas Web
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          Protocolo Anti-Prueba
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Valida la asistencia real del paciente antes de pasarlo a la agenda médica oficial. Si la consulta se registró sin especialista, asígnele el médico correspondiente de la especialidad antes de confirmar.
                      </p>
                    </div>
                  </div>

                  {/* Resumen de contadores */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-center">
                      <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-300 block">Por Validar</span>
                      <span className="text-sm font-black text-amber-800 dark:text-amber-200">{pendingValidationAppointments.length}</span>
                    </div>
                    <div className="px-3 py-1.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800 text-center">
                      <span className="text-[10px] uppercase font-bold text-[#02B2C6] block">Sin Doctor</span>
                      <span className="text-sm font-black text-[#02B2C6]">{pendingWithoutDoctorCount}</span>
                    </div>
                    <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-center">
                      <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300 block">Confirmadas</span>
                      <span className="text-sm font-black text-emerald-800 dark:text-emerald-200">{confirmedAppointmentsCount}</span>
                    </div>
                  </div>
                </div>

                {validationSuccessMsg && (
                  <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-2xl text-xs flex items-center justify-between gap-2 animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{validationSuccessMsg}</span>
                    </div>
                    <button
                      onClick={() => setValidationSuccessMsg(null)}
                      className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
                    >
                      Cerrar
                    </button>
                  </div>
                )}

                {/* Listado de Citas Pendientes de Validación */}
                {pendingValidationAppointments.length === 0 ? (
                  <div className="py-12 text-center space-y-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
                    <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
                    <h4 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                      ¡Todas las citas web han sido validadas por secretaría!
                    </h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
                      No hay citas pendientes de confirmación telefónica o WhatsApp. Las solicitudes que los pacientes reserven en línea aparecerán en esta cola de validación.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingValidationAppointments.map((apt) => {
                      const service = services.find((s) => s.id === apt.service_id)
                      const currentSelectedDocId =
                        pendingDocAssignments[apt.id] !== undefined
                          ? pendingDocAssignments[apt.id]
                          : (apt.doctor_id || '')
                      const matchingDocs = getDoctorsForService(service, doctors)
                      const currentAssignedDoc = doctors.find((d) => d.id === currentSelectedDocId)
                      const cleanPhone = apt.patient_phone.replace(/[^0-9]/g, '')

                      // Mensaje personalizado WhatsApp
                      const docMsgPart = currentAssignedDoc
                        ? `con ${currentAssignedDoc.name} (${currentAssignedDoc.specialty_name})`
                        : ''
                      const waText = `Hola ${apt.patient_name}, le saludamos de Recepción de Grupo Médico Zenit (CC Galerías Sebucán). Nos comunicamos para validar y confirmar su cita de *${service?.name || 'Consulta'}* agendada para el *${apt.appointment_date}* a las *${apt.appointment_time}* ${docMsgPart}. Por favor respóndanos a este mensaje para confirmar que acudirá a su consulta. ¡Muchas gracias!`
                      const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waText)}`

                      return (
                        <div
                          key={apt.id}
                          className="p-4 sm:p-5 rounded-2xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/20 dark:bg-zinc-850 hover:shadow-md transition space-y-4"
                        >
                          {/* Cabecera de la Cita */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-100 dark:border-zinc-800 pb-3">
                            <div className="flex items-center gap-2.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                              <h4 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                                {apt.patient_name}
                              </h4>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold">
                                {apt.patient_cedula}
                              </span>
                              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-cyan-100 text-[#02B2C6] dark:bg-cyan-950">
                                {apt.area === 'estetica' ? 'Espacio Estética' : 'Salud Médica'}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-xs text-zinc-600 dark:text-zinc-300 font-bold">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-[#02B2C6]" />
                                <span>{apt.appointment_date}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-[#02B2C6]" />
                                <span>{apt.appointment_time}</span>
                              </div>
                            </div>
                          </div>

                          {/* Cuadrícula de Datos y Asignación */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                            {/* Columna 1: Servicio y Arancel */}
                            <div className="p-3 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 space-y-1.5">
                              <span className="text-[10px] font-bold uppercase text-zinc-400 block">
                                Servicio o Tratamiento Solicitado
                              </span>
                              <p className="font-extrabold text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm">
                                {service?.name || 'Consulta Médica'}
                              </p>
                              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-zinc-100 dark:border-zinc-700/60">
                                <span className="text-zinc-500">Arancel estimado:</span>
                                <span className="font-extrabold text-[#02B2C6]">
                                  ${service?.price || 40} USD
                                </span>
                              </div>
                              <div className="text-[10px] text-zinc-500">
                                Registrada en línea: {new Date(apt.created_at).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>

                            {/* Columna 2: Especialista y Asignación */}
                            <div className="p-3 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase text-zinc-400">
                                  Especialista Asignado
                                </span>
                                {currentSelectedDocId ? (
                                  <span className="text-[9px] font-black text-emerald-600 uppercase bg-emerald-50 px-1.5 py-0.5 rounded">
                                    Asignado
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-black text-amber-700 uppercase bg-amber-100 px-1.5 py-0.5 rounded animate-pulse">
                                    Por Asignar
                                  </span>
                                )}
                              </div>

                              <select
                                value={currentSelectedDocId}
                                onChange={(e) =>
                                  setPendingDocAssignments((prev) => ({
                                    ...prev,
                                    [apt.id]: e.target.value,
                                  }))
                                }
                                className={`w-full p-2 rounded-xl border text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-[#02B2C6] ${
                                  !currentSelectedDocId
                                    ? 'border-amber-400 bg-amber-50/70 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200'
                                    : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                                }`}
                              >
                                {matchingDocs.length > 0 ? (
                                  <>
                                    <option value="">-- Asignar Médico Colegiado MPPS --</option>
                                    {matchingDocs.map((d) => (
                                      <option key={d.id} value={d.id}>
                                        {d.name} — {d.specialty_name}
                                      </option>
                                    ))}
                                  </>
                                ) : (
                                  <option value="">
                                    -- Sin especialista para este servicio (Pendiente) --
                                  </option>
                                )}
                              </select>

                              {matchingDocs.length === 0 ? (
                                <p className="text-[10px] text-amber-700 dark:text-amber-300">
                                  ℹ️ No hay doctores en agenda que coincidan con este servicio.
                                </p>
                              ) : !currentSelectedDocId ? (
                                <p className="text-[10px] text-amber-700 dark:text-amber-300">
                                  ⚠️ Selecciona un especialista antes de confirmar la cita.
                                </p>
                              ) : (
                                <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
                                  ✓ Especialista coincide con el servicio solicitado.
                                </p>
                              )}
                            </div>

                            {/* Columna 3: Canales de Validación */}
                            <div className="p-3 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 space-y-2 flex flex-col justify-between">
                              <span className="text-[10px] font-bold uppercase text-zinc-400 block">
                                Contactar y Validar con el Paciente
                              </span>

                              <div className="space-y-1.5">
                                <a
                                  href={waUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition active:scale-95"
                                  title="Enviar mensaje de confirmación por WhatsApp"
                                >
                                  <MessageSquare className="w-3.5 h-3.5 text-white" />
                                  <span>Validar vía WhatsApp</span>
                                </a>

                                <a
                                  href={`tel:${apt.patient_phone}`}
                                  className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-[#525862] dark:text-zinc-200 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95"
                                  title={`Llamar al teléfono: ${apt.patient_phone}`}
                                >
                                  <Phone className="w-3.5 h-3.5 text-[#02B2C6]" />
                                  <span>Llamar: {apt.patient_phone}</span>
                                </a>
                              </div>

                              <span className="text-[9.5px] text-zinc-400 text-center block">
                                Preguntar al paciente si confirma asistencia definitiva.
                              </span>
                            </div>
                          </div>

                          {/* Botones de Resolución (Confirmar vs Descartar) */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-amber-100 dark:border-zinc-800">
                            <span className="text-xs text-zinc-500 dark:text-zinc-400">
                              ¿El paciente atendió y confirmó la cita?
                            </span>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setDismissModalApt(apt)}
                                className="px-3.5 py-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Descartar (Prueba / No Asistirá)</span>
                              </button>

                              <button
                                type="button"
                                disabled={isValidatingId === apt.id}
                                onClick={() => handleValidateAndConfirm(apt)}
                                className="px-5 py-2 rounded-xl bg-[#02B2C6] hover:bg-[#029baa] text-white text-xs font-bold shadow-md shadow-cyan-600/20 flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>{isValidatingId === apt.id ? 'Validando...' : 'Confirmar Cita (Validada)'}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. VISTA: SALA DE ESPERA & TURNOS */}
          {admissionTab === 'sala' && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#02B2C6] text-white flex items-center justify-center shadow-sm">
                      <Users className="w-4 h-4" />
                    </div>
                    <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100">
                      Monitor de Sala de Espera & Control de Turnos ({waitingRoomList.length})
                    </h3>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Pacientes actualmente admitidos en la sala de espera en orden cronológico de llegada.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setAdmissionTab('checkin')}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#02B2C6] text-white hover:bg-[#029baa] transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                >
                  <ClipboardCheck className="w-3.5 h-3.5" />
                  <span>+ Admisión de Nuevo Paciente</span>
                </button>
              </div>

              {waitingRoomList.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto">
                    <Users className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-sm text-zinc-700 dark:text-zinc-300">
                    No hay pacientes en sala de espera en este momento
                  </h4>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                    Cuando un paciente llegue a la recepción, usa la pestaña de <strong>Admisión & Check-In</strong> para darle entrada a la sala.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {waitingRoomList.map((apt, idx) => {
                    const doc = doctors.find((d) => d.id === apt.doctor_id)
                    const srv = services.find((s) => s.id === apt.service_id)
                    const isPaid = apt.payment_status === 'pagado'

                    return (
                      <div
                        key={apt.id}
                        className="p-4 rounded-2xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/60 space-y-3 shadow-2xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-[#02B2C6] text-white font-black text-xs flex items-center justify-center shadow-xs">
                              #{idx + 1}
                            </div>
                            <div>
                              <h4 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                                {apt.patient_name}
                              </h4>
                              <p className="text-xs text-zinc-500">
                                C.I: <strong>{apt.patient_cedula}</strong> • Tel: {apt.patient_phone}
                              </p>
                            </div>
                          </div>

                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                            En Sala ({apt.check_in_time})
                          </span>
                        </div>

                        <div className="p-2.5 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs space-y-1">
                          <div className="flex justify-between">
                            <span className="text-zinc-400">Especialista:</span>
                            <span className="font-bold text-zinc-800 dark:text-zinc-200">{doc?.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-400">Servicio:</span>
                            <span className="text-zinc-700 dark:text-zinc-300">{srv?.name || 'Consulta'}</span>
                          </div>
                          <div className="flex justify-between items-center pt-0.5 border-t border-zinc-100 dark:border-zinc-800">
                            <span className="text-zinc-400">Caja / Pago:</span>
                            <span className={`font-bold ${isPaid ? 'text-emerald-600' : 'text-amber-600'}`}>
                              {isPaid ? `✓ Pagado (${apt.payment_amount_usd})` : `Pendiente (${srv?.price || 40})`}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleNotifyTurnWhatsApp(apt)}
                            className="flex-1 py-2 px-3 rounded-xl bg-[#02B2C6] hover:bg-[#029baa] text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Avisar Turno (WhatsApp)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setAdmissionPassApt(apt)
                              setIsPassModalOpen(true)
                            }}
                            className="py-2 px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-white dark:hover:bg-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-200 transition cursor-pointer"
                            title="Ver pase de turno"
                          >
                            <Printer className="w-3.5 h-3.5 text-[#02B2C6]" />
                          </button>

                          {!isPaid && (
                            <button
                              type="button"
                              onClick={() => handleOpenPayModal(apt)}
                              className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer"
                              title="Cobrar en caja"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* 3. VISTA: ADMISIÓN SIN CITA / VENTANILLA PRESENCIAL */}
          {admissionTab === 'sin-cita' && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-2.5 border-b border-zinc-100 dark:border-zinc-800 pb-4">
                <div className="w-9 h-9 rounded-xl bg-[#02B2C6] text-white flex items-center justify-center shadow-sm">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100">
                    Admisión Inmediata de Paciente en Ventanilla (Sin Cita Previa)
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Registra al paciente que llega espontáneamente para triaje o consulta y envíalo directamente a Sala de Espera.
                  </p>
                </div>
              </div>

              {walkInSuccessMsg && (
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 text-emerald-800 dark:text-emerald-300 rounded-2xl text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{walkInSuccessMsg}</span>
                </div>
              )}

              {walkInErrorMsg && (
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 text-rose-800 dark:text-rose-300 rounded-2xl text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{walkInErrorMsg}</span>
                </div>
              )}

              <form onSubmit={handleWalkInAdmission} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">
                      Cédula de Identidad *
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: V-18456789"
                      value={walkInCedula}
                      onChange={(e) => setWalkInCedula(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-bold text-zinc-900 dark:text-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: María Rodríguez"
                      value={walkInName}
                      onChange={(e) => setWalkInName(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">
                      Teléfono / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      placeholder="Ej: 04141234567"
                      value={walkInPhone}
                      onChange={(e) => setWalkInPhone(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">
                      Área de Atención *
                    </label>
                    <select
                      value={walkInArea}
                      onChange={(e) => setWalkInArea(e.target.value as ClinicArea)}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-bold text-zinc-900 dark:text-zinc-100"
                    >
                      <option value="salud">🩺 Especialidad Médica (Salud)</option>
                      <option value="estetica">✨ Dermoestética & Bienestar</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">
                      Servicio Solicitado *
                    </label>
                    <select
                      value={walkInServiceId}
                      onChange={(e) => setWalkInServiceId(parseInt(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100"
                    >
                      {walkInServices.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} (${s.price})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">
                      Médico de Guardia / Especialista *
                    </label>
                    <select
                      value={walkInDoctorId}
                      onChange={(e) => setWalkInDoctorId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100"
                    >
                      {walkInDoctors.length > 0 ? (
                        walkInDoctors.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} ({d.specialty_name})
                          </option>
                        ))
                      ) : (
                        <option value="">
                          -- Sin especialista asignado en agenda --
                        </option>
                      )}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">
                    Motivo de la Consulta / Triaje Preliminar
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Evaluación general, dolor articular, control de rutina..."
                    value={walkInReason}
                    onChange={(e) => setWalkInReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setAdmissionTab('checkin')}
                    className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmittingWalkIn}
                    className="px-5 py-2.5 rounded-xl bg-[#02B2C6] hover:bg-[#029baa] text-white text-xs font-bold shadow-md shadow-cyan-600/20 flex items-center gap-2 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{isSubmittingWalkIn ? 'Procesando Admisión...' : 'Admitir Paciente y Asignar a Sala'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* 1. SECCIÓN AVISOS WHATSAPP (SOLO VISIBLE EN SUB-MENÚ 'avisos') */}
      {activeTab === 'avisos' && (
        <section className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-3xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-extrabold text-sm sm:text-base">
              Atención Prioritaria: Solicitudes de Cancelación ({pendingCancelRequests.length})
            </h3>
          </div>
          <p className="text-xs text-amber-700/80 dark:text-amber-400">
            Los siguientes pacientes han solicitado cancelar su cita desde su portal. Por favor
            contactar antes de liberar el horario.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingCancelRequests.map((req) => {
              const service = services.find((s) => s.id === req.service_id)
              const doctor = doctors.find((d) => d.id === req.doctor_id)

              return (
                <div
                  key={req.id}
                  className="bg-white dark:bg-zinc-900 border border-amber-300/80 dark:border-amber-800/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        {req.patient_name}
                      </span>
                      <span className="text-[10px] text-zinc-400">{req.patient_cedula}</span>
                    </div>
                    <p className="text-xs text-zinc-500">
                      {service?.name} con {doctor?.name} ({req.appointment_date} -{' '}
                      {req.appointment_time})
                    </p>
                    <div className="p-2.5 bg-amber-50/50 dark:bg-amber-950/40 rounded-xl text-xs text-amber-900 dark:text-amber-200 italic">
                      &ldquo;{req.cancellation_reason}&rdquo;
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <a
                      href={`tel:${req.patient_phone}`}
                      className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 flex items-center gap-1.5"
                    >
                      <Phone className="w-3.5 h-3.5 text-zinc-400" />
                      Llamar
                    </a>
                    <button
                      type="button"
                      onClick={() => handleOpenCancelModal(req)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm flex items-center gap-1.5 flex-1 justify-center"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Avisar y Cancelar
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* 2. AGENDA GENERAL, CAJA & CONTROL DE LLEGADAS (AISLADA) */}
      {(activeTab === 'caja' || ((activeTab === 'espera' || activeTab === 'nueva-cita') && admissionTab === 'agenda')) && (
      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-extrabold text-lg text-zinc-900 dark:text-zinc-100">
              Agenda del Día & Caja de Recepción
            </h3>
            <p className="text-xs text-zinc-400">
              Cobro de citas en USD/Bs, facturación instantánea y notificaciones directas por WhatsApp
            </p>
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar paciente o cédula..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#02B2C6]"
              />
            </div>

            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value as 'all' | 'pagado' | 'pendiente')}
              className="py-1.5 px-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 font-bold"
            >
              <option value="all">Todos los Pagos</option>
              <option value="pagado">🟢 Pagadas</option>
              <option value="pendiente">🟡 Pendientes</option>
            </select>

            <select
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value as ClinicArea | 'all')}
              className="py-1.5 px-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100"
            >
              <option value="all">Todas las Áreas</option>
              <option value="salud">Salud Médica</option>
              <option value="estetica">Estética</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as AppointmentStatus | 'all')}
              className="py-1.5 px-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100"
            >
              <option value="all">Todos los Estados</option>
              <option value="confirmada">Confirmada</option>
              <option value="en_sala">En Sala</option>
              <option value="solicitud_cancelacion">Sol. Cancelación</option>
              <option value="atendida">Atendida</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>
        </div>

        {/* Tabla de Citas y Caja */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 uppercase font-bold text-[10px]">
                <th className="py-3 px-3">Hora / Fecha</th>
                <th className="py-3 px-3">Paciente & Cédula</th>
                <th className="py-3 px-3">Contacto & WhatsApp</th>
                <th className="py-3 px-3">Servicio / Doctor</th>
                <th className="py-3 px-3">Estado Sala</th>
                <th className="py-3 px-3">Estado de Pago (Caja)</th>
                <th className="py-3 px-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-zinc-400">
                    No se encontraron citas con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((apt) => {
                  const service = services.find((s) => s.id === apt.service_id)
                  const doctor = doctors.find((d) => d.id === apt.doctor_id)

                  const isEnSala = apt.status === 'en_sala'
                  const isCancelada = apt.status === 'cancelada'
                  const isAtendida = apt.status === 'atendida'
                  const isSolicitud = apt.status === 'solicitud_cancelacion'
                  const isPagado = apt.payment_status === 'pagado'

                  return (
                    <tr
                      key={apt.id}
                      className={`hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition ${
                        isEnSala ? 'bg-blue-50/30 dark:bg-blue-950/10' : ''
                      }`}
                    >
                      {/* Fecha / Hora */}
                      <td className="py-3.5 px-3">
                        <span className="font-bold text-zinc-900 dark:text-zinc-100 block">
                          {apt.appointment_time}
                        </span>
                        <span className="text-[10px] text-zinc-400">{apt.appointment_date}</span>
                      </td>

                      {/* Paciente */}
                      <td className="py-3.5 px-3">
                        <span className="font-bold text-zinc-900 dark:text-zinc-100 block">
                          {apt.patient_name}
                        </span>
                        <span className="text-[10px] text-zinc-400">{apt.patient_cedula}</span>
                      </td>

                      {/* Contacto & WhatsApp */}
                      <td className="py-3.5 px-3">
                        <div className="space-y-1">
                          <a
                            href={`tel:${apt.patient_phone}`}
                            className="text-zinc-700 dark:text-zinc-300 hover:text-[#02B2C6] flex items-center gap-1 font-semibold"
                          >
                            <Phone className="w-3 h-3 text-zinc-400" />
                            <span>{apt.patient_phone}</span>
                          </a>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleSendReminderWhatsApp(apt)}
                              className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 flex items-center gap-1"
                              title="Enviar recordatorio formal por WhatsApp"
                            >
                              <MessageSquare className="w-2.5 h-2.5" />
                              Recordar
                            </button>
                            {isEnSala && (
                              <button
                                type="button"
                                onClick={() => handleNotifyTurnWhatsApp(apt)}
                                className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-50 dark:bg-cyan-950/60 text-[#02B2C6] border border-cyan-200 dark:border-cyan-800 hover:bg-cyan-100 flex items-center gap-1"
                                title="Avisar que su médico está listo"
                              >
                                Avisar Turno
                              </button>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Servicio & Doctor */}
                      <td className="py-3.5 px-3">
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200 block">
                          {service?.name || 'Consulta'}
                        </span>
                        <span className="text-[10px] text-zinc-400">{doctor?.name}</span>
                      </td>

                      {/* Estado Sala */}
                      <td className="py-3.5 px-3">
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full inline-block ${
                            isEnSala
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 animate-pulse'
                              : isSolicitud
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
                            : isSolicitud
                            ? 'Sol. Cancelación'
                            : isCancelada
                            ? 'Cancelada'
                            : isAtendida
                            ? 'Atendida'
                            : 'Confirmada'}
                        </span>
                      </td>

                      {/* Estado de Cobro (Caja) */}
                      <td className="py-3.5 px-3">
                        {isPagado ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                              ✓ Pagado (${apt.payment_amount_usd})
                            </span>
                            <div className="text-[10px] text-zinc-400 flex items-center gap-1">
                              <span>Ref: {apt.payment_reference || 'N/A'}</span>
                              <button
                                type="button"
                                onClick={() => handleOpenReceipt(apt)}
                                className="text-[#02B2C6] hover:underline font-bold"
                              >
                                [Recibo]
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <span className="inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                              Pendiente (${service?.price || 40})
                            </span>
                            <div>
                              <button
                                type="button"
                                onClick={() => handleOpenPayModal(apt)}
                                className="px-2 py-1 rounded-lg text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs flex items-center gap-1 transition"
                              >
                                <DollarSign className="w-2.5 h-2.5" />
                                Cobrar Caja
                              </button>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Check-in */}
                          {!isEnSala && !isAtendida && !isCancelada && (
                            <button
                              type="button"
                              onClick={() => confirmCheckIn(apt.id)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-white bg-[#02B2C6] hover:bg-[#029baa] shadow-sm flex items-center gap-1 transition"
                              title="Marcar llegada a sala"
                            >
                              <Clock className="w-3 h-3" />
                              <span>Check-in</span>
                            </button>
                          )}

                          {/* Cancelar con Aviso */}
                          {!isCancelada && !isAtendida && (
                            <button
                              type="button"
                              onClick={() => handleOpenCancelModal(apt)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900 transition"
                              title="Cancelar con protocolo de aviso formal"
                            >
                              Cancelar
                            </button>
                          )}

                          {isAtendida && (
                            <span className="text-[11px] text-zinc-400">Completada</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
      )}

      {/* MODAL DE COBRO EN CAJA / REGISTRO DE PAGO */}
      {isPayModalOpen && selectedPayAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-5">
            <button
              type="button"
              onClick={() => setIsPayModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-emerald-600">
              <Receipt className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Caja de Recepción CMZenit
              </span>
            </div>

            <div>
              <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100">
                Registrar Cobro de Cita
              </h3>
              <p className="text-xs text-zinc-500">
                Paciente: <strong className="text-zinc-800 dark:text-zinc-200">{selectedPayAppointment.patient_name}</strong> ({selectedPayAppointment.patient_cedula})
              </p>
            </div>

            <form onSubmit={handleConfirmPayment} className="space-y-4">
              {/* Tarjeta de Cálculo de Montos */}
              <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-black text-emerald-700 dark:text-emerald-400 block">
                    Monto a Cobrar (USD)
                  </span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-lg font-bold text-zinc-600">$</span>
                    <input
                      type="number"
                      required
                      min="0"
                      step="1"
                      value={payAmountUsd}
                      onChange={(e) => setPayAmountUsd(Number(e.target.value))}
                      className="w-24 text-xl font-black text-emerald-900 dark:text-emerald-200 bg-white dark:bg-zinc-800 px-2 py-1 rounded-lg border border-emerald-300"
                    />
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-black text-emerald-700 dark:text-emerald-400 block">
                    Equivalente en Bolívares (Bs.)
                  </span>
                  <p className="text-xl font-black text-emerald-900 dark:text-emerald-200 mt-1">
                    Bs. {(payAmountUsd * exchangeRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold block">
                    Tasa Oficial: {exchangeRate.toFixed(2)} Bs/USD
                  </span>
                </div>
              </div>

              {/* Selector de Método de Pago */}
              <div>
                <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">
                  Método de Pago *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {[
                    { id: 'pago_movil', label: 'Pago Móvil', icon: '📱' },
                    { id: 'punto_venta', label: 'Punto de Venta', icon: '💳' },
                    { id: 'zelle', label: 'Zelle (USD)', icon: '💵' },
                    { id: 'transferencia', label: 'Transferencia', icon: '🏦' },
                    { id: 'efectivo_usd', label: 'Efectivo USD ($)', icon: '💵' },
                    { id: 'efectivo_bs', label: 'Efectivo Bs.', icon: '🪙' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPayMethod(m.id as PaymentMethod)}
                      className={`p-2.5 rounded-xl border text-left font-bold transition flex items-center gap-2 ${
                        payMethod === m.id
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 shadow-xs'
                          : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50'
                      }`}
                    >
                      <span>{m.icon}</span>
                      <span className="text-xs">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Número de Referencia o Comprobante */}
              <div>
                <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">
                  Número de Referencia / Comprobante
                </label>
                <input
                  type="text"
                  placeholder="Ej: Últimos 4 o 6 dígitos de la transacción"
                  value={payReference}
                  onChange={(e) => setPayReference(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100"
                />
              </div>

              {/* Botones de Acción */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isProcessingPayment}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isProcessingPayment ? 'Registrando...' : 'Confirmar Pago & Generar Recibo'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE RECIBO DIGITAL DE CAJA (IMPRIMIBLE / COMPARTIBLE) */}
      {isReceiptModalOpen && receiptApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-5">
            <button
              type="button"
              onClick={() => setIsReceiptModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 no-print"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Recibo Imprimible */}
            <div id="printable-receipt" className="space-y-4 bg-white p-2 text-zinc-900">
              <div className="text-center border-b border-zinc-200 pb-3 space-y-1">
                <div className="w-8 h-8 rounded-xl bg-[#02B2C6] text-white font-black flex items-center justify-center mx-auto text-sm">
                  Z
                </div>
                <h3 className="font-black text-sm tracking-tight text-zinc-900">
                  CENTRO MÉDICO ZENIT
                </h3>
                <p className="text-[10px] text-zinc-500">
                  CC Galerías Sebucán, Caracas • RIF: J-50123456-7
                </p>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 inline-block">
                  COMPROBANTE DE PAGO EN CAJA
                </span>
              </div>

              <div className="space-y-2 text-xs border-b border-zinc-100 pb-3">
                <div className="flex justify-between">
                  <span className="text-zinc-500 font-semibold">Nro. de Recibo:</span>
                  <strong className="font-mono">REC-{receiptApt.id.slice(-6).toUpperCase()}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500 font-semibold">Fecha y Hora:</span>
                  <span>{new Date().toLocaleDateString('es-VE')} {new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500 font-semibold">Paciente:</span>
                  <strong className="text-zinc-900">{receiptApt.patient_name}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500 font-semibold">Cédula:</span>
                  <span>{receiptApt.patient_cedula}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500 font-semibold">Método:</span>
                  <span className="uppercase font-bold text-emerald-700">{receiptApt.payment_method?.replace('_', ' ')}</span>
                </div>
                {receiptApt.payment_reference && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500 font-semibold">Referencia:</span>
                    <span className="font-mono">{receiptApt.payment_reference}</span>
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200 text-center space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">Total Pagado</span>
                <p className="text-2xl font-black text-emerald-600">
                  ${receiptApt.payment_amount_usd || 0} USD
                </p>
                <p className="text-xs font-bold text-zinc-700">
                  Bs. {receiptApt.payment_amount_bs?.toLocaleString('es-VE', { minimumFractionDigits: 2 }) || ((receiptApt.payment_amount_usd || 0) * exchangeRate).toFixed(2)}
                </p>
              </div>
            </div>

            {/* Acciones de Recibo */}
            <div className="flex items-center gap-2 pt-2 border-t border-zinc-100 no-print">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-[#02B2C6] hover:bg-[#029baa] shadow-sm flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Imprimir Recibo
              </button>
              <button
                type="button"
                onClick={() => {
                  const text = `*COMPROBANTE DE PAGO - GRUPO MÉDICO ZENIT*%0A%0A*Paciente:* ${receiptApt.patient_name}%0A*Cédula:* ${receiptApt.patient_cedula}%0A*Monto:* $${receiptApt.payment_amount_usd} (Bs. ${receiptApt.payment_amount_bs || ((receiptApt.payment_amount_usd || 0) * exchangeRate)})%0A*Método:* ${receiptApt.payment_method}%0A*Ref:* ${receiptApt.payment_reference || 'N/A'}%0A%0AGracias por confiar en Centro Médico Zenit.`
                  window.open(`https://api.whatsapp.com/send?phone=${encodeURIComponent(receiptApt.patient_phone)}&text=${text}`, '_blank')
                }}
                className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 flex items-center justify-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL OBLIGATORIO: CANCELACIÓN CON AVISO PREVIO */}
      {isCancelModalOpen && selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl p-6 sm:p-8">
            <button
              type="button"
              onClick={() => setIsCancelModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-rose-600 mb-2">
              <ShieldAlert className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Protocolo de Calidad CMZenit
              </span>
            </div>

            <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100">
              Cancelar Cita Médica con Aviso Previo
            </h3>
            <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
              Es obligatorio confirmar contacto telefónico o enviar la notificación oficial por
              WhatsApp para preservar la relación médico-paciente.
            </p>

            {generatedWaUrl ? (
              <div className="mt-6 p-5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl space-y-4 text-center">
                <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-200">
                  ¡Cita Cancelada y Mensaje Preparado!
                </h4>
                <p className="text-xs text-emerald-800 dark:text-emerald-300">
                  Haz clic abajo para abrir WhatsApp y entregar el aviso formal al paciente:
                </p>
                <a
                  href={generatedWaUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
                >
                  <MessageSquare className="w-4 h-4" />
                  Abrir Chat de WhatsApp con Paciente
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  type="button"
                  onClick={() => setIsCancelModalOpen(false)}
                  className="text-xs text-zinc-500 hover:underline block mx-auto pt-1"
                >
                  Cerrar ventana
                </button>
              </div>
            ) : (
              <form onSubmit={handleConfirmCancellation} className="space-y-4 mt-5">
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl space-y-1 text-xs">
                  <p>
                    <strong className="text-zinc-700 dark:text-zinc-300">Paciente:</strong>{' '}
                    {selectedAppointment.patient_name} ({selectedAppointment.patient_cedula})
                  </p>
                  <p>
                    <strong className="text-zinc-700 dark:text-zinc-300">Teléfono:</strong>{' '}
                    {selectedAppointment.patient_phone}
                  </p>
                  <p>
                    <strong className="text-zinc-700 dark:text-zinc-300">Fecha y Hora:</strong>{' '}
                    {selectedAppointment.appointment_date} - {selectedAppointment.appointment_time}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">
                    Motivo Formal de la Cancelación *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                {/* Checkbox Obligatorio */}
                <label className="flex items-start gap-2.5 p-3 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={hasCalledPatient}
                    onChange={(e) => setHasCalledPatient(e.target.checked)}
                    className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
                  />
                  <span className="text-xs text-amber-900 dark:text-amber-200 font-medium leading-relaxed">
                    Confirmo que he intentado comunicarme o he coordinado el aviso previo vía
                    telefónica/WhatsApp con el paciente.
                  </span>
                </label>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCancelModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    Volver
                  </button>
                  <button
                    type="submit"
                    disabled={!hasCalledPatient || sendingNotice}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 shadow-md shadow-rose-600/20 flex items-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{sendingNotice ? 'Procesando...' : 'Confirmar Cancelación & Generar WhatsApp'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      {/* MODAL: DESCARTAR CITA DE PRUEBA O NO CONFIRMADA */}
      {dismissModalApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950 flex items-center justify-center font-bold shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100">
                  Descartar Cita No Confirmada
                </h4>
                <p className="text-xs text-zinc-500">
                  Paciente: {dismissModalApt.patient_name} ({dismissModalApt.patient_cedula})
                </p>
              </div>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Esta acción cancelará la solicitud para que no ocupe lugar en la agenda médica de los doctores ni en las salas de espera.
            </p>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-zinc-500">
                Motivo del Descarte
              </label>
              <select
                value={dismissReason}
                onChange={(e) => setDismissReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-bold text-zinc-900 dark:text-zinc-100"
              >
                <option value="Cita de prueba / Teléfono no existe o es ficticio">Cita de prueba / Teléfono no existe o ficticio</option>
                <option value="Paciente no respondió llamada telefónica ni WhatsApp">Paciente no respondió llamada ni WhatsApp</option>
                <option value="Paciente manifestó que no podrá asistir a la consulta">Paciente manifestó que no podrá acudir</option>
                <option value="Datos incompletos o inconsistentes">Datos incompletos o inconsistentes</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setDismissModalApt(null)}
                className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDismissAppointment}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition active:scale-95 cursor-pointer"
              >
                Confirmar Descarte
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
