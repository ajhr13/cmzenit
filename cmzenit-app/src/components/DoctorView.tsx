'use client'

import React, { useState, useMemo, useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useCMZenit } from '@/context/CMZenitContext'
import { MedicalRecord, MedicalRecordExam, Appointment, VitalSigns, MedicalRecordAttachment } from '@/types/database.types'
import { RecipeModal } from '@/components/RecipeModal'
import { ImageLightboxModal } from '@/components/ImageLightboxModal'
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
  Users,
  AlertCircle,
  ChevronRight,
  ClipboardList,
  Printer,
  Activity,
  Heart,
  Thermometer,
  Weight,
  Paperclip,
  UploadCloud,
  AlertTriangle,
  Eye,
  Trash2,
  ShieldAlert,
  Camera,
  Image as ImageIcon,
  ZoomIn,
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
    currentUser,
    doctors,
    appointments,
    medicalRecords,
    systemUsers,
    createSystemUser,
    bookAppointment,
    addMedicalRecord,
    markAppointmentAttended,
    patientAllergiesMap,
    updatePatientAllergies,
    uploadMedicalAttachment,
    getPatientProfile,
  } = useCMZenit()

  // Si el usuario autenticado es doctor, asociarlo directamente a su perfil médico
  const loggedDoctor = useMemo(() => {
    if (currentUser?.role === 'doctor') {
      const cleanUserName = currentUser.name.toLowerCase().replace(/dr\.?|dra\.?|\(especialista\)|\(doctor\)/gi, '').trim()
      return (
        doctors.find((d) => {
          if (currentUser.id && d.user_id === currentUser.id) return true
          const cleanDocName = d.name.toLowerCase().replace(/dr\.?|dra\.?/gi, '').trim()
          return cleanDocName.includes(cleanUserName) || cleanUserName.includes(cleanDocName)
        }) || doctors[0]
      )
    }
    return null
  }, [currentUser, doctors])

  // Especialista seleccionado
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(
    loggedDoctor?.id || doctors[0]?.id || 'doc-1'
  )

  useEffect(() => {
    if (loggedDoctor?.id) {
      setSelectedDoctorId(loggedDoctor.id)
    }
  }, [loggedDoctor?.id])

  // Búsqueda y selección de paciente
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPatientCedula, setSelectedPatientCedula] = useState<string | null>(null)
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams?.get('tab') as 'agenda' | 'sala' | 'consulta' | 'archivo' | 'nuevo-paciente' | null
  const [activeTab, setActiveTab] = useState<'agenda' | 'sala' | 'consulta' | 'archivo' | 'nuevo-paciente'>('agenda')

  useEffect(() => {
    if (tabParam && ['agenda', 'sala', 'consulta', 'archivo', 'nuevo-paciente'].includes(tabParam)) {
      setActiveTab(tabParam)
      if (tabParam === 'nuevo-paciente') {
        setIsNewPatientModalOpen(true)
      }
    }
  }, [tabParam])

  const handleTabChange = (newTab: 'agenda' | 'sala' | 'consulta' | 'archivo' | 'nuevo-paciente') => {
    setActiveTab(newTab)
    router.replace(`/doctor?tab=${newTab}`, { scroll: false })
  }
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

  // Módulo de Signos Vitales
  const [bloodPressure, setBloodPressure] = useState('')
  const [heartRate, setHeartRate] = useState('')
  const [respiratoryRate, setRespiratoryRate] = useState('')
  const [temperature, setTemperature] = useState('')
  const [oxygenSaturation, setOxygenSaturation] = useState('')
  const [weightKg, setWeightKg] = useState<number | ''>('')
  const [heightCm, setHeightCm] = useState<number | ''>('')

  // Cálculo Automático de IMC
  const calculatedBmi = useMemo(() => {
    if (typeof weightKg === 'number' && typeof heightCm === 'number' && weightKg > 0 && heightCm > 0) {
      const heightM = heightCm / 100
      return Number((weightKg / (heightM * heightM)).toFixed(1))
    }
    return null
  }, [weightKg, heightCm])

  // Módulo de Alergias Críticas
  const [newAllergyInput, setNewAllergyInput] = useState('')
  const [showAllergyInput, setShowAllergyInput] = useState(false)

  // Módulo de Cámara y Archivos Adjuntos / Récipes
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [attachmentCategory, setAttachmentCategory] = useState<'recipe' | 'informe' | 'estudio' | 'foto'>('recipe')
  const [attachments, setAttachments] = useState<MedicalRecordAttachment[]>([])
  const [isUploadingFile, setIsUploadingFile] = useState(false)

  // Visor Lightbox para fotos de récipe, informes e imágenes
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)
  const [lightboxTitle, setLightboxTitle] = useState<string>('')
  const [lightboxType, setLightboxType] = useState<string>('')

  // Control de vista móvil para el Archivo de Historias
  const [mobileArchiveView, setMobileArchiveView] = useState<'list' | 'detail'>('list')

  const currentDoctor = (currentUser?.role === 'doctor' && loggedDoctor)
    ? loggedDoctor
    : (doctors.find((d) => d.id === selectedDoctorId) || doctors[0])
  const isEstetica = currentDoctor?.area === 'estetica'

  // Citas del doctor actual para hoy
  const waitingPatients = useMemo(() => {
    return appointments.filter((a) => a.doctor_id === currentDoctor?.id && a.status === 'en_sala')
  }, [appointments, currentDoctor?.id])

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

  // Perfil clínico completo del paciente activo (cédula, patologías, peso, altura, etc.)
  const activePatientProfile = useMemo(() => {
    if (!activePatient?.cedula) return null
    return getPatientProfile(activePatient.cedula)
  }, [activePatient?.cedula, getPatientProfile])

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

  // Subida de archivos médicos, capturas de cámara y dermoestética
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isCameraCapture = false) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploadingFile(true)
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const uploaded = await uploadMedicalAttachment(file)

        // Asignar prefijo descriptivo según la categoría seleccionada
        let catLabel = 'Récipe'
        if (attachmentCategory === 'informe') catLabel = 'Informe'
        else if (attachmentCategory === 'foto') catLabel = 'Foto Clínica'
        else if (attachmentCategory === 'estudio') catLabel = 'Estudio'

        const timeStamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        const displayName = isCameraCapture
          ? `[${catLabel} Cámara] ${timeStamp}`
          : `${catLabel}: ${file.name}`

        setAttachments((prev) => [
          ...prev,
          {
            name: displayName,
            file_url: uploaded.url,
            file_type: uploaded.type,
            size_kb: uploaded.size_kb,
            uploaded_at: new Date().toISOString().split('T')[0],
          },
        ])
      }
    } catch (err) {
      console.warn('Error subiendo archivo médico:', err)
    } finally {
      setIsUploadingFile(false)
      if (e.target) e.target.value = ''
    }
  }

  const handleRemoveAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index))
  }

  const handleAddAllergy = () => {
    if (!activePatient || !newAllergyInput.trim()) return
    const key = activePatient.cedula.trim().toUpperCase()
    const current = patientAllergiesMap[key] || []
    if (!current.includes(newAllergyInput.trim())) {
      updatePatientAllergies(activePatient.cedula, [...current, newAllergyInput.trim()])
    }
    setNewAllergyInput('')
    setShowAllergyInput(false)
  }

  const handleRemoveAllergy = (allergyToRemove: string) => {
    if (!activePatient) return
    const key = activePatient.cedula.trim().toUpperCase()
    const current = patientAllergiesMap[key] || []
    updatePatientAllergies(activePatient.cedula, current.filter((a) => a !== allergyToRemove))
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
        : (attachments.find(a => a.name.toLowerCase().includes('récipe') || a.name.toLowerCase().includes('recipe'))?.file_url || null),
      exams_json: exams,
      vital_signs: {
        blood_pressure: bloodPressure.trim() || undefined,
        heart_rate: heartRate.trim() ? `${heartRate.trim()} lpm` : undefined,
        respiratory_rate: respiratoryRate.trim() ? `${respiratoryRate.trim()} rpm` : undefined,
        temperature: temperature.trim() ? `${temperature.trim()} °C` : undefined,
        oxygen_saturation: oxygenSaturation.trim() ? `${oxygenSaturation.trim()} %` : undefined,
        weight_kg: typeof weightKg === 'number' ? weightKg : undefined,
        height_cm: typeof heightCm === 'number' ? heightCm : undefined,
        bmi: calculatedBmi || undefined,
      },
      allergies: (activePatient ? patientAllergiesMap[activePatient.cedula.trim().toUpperCase()] : []) || [],
      attachments: attachments,
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
      setBloodPressure('')
      setHeartRate('')
      setRespiratoryRate('')
      setTemperature('')
      setOxygenSaturation('')
      setWeightKg('')
      setHeightCm('')
      setAttachments([])
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
      {/* HEADER MÉDICO & INFORMACIÓN DEL CONSULTORIO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center font-bold text-white shadow-md bg-[#02B2C6] shadow-cyan-600/20 shrink-0"
          >
            {isEstetica ? <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" /> : <Stethoscope className="w-5 h-5 sm:w-6 sm:h-6" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 truncate">
                {currentDoctor?.name}
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 shrink-0">
                {currentDoctor?.mpps_license}
              </span>
            </div>
            <p className="text-xs text-zinc-500 truncate">{currentDoctor?.specialty_name}</p>
          </div>
        </div>

        {/* Acciones del Header: Botón Nuevo Paciente */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {currentUser?.role !== 'doctor' && (
            <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
              <label className="text-[11px] font-bold uppercase text-zinc-400 hidden lg:inline">
                Especialista:
              </label>
              <select
                value={selectedDoctorId}
                onChange={(e) => {
                  setSelectedDoctorId(e.target.value)
                  setSelectedAppointmentId(null)
                  setSelectedPatientCedula(null)
                }}
                className="w-full sm:w-auto py-2.5 px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02B2C6]"
              >
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} — {d.area === 'estetica' ? 'Estética' : 'Salud'}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setModalError('')
              setModalSuccess('')
              setIsNewPatientModalOpen(true)
            }}
            className="w-full sm:w-auto justify-center px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-[#02B2C6] hover:bg-[#029baa] shadow-md shadow-cyan-600/20 flex items-center gap-1.5 transition active:scale-95 cursor-pointer shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Nuevo Paciente</span>
          </button>
        </div>
      </div>

      {/* 1. SUB-MENU: AGENDA DE HOY (AISLADO) */}
      {activeTab === 'agenda' && (
        <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm space-y-4 sm:space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#02B2C6]" />
                <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100">
                  Agenda Médica de Hoy — {currentDoctor?.name}
                </h2>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Citas y turnos programados en este consultorio para la jornada actual
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-cyan-50 dark:bg-cyan-950 text-[#02B2C6]">
              {doctorAppointments.length} Pacientes en Agenda
            </span>
          </div>

          {doctorAppointments.length === 0 ? (
            <div className="py-12 text-center text-zinc-400 space-y-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl p-6 border border-dashed border-zinc-200 dark:border-zinc-800">
              <Calendar className="w-10 h-10 text-zinc-300 mx-auto" />
              <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                No hay citas pautadas para hoy con este especialista.
              </p>
              <p className="text-[11px] text-zinc-400 max-w-sm mx-auto">
                Puedes buscar pacientes en el <strong>Archivo de Historias</strong> o hacer clic en <strong>+ Nuevo Paciente</strong> para abrir una consulta espontánea.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {doctorAppointments.map((apt) => {
                const isSelected = activePatient?.todayAppointment?.id === apt.id
                const isEnSala = apt.status === 'en_sala'
                const isAtendida = apt.status === 'atendida'

                return (
                  <div
                    key={apt.id}
                    className={`p-4 rounded-2xl border transition-all space-y-3 ${
                      isSelected
                        ? 'border-[#02B2C6] bg-cyan-50/40 dark:bg-cyan-950/20 shadow-sm'
                        : isEnSala
                        ? 'border-emerald-300 dark:border-emerald-900 bg-emerald-50/30 dark:bg-emerald-950/20'
                        : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 block">
                          {apt.patient_name}
                        </span>
                        <span className="text-[11px] text-zinc-400 font-medium">
                          {apt.patient_cedula} • {apt.patient_phone}
                        </span>
                      </div>
                      <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#02B2C6]" />
                        {apt.appointment_time}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-zinc-100 dark:border-zinc-800">
                      <div>
                        {isEnSala ? (
                          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                            <Clock className="w-3 h-3" />
                            En Sala ({apt.check_in_time})
                          </span>
                        ) : isAtendida ? (
                          <span className="text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Check className="w-3 h-3 text-emerald-600" />
                            Atendida
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-zinc-400">
                            Confirmada
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAppointmentId(apt.id)
                          setSelectedPatientCedula(apt.patient_cedula)
                          handleTabChange('consulta')
                        }}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-[#02B2C6] hover:bg-[#029baa] shadow-sm transition active:scale-95 cursor-pointer"
                      >
                        Pasar a Consulta →
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}

      {/* 2. SUB-MENU: EN SALA DE ESPERA (AISLADO) */}
      {activeTab === 'sala' && (
        <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm space-y-4 sm:space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100">
                  Pacientes Presentes en Sala de Espera
                </h2>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Pacientes que realizaron Check-In en recepción y están listos para ser atendidos
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
              {waitingPatients.length} En Espera
            </span>
          </div>

          {waitingPatients.length === 0 ? (
            <div className="py-12 text-center text-zinc-400 space-y-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl p-6 border border-dashed border-zinc-200 dark:border-zinc-800">
              <Users className="w-10 h-10 text-zinc-300 mx-auto" />
              <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                No hay pacientes esperando en sala en este momento.
              </p>
              <p className="text-[11px] text-zinc-400 max-w-sm mx-auto">
                Cuando recepción confirme la llegada de un paciente para su turno, aparecerá aquí con alerta sonora y visual.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {waitingPatients.map((apt) => {
                const pKey = apt.patient_cedula.trim().toUpperCase()
                const allergies = patientAllergiesMap[pKey] || []

                return (
                  <div
                    key={apt.id}
                    className="p-5 rounded-2xl border-2 border-emerald-300 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-base font-black text-zinc-900 dark:text-zinc-100 block">
                          {apt.patient_name}
                        </span>
                        <span className="text-xs text-zinc-500">
                          {apt.patient_cedula} • {apt.patient_phone}
                        </span>
                      </div>
                      <span className="text-xs font-extrabold px-2.5 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 animate-pulse">
                        Check-In: {apt.check_in_time || apt.appointment_time}
                      </span>
                    </div>

                    {allergies.length > 0 && (
                      <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-[11px] text-rose-800 dark:text-rose-200 font-bold flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>Alergias: {allergies.join(', ')}</span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAppointmentId(apt.id)
                        setSelectedPatientCedula(apt.patient_cedula)
                        handleTabChange('consulta')
                      }}
                      className="w-full py-3 rounded-xl text-xs font-bold text-white bg-[#02B2C6] hover:bg-[#029baa] shadow-md shadow-cyan-600/20 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Stethoscope className="w-4 h-4" />
                      <span>Atender Ahora en Consultorio</span>
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}

      {/* 3. SUB-MENU: ATENCIÓN MÉDICA & CONSULTA (AISLADO) */}
      {activeTab === 'consulta' && (
        <section className="space-y-6">
          {activePatient ? (
            <>
              {/* FICHA RESUMEN DEL PACIENTE ACTIVO */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm space-y-4">
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

                  {/* Acciones y enlace al archivo previo */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleTabChange('archivo')}
                      className="px-3 py-2 rounded-xl text-xs font-bold border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 flex items-center gap-1.5 transition"
                    >
                      <History className="w-3.5 h-3.5 text-[#02B2C6]" />
                      <span>Ver Historial Previo ({patientRecords.length})</span>
                    </button>
                  </div>
                </div>

                {/* ALERTA CRÍTICA DE ALERGIAS FARMACOLÓGICAS */}
                {(() => {
                  const pKey = activePatient.cedula.trim().toUpperCase()
                  const allergies = patientAllergiesMap[pKey] || []
                  const hasAllergies = allergies.length > 0

                  return (
                    <div
                      className={`p-3.5 rounded-2xl border transition ${
                        hasAllergies
                          ? 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-300 dark:border-rose-900/70'
                          : 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-white ${
                              hasAllergies ? 'bg-rose-600 shadow-sm' : 'bg-emerald-600'
                            }`}
                          >
                            <ShieldAlert className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[10px] font-black uppercase tracking-wider ${
                                  hasAllergies ? 'text-rose-700 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'
                                }`}
                              >
                                {hasAllergies ? 'ALERTA DE SEGURIDAD FARMACOLÓGICA' : 'SEGURIDAD CLÍNICA'}
                              </span>
                              {hasAllergies && (
                                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200 animate-pulse">
                                  Precaución al prescribir
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap pt-1">
                              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                Alergias Registradas:
                              </span>
                              {hasAllergies ? (
                                allergies.map((alg, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center gap-1 text-xs font-black px-2 py-0.5 rounded-lg bg-rose-200/90 dark:bg-rose-900/80 text-rose-900 dark:text-rose-100 border border-rose-300 dark:border-rose-800"
                                  >
                                    ⚠️ {alg}
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveAllergy(alg)}
                                      className="text-rose-700 hover:text-rose-950 ml-0.5"
                                      title="Eliminar alergia"
                                    >
                                      ×
                                    </button>
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                  ✓ Sin alergias registradas conocidas
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Botón para añadir alergia */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {showAllergyInput ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                placeholder="Ej: Penicilina, AINEs"
                                value={newAllergyInput}
                                onChange={(e) => setNewAllergyInput(e.target.value)}
                                className="px-2 py-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 w-36"
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={handleAddAllergy}
                                className="px-2 py-1 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700"
                              >
                                Añadir
                              </button>
                              <button
                                type="button"
                                onClick={() => setShowAllergyInput(false)}
                                className="p-1 text-zinc-400 hover:text-zinc-600 text-xs"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setShowAllergyInput(true)}
                              className="px-2.5 py-1 rounded-xl text-xs font-bold border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 flex items-center gap-1"
                            >
                              + Añadir Alergia
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })()}

                {/* ANTECEDENTES Y PERFIL CLÍNICO DEL PACIENTE */}
                {activePatientProfile && (
                  <div className="p-3.5 rounded-2xl border border-cyan-200/80 dark:border-cyan-900/50 bg-cyan-50/40 dark:bg-cyan-950/20 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-[#02B2C6] text-white flex items-center justify-center text-xs font-bold">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-wider text-cyan-800 dark:text-cyan-300">
                          Perfil Clínico & Antecedentes del Paciente
                        </span>
                      </div>
                      {activePatientProfile.updatedAt && (
                        <span className="text-[10px] text-zinc-400">
                          Actualizado: {activePatientProfile.updatedAt}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      <div className="bg-white/80 dark:bg-zinc-900/80 p-2.5 rounded-xl border border-cyan-100 dark:border-cyan-950">
                        <span className="block text-[10px] font-bold text-zinc-400 uppercase">Sexo / Género</span>
                        <span className="font-bold text-zinc-800 dark:text-zinc-200">
                          {activePatientProfile.gender || 'No registrado'}
                        </span>
                      </div>

                      <div className="bg-white/80 dark:bg-zinc-900/80 p-2.5 rounded-xl border border-cyan-100 dark:border-cyan-950">
                        <span className="block text-[10px] font-bold text-zinc-400 uppercase">Contacto Emergencia</span>
                        <span
                          className="font-bold text-zinc-800 dark:text-zinc-200 truncate block"
                          title={activePatientProfile.emergencyContact ? `${activePatientProfile.emergencyContact} - ${activePatientProfile.emergencyPhone || ''}` : 'No registrado'}
                        >
                          {activePatientProfile.emergencyContact || 'No registrado'}
                        </span>
                        {activePatientProfile.emergencyPhone && (
                          <span className="text-[10px] text-zinc-500 font-medium">{activePatientProfile.emergencyPhone}</span>
                        )}
                      </div>

                      <div className="bg-white/80 dark:bg-zinc-900/80 p-2.5 rounded-xl border border-cyan-100 dark:border-cyan-950">
                        <span className="block text-[10px] font-bold text-zinc-400 uppercase">Patologías / Enfermedades</span>
                        <span
                          className="font-bold text-zinc-800 dark:text-zinc-200 block truncate"
                          title={activePatientProfile.chronicDiseases || 'Sin patologías declaradas'}
                        >
                          {activePatientProfile.chronicDiseases || 'Sin patologías declaradas'}
                        </span>
                      </div>

                      <div className="bg-white/80 dark:bg-zinc-900/80 p-2.5 rounded-xl border border-cyan-100 dark:border-cyan-950">
                        <span className="block text-[10px] font-bold text-zinc-400 uppercase">Dirección</span>
                        <span
                          className="font-bold text-zinc-800 dark:text-zinc-200 block truncate"
                          title={activePatientProfile.address || 'No registrada'}
                        >
                          {activePatientProfile.address || 'No registrada'}
                        </span>
                      </div>
                    </div>

                    {(activePatientProfile.currentMedications || activePatientProfile.surgicalHistory) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-0.5">
                        {activePatientProfile.currentMedications && (
                          <div className="p-2 rounded-xl bg-white/70 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase block">Medicación Habitual:</span>
                            <span className="text-zinc-800 dark:text-zinc-200 font-medium">{activePatientProfile.currentMedications}</span>
                          </div>
                        )}
                        {activePatientProfile.surgicalHistory && (
                          <div className="p-2 rounded-xl bg-white/70 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase block">Cirugías Previas:</span>
                            <span className="text-zinc-800 dark:text-zinc-200 font-medium">{activePatientProfile.surgicalHistory}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* FORMULARIO DE EVOLUCIÓN & RÉCIPE */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm space-y-4">
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
                  {/* MÓDULO DE SIGNOS VITALES / CONSTANTES CLÍNICAS */}
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-200 dark:border-zinc-700 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black uppercase tracking-wider text-[#02B2C6] flex items-center gap-1.5">
                          <Activity className="w-4 h-4" />
                          Signos Vitales & Constantes Fisiológicas
                        </span>
                        {(activePatientProfile?.weightKg || activePatientProfile?.heightCm) && (!weightKg || !heightCm) && (
                          <button
                            type="button"
                            onClick={() => {
                              if (activePatientProfile.weightKg) setWeightKg(activePatientProfile.weightKg)
                              if (activePatientProfile.heightCm) setHeightCm(activePatientProfile.heightCm)
                            }}
                            className="text-[10px] font-bold text-[#02B2C6] bg-cyan-50 dark:bg-cyan-950/60 px-2 py-0.5 rounded-md hover:bg-cyan-100 transition cursor-pointer"
                            title="Autocompletar peso y talla guardados por el paciente"
                          >
                            ⚡ Cargar peso/talla del perfil ({activePatientProfile.weightKg || '--'}kg / {activePatientProfile.heightCm || '--'}cm)
                          </button>
                        )}
                      </div>
                      {calculatedBmi && (
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                            calculatedBmi < 18.5
                              ? 'bg-amber-100 text-amber-800'
                              : calculatedBmi <= 24.9
                              ? 'bg-emerald-100 text-emerald-800'
                              : calculatedBmi <= 29.9
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          IMC: {calculatedBmi} ({calculatedBmi < 18.5 ? 'Bajo Peso' : calculatedBmi <= 24.9 ? 'Normal' : calculatedBmi <= 29.9 ? 'Sobrepeso' : 'Obesidad'})
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs">
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-0.5">
                          P. Arterial
                        </label>
                        <input
                          type="text"
                          placeholder="120/80"
                          value={bloodPressure}
                          onChange={(e) => setBloodPressure(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-0.5">
                          F. Cardíaca
                        </label>
                        <input
                          type="text"
                          placeholder="72 lpm"
                          value={heartRate}
                          onChange={(e) => setHeartRate(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-0.5">
                          Temperatura
                        </label>
                        <input
                          type="text"
                          placeholder="36.5 °C"
                          value={temperature}
                          onChange={(e) => setTemperature(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-0.5">
                          Saturación O2
                        </label>
                        <input
                          type="text"
                          placeholder="98 %"
                          value={oxygenSaturation}
                          onChange={(e) => setOxygenSaturation(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-0.5">
                          Peso (kg)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="70"
                          value={weightKg}
                          onChange={(e) => setWeightKg(e.target.value ? parseFloat(e.target.value) : '')}
                          className="w-full px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-0.5">
                          Talla (cm)
                        </label>
                        <input
                          type="number"
                          placeholder="170"
                          value={heightCm}
                          onChange={(e) => setHeightCm(e.target.value ? parseFloat(e.target.value) : '')}
                          className="w-full px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 font-bold"
                        />
                      </div>
                    </div>
                  </div>

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

                    {/* MÓDULO DE FOTO CON CÁMARA, RÉCIPES & ESTUDIOS MÉDICOS */}
                    <div className="p-4 sm:p-5 bg-gradient-to-br from-cyan-50/60 to-white dark:from-cyan-950/20 dark:to-zinc-900 rounded-2xl border border-cyan-200 dark:border-cyan-900/50 space-y-3.5 mt-3 shadow-2xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div>
                          <span className="text-xs font-black uppercase tracking-wider text-[#02B2C6] flex items-center gap-1.5">
                            <Camera className="w-4 h-4 text-[#02B2C6]" />
                            Adjuntar Imágenes, Récipes o Informes con Cámara
                          </span>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                            Toma una fotografía directa desde tu dispositivo o sube fotos y documentos en PDF
                          </p>
                        </div>
                        <span className="text-[10px] text-zinc-400 font-semibold">
                          JPG, PNG, WebP o PDF
                        </span>
                      </div>

                      {/* Selector de Categoría de Documento */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold uppercase text-zinc-400">Tipo de Documento:</span>
                        <button
                          type="button"
                          onClick={() => setAttachmentCategory('recipe')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                            attachmentCategory === 'recipe'
                              ? 'bg-[#02B2C6] text-white shadow-2xs'
                              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200'
                          }`}
                        >
                          💊 Récipe Médico
                        </button>
                        <button
                          type="button"
                          onClick={() => setAttachmentCategory('informe')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                            attachmentCategory === 'informe'
                              ? 'bg-[#02B2C6] text-white shadow-2xs'
                              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200'
                          }`}
                        >
                          📋 Informe Médico
                        </button>
                        <button
                          type="button"
                          onClick={() => setAttachmentCategory('foto')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                            attachmentCategory === 'foto'
                              ? 'bg-[#02B2C6] text-white shadow-2xs'
                              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200'
                          }`}
                        >
                          📷 Foto Clínica / Lesión
                        </button>
                        <button
                          type="button"
                          onClick={() => setAttachmentCategory('estudio')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                            attachmentCategory === 'estudio'
                              ? 'bg-[#02B2C6] text-white shadow-2xs'
                              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200'
                          }`}
                        >
                          🔬 Estudio / Eco
                        </button>
                      </div>

                      {/* Inputs Ocultos de Cámara y Archivos */}
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        ref={cameraInputRef}
                        onChange={(e) => handleFileUpload(e, true)}
                        className="hidden"
                      />
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        multiple
                        ref={fileInputRef}
                        onChange={(e) => handleFileUpload(e, false)}
                        className="hidden"
                      />

                      {/* Botones de Acción Táctiles (Responsivos) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => cameraInputRef.current?.click()}
                          disabled={isUploadingFile}
                          className="p-3.5 rounded-2xl bg-white dark:bg-zinc-800 border-2 border-dashed border-[#02B2C6] text-[#02B2C6] hover:bg-cyan-50 dark:hover:bg-cyan-950/40 transition active:scale-98 flex items-center justify-center gap-2 font-black text-xs shadow-xs cursor-pointer"
                        >
                          <Camera className="w-5 h-5 text-[#02B2C6]" />
                          <span>{isUploadingFile ? 'Procesando captura...' : '📸 Tomar Foto con Cámara'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingFile}
                          className="p-3.5 rounded-2xl bg-white dark:bg-zinc-800 border-2 border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:border-[#02B2C6] hover:text-[#02B2C6] transition active:scale-98 flex items-center justify-center gap-2 font-bold text-xs shadow-xs cursor-pointer"
                        >
                          <UploadCloud className="w-5 h-5" />
                          <span>📁 Subir desde Galería o Archivo PDF</span>
                        </button>
                      </div>

                      {/* Galería de Miniaturas Fotográficas y Documentos Adjuntos */}
                      {attachments.length > 0 && (
                        <div className="space-y-2 pt-2">
                          <span className="text-[10px] font-black uppercase text-zinc-500 tracking-wider block">
                            Documentos listos para guardar ({attachments.length}):
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {attachments.map((att, idx) => {
                              const isImage = !att.name.toLowerCase().endsWith('.pdf') && !att.file_type?.includes('pdf')

                              return (
                                <div
                                  key={idx}
                                  className="p-2.5 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center gap-3 shadow-xs hover:border-[#02B2C6] transition"
                                >
                                  {/* Miniatura visual si es imagen */}
                                  <div
                                    onClick={() => {
                                      setLightboxImage(att.file_url)
                                      setLightboxTitle(att.name)
                                      setLightboxType(att.file_type || (isImage ? 'image' : 'pdf'))
                                    }}
                                    className="w-14 h-14 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center overflow-hidden shrink-0 cursor-pointer relative group"
                                  >
                                    {isImage ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img
                                        src={att.file_url}
                                        alt={att.name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition duration-200"
                                      />
                                    ) : (
                                      <FileText className="w-6 h-6 text-rose-500" />
                                    )}
                                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                                      <Eye className="w-4 h-4" />
                                    </div>
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-black text-zinc-900 dark:text-zinc-100 truncate">
                                      {att.name}
                                    </p>
                                    <p className="text-[10px] text-zinc-400">
                                      {att.size_kb} KB • {att.uploaded_at}
                                    </p>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setLightboxImage(att.file_url)
                                        setLightboxTitle(att.name)
                                        setLightboxType(att.file_type || (isImage ? 'image' : 'pdf'))
                                      }}
                                      className="text-[10px] text-[#02B2C6] font-bold hover:underline flex items-center gap-1 pt-0.5 cursor-pointer"
                                    >
                                      <ZoomIn className="w-3 h-3" />
                                      <span>Ver en grande</span>
                                    </button>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleRemoveAttachment(idx)}
                                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition shrink-0 cursor-pointer"
                                    title="Eliminar adjunto"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
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

                  <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                    <button
                      type="submit"
                      className="w-full sm:flex-1 py-3.5 rounded-xl font-bold text-sm text-white bg-[#02B2C6] hover:bg-[#029baa] shadow-md shadow-cyan-600/20 transition active:scale-95 cursor-pointer"
                    >
                      Guardar Evolución & Completar Consulta
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const dummyRec: MedicalRecord = {
                          id: 'temp-' + Date.now(),
                          appointment_id: activePatient.todayAppointment?.id || '',
                          patient_cedula: activePatient.cedula,
                          patient_name: activePatient.name,
                          doctor_id: currentDoctor.id,
                          area: currentDoctor.area,
                          admission_date: new Date().toISOString().split('T')[0],
                          previous_consult_date: null,
                          symptoms: symptoms || 'Consulta médica de rutina',
                          diagnosis: diagnosis || 'En evaluación clínica',
                          treatment: treatment || 'Prescripción en trámite',
                          vital_signs: {
                            blood_pressure: bloodPressure || undefined,
                            heart_rate: heartRate ? `${heartRate} lpm` : undefined,
                            temperature: temperature ? `${temperature} °C` : undefined,
                            oxygen_saturation: oxygenSaturation ? `${oxygenSaturation} %` : undefined,
                            weight_kg: typeof weightKg === 'number' ? weightKg : undefined,
                            height_cm: typeof heightCm === 'number' ? heightCm : undefined,
                            bmi: calculatedBmi || undefined,
                          },
                          allergies: patientAllergiesMap[activePatient.cedula.trim().toUpperCase()] || [],
                          exams_json: exams,
                          recipe_file_url: null,
                          created_at: new Date().toISOString(),
                        }
                        setSelectedRecordForModal(dummyRec)
                        setRecipeModalOpen(true)
                      }}
                      className="w-full sm:w-auto px-5 py-3.5 rounded-xl font-bold text-xs border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 flex items-center justify-center gap-2 transition"
                    >
                      <Printer className="w-4 h-4 text-[#02B2C6]" />
                      <span>Vista Previa Récipe PDF</span>
                    </button>
                  </div>
                </form>
              </div>
            </>
          ) : (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-12 text-center text-zinc-400 text-sm space-y-4">
              <User className="w-12 h-12 text-zinc-300 mx-auto" />
              <p className="font-extrabold text-base text-zinc-700 dark:text-zinc-200">
                Ningún paciente seleccionado en este momento
              </p>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                Selecciona un paciente citado desde tu <strong>Agenda de Hoy</strong>, llámalo desde la <strong>Sala de Espera</strong>, o búscalo en el <strong>Archivo de Historias</strong>.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleTabChange('agenda')}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#02B2C6] hover:bg-[#029baa] shadow-sm"
                >
                  Ver Agenda de Hoy
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange('sala')}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100"
                >
                  Ver Sala de Espera
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* 4. SUB-MENU: ARCHIVO DE HISTORIAS & BUSCADOR (AISLADO) */}
      {activeTab === 'archivo' && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* COLUMNA IZQUIERDA: BUSCADOR & LISTA GENERAL DE PACIENTES */}
          <div className={`lg:col-span-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-sm space-y-4 ${
            mobileArchiveView === 'detail' && activePatient ? 'hidden lg:block' : 'block'
          }`}>
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
              </div>
            </div>

            {/* LISTADO DE PACIENTES DEL ARCHIVO */}
            <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
              {(searchTerm.trim() ? filteredPatients : allPatients).map((patient) => {
                const isSelected = activePatient?.cedula.toUpperCase() === patient.cedula.toUpperCase()

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
                      setMobileArchiveView('detail')
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-1.5 ${
                      isSelected
                        ? 'border-[#02B2C6] bg-cyan-50/50 dark:bg-cyan-950/30 shadow-sm'
                        : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 bg-white dark:bg-zinc-900'
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
                      {patient.recordCount > 0 ? (
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {patient.recordCount} consulta(s)
                        </span>
                      ) : (
                        <span className="text-zinc-400 italic">Sin consultas previas</span>
                      )}
                      <span className="text-zinc-400 font-medium">Ver Historial</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* COLUMNA DERECHA: EXPEDIENTE HISTÓRICO COMPLETO */}
          <div className={`lg:col-span-8 space-y-4 ${
            mobileArchiveView === 'list' && activePatient ? 'hidden lg:block' : 'block'
          }`}>
            {activePatient ? (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
                {/* Botón Volver a la Lista en Móviles */}
                <div className="lg:hidden pb-1">
                  <button
                    type="button"
                    onClick={() => setMobileArchiveView('list')}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 flex items-center gap-1.5 transition cursor-pointer"
                  >
                    ← Volver al Directorio de Pacientes
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                  <div>
                    <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <History className="w-4 h-4 text-[#02B2C6]" />
                      Historial Clínico: {activePatient.name}
                    </h3>
                    <span className="text-xs text-zinc-400">
                      {activePatient.cedula} • {patientRecords.length} consulta(s) registradas
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleTabChange('consulta')}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#02B2C6] hover:bg-[#029baa] shadow-sm transition active:scale-95 flex items-center gap-1.5"
                  >
                    <Stethoscope className="w-4 h-4" />
                    <span>Iniciar Consulta con este Paciente</span>
                  </button>
                </div>

                {patientRecords.length === 0 ? (
                  <div className="p-8 text-center space-y-2 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
                    <AlertCircle className="w-6 h-6 text-zinc-400 mx-auto" />
                    <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                      No hay consultas o antecedentes previos registrados para este paciente.
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      Haz clic en el botón superior &quot;Iniciar Consulta con este Paciente&quot; para abrir su primera historia clínica.
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
                                {recDoctor ? recDoctor.name : 'Médico Especialista CMZenit'} ({rec.area === 'estetica' ? 'Dermoestética' : 'Salud'})
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedRecordForModal(rec)
                                setRecipeModalOpen(true)
                              }}
                              className="text-[#02B2C6] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Ver Récipe PDF</span>
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <strong className="text-zinc-500 uppercase tracking-wider text-[10px] block">
                                Motivo de Consulta:
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
                              Tratamiento Prescrito:
                            </strong>
                            <p className="text-zinc-800 dark:text-zinc-200 leading-relaxed bg-white dark:bg-zinc-800 p-2.5 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60">
                              {rec.treatment}
                            </p>
                          </div>

                          {rec.vital_signs && (
                            <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60 space-y-1">
                              <strong className="text-zinc-500 uppercase tracking-wider text-[10px] block">
                                Signos Vitales Registrados:
                              </strong>
                              <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                                {rec.vital_signs.blood_pressure && (
                                  <span className="px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold">
                                    PA: {rec.vital_signs.blood_pressure}
                                  </span>
                                )}
                                {rec.vital_signs.heart_rate && (
                                  <span className="px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold">
                                    FC: {rec.vital_signs.heart_rate}
                                  </span>
                                )}
                                {rec.vital_signs.temperature && (
                                  <span className="px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold">
                                    Temp: {rec.vital_signs.temperature}
                                  </span>
                                )}
                                {rec.vital_signs.weight_kg && (
                                  <span className="px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold">
                                    Peso: {rec.vital_signs.weight_kg} kg
                                  </span>
                                )}
                                {rec.vital_signs.bmi && (
                                  <span className="px-2 py-0.5 rounded-lg bg-cyan-50 dark:bg-cyan-950 text-[#02B2C6] font-bold">
                                    IMC: {rec.vital_signs.bmi}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {rec.attachments && rec.attachments.length > 0 && (
                            <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60 space-y-2">
                              <strong className="text-zinc-500 uppercase tracking-wider text-[10px] block">
                                Récipes, Informes & Fotografías Adjuntas ({rec.attachments.length}):
                              </strong>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                {rec.attachments.map((att, aIdx) => {
                                  const isImage = !att.name.toLowerCase().endsWith('.pdf') && !att.file_type?.includes('pdf')

                                  return (
                                    <div
                                      key={aIdx}
                                      className="p-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center gap-2.5 shadow-2xs hover:border-[#02B2C6] transition"
                                    >
                                      <div
                                        onClick={() => {
                                          setLightboxImage(att.file_url)
                                          setLightboxTitle(att.name)
                                          setLightboxType(att.file_type || (isImage ? 'image' : 'pdf'))
                                        }}
                                        className="w-12 h-12 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center overflow-hidden shrink-0 cursor-pointer relative group"
                                      >
                                        {isImage ? (
                                          // eslint-disable-next-line @next/next/no-img-element
                                          <img
                                            src={att.file_url}
                                            alt={att.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition"
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
                      )
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-12 text-center text-zinc-400 text-sm space-y-3">
                <FileText className="w-10 h-10 text-zinc-300 mx-auto" />
                <p className="font-semibold text-zinc-600 dark:text-zinc-300">
                  Selecciona un paciente del directorio
                </p>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  Haz clic en un paciente de la lista izquierda para visualizar su expediente clínico detallado y todas sus consultas previas.
                </p>
              </div>
            )}
          </div>
        </section>
      )}

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
