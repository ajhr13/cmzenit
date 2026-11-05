'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useCMZenit } from '@/context/CMZenitContext'
import {
  Clock,
  Calendar,
  Lock,
  ArrowRight,
  ShieldCheck,
  Phone,
    ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Activity,
  Award,
  HeartPulse,
  Smile,
  MapPin,
  ChevronDown,
} from 'lucide-react'

import { WhatsAppIcon, InstagramIcon } from '@/components/SocialIcons'

// 6 Diapositivas para el Hero Slider fiel al sistema de diseño MedicalGuide
const HERO_SLIDES = [
  {
    id: 1,
    h1: 'ATENCIÓN CLÍNICA Y QUIRÚRGICA 24/7',
    h2: 'SOLUCIÓN EN SALUD / HOSPITALIZACIÓN INTEGRAL',
    description:
      'Salas de hospitalización confortables, quirófanos completamente equipados para cirugías ambulatorias y monitoreo continuo de enfermería especializada las 24 horas del día.',
    bullets: [
      'Habitaciones individuales de recuperación y hospitalización monitoreada',
      'Quirófano ambulatorio con tecnología de esterilización clase B',
      'Atención médica de emergencia continua los 365 días del año',
    ],
    primaryBtn: 'CONOCER MÁS',
    primaryHref: '/especialidades',
    secondaryBtn: 'AGENDAR CITA',
    secondaryHref: '#agendar-cita',
    imageUrl:
      'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1920&q=80',
  },
  {
    id: 2,
    h1: 'DIAGNÓSTICO COMPUTARIZADO Y SALUD OCULAR',
    h2: 'OFTALMOLOGÍA CLÍNICA / AGUDEZA VISUAL AVANZADA',
    description:
      'Evaluación exhaustiva de la agudeza visual, biomicroscopía con lámpara de hendidura, fondo de ojo, control de presión intraocular y cirugía ocular con especialistas acreditados MPPS.',
    bullets: [
      'Examen oftalmológico computarizado de alta precisión',
      'Detección y control preventivo de glaucoma, cataratas y retinopatías',
      'Adaptación de lentes correctivos y cirugía ambulatoria',
    ],
    primaryBtn: 'CONOCER MÁS',
    primaryHref: '/especialidades',
    secondaryBtn: 'AGENDAR CITA',
    secondaryHref: '#agendar-cita',
    imageUrl:
      'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1920&q=80',
  },
  {
    id: 3,
    h1: 'CUIDADO INTEGRAL DE LA MUJER Y CONTROL PRENATAL',
    h2: 'GINECOLOGÍA & OBSTETRICIA / ECOGRAFÍA 4D Y 5D',
    description:
      'Control prenatal mensual, ecosonografía morfológica de alta resolución 4D/5D, chequeo ginecológico preventivo y citología digital con entrega inmediata de informe médico.',
    bullets: [
      'Ecosonografía obstétrica y morfológica de alta definición',
      'Control prenatal especializado en embarazos de bajo y alto riesgo',
      'Chequeo ginecológico preventivo y citología en consultorio',
    ],
    primaryBtn: 'CONOCER MÁS',
    primaryHref: '/especialidades',
    secondaryBtn: 'AGENDAR CITA',
    secondaryHref: '#agendar-cita',
    imageUrl:
      'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?auto=format&fit=crop&w=1920&q=80',
  },
  {
    id: 4,
    h1: 'ARMONÍA, CIENCIA Y BIENESTAR PARA TU PIEL',
    h2: 'ESPACIO ESTÉTICA & DERMOESTÉTICA INTEGRAL',
    description:
      'Tratamientos no invasivos de vanguardia: masajes post-operatorios, drenaje linfático manual, HydraFacial con radiofrecuencia, dermoabrasión punta diamante y depilación láser.',
    bullets: [
      'Masajes post-operatorios y drenaje linfático especializado',
      'HydraFacial radiofrecuencia, peeling ultrasónico y máscara LED',
      'Depilación láser de diodo con cabezal de enfriamiento indoloro',
    ],
    primaryBtn: 'CONOCER MÁS',
    primaryHref: '/estetica',
    secondaryBtn: 'AGENDAR CITA',
    secondaryHref: '#agendar-cita',
    imageUrl:
      'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1920&q=80',
  },
  {
    id: 5,
    h1: 'DISEÑO DE SONRISA Y ODONTOLOGÍA INTEGRAL',
    h2: 'CUIDADO DENTAL / SALUD BUCAL Y ESTÉTICA',
    description:
      'Odontología general, profilaxis ultrasónica sin dolor, resinas estéticas de alta densidad, blanqueamiento dental LED, ortodoncia correctiva y diseño de sonrisa personalizado.',
    bullets: [
      'Profilaxis ultrasónica profunda y eliminación de sarro',
      'Odontología estética, resinas microhíbridas y carillas',
      'Ortodoncia preventiva y blanqueamiento dental láser',
    ],
    primaryBtn: 'CONOCER MÁS',
    primaryHref: '/especialidades',
    secondaryBtn: 'AGENDAR CITA',
    secondaryHref: '#agendar-cita',
    imageUrl:
      'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=1920&q=80',
  },
  {
    id: 6,
    h1: 'EVALUACIÓN MÉDICA INTEGRAL Y CHEQUEO PREVENTIVO',
    h2: 'GUÍA MÉDICA DE CONFIANZA / CONSULTA GENERAL',
    description:
      'Médicos certificados MPPS, chequeos médicos preventivos, control de tensión arterial, glicemia, electrocardiograma y récipes digitales con acceso seguro las 24 horas del día.',
    bullets: [
      'Evaluación clínica integral para adultos y niños',
      'Chequeos preventivos preoperatorios y certificados médicos viales',
      'Récipes médicos digitales válidos con código de verificación QR',
    ],
    primaryBtn: 'CONOCER MÁS',
    primaryHref: '/cuerpo-medico',
    secondaryBtn: 'AGENDAR CITA',
    secondaryHref: '#agendar-cita',
    imageUrl:
      'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=1920&q=80',
  },
]

