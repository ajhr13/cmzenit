'use client'

import React, { useState } from 'react'
import { useCMZenit } from '@/context/CMZenitContext'
import { Appointment, ClinicArea, AppointmentStatus } from '@/types/database.types'
import {
  Clock,
  Phone,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  Search,
  X,
  Send,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react'

export function SecretaryView() {
  const {
    appointments,
    services,
    doctors,
    confirmCheckIn,
    cancelAppointmentWithNotice,
  } = useCMZenit()

  const [searchFilter, setSearchFilter] = useState('')
  const [areaFilter, setAreaFilter] = useState<ClinicArea | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'all'>('all')

  // Modal Cancelación con Aviso Previo
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [hasCalledPatient, setHasCalledPatient] = useState(false)
  const [sendingNotice, setSendingNotice] = useState(false)
  const [generatedWaUrl, setGeneratedWaUrl] = useState<string | null>(null)

  // Solicitudes prioritarias de cancelación
  const pendingCancelRequests = appointments.filter(
    (a) => a.status === 'solicitud_cancelacion'
  )

  // Filtrado de agenda
  const filteredAppointments = appointments.filter((apt) => {
    const matchesArea = areaFilter === 'all' || apt.area === areaFilter
    const matchesStatus = statusFilter === 'all' || apt.status === statusFilter
    const matchesSearch =
      apt.patient_name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      apt.patient_cedula.toLowerCase().includes(searchFilter.toLowerCase()) ||
      apt.patient_phone.includes(searchFilter)

    return matchesArea && matchesStatus && matchesSearch
  })

  // Métricas
  const enSalaCount = appointments.filter((a) => a.status === 'en_sala').length
  const confirmadasCount = appointments.filter((a) => a.status === 'confirmada').length
  const atendidasCount = appointments.filter((a) => a.status === 'atendida').length

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

  return (
    <div className="space-y-8 pb-16">
      {/* HEADER DE SECRETARÍA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-[#02B2C6] bg-cyan-50 dark:bg-cyan-950 px-2.5 py-1 rounded-full">
            Panel de Admisión y Sala
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 mt-1">
            Recepción & Secretaría Médica
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Control de asistencia en sala, confirmaciones y gestión de cancelaciones
          </p>
        </div>

        {/* KPIs Rápidos */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="p-3 bg-white dark:bg-zinc-900 border border-blue-200 dark:border-blue-900/50 rounded-2xl shadow-sm">
            <span className="text-[10px] font-bold text-[#02B2C6] uppercase">En Sala</span>
            <p className="text-xl font-black text-blue-700 dark:text-blue-400">{enSalaCount}</p>
          </div>
          <div className="p-3 bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl shadow-sm">
            <span className="text-[10px] font-bold text-emerald-600 uppercase">Confirmadas</span>
            <p className="text-xl font-black text-emerald-700 dark:text-emerald-400">
              {confirmadasCount}
            </p>
          </div>
          <div className="p-3 bg-white dark:bg-zinc-900 border border-amber-200 dark:border-amber-900/50 rounded-2xl shadow-sm">
            <span className="text-[10px] font-bold text-amber-600 uppercase">Sol. Cancelación</span>
            <p className="text-xl font-black text-amber-600 dark:text-amber-400">
              {pendingCancelRequests.length}
            </p>
          </div>
          <div className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
            <span className="text-[10px] font-bold text-zinc-500 uppercase">Atendidas</span>
            <p className="text-xl font-black text-zinc-800 dark:text-zinc-200">{atendidasCount}</p>
          </div>
        </div>
      </div>

      {/* 1. ALERTAS PRIORITARIAS DE CANCELACIÓN */}
      {pendingCancelRequests.length > 0 && (
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

      {/* 2. AGENDA GENERAL Y CONTROL DE INGRESO */}
      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="font-extrabold text-lg text-zinc-900 dark:text-zinc-100">
            Agenda del Día & Control de Llegadas
          </h3>

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

        {/* Tabla Responsive */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 uppercase font-bold text-[10px]">
                <th className="py-3 px-3">Hora / Fecha</th>
                <th className="py-3 px-3">Paciente & Cédula</th>
                <th className="py-3 px-3">Contacto</th>
                <th className="py-3 px-3">Servicio / Doctor</th>
                <th className="py-3 px-3">Estado</th>
                <th className="py-3 px-3 text-right">Acción de Secretaría</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-zinc-400">
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

                  return (
                    <tr
                      key={apt.id}
                      className={`hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition ${
                        isEnSala ? 'bg-blue-50/30 dark:bg-blue-950/10' : ''
                      }`}
                    >
                      <td className="py-3.5 px-3">
                        <span className="font-bold text-zinc-900 dark:text-zinc-100 block">
                          {apt.appointment_time}
                        </span>
                        <span className="text-[10px] text-zinc-400">{apt.appointment_date}</span>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="font-bold text-zinc-900 dark:text-zinc-100 block">
                          {apt.patient_name}
                        </span>
                        <span className="text-[10px] text-zinc-400">{apt.patient_cedula}</span>
                      </td>

                      <td className="py-3.5 px-3">
                        <a
                          href={`tel:${apt.patient_phone}`}
                          className="text-[#02B2C6] hover:underline flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3 text-zinc-400" />
                          <span>{apt.patient_phone}</span>
                        </a>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200 block">
                          {service?.name || 'Consulta'}
                        </span>
                        <span className="text-[10px] text-zinc-400">{doctor?.name}</span>
                      </td>

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

                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Botón Marcar Ingreso (Check-in) */}
                          {!isEnSala && !isAtendida && !isCancelada && (
                            <button
                              onClick={() => confirmCheckIn(apt.id)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-white bg-[#02B2C6] hover:bg-[#029baa] shadow-sm flex items-center gap-1 transition"
                              title="El paciente llegó a la clínica"
                            >
                              <Clock className="w-3 h-3" />
                              <span>Check-in</span>
                            </button>
                          )}

                          {/* Botón Cancelar con Aviso */}
                          {!isCancelada && !isAtendida && (
                            <button
                              onClick={() => handleOpenCancelModal(apt)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900 transition"
                              title="Cancelar con aviso a WhatsApp"
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

      {/* MODAL OBLIGATORIO: CANCELACIÓN CON AVISO PREVIO */}
      {isCancelModalOpen && selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl p-6 sm:p-8">
            <button
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
    </div>
  )
}
