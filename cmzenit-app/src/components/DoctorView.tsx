'use client'

import React, { useState, useMemo } from 'react'
import { useCMZenit } from '@/context/CMZenitContext'
import { MedicalRecord, MedicalRecordExam, Appointment } from '@/types/database.types'
import { RecipeModal } from '@/components/RecipeModal'
import {
  Calendar,
  Clock,
  FileText,
  Plus,
  CheckCircle,
  Download,
  Stethoscope,
  Sparkles,
  Check,
  History,
  Search,
  UserPlus,
  X,
  Phone,
  Mail,
  User,
  AlertCircle,
  ChevronRight,
  ClipboardList,
  Printer,
} from 'lucide-react'

interface UnifiedPatient {
  id: string
  name: string
  cedula: string
  phone: string
  email?: string
  todayAppointment?: Appointment
  recordCount: number
  lastConsultDate?: string | null
}

export function DoctorView() {
  const {
    doctors,
    appointments,
    medicalRecords,
    systemUsers,
    createSystemUser,
    bookAppointment,
    addMedicalRecord,
    markAppointmentAttended,
  } = useCMZenit()

  // Especialista seleccionado
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(
    doctors[0]?.id || 'doc-1'
  )

  // Búsqueda y selección de paciente
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPatientCedula, setSelectedPatientCedula] = useState<string | null>(null)
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'todo' | 'historial' | 'evolucion'>('todo')
  const [recipeModalOpen, setRecipeModalOpen] = useState(false)
  const [selectedRecordForModal, setSelectedRecordForModal] = useState<MedicalRecord | null>(null)

  // Modal para agregar nuevo paciente
  const [isNewPatientModalOpen, setIsNewPatientModalOpen] = useState(false)
  const [newPatientName, setNewPatientName] = useState('')
  const [newPatientCedula, setNewPatientCedula] = useState('')
  const [newPatientPhone, setNewPatientPhone] = useState('')
  const [newPatientEmail, setNewPatientEmail] = useState('')
  const [newPatientInitialReason, setNewPatientInitialReason] = useState('')
  const [newPatientImmediateConsult, setNewPatientImmediateConsult] = useState(true)
  const [modalError, setModalError] = useState('')
  const [modalSuccess, setModalSuccess] = useState('')
  const [isSubmittingPatient, setIsSubmittingPatient] = useState(false)

  // Formulario de nueva evolución médica
  const [symptoms, setSymptoms] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [treatment, setTreatment] = useState('')
  const [recipeFileName, setRecipeFileName] = useState('')
  const [exams, setExams] = useState<MedicalRecordExam[]>([])
  const [newExamName, setNewExamName] = useState('')
  const [newExamResult, setNewExamResult] = useState('')
  const [newExamType, setNewExamType] = useState('Laboratorio')
  const [saveSuccess, setSaveSuccess] = useState(false)

  const currentDoctor = doctors.find((d) => d.id === selectedDoctorId) || doctors[0]
  const isEstetica = currentDoctor?.area === 'estetica'

  // Citas del doctor actual para hoy
  const doctorAppointments = useMemo(() => {
    return appointments.filter((a) => a.doctor_id === currentDoctor?.id)
  }, [appointments, currentDoctor?.id])

  // Compilar lista unificada de todos los pacientes en el sistema clínico
  const allPatients: UnifiedPatient[] = useMemo(() => {
    const patientMap = new Map<string, UnifiedPatient>()

    // 1. Desde systemUsers con rol paciente
    systemUsers
      .filter((u) => u.role === 'paciente')
      .forEach((u) => {
        const key = (u.cedula?.trim() || u.full_name.trim()).toUpperCase()
        patientMap.set(key, {
          id: u.id,
          name: u.full_name,
          cedula: u.cedula || 'V-S/C',
          phone: u.phone || 'Sin registrar',
          email: u.email,
          recordCount: 0,
        })
      })

    // 2. Desde appointments
    appointments.forEach((apt) => {
      const key = (apt.patient_cedula?.trim() || apt.patient_name.trim()).toUpperCase()
      const existing = patientMap.get(key)
      const isTodayForCurrentDoc =
        apt.doctor_id === currentDoctor?.id &&
        (apt.appointment_date === new Date().toISOString().split('T')[0] || apt.status === 'en_sala')

      if (existing) {
        if (!existing.phone || existing.phone === 'Sin registrar') {
          existing.phone = apt.patient_phone
        }
        if (isTodayForCurrentDoc && !existing.todayAppointment) {
          existing.todayAppointment = apt
        }
      } else {
        patientMap.set(key, {
          id: apt.patient_id || 'pat-' + apt.id,
          name: apt.patient_name,
          cedula: apt.patient_cedula,
          phone: apt.patient_phone,
          todayAppointment: isTodayForCurrentDoc ? apt : undefined,
          recordCount: 0,
        })
      }
    })

    // 3. Desde medicalRecords (contabilizar historias clínicas previas)
    medicalRecords.forEach((rec) => {
      const key = (rec.patient_cedula?.trim() || rec.patient_name.trim()).toUpperCase()
      const existing = patientMap.get(key)
      if (existing) {
        existing.recordCount += 1
        if (!existing.lastConsultDate || rec.admission_date > existing.lastConsultDate) {
          existing.lastConsultDate = rec.admission_date
        }
      } else {
        patientMap.set(key, {
          id: 'rec-pat-' + rec.id,
          name: rec.patient_name,
          cedula: rec.patient_cedula,
          phone: 'Registrado en historial',
          recordCount: 1,
          lastConsultDate: rec.admission_date,
        })
      }
    })

    return Array.from(patientMap.values())
  }, [systemUsers, appointments, medicalRecords, currentDoctor?.id])

  // Resultados del buscador de pacientes en tiempo real
  const filteredPatients = useMemo(() => {
    if (!searchTerm.trim()) return []
    const term = searchTerm.trim().toLowerCase()
    return allPatients.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.cedula.toLowerCase().includes(term) ||
        p.phone.toLowerCase().includes(term) ||
        (p.email && p.email.toLowerCase().includes(term))
    )
  }, [allPatients, searchTerm])

  // Paciente actualmente activo en el consultorio
  const activePatient: UnifiedPatient | null = useMemo(() => {
    // 1. Si hay una cédula seleccionada directamente
    if (selectedPatientCedula) {
      const found = allPatients.find(
        (p) =>
          p.cedula.toUpperCase() === selectedPatientCedula.toUpperCase() ||
          p.name.toLowerCase() === selectedPatientCedula.toLowerCase()
      )
      if (found) return found
    }

    // 2. Si hay una cita seleccionada de hoy
    if (selectedAppointmentId) {
      const apt = doctorAppointments.find((a) => a.id === selectedAppointmentId)
      if (apt) {
        const found = allPatients.find(
          (p) =>
            p.cedula.toUpperCase() === apt.patient_cedula.toUpperCase() ||
            p.name.toLowerCase() === apt.patient_name.toLowerCase()
        )
        if (found) return { ...found, todayAppointment: apt }
        return {
          id: apt.patient_id || apt.id,
          name: apt.patient_name,
          cedula: apt.patient_cedula,
          phone: apt.patient_phone,
          todayAppointment: apt,
          recordCount: 0,
        }
      }
    }

    // 3. Fallback inicial: Paciente en sala o primera cita de hoy con este doctor
    const enSalaApt = doctorAppointments.find((a) => a.status === 'en_sala')
    const firstApt = enSalaApt || doctorAppointments[0]
    if (firstApt) {
      const found = allPatients.find(
        (p) =>
          p.cedula.toUpperCase() === firstApt.patient_cedula.toUpperCase() ||
          p.name.toLowerCase() === firstApt.patient_name.toLowerCase()
      )
      if (found) return { ...found, todayAppointment: firstApt }
      return {
        id: firstApt.patient_id || firstApt.id,
        name: firstApt.patient_name,
        cedula: firstApt.patient_cedula,
        phone: firstApt.patient_phone,
        todayAppointment: firstApt,
        recordCount: 0,
      }
    }

    return null
  }, [selectedPatientCedula, selectedAppointmentId, allPatients, doctorAppointments])

  // Historial clínico completo del paciente seleccionado
  const patientRecords = useMemo(() => {
    if (!activePatient) return []
    return medicalRecords.filter(
      (r) =>
        (r.patient_cedula &&
          activePatient.cedula &&
          r.patient_cedula.trim().toUpperCase() === activePatient.cedula.trim().toUpperCase()) ||
        (r.patient_name &&
          activePatient.name &&
          r.patient_name.trim().toLowerCase() === activePatient.name.trim().toLowerCase())
    )
  }, [medicalRecords, activePatient])

  // Agregar examen al récipe
  const handleAddExam = () => {
    if (!newExamName.trim()) return
    setExams([
      ...exams,
      {
        name: newExamName,
        result: newExamResult || 'Pendiente de entrega',
        type: newExamType,
        date: new Date().toISOString().split('T')[0],
      },
    ])
    setNewExamName('')
    setNewExamResult('')
  }

  const handleRemoveExam = (index: number) => {
    setExams(exams.filter((_, i) => i !== index))
  }

  // Guardar evolución médica / ficha dermoestética
  const handleSaveMedicalRecord = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activePatient || !symptoms.trim() || !diagnosis.trim() || !treatment.trim()) return

    const lastRecord = patientRecords[0]
    const appointmentIdToUse = activePatient.todayAppointment?.id || 'direct-consult-' + Date.now()

    await addMedicalRecord({
      appointment_id: appointmentIdToUse,
      patient_cedula: activePatient.cedula,
      patient_name: activePatient.name,
      doctor_id: currentDoctor.id,
      area: currentDoctor.area,
      admission_date: new Date().toISOString().split('T')[0],
      previous_consult_date: lastRecord ? lastRecord.admission_date : null,
      symptoms,
      diagnosis,
      treatment,
      recipe_file_url: recipeFileName
        ? `https://cmzenit.com/recipies/${encodeURIComponent(recipeFileName)}.pdf`
        : null,
      exams_json: exams,
    })

    // Si el paciente tenía cita hoy, marcarla como atendida
    if (activePatient.todayAppointment) {
      await markAppointmentAttended(activePatient.todayAppointment.id)
    }

    setSaveSuccess(true)
    setTimeout(() => {
      setSaveSuccess(false)
      setSymptoms('')
      setDiagnosis('')
      setTreatment('')
      setRecipeFileName('')
      setExams([])
    }, 2500)
  }

  // Registrar nuevo paciente desde el consultorio
  const handleRegisterPatient = async (e: React.FormEvent) => {
    e.preventDefault()
    setModalError('')
    setModalSuccess('')

    if (!newPatientName.trim() || !newPatientCedula.trim() || !newPatientPhone.trim()) {
      setModalError('Por favor completa todos los campos obligatorios (*).')
      return
    }

    setIsSubmittingPatient(true)

    try {
      const emailToUse =
        newPatientEmail.trim() ||
        `paciente_${newPatientCedula.trim().replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}@cmzenit.com`

      const res = await createSystemUser({
        full_name: newPatientName.trim(),
        cedula: newPatientCedula.trim(),
        phone: newPatientPhone.trim(),
        email: emailToUse,
        role: 'paciente',
        password: 'paciente123',
      })

      if (!res.success && res.error && !res.error.includes('Ya existe')) {
        setModalError(res.error)
        setIsSubmittingPatient(false)
        return
      }

      // Si seleccionó abrir consulta inmediata para hoy
      if (newPatientImmediateConsult) {
        const bookRes = await bookAppointment({
          serviceId: 1,
          doctorId: currentDoctor.id,
          date: new Date().toISOString().split('T')[0],
          time: new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' }),
          patientName: newPatientName.trim(),
          patientCedula: newPatientCedula.trim(),
          patientPhone: newPatientPhone.trim(),
          area: currentDoctor.area,
        })

        if (bookRes.appointment) {
          setSelectedAppointmentId(bookRes.appointment.id)
        }
      }

      setSelectedPatientCedula(newPatientCedula.trim())
      setSearchTerm('')

      if (newPatientInitialReason.trim()) {
        setSymptoms(newPatientInitialReason.trim())
      }

      setModalSuccess('¡Paciente registrado con éxito! Abriendo su expediente clínico...')

      setTimeout(() => {
        setIsNewPatientModalOpen(false)
        setModalSuccess('')
        setNewPatientName('')
        setNewPatientCedula('')
        setNewPatientPhone('')
        setNewPatientEmail('')
        setNewPatientInitialReason('')
        setIsSubmittingPatient(false)
      }, 1200)
    } catch (err) {
      setModalError('Ocurrió un error inesperado al registrar el paciente.')
      setIsSubmittingPatient(false)
    }
  }

  return (
    <div className="space-y-8 pb-16">
      {/* HEADER MÉDICO & SELECTOR DE ESPECIALISTA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-3xl shadow-sm">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white shadow-md ${
              'bg-[#02B2C6] shadow-cyan-600/20'
            }`}
          >
            {isEstetica ? <Sparkles className="w-6 h-6" /> : <Stethoscope className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100">
                {currentDoctor?.name}
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                {currentDoctor?.mpps_license}
              </span>
            </div>
            <p className="text-xs text-zinc-500">{currentDoctor?.specialty_name}</p>
          </div>
        </div>

        {/* Acciones del Header: Selector y Botón Nuevo Paciente */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold uppercase text-zinc-400 hidden lg:inline">
              Especialista:
            </label>
            <select
              value={selectedDoctorId}
              onChange={(e) => {
                setSelectedDoctorId(e.target.value)
                setSelectedAppointmentId(null)
                setSelectedPatientCedula(null)
              }}
              className="py-2.5 px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02B2C6]"
            >
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} — {d.area === 'estetica' ? 'Estética' : 'Salud'}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => {
              setModalError('')
              setModalSuccess('')
              setIsNewPatientModalOpen(true)
            }}
            className="px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-[#02B2C6] hover:bg-[#029baa] shadow-md shadow-cyan-600/20 flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Nuevo Paciente</span>
          </button>
        </div>
      </div>

      {/* CUADRO PRINCIPAL: BUSCADOR & LISTA DE PACIENTES / EXPEDIENTE CLÍNICO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COLUMNA IZQUIERDA: BUSCADOR DE PACIENTES & CITAS DE HOY (4 COLS) */}
        <div className="lg:col-span-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm space-y-4">
          {/* BUSCADOR DE PACIENTES */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-[#02B2C6]" />
                Buscador de Pacientes
              </span>
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="text-[11px] text-zinc-400 hover:text-zinc-600 flex items-center gap-0.5"
                >
                  <X className="w-3 h-3" /> Limpiar
                </button>
              )}
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Buscar por nombre o cédula..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#02B2C6]"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* VISTA SEGÚN SI HAY BÚSQUEDA ACTIVA O CITAS DE HOY */}
          {searchTerm.trim() ? (
            /* LISTA DE RESULTADOS DE BÚSQUEDA */
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100">
                  Resultados encontrados ({filteredPatients.length})
                </span>
                <span className="text-[10px] text-zinc-400">Archivo General</span>
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {filteredPatients.length === 0 ? (
                  <div className="py-8 text-center space-y-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-4 border border-dashed border-zinc-200 dark:border-zinc-700">
                    <p className="text-xs text-zinc-500">
                      No se encontró ningún paciente con &ldquo;<strong>{searchTerm}</strong>&rdquo;.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setNewPatientName(searchTerm)
                        setModalError('')
                        setModalSuccess('')
                        setIsNewPatientModalOpen(true)
                      }}
                      className="px-3 py-2 rounded-xl text-xs font-bold text-white bg-[#02B2C6] hover:bg-[#029baa] shadow-sm inline-flex items-center gap-1.5"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Registrar como Nuevo Paciente</span>
                    </button>
                  </div>
                ) : (
                  filteredPatients.map((patient) => {
                    const isSelected =
                      activePatient?.cedula.toUpperCase() === patient.cedula.toUpperCase()
                    const hasTodayApt = Boolean(patient.todayAppointment)

                    return (
                      <div
                        key={patient.id + patient.cedula}
                        onClick={() => {
                          setSelectedPatientCedula(patient.cedula)
                          if (patient.todayAppointment) {
                            setSelectedAppointmentId(patient.todayAppointment.id)
                          } else {
                            setSelectedAppointmentId(null)
                          }
                        }}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-1.5 ${
                          isSelected
                            ? 'border-[#02B2C6] bg-cyan-50/50 dark:bg-cyan-950/30 shadow-sm'
                            : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <div>
                            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block">
                              {patient.name}
                            </span>
                            <span className="text-[10px] text-zinc-400 font-medium">
                              {patient.cedula} • {patient.phone}
                            </span>
                          </div>
                          <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-[#02B2C6]' : 'text-zinc-300'}`} />
                        </div>

                        <div className="flex items-center justify-between pt-1 text-[10px]">
                          {hasTodayApt ? (
                            <span className="font-bold text-cyan-700 dark:text-cyan-300 bg-cyan-100 dark:bg-cyan-950/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Cita Hoy: {patient.todayAppointment?.appointment_time}
                            </span>
                          ) : patient.recordCount > 0 ? (
                            <span className="font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              {patient.recordCount} consulta(s) previa(s)
                            </span>
                          ) : (
                            <span className="text-zinc-400 italic">Sin consultas previas</span>
                          )}

                          <span className="text-zinc-400 font-medium">Ver Historial</span>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          ) : (
            /* LISTA DE PACIENTES CITADOS PARA HOY */
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-zinc-100 dark:border-zinc-800">
                <h3 className="font-extrabold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#02B2C6]" />
                  Pacientes Citados para Hoy
                </h3>
                <span className="text-[10px] font-bold text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                  {doctorAppointments.length} cita(s)
                </span>
              </div>

              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {doctorAppointments.length === 0 ? (
                  <div className="py-8 text-center text-zinc-400 text-xs bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl p-4 border border-dashed border-zinc-200 dark:border-zinc-800">
                    <p className="mb-2">No hay pacientes citados para hoy con este especialista.</p>
                    <p className="text-[11px] text-zinc-500">
                      Puedes buscar un paciente en el archivo superior o registrar uno nuevo.
                    </p>
                  </div>
                ) : (
                  doctorAppointments.map((apt) => {
                    const isSelected = activePatient?.todayAppointment?.id === apt.id
                    const isEnSala = apt.status === 'en_sala'
                    const isAtendida = apt.status === 'atendida'

                    return (
                      <div
                        key={apt.id}
                        onClick={() => {
                          setSelectedAppointmentId(apt.id)
                          setSelectedPatientCedula(apt.patient_cedula)
                        }}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                          isSelected
                            ? 'border-[#02B2C6] bg-cyan-50/50 dark:bg-cyan-950/20 shadow-sm'
                            : isEnSala
                            ? 'border-blue-400/80 bg-blue-50/40 dark:bg-blue-950/20 hover:border-blue-500'
                            : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <div>
                            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block">
                              {apt.patient_name}
                            </span>
                            <span className="text-[10px] text-zinc-400">{apt.patient_cedula}</span>
                          </div>
                          <span className="text-xs font-extrabold text-zinc-700 dark:text-zinc-300">
                            {apt.appointment_time}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          {isEnSala ? (
                            <span className="text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                              <Clock className="w-3 h-3" />
                              En Sala (Check-in: {apt.check_in_time})
                            </span>
                          ) : isAtendida ? (
                            <span className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              Atendido
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-zinc-400">
                              {apt.status === 'solicitud_cancelacion'
                                ? 'Sol. Cancelación'
                                : 'Confirmada'}
                            </span>
                          )}

                          <span className="text-[10px] text-zinc-400">Abrir Expediente</span>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}

          {/* BOTÓN RÁPIDO PARA AGREGAR NUEVO PACIENTE */}
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => {
                setModalError('')
                setModalSuccess('')
                setIsNewPatientModalOpen(true)
              }}
              className="w-full py-2.5 px-3 rounded-xl border border-dashed border-[#02B2C6] text-[#02B2C6] hover:bg-cyan-50 dark:hover:bg-cyan-950/30 text-xs font-bold flex items-center justify-center gap-1.5 transition"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Registrar Nuevo Paciente</span>
            </button>
          </div>
        </div>

        {/* COLUMNA DERECHA: EXPEDIENTE, HISTORIAL CLÍNICO Y NUEVA EVOLUCIÓN (8 COLS) */}
        <div className="lg:col-span-8 space-y-6">
          {activePatient ? (
            <>
              {/* FICHA RESUMEN DEL PACIENTE ACTIVO */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#02B2C6] to-cyan-400 text-white font-black text-base flex items-center justify-center shadow-md shadow-cyan-600/20">
                      {activePatient.name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-zinc-100">
                          {activePatient.name}
                        </h2>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                          {activePatient.cedula}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-zinc-500 pt-0.5 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-[#02B2C6]" />
                          {activePatient.phone}
                        </span>
                        {activePatient.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-zinc-400" />
                            {activePatient.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Estado de la cita o Badge de origen */}
                  <div className="flex flex-col sm:items-end gap-1">
                    {activePatient.todayAppointment ? (
                      <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 p-2.5 rounded-xl text-left sm:text-right">
                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase block">
                          Cita Pautada Hoy ({activePatient.todayAppointment.appointment_time})
                        </span>
                        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                          {activePatient.todayAppointment.check_in_time
                            ? `Check-in: ${activePatient.todayAppointment.check_in_time}`
                            : 'Estado: ' + activePatient.todayAppointment.status.toUpperCase()}
                        </span>
                      </div>
                    ) : (
                      <div className="bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-xl text-left sm:text-right">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase block">
                          Expediente de Archivo Clínico
                        </span>
                        <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                          {patientRecords.length} consulta(s) registradas
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* SELECTOR DE VISTA EN EXPEDIENTE */}
                <div className="flex items-center gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setActiveTab('todo')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      activeTab === 'todo'
                        ? 'bg-[#02B2C6] text-white shadow-sm'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200'
                    }`}
                  >
                    Vista Completa
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('historial')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      activeTab === 'historial'
                        ? 'bg-[#02B2C6] text-white shadow-sm'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200'
                    }`}
                  >
                    <History className="w-3.5 h-3.5" />
                    Historial Clínico ({patientRecords.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('evolucion')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      activeTab === 'evolucion'
                        ? 'bg-[#02B2C6] text-white shadow-sm'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200'
                    }`}
                  >
                    <ClipboardList className="w-3.5 h-3.5" />
                    Nueva Evolución
                  </button>
                </div>
              </div>

              {/* SECCIÓN 1: HISTORIAL CLÍNICO PREVIO */}
              {(activeTab === 'todo' || activeTab === 'historial') && (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                    <h3 className="font-extrabold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <History className="w-4 h-4 text-[#02B2C6]" />
                      Historial Clínico & Antecedentes ({patientRecords.length} consulta(s))
                    </h3>
                    <span className="text-[11px] font-semibold text-zinc-400">
                      {activePatient.name} — {activePatient.cedula}
                    </span>
                  </div>

                  {patientRecords.length === 0 ? (
                    <div className="p-6 text-center space-y-2 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
                      <AlertCircle className="w-6 h-6 text-zinc-400 mx-auto" />
                      <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                        Primera consulta registrada en CMZenit para este paciente.
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        No cuenta con antecedentes o evoluciones médicas previas. Completa el formulario inferior para registrar su primera historia médica.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {patientRecords.map((rec, index) => {
                        const recDoctor = doctors.find((d) => d.id === rec.doctor_id)

                        return (
                          <div
                            key={rec.id || index}
                            className="p-4 sm:p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-800 space-y-3 text-xs"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] pb-2 border-b border-zinc-200/60 dark:border-zinc-700/60">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-zinc-900 dark:text-zinc-100">
                                  Fecha de Atención: {rec.admission_date}
                                </span>
                                <span className="text-zinc-400">•</span>
                                <span className="text-zinc-600 dark:text-zinc-300 font-medium">
                                  {recDoctor ? recDoctor.name : 'Médico Especialista CMZenit'} (
                                  {rec.area === 'estetica' ? 'Dermoestética' : 'Salud'})
                                </span>
                              </div>

                              {rec.recipe_file_url && (
                                <a
                                  href={rec.recipe_file_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[#02B2C6] font-bold hover:underline flex items-center gap-1"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>Descargar Récipe PDF</span>
                                </a>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <strong className="text-zinc-500 uppercase tracking-wider text-[10px] block">
                                  Motivo de Consulta / Síntomas:
                                </strong>
                                <p className="text-zinc-800 dark:text-zinc-200 leading-relaxed bg-white dark:bg-zinc-800 p-2.5 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60">
                                  {rec.symptoms}
                                </p>
                              </div>

                              <div className="space-y-1">
                                <strong className="text-zinc-500 uppercase tracking-wider text-[10px] block">
                                  Diagnóstico Médico:
                                </strong>
                                <p className="text-zinc-900 dark:text-zinc-100 font-semibold leading-relaxed bg-white dark:bg-zinc-800 p-2.5 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60">
                                  {rec.diagnosis}
                                </p>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <strong className="text-zinc-500 uppercase tracking-wider text-[10px] block">
                                Tratamiento & Prescripción Posológica:
                              </strong>
                              <p className="text-zinc-800 dark:text-zinc-200 leading-relaxed bg-white dark:bg-zinc-800 p-2.5 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60">
                                {rec.treatment}
                              </p>
                            </div>

                            {/* Exámenes y laboratorios vinculados a esta consulta */}
                            {rec.exams_json && rec.exams_json.length > 0 && (
                              <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60 space-y-1.5">
                                <strong className="text-zinc-500 uppercase tracking-wider text-[10px] block">
                                  Exámenes & Estudios Solicitados ({rec.exams_json.length}):
                                </strong>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {rec.exams_json.map((ex, exIdx) => (
                                    <div
                                      key={exIdx}
                                      className="p-2 rounded-xl bg-white dark:bg-zinc-800 text-[11px] border border-zinc-200/60 dark:border-zinc-700/60 flex items-center justify-between"
                                    >
                                      <span>
                                        <strong>{ex.name}</strong> ({ex.type || 'Laboratorio'})
                                      </span>
                                      <span className="text-zinc-500 text-[10px]">
                                        {ex.result || 'Pendiente'}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* SECCIÓN 2: FORMULARIO DE NUEVA EVOLUCIÓN MÉDICA / FICHA DERMOESTÉTICA */}
              {(activeTab === 'todo' || activeTab === 'evolucion') && (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                    <div>
                      <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100">
                        {isEstetica
                          ? 'Registrar Ficha Dermoestética'
                          : 'Registrar Evolución Médica & Récipe'}
                      </h3>
                      <p className="text-xs text-zinc-400">
                        {activePatient.todayAppointment
                          ? 'Al guardar, la cita del día pasará automáticamente a estado "Atendida".'
                          : 'Se agregará una nueva consulta directamente al historial clínico de este paciente.'}
                      </p>
                    </div>
                  </div>

                  {saveSuccess && (
                    <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 shrink-0" />
                      <span>
                        ¡Evolución guardada con éxito en el historial clínico del paciente!
                      </span>
                    </div>
                  )}

                  <form onSubmit={handleSaveMedicalRecord} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">
                        {isEstetica
                          ? 'Motivo de Consulta / Biotipo Cutáneo *'
                          : 'Síntomas / Motivo de Consulta *'}
                      </label>
                      <textarea
                        required
                        rows={2}
                        placeholder={
                          isEstetica
                            ? 'Evaluación dermoestética, líneas de expresión, deshidratación...'
                            : 'Descripción de síntomas, dolor, presión arterial basal...'
                        }
                        value={symptoms}
                        onChange={(e) => setSymptoms(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02B2C6]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">
                        Diagnóstico Médico / Juicio Clínico *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Diagnóstico concluyente..."
                        value={diagnosis}
                        onChange={(e) => setDiagnosis(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02B2C6]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">
                        Tratamiento, Prescripción & Posología *
                      </label>
                      <textarea
                        required
                        rows={3}
                        placeholder="Medicamentos, dosis diaria, duración del tratamiento o rutina de skincare..."
                        value={treatment}
                        onChange={(e) => setTreatment(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02B2C6]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">
                        Adjuntar Nombre / Enlace de Récipe PDF (Opcional)
                      </label>
                      <div className="relative">
                        <FileText className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          placeholder="Ej. recipe_carlos_mendoza_noviembre"
                          value={recipeFileName}
                          onChange={(e) => setRecipeFileName(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02B2C6]"
                        />
                      </div>
                    </div>

                    {/* Sección: Exámenes y Laboratorios Adjuntos */}
                    <div className="space-y-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">
                        Subir / Indicar Exámenes de Laboratorio e Imagenología
                      </span>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                        <input
                          type="text"
                          placeholder="Nombre del examen (ej. Perfil 20)"
                          value={newExamName}
                          onChange={(e) => setNewExamName(e.target.value)}
                          className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#02B2C6]"
                        />
                        <input
                          type="text"
                          placeholder="Resultado o indicación"
                          value={newExamResult}
                          onChange={(e) => setNewExamResult(e.target.value)}
                          className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#02B2C6]"
                        />
                        <select
                          value={newExamType}
                          onChange={(e) => setNewExamType(e.target.value)}
                          className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#02B2C6]"
                        >
                          <option value="Laboratorio">Laboratorio</option>
                          <option value="Imagenología">Imagenología</option>
                          <option value="Dermatoscopia">Dermatoscopia</option>
                          <option value="Ecocardiograma">Ecocardiograma</option>
                          <option value="Biopsia">Biopsia</option>
                        </select>
                        <button
                          type="button"
                          onClick={handleAddExam}
                          className="px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center gap-1 transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Agregar
                        </button>
                      </div>

                      {exams.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          {exams.map((ex, idx) => (
                            <div
                              key={idx}
                              className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 flex items-center justify-between text-xs"
                            >
                              <span>
                                <strong>{ex.name}</strong> ({ex.type}): {ex.result}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveExam(idx)}
                                className="text-rose-500 text-[11px] font-bold hover:underline"
                              >
                                Eliminar
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-[#02B2C6] hover:bg-[#029baa] shadow-md shadow-cyan-600/20 transition active:scale-95 mt-2 cursor-pointer"
                    >
                      Guardar Evolución & Completar Consulta
                    </button>
                  </form>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-12 text-center text-zinc-400 text-sm space-y-3">
              <User className="w-10 h-10 text-zinc-300 mx-auto" />
              <p className="font-semibold text-zinc-600 dark:text-zinc-300">
                Ningún paciente seleccionado
              </p>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Selecciona un paciente en la lista lateral, usa el buscador para encontrar un historial, o haz clic en <strong>+ Nuevo Paciente</strong> para registrar uno.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL PARA AGREGAR NUEVO PACIENTE */}
      {isNewPatientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 sm:p-7 space-y-5 relative max-h-[90vh] overflow-y-auto">
            {/* Header del Modal */}
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-[#02B2C6] flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-zinc-900 dark:text-zinc-100">
                    Registrar Nuevo Paciente
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Consultorio de {currentDoctor?.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewPatientModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mensajes de Feedback */}
            {modalError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            {modalSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{modalSuccess}</span>
              </div>
            )}

            {/* Formulario */}
            <form onSubmit={handleRegisterPatient} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">
                  Nombre Completo del Paciente *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Ana Victoria Torres"
                  value={newPatientName}
                  onChange={(e) => setNewPatientName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02B2C6]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">
                    Cédula de Identidad *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. V-24.890.123"
                    value={newPatientCedula}
                    onChange={(e) => setNewPatientCedula(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02B2C6]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">
                    Teléfono / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Ej. +58 412 1234567"
                    value={newPatientPhone}
                    onChange={(e) => setNewPatientPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02B2C6]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">
                  Correo Electrónico (Para envío de récipes digitales)
                </label>
                <input
                  type="email"
                  placeholder="paciente@correo.com"
                  value={newPatientEmail}
                  onChange={(e) => setNewPatientEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02B2C6]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">
                  Motivo de Consulta Inicial (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej. Chequeo preventivo, dolor precordial leve, evaluación facial..."
                  value={newPatientInitialReason}
                  onChange={(e) => setNewPatientInitialReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02B2C6]"
                />
              </div>

              {/* Checkbox de Consulta Inmediata */}
              <div className="p-3 rounded-xl bg-cyan-50/60 dark:bg-cyan-950/30 border border-cyan-100 dark:border-cyan-900/60 flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="immediateConsult"
                  checked={newPatientImmediateConsult}
                  onChange={(e) => setNewPatientImmediateConsult(e.target.checked)}
                  className="mt-0.5 rounded text-[#02B2C6] focus:ring-[#02B2C6] cursor-pointer"
                />
                <label
                  htmlFor="immediateConsult"
                  className="text-xs text-zinc-700 dark:text-zinc-300 font-medium cursor-pointer"
                >
                  <strong>Abrir consulta inmediata hoy:</strong> Registrar turno en este consultorio y abrir su expediente clínico ahora.
                </label>
              </div>

              {/* Botones de acción */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsNewPatientModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPatient}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#02B2C6] hover:bg-[#029baa] shadow-md shadow-cyan-600/20 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingPatient ? 'Registrando...' : 'Guardar y Abrir Expediente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL DE RÉCIPE MÉDICO OFICIAL IMPRIMIBLE */}
      <RecipeModal
        isOpen={recipeModalOpen}
        onClose={() => setRecipeModalOpen(false)}
        record={selectedRecordForModal}
        doctor={
          doctors.find((d) => d.id === selectedRecordForModal?.doctor_id) || currentDoctor
        }
        patientName={activePatient?.name}
        patientCedula={activePatient?.cedula}
        patientPhone={activePatient?.phone}
      />
    </div>
  )
}