export function PublicLandingView() {
  const { services, doctors, currentUser, bookAppointment, openAuthModal } = useCMZenit()

  // Slider State
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  // Booking Form State
  const [selectedServiceId, setSelectedServiceId] = useState<number>(services[0]?.id || 1)
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(doctors[0]?.id || '')
  const [appointmentDate, setAppointmentDate] = useState<string>('')
  const [appointmentTime, setAppointmentTime] = useState<string>('09:00 AM')
  const [patientNameInput, setPatientNameInput] = useState<string | null>(null)
  const [patientCedulaInput, setPatientCedulaInput] = useState<string | null>(null)
  const [patientPhoneInput, setPatientPhoneInput] = useState<string | null>(null)

  const patientName = patientNameInput !== null ? patientNameInput : (currentUser?.name || '')
  const patientCedula = patientCedulaInput !== null ? patientCedulaInput : (currentUser?.cedula || '')
  const patientPhone = patientPhoneInput !== null ? patientPhoneInput : (currentUser?.phone || '')

  const [isBookingSubmitting, setIsBookingSubmitting] = useState(false)
  const [bookingSuccessMsg, setBookingSuccessMsg] = useState('')

  // Auto slide every 7 seconds
  useEffect(() => {
    if (isPaused) return
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length)
    }, 7000)
    return () => clearInterval(timer)
  }, [isPaused])

  // Scroll suave y encuadre exacto cuando la URL contiene #agendar-cita
  useEffect(() => {
    const handleHashScroll = () => {
      if (typeof window !== 'undefined' && window.location.hash === '#agendar-cita') {
        setTimeout(() => {
          const el = document.getElementById('agendar-cita')
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        }, 150)
      }
    }

    handleHashScroll()
    window.addEventListener('hashchange', handleHashScroll)
    return () => window.removeEventListener('hashchange', handleHashScroll)
  }, [])

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length)
  const prevSlide = () =>
    setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)

  // Submit appointment
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentUser) {
      openAuthModal('signin')
      return
    }

    if (!patientName.trim() || !patientCedula.trim() || !patientPhone.trim()) {
      alert('Por favor completa Nombre, Cédula y WhatsApp para confirmar tu cita.')
      return
    }

    const selectedSrv = services.find((s) => s.id === Number(selectedServiceId))
    if (!selectedSrv) return

    setIsBookingSubmitting(true)
    const chosenDate =
      appointmentDate || new Date(Date.now() + 86400000).toISOString().split('T')[0]

    const res = await bookAppointment({
      doctorId: selectedDoctorId || doctors[0]?.id || 'doc-1',
      serviceId: selectedSrv.id,
      date: chosenDate,
      time: appointmentTime,
      patientName: patientName || currentUser.name || 'Paciente',
      patientCedula: patientCedula || currentUser.cedula || 'V-00000000',
      patientPhone: patientPhone || currentUser.phone || '+58 422 0241622',
      area: selectedSrv.category,
    })

    setIsBookingSubmitting(false)

    if (res.success) {
      setBookingSuccessMsg(
        `¡Cita solicitada exitosamente para ${selectedSrv.name} el ${chosenDate} a las ${appointmentTime}! Nuestro equipo te contactará para confirmar.`
      )
    }
  }

  const slide = HERO_SLIDES[currentSlide]

  return (
    <div className="space-y-16 pb-20 bg-white">
      {/* =========================================================================
          1. SECCIÓN HERO CON IMAGEN DE FONDO A ANCHO COMPLETO Y TARJETA FLOTANTE A LA DERECHA
          Overlay: rgba(255, 255, 255, 0.9)
          H1: ExtraBold (800) UPPERCASE en #02B2C6
          H2: Light/Regular (300/400) UPPERCASE en #777777 justo debajo del H1
          Cuerpo: Regular (400) en #777777 leading-[1.6]
          Borde inferior de énfasis: #02B2C6
          ========================================================================= */}
      <section
        className="relative w-full min-h-[580px] sm:min-h-[640px] lg:min-h-[680px] flex items-center overflow-hidden bg-[#525862] select-none"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Imagen de Fondo a Ancho Completo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={slide.imageUrl}
          alt={slide.h1}
          className="absolute inset-0 w-full h-full object-cover object-center transform transition-transform duration-1000 scale-105"
        />

        {/* Gradiente sutil para garantizar contraste */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/40 via-transparent to-slate-900/50" />

        {/* Badge Circular Cian Superior Derecho (Atención Médica 24/7) */}
        <div className="absolute top-6 right-6 z-20 hidden md:flex items-center gap-2 bg-[#02B2C6] text-white px-3.5 py-1.5 rounded-md shadow-md text-xs font-semibold uppercase tracking-wider">
          <Clock className="w-3.5 h-3.5" />
          <span>Atención 24/7</span>
        </div>

        {/* Contenedor Principal */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20 w-full flex justify-end">
          {/* TARJETA FLOTANTE A LA DERECHA EN BLANCO SEMITRANSPARENTE (rgba(255, 255, 255, 0.9)) */}
          <div
            className="w-full max-w-xl sm:max-w-2xl p-8 sm:p-10 rounded-md shadow-2xl border-b-4 border-[#02B2C6] space-y-4 animate-in fade-in slide-in-from-right-6 duration-700"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.92)' }}
          >
            {/* TÍTULO HERO (H1): UPPERCASE, ExtraBold (800), color Azul Cian (#02B2C6) */}
            <h1 className="text-2xl sm:text-4xl font-extrabold uppercase tracking-tight text-[#02B2C6] leading-tight">
              {slide.h1}
            </h1>

            {/* SUBTÍTULO HERO (H2): UPPERCASE, Regular (400), color Gris Medio (#777777), ubicado justo debajo del H1 */}
            <h2 className="text-xs sm:text-sm font-normal uppercase tracking-wider text-[#777777]">
              {slide.h2}
            </h2>

            {/* CUERPO DE TEXTO: Regular (400), color Gris Medio (#777777), con interlineado amplio (line-height: 1.6) */}
            <p className="text-xs sm:text-sm font-normal text-[#777777] leading-[1.6]">
              {slide.description}
            </p>

            {/* Viñetas con Detalle Cian */}
            <div className="space-y-2 pt-2 border-t border-gray-200/80">
              {slide.bullets.map((bullet, idx) => (
                <div key={idx} className="flex items-center gap-2.5 text-xs text-[#777777] font-normal leading-[1.6]">
                  <div className="w-4 h-4 rounded-sm bg-[#02B2C6] text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                    +
                  </div>
                  <span>{bullet}</span>
                </div>
              ))}
            </div>

            {/* BOTONES DE ACCIÓN: Secundario Oscuro (#525862) y Primario Cian (#02B2C6) */}
            <div className="flex flex-wrap items-center gap-3 pt-3">
              <Link
                href={slide.primaryHref}
                className="px-6 py-3 rounded-md font-semibold text-xs uppercase tracking-wider text-white bg-[#525862] hover:bg-[#3d424b] shadow-sm transition active:scale-95"
              >
                {slide.primaryBtn}
              </Link>

              <a
                href={slide.secondaryHref}
                className="px-6 py-3 rounded-md font-semibold text-xs uppercase tracking-wider text-white bg-[#02B2C6] hover:bg-[#029baa] shadow-sm transition active:scale-95 flex items-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{slide.secondaryBtn}</span>
              </a>
            </div>
          </div>
        </div>

        {/* Botón Flotante Inferior Izquierdo "Make an Appointment v" (Gris Pizarra #525862 de MedicalGuide) */}
        <a
          href="#agendar-cita"
          className="absolute bottom-6 left-6 z-20 hidden sm:flex items-center gap-2 bg-[#525862] hover:bg-[#3d424b] text-white px-5 py-3 rounded-md shadow-lg text-xs font-semibold uppercase tracking-wider transition active:scale-95"
        >
          <span>Agendar una Cita</span>
          <ChevronDown className="w-4 h-4" />
        </a>

        {/* Flechas Laterales de Navegación del Carrusel */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-md bg-white/30 hover:bg-[#02B2C6] text-white flex items-center justify-center backdrop-blur-sm transition shadow-md active:scale-95 cursor-pointer"
          aria-label="Diapositiva anterior"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-md bg-white/30 hover:bg-[#02B2C6] text-white flex items-center justify-center backdrop-blur-sm transition shadow-md active:scale-95 cursor-pointer"
          aria-label="Diapositiva siguiente"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Indicadores de Barra Horizontal Inferiores en #02B2C6 */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          {HERO_SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                currentSlide === idx ? 'w-10 bg-[#02B2C6]' : 'w-4 bg-white/50 hover:bg-white/80'
              }`}
              aria-label={`Diapositiva ${idx + 1}`}
            />
          ))}
        </div>
      </section>

      {/* =========================================================================
          2. SECCIÓN 4 CAJAS DE CARACTERÍSTICAS
          Fondo: Blanco Puro (#FFFFFF)
          Fondo de Ícono: Azul Cian (#02B2C6) cuadrado con bordes ligeramente redondeados
          Títulos (H3): Semi-Bold (600), Title Case, Gris Pizarra (#525862)
          Cuerpo: Regular (400), Gris Medio (#777777), leading-[1.6]
          ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 -mt-10 sm:-mt-14 relative z-30">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Caja 1: Operation Theater */}
          <Link
            href="/especialidades"
            className="bg-white border border-gray-100 p-6 rounded-md shadow-md hover:shadow-xl hover:border-[#02B2C6] transition-all flex items-start gap-4 group"
          >
            <div className="w-14 h-14 rounded-md bg-[#02B2C6] text-white flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105">
              <Activity className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              {/* Título H3: Title Case, Semi-Bold (600), Gris Pizarra (#525862) */}
              <h3 className="text-sm font-semibold text-[#525862] group-hover:text-[#02B2C6] transition">
                Quirófanos & Cirugía
              </h3>
              {/* Párrafo: Regular (400), Gris Medio (#777777), line-height: 1.6 */}
              <p className="text-xs font-normal text-[#777777] leading-[1.6]">
                Salas quirúrgicas ambulatorias equipadas con monitoreo multiparámetro 24/7.
              </p>
            </div>
          </Link>

          {/* Caja 2: Emergency Services */}
          <a
            href="tel:04220241622"
            className="bg-white border border-gray-100 p-6 rounded-md shadow-md hover:shadow-xl hover:border-[#02B2C6] transition-all flex items-start gap-4 group"
          >
            <div className="w-14 h-14 rounded-md bg-[#02B2C6] text-white flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105">
              <HeartPulse className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-[#525862] group-hover:text-[#02B2C6] transition">
                Servicios de Emergencia
              </h3>
              <p className="text-xs font-normal text-[#777777] leading-[1.6]">
                Triaje clínico continuo y atención médica de urgencias en Caracas.
              </p>
            </div>
          </a>

          {/* Caja 3: Dental Care */}
          <Link
            href="/especialidades"
            className="bg-white border border-gray-100 p-6 rounded-md shadow-md hover:shadow-xl hover:border-[#02B2C6] transition-all flex items-start gap-4 group"
          >
            <div className="w-14 h-14 rounded-md bg-[#02B2C6] text-white flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105">
              <Smile className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-[#525862] group-hover:text-[#02B2C6] transition">
                Cuidado Odontológico
              </h3>
              <p className="text-xs font-normal text-[#777777] leading-[1.6]">
                Diseño de sonrisa, profilaxis ultrasónica y ortodoncia con bioseguridad.
              </p>
            </div>
          </Link>

          {/* Caja 4: Qualified Doctors */}
          <Link
            href="/cuerpo-medico"
            className="bg-white border border-gray-100 p-6 rounded-md shadow-md hover:shadow-xl hover:border-[#02B2C6] transition-all flex items-start gap-4 group"
          >
            <div className="w-14 h-14 rounded-md bg-[#02B2C6] text-white flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105">
              <Award className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-[#525862] group-hover:text-[#02B2C6] transition">
                Médicos Calificados
              </h3>
              <p className="text-xs font-normal text-[#777777] leading-[1.6]">
                Cuerpo médico multidisciplinario con credenciales verificadas ante el MPPS.
              </p>
            </div>
          </Link>
        </div>
      </section>

      {/* =========================================================================
          3. SECCIÓN MEDICAL SERVICES (FOTO 2 Y 3 DE MEDICALGUIDE)
          Izquierda: H3 en Title Case, Gris Pizarra (#525862) y Párrafos en #777777 (1.6)
          Derecha: Fotografía dental / clínica
          ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Columna Izquierda: Servicios y Viñetas */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-[#02B2C6] block">
                Solución Médica Integral
              </span>
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#525862]">
                Servicios <span className="text-[#02B2C6] font-light">Médicos</span>
              </h2>
              <p className="text-xs sm:text-sm font-normal text-[#777777] leading-[1.6]">
                En Centro Médico Zenit brindamos atención en salud y estética bajo rigurosos protocolos
                sanitarios, equipamiento de última generación y calidez profesional.
              </p>
            </div>

            <div className="space-y-4">
              {/* Dental Care */}
              <div className="flex items-start gap-4 p-4 rounded-md bg-white border border-gray-100 shadow-sm">
                <div className="w-12 h-12 rounded-md bg-[#02B2C6] text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Smile className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#525862]">Cuidado Odontológico</h3>
                  <p className="text-xs font-normal text-[#777777] mt-1 leading-[1.6]">
                    Profilaxis ultrasónica profunda, ortodoncia correctiva, resinas microhíbridas y blanqueamiento dental.
                  </p>
                </div>
              </div>

              {/* Operation Theater */}
              <div className="flex items-start gap-4 p-4 rounded-md bg-white border border-gray-100 shadow-sm">
                <div className="w-12 h-12 rounded-md bg-[#02B2C6] text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#525862]">Quirófanos Ambulatorios</h3>
                  <p className="text-xs font-normal text-[#777777] mt-1 leading-[1.6]">
                    Salas de procedimientos ambulatorios y habitaciones clínicas de recuperación monitoreadas 24/7.
                  </p>
                </div>
              </div>

              {/* Qualified Doctors */}
              <div className="flex items-start gap-4 p-4 rounded-md bg-white border border-gray-100 shadow-sm">
                <div className="w-12 h-12 rounded-md bg-[#02B2C6] text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#525862]">Médicos Calificados</h3>
                  <p className="text-xs font-normal text-[#777777] mt-1 leading-[1.6]">
                    Especialistas acreditados en Ginecología, Oftalmología, Cardiología, Medicina General y Dermoestética.
                  </p>
                </div>
              </div>
            </div>

            {/* Fila de Botones de Especialidades y Redirecciones */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/especialidades"
                className="px-5 py-3 rounded-md font-semibold text-xs uppercase tracking-wider text-white bg-[#02B2C6] hover:bg-[#029baa] shadow-sm transition flex items-center gap-1.5"
              >
                <span>Ver Especialidades</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/estetica"
                className="px-5 py-3 rounded-md font-semibold text-xs uppercase tracking-wider text-white bg-[#525862] hover:bg-[#3d424b] shadow-sm transition"
              >
                Espacio Estética
              </Link>
              <Link
                href="/cuerpo-medico"
                className="px-5 py-3 rounded-md font-semibold text-xs uppercase tracking-wider text-[#525862] bg-slate-100 hover:bg-slate-200 transition"
              >
                Cuerpo Médico MPPS
              </Link>
            </div>
          </div>

          {/* Columna Derecha: Fotografía Clínica Dental */}
          <div className="lg:col-span-6 relative">
            <div className="relative rounded-md overflow-hidden shadow-xl border-4 border-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1200&q=80"
                alt="Consulta Odontológica y Médica CMZenit"
                className="w-full h-[400px] sm:h-[460px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent" />

              {/* Tarjeta Flotante Inferior en Blanco con Borde Cian */}
              <div className="absolute bottom-5 left-5 right-5 bg-white/95 backdrop-blur-md p-4 rounded-md border-b-2 border-[#02B2C6] shadow-md flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[#02B2C6] block">
                    Central de Atención Telefónica
                  </span>
                  <a
                    href="tel:04220241622"
                    className="text-base font-bold text-[#525862] hover:text-[#02B2C6] transition"
                  >
                    (422) 0241622
                  </a>
                  <p className="text-[11px] text-[#777777]">Lunes a Sábado de 8:00 AM a 7:00 PM</p>
                </div>
                <div className="w-10 h-10 rounded-md bg-[#02B2C6] text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Phone className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. SECCIÓN AGENDAR CITA (FORMULARIO)
          ========================================================================= */}
      <section id="agendar-cita" className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 scroll-mt-28 lg:scroll-mt-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Formulario */}
          <div className="lg:col-span-5 bg-white rounded-md border border-gray-100 shadow-xl overflow-hidden">
            {/* Header Cian con Ícono de Calendario */}
            <div className="bg-[#02B2C6] text-white p-6 sm:p-7">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-white/20 flex items-center justify-center font-bold">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-cyan-100 block">
                    Reserva tu Turno en Línea
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-white">
                    Agendar una Cita
                  </h3>
                </div>
              </div>
            </div>

            {/* Inputs del Formulario */}
            <form onSubmit={handleBookingSubmit} className="p-6 sm:p-7 space-y-4">
              {bookingSuccessMsg && (
                <div className="p-3.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-start gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{bookingSuccessMsg}</span>
                </div>
              )}

              {/* Alerta de autenticación requerida */}
              {!currentUser && (
                <div className="p-3 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between gap-2 animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Para confirmar tu cita debes iniciar sesión con tu cuenta.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => openAuthModal('signin')}
                    className="text-xs font-bold text-[#02B2C6] underline hover:text-[#029baa] shrink-0 cursor-pointer"
                  >
                    Ingresar
                  </button>
                </div>
              )}

              {/* Sesión activa */}
              {currentUser && (
                <div className="p-2.5 rounded-md bg-cyan-50/80 border border-[#02B2C6]/30 text-xs text-[#525862] flex items-center justify-between animate-in fade-in">
                  <div className="flex items-center gap-2 truncate">
                    <CheckCircle2 className="w-4 h-4 text-[#02B2C6] shrink-0" />
                    <span className="truncate">
                      Sesión activa: <strong>{currentUser.name}</strong>
                    </span>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-[#02B2C6] px-2 py-0.5 rounded bg-white shadow-2xs shrink-0">
                    {currentUser.role}
                  </span>
                </div>
              )}

              {/* Selector de Especialidad */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[#525862]">
                  Especialidad o Tratamiento
                </label>
                <select
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-md border border-gray-200 bg-white text-xs text-[#525862] focus:outline-none focus:ring-2 focus:ring-[#02B2C6]"
                >
                  {services.map((srv) => (
                    <option key={srv.id} value={srv.id}>
                      {srv.name} ({srv.category === 'salud' ? 'Salud' : 'Estética'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Selector de Especialista */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[#525862]">
                  Médico o Especialista MPPS
                </label>
                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-md border border-gray-200 bg-white text-xs text-[#525862] focus:outline-none focus:ring-2 focus:ring-[#02B2C6]"
                >
                  {doctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name} — {doc.specialty_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Fecha y Hora */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-[#525862]">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-md border border-gray-200 bg-white text-xs text-[#525862] focus:outline-none focus:ring-2 focus:ring-[#02B2C6]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-[#525862]">
                    Hora
                  </label>
                  <select
                    value={appointmentTime}
                    onChange={(e) => setAppointmentTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-md border border-gray-200 bg-white text-xs text-[#525862] focus:outline-none focus:ring-2 focus:ring-[#02B2C6]"
                  >
                    <option value="08:30 AM">08:30 AM</option>
                    <option value="09:00 AM">09:00 AM</option>
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="11:00 AM">11:00 AM</option>
                    <option value="02:00 PM">02:00 PM</option>
                    <option value="03:30 PM">03:30 PM</option>
                    <option value="04:30 PM">04:30 PM</option>
                  </select>
                </div>
              </div>

              {/* Nombre Paciente */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[#525862]">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  placeholder="Tu nombre y apellido"
                  value={patientName}
                  onChange={(e) => setPatientNameInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-md border border-gray-200 bg-white text-xs text-[#525862] placeholder:text-[#777777] focus:outline-none focus:ring-2 focus:ring-[#02B2C6]"
                />
              </div>

              {/* Cédula y Teléfono */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-[#525862]">
                    Cédula
                  </label>
                  <input
                    type="text"
                    placeholder="V-12345678"
                    value={patientCedula}
                    onChange={(e) => setPatientCedulaInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-md border border-gray-200 bg-white text-xs text-[#525862] placeholder:text-[#777777] focus:outline-none focus:ring-2 focus:ring-[#02B2C6]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-[#525862]">
                    WhatsApp
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+58 422 0241622"
                    value={patientPhone}
                    onChange={(e) => setPatientPhoneInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-md border border-gray-200 bg-white text-xs text-[#525862] placeholder:text-[#777777] focus:outline-none focus:ring-2 focus:ring-[#02B2C6]"
                  />
                </div>
              </div>

              {/* Botón Submit o Iniciar Sesión Obligatorio */}
              <div className="pt-2">
                {currentUser ? (
                  <button
                    type="submit"
                    disabled={isBookingSubmitting}
                    className="w-full py-3.5 rounded-md text-xs font-semibold uppercase tracking-wider text-white bg-[#02B2C6] hover:bg-[#029baa] shadow-sm transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>{isBookingSubmitting ? 'Procesando Cita...' : 'Confirmar Cita Médica'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => openAuthModal('signin')}
                    className="w-full py-3.5 rounded-md text-xs font-semibold uppercase tracking-wider text-white bg-[#02B2C6] hover:bg-[#029baa] shadow-sm transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Iniciar Sesión para Confirmar Cita</span>
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Columna Derecha: Información de Confianza */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-3">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-[#02B2C6] block">
                Atención Médica Humanizada
              </span>
              <h2 className="text-3xl sm:text-4xl font-semibold uppercase text-[#525862] tracking-tight">
                Bienvenido a <span className="text-[#02B2C6]">CMZenit</span>
              </h2>
              <p className="text-xs sm:text-sm font-normal text-[#777777] leading-[1.6]">
                Somos una institución médica y dermoestética integral comprometida con el cuidado de tu
                salud. Contamos con tecnología diagnóstica de última generación, récipes médicos digitales
                y quirófanos ambulatorios certificados en Caracas.
              </p>
            </div>

            {/* Tarjetas Informativas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-md border border-gray-100 shadow-sm space-y-2">
                <div className="w-10 h-10 rounded-md bg-[#02B2C6] text-white flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-[#525862]">Acreditación Sanitaria MPPS</h3>
                <p className="text-xs font-normal text-[#777777] leading-[1.6]">
                  Acreditación sanitaria oficial N° 45.892 con especialistas colegiados.
                </p>
              </div>

              <div className="bg-white p-5 rounded-md border border-gray-100 shadow-sm space-y-2">
                <div className="w-10 h-10 rounded-md bg-[#02B2C6] text-white flex items-center justify-center font-bold">
                  <Clock className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-[#525862]">Hospitalización 24/7</h3>
                <p className="text-xs font-normal text-[#777777] leading-[1.6]">
                  Habitaciones clínicas individuales monitoreadas las 24 horas del día.
                </p>
              </div>
            </div>

            {/* Banner de Contacto Gris Pizarra #525862 */}
            <div className="bg-[#525862] text-white p-6 rounded-md flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-md bg-[#02B2C6] text-white flex items-center justify-center shrink-0">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-[#02B2C6] font-semibold flex items-center gap-2">
                    <span>Central Telefónica & WhatsApp</span>
                    <span className="text-white/60">•</span>
                    <span className="flex items-center gap-1 text-white">
                      <InstagramIcon className="w-3 h-3" /> @cmzenit
                    </span>
                  </p>
                  <a
                    href="tel:04220241622"
                    className="text-lg sm:text-xl font-bold tracking-tight text-white hover:text-[#02B2C6] transition"
                  >
                    (422) 0241622
                  </a>
                  <p className="text-[11px] text-white/80">Lunes a Sábado de 8:00 AM a 7:00 PM</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="https://wa.me/584220241622"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-md font-semibold text-xs uppercase tracking-wider bg-[#02B2C6] hover:bg-[#029baa] text-white shadow-sm transition flex items-center gap-2 whitespace-nowrap"
                >
                  <WhatsAppIcon className="w-4 h-4 text-white" />
                  <span>WhatsApp Citas</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. UBICACIÓN & CONTACTO INFORMATIVO
          ========================================================================= */}
      <section id="contacto-info" className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-white border border-gray-100 rounded-md p-6 sm:p-10 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-md bg-[#02B2C6] text-white flex items-center justify-center font-bold">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-[#525862]">Sede Principal</h3>
              <p className="text-xs font-normal text-[#777777] leading-[1.6]">
                Av. Transversal 10, CC, Galerias Sebucan, con Av. los Chorros, Caracas 1071, Miranda, Venezuela.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 rounded-md bg-[#02B2C6] text-white flex items-center justify-center font-bold">
                <Phone className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-[#525862]">Teléfonos de Contacto</h3>
              <p className="text-xs font-normal text-[#777777] leading-[1.6]">
                Central: (422) 0241622 <br />
                WhatsApp: (422) 0241622
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 rounded-md bg-[#02B2C6] text-white flex items-center justify-center font-bold">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-[#525862]">Horario de Atención</h3>
              <p className="text-xs font-normal text-[#777777] leading-[1.6]">
                Consultas: Lunes a Sábado de 8:00 AM a 7:00 PM <br />
                Hospitalización & Emergencias: 24 Horas
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}



