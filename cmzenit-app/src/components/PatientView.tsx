'use client'

import React, { useState } from 'react'
import { useCMZenit } from '@/context/CMZenitContext'
import { Service, ClinicArea } from '@/types/database.types'
import {
  Calendar,
  Clock,
  Search,
  CheckCircle,
  FileText,
  Download,
  Sparkles,
  Stethoscope,
  X,
  Send,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react'

export function PatientView() {
  const {
    currentUser,
    activeArea,
    setActiveArea,
    services,
    doctors,
    appointments,
    medicalRecords,
    bookAppointment,
    requestCancellation,
  } = useCMZenit()

  // Estados de catálogo y filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [filterArea, setFilterArea] = useState<ClinicArea | 'all'>('all')

  // Modal Agendamiento
  const [isBookingOpen, setIsBookingOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedDoctorId, setSelectedDoctorId] = useState('')
  const [bookingDate, setBookingDate] = useState('')
  const [bookingTime, setBookingTime] = useState('09:00 AM')
  const [patientName, setPatientName] = useState(currentUser?.name || '')
  const [patientCedula, setPatientCedula] = useState(currentUser?.cedula || '')
  const [patientPhone, setPatientPhone] = useState(currentUser?.phone || '')
  const [bookingSuccess, setBookingSuccess] = useState(false)

  // Modal Solicitar Cancelación
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [appointmentToCancelId, setAppointmentToCancelId] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState('')

  const isEstetica = activeArea === 'estetica'

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

  const handleOpenBooking = (service?: Service) => {
    if (service) {
      setSelectedService(service)
      // Seleccionar un doctor del área correspondiente por defecto
      const matchDoc = doctors.find((d) => d.area === service.category && d.is_active)
      if (matchDoc) setSelectedDoctorId(matchDoc.id)
    } else {
      setSelectedService(services[0])
      setSelectedDoctorId(doctors[0]?.id || '')
    }

    // Default fecha: mañana
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
    setBookingDate(tomorrow)
    setBookingSuccess(false)
    setIsBookingOpen(true)
  }

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedService || !selectedDoctorId || !bookingDate || !bookingTime) return

    const res = await bookAppointment({
      serviceId: selectedService.id,
      doctorId: selectedDoctorId,
      date: bookingDate,
      time: bookingTime,
      patientName: patientName || currentUser?.name || 'Paciente',
      patientCedula: patientCedula || currentUser?.cedula || 'V-000000',
      patientPhone: patientPhone || currentUser?.phone || '+58 412 0000000',
      area: selectedService.category,
    })

    if (res.success) {
      setBookingSuccess(true)
      setTimeout(() => {
        setIsBookingOpen(false)
        setBookingSuccess(false)
      }, 1800)
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
    <div className="space-y-10 pb-16">
      {/* 1. HERO BANNER DINÁMICO */}
      <section
        className="relative overflow-hidden rounded-3xl p-6 sm:p-10 text-white transition-all duration-500 shadow-xl bg-gradient-to-r from-[#525862] via-[#243347] to-[#525862] border border-slate-700"
      >
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md">
            {isEstetica ? <Sparkles className="w-4 h-4" /> : <Stethoscope className="w-4 h-4" />}
            <span>
              {isEstetica
                ? 'Espacio Estética, Dermo & Rejuvenecimiento'
                : 'Salud Integral & Especialidades Clínicas'}
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            {isEstetica
              ? 'Realza tu armonía y cuida tu piel con especialistas.'
              : 'Atención médica de élite, rápida y personalizada.'}
          </h1>

          <p className="text-sm sm:text-base text-white/80 leading-relaxed max-w-xl">
            {isEstetica
              ? 'Tecnología médica avanzada en toxina botulínica, bioestimuladores de colágeno, láser de diodo e hidratación profunda.'
              : 'Consultas especializadas en cardiología, medicina interna, oftalmología y chequeos de rutina con récipes digitales al instante.'}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => handleOpenBooking()}
              className="px-5 py-3 rounded-xl font-bold text-xs sm:text-sm bg-white text-zinc-900 hover:bg-zinc-100 shadow-lg transition active:scale-95"
            >
              Agendar Cita Ahora
            </button>
            <button
              onClick={() => setActiveArea(isEstetica ? 'salud' : 'estetica')}
              className="px-4 py-3 rounded-xl font-semibold text-xs sm:text-sm bg-white/10 hover:bg-white/20 border border-white/25 backdrop-blur-md transition"
            >
              Cambiar a {isEstetica ? 'Área Médica (Salud)' : 'Espacio Estética'}
            </button>
          </div>
        </div>

        {/* Patrón decorativo de fondo */}
        <div className="absolute -right-12 -bottom-12 w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none" />
      </section>

{/* 1. SECCIÓN "MIS CITAS" (CON PROTOCOLO DE CANCELACIÓN) */}
      <section className="space-y-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
              Mis Citas Médicas & Tratamientos
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Control de asistencia, hora de llegada y reprogramación asistida
            </p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
            {myAppointments.length} agendada(s)
          </span>
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

              return (
                <div
                  key={apt.id}
                  className={`bg-white dark:bg-zinc-900 border rounded-2xl p-5 shadow-sm transition space-y-4 ${
                    isSolicitudCancel
                      ? 'border-amber-400/60 dark:border-amber-500/40'
                      : isEnSala
                      ? 'border-blue-400/60 dark:border-blue-500/40'
                      : 'border-zinc-200 dark:border-zinc-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                        {apt.area === 'estetica' ? 'Estética' : 'Salud'}
                      </span>
                      <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                        {service?.name || 'Consulta Médica'}
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {doctor?.name} ({doctor?.specialty_name})
                      </p>
                    </div>

                    {/* Insignia de estado */}
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full ${
                        isEnSala
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 animate-pulse'
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
                        : isSolicitudCancel
                        ? 'Cancelación en Revisión'
                        : isCancelada
                        ? 'Cancelada'
                        : isAtendida
                        ? 'Atendida'
                        : 'Confirmada'}
                    </span>
                  </div>

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

      {/* 2. HISTORIAL CLÍNICO, RÉCIPES Y EXÁMENES PREVIOS */}
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

                {rec.recipe_file_url && (
                  <a
                    href={rec.recipe_file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Descargar Récipe PDF
                  </a>
                )}
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
            </div>
          ))}
        </div>
      </section>

      {/* 3. CATÁLOGO DE SERVICIOS Y PROCEDIMIENTOS */}
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
              <div className="py-12 text-center space-y-3 animate-in zoom-in-95">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
                <h4 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  ¡Cita Registrada Exitosamente!
                </h4>
                <p className="text-xs text-zinc-500">
                  Hemos notificado a Secretaría. Puedes verla en la sección &ldquo;Mis Citas&rdquo;.
                </p>
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
                        const doc = doctors.find((d) => d.area === s.category && d.is_active)
                        if (doc) setSelectedDoctorId(doc.id)
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
                  <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">
                    Especialista
                  </label>
                  <select
                    value={selectedDoctorId}
                    onChange={(e) => setSelectedDoctorId(e.target.value)}
                    className="w-full py-2.5 px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02B2C6]"
                  >
                    {doctors
                      .filter(
                        (d) =>
                          d.is_active &&
                          (!selectedService || d.area === selectedService.category)
                      )
                      .map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} — {d.specialty_name}
                        </option>
                      ))}
                  </select>
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
                      min={bookingDate || undefined}
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
    </div>
  )
}
