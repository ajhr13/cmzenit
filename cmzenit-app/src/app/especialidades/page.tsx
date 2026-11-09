'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCMZenit } from '@/context/CMZenitContext'
import {
  Stethoscope,
  Calendar,
  Search,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  Award,
  CheckCircle2,
  HeartPulse,
  Eye,
  Smile,
  Activity,
  Building2,
} from 'lucide-react'
import { WhatsAppIcon, InstagramIcon } from '@/components/SocialIcons'

// 6 Especialidades Médicas para el Carrusel Interactivo
const SPECIALTY_SLIDES = [
  {
    id: 'hospitalizacion',
    badge: 'Atención Continua 24 Horas',
    icon: Building2,
    h1: 'HOSPITALIZACIÓN INTEGRAL 24/7',
    h2: 'CUIDADOS CLÍNICOS & MONITOREO CONTINUO',
    description:
      'Habitaciones individuales confortables con monitoreo multiparámetro, enfermería permanente y quirófano ambulatorio para cirugías programadas y recuperación segura.',
    features: [
      'Habitaciones privadas climatizadas con baño individual',
      'Atención médica y de enfermería continua 24/7',
      'Quirófanos equipados con esterilización de grado hospitalario',
    ],
    imageUrl:
      'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1600&q=80',
  },
  {
    id: 'consulta',
    badge: 'Medicina Familiar & Diagnóstico',
    icon: Stethoscope,
    h1: 'CONSULTA GENERAL & MEDICINA INTERNA',
    h2: 'DIAGNÓSTICO PREVENTIVO & RÉCIPE DIGITAL',
    description:
      'Evaluación exhaustiva de salud, despistaje clínico, control de hipertensión, diabetes y emisión de récord médico con récipes digitales válidos a nivel nacional.',
    features: [
      'Chequeo físico completo y control de signos vitales',
      'Diagnóstico y manejo de patologías metabólicas y crónicas',
      'Récipes médicos y certificados de salud avalados por MPPS',
    ],
    imageUrl:
      'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=1600&q=80',
  },
  {
    id: 'oftalmologia',
    badge: 'Salud Visual Computarizada',
    icon: Eye,
    h1: 'OFTALMOLOGÍA CLÍNICA Y QUIRÚRGICA',
    h2: 'BIOMICROSCOPÍA & AGUDEZA VISUAL AVANZADA',
    description:
      'Examen visual computarizado en lámpara de hendidura, tonometría para control de presión intraocular, fondo de ojo y cirugía ambulatoria de cataratas y pterigión.',
    features: [
      'Evaluación computarizada de la refracción y agudeza visual',
      'Detección y control temprano de glaucoma y cataratas',
      'Fondo de ojo dilatado con informe biomédico para el paciente',
    ],
    imageUrl:
      'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1600&q=80',
  },
  {
    id: 'ginecologia',
    badge: 'Cuidado Femenino & Obstetricia',
    icon: HeartPulse,
    h1: 'GINECOLOGÍA Y CONTROL PRENATAL',
    h2: 'ECOGRAFÍA 4D/5D & CHEQUEO PREVENTIVO',
    description:
      'Acompañamiento integral a la mujer en todas sus etapas: control de embarazo, ecosonografía de alta resolución en tiempo real, citología y colposcopia clínica.',
    features: [
      'Ecosonografía pélvica, transvaginal y morfológica 4D/5D',
      'Control prenatal de bajo y alto riesgo obstétrico',
      'Pesquisa ginecológica preventiva y toma de citología cervical',
    ],
    imageUrl:
      'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?auto=format&fit=crop&w=1600&q=80',
  },
  {
    id: 'odontologia',
    badge: 'Salud Bucal Integral',
    icon: Smile,
    h1: 'ODONTOLOGÍA INTEGRAL Y ESTÉTICA',
    h2: 'PROFILAXIS ULTRASÓNICA & DISEÑO DE SONRISA',
    description:
      'Tratamientos dentales conservadores y estéticos: limpieza ultrasónica profunda, resinas nanohíbridas, blanqueamiento dental láser y ortodoncia correctiva.',
    features: [
      'Profilaxis ultrasónica y eliminación indolora de cálculo',
      'Odontología restauradora estética con resinas de alta densidad',
      'Blanqueamiento dental en consultorio y ortodoncia especializada',
    ],
    imageUrl:
      'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=1600&q=80',
  },
  {
    id: 'cardiologia',
    badge: 'Prevención Cardiovascular',
    icon: Activity,
    h1: 'CARDIOLOGÍA Y ELECTROCARDIOGRAFÍA',
    h2: 'EVALUACIÓN CARDIOVASCULAR & DOPPLER',
    description:
      'Electrocardiograma digital de 12 derivaciones con informe inmediato, ecocardiograma Doppler, evaluación cardiovascular preoperatoria y control de presión arterial.',
    features: [
      'Electrocardiograma de reposo de 12 derivaciones digital',
      'Valoración de riesgo quirúrgico y cardiovascular integral',
      'Control y titulación farmacológica para pacientes hipertensos',
    ],
    imageUrl:
      'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1600&q=80',
  },
]

export default function EspecialidadesPage() {
  const { services, doctors, currentUser, openAuthModal, setActiveArea } = useCMZenit()
  const router = useRouter()
  const [selectedFilter, setSelectedFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Estado del Carrusel Interactivo
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [isCarouselPaused, setIsCarouselPaused] = useState(false)

  const nextSlide = useCallback(() => {
    setCurrentSlideIndex((prev) => (prev + 1) % SPECIALTY_SLIDES.length)
  }, [])

  const prevSlide = useCallback(() => {
    setCurrentSlideIndex((prev) => (prev - 1 + SPECIALTY_SLIDES.length) % SPECIALTY_SLIDES.length)
  }, [])

  // Auto-play del carrusel cada 5 segundos
  useEffect(() => {
    if (isCarouselPaused) return
    const interval = setInterval(nextSlide, 5000)
    return () => clearInterval(interval)
  }, [isCarouselPaused, nextSlide])

  // Filtrar solo las especialidades médicas (salud)
  const medicalServices = services.filter((s) => s.category === 'salud')

  const filteredServices = medicalServices.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.description || '').toLowerCase().includes(searchTerm.toLowerCase())

    if (!matchesSearch) return false

    if (selectedFilter === 'all') return true
    if (selectedFilter === 'consulta') return s.name.toLowerCase().includes('consulta') || s.name.toLowerCase().includes('medicina')
    if (selectedFilter === 'hospitalizacion') return s.name.toLowerCase().includes('hospitalizaci')
    if (selectedFilter === 'oftalmologia') return s.name.toLowerCase().includes('oftalmo')
    if (selectedFilter === 'ginecologia') return s.name.toLowerCase().includes('gineco')
    if (selectedFilter === 'odontologia') return s.name.toLowerCase().includes('odonto')
    if (selectedFilter === 'cardiologia') return s.name.toLowerCase().includes('cardio')

    return true
  })

  const handleBooking = () => {
    setActiveArea('salud')
    if (!currentUser) {
      openAuthModal('signin')
    } else {
      router.push('/#agendar-cita')
    }
  }

  const activeSlide = SPECIALTY_SLIDES[currentSlideIndex]
  const ActiveSlideIcon = activeSlide.icon

  return (
    <div className="space-y-12 pb-16 font-sans">
      {/* 1. HEADER BANNER CON LOGO OFICIAL ZENIT */}
      <section className="relative bg-gradient-to-r from-[#525862] via-[#243347] to-[#525862] text-white py-12 sm:py-16 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4 sm:gap-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-zenit.png"
                alt="Grupo Médico Zenit"
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-full bg-white p-1.5 shadow-xl shrink-0"
              />
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#02B2C6]/20 border border-[#02B2C6]/30 text-[#02B2C6] text-xs font-bold uppercase tracking-widest">
                  <Stethoscope className="w-3.5 h-3.5" />
                  <span>Grupo Médico Zenit • Acreditación MPPS</span>
                </div>
                <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white">
                  Especialidades <span className="text-[#02B2C6]">Médicas</span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Hospitalización 24/7, consultas con médicos colegiados, diagnóstico avanzado y quirófanos en CC Galerías Sebucán.
                </p>
              </div>
            </div>

            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold bg-white/10 border border-white/15 px-4 py-2 rounded-xl self-start md:self-auto backdrop-blur-sm">
              <Link href="/" className="hover:text-[#02B2C6] transition">
                Inicio
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[#02B2C6]">Especialidades</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CARRUSEL INTERACTIVO DE TODAS LAS ESPECIALIDADES (FONDO A ANCHO COMPLETO COMO EL INICIO) */}
      <section
        className="relative w-full min-h-[540px] sm:min-h-[580px] lg:min-h-[620px] flex items-center overflow-hidden bg-slate-900 select-none shadow-md"
        onMouseEnter={() => setIsCarouselPaused(true)}
        onMouseLeave={() => setIsCarouselPaused(false)}
      >
        {/* Imagen de Fondo a Ancho Completo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={activeSlide.imageUrl}
          alt={activeSlide.h1}
          className="absolute inset-0 w-full h-full object-cover object-center transform transition-transform duration-1000 scale-105"
        />

        {/* Gradiente oscuro para contraste óptimo */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/60 to-slate-900/40" />

        {/* Contenedor Centrado para la Tarjeta Flotante */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 w-full flex justify-start">
          {/* Tarjeta Flotante en Blanco Semitransparente con Borde Acento Cyan #02B2C6 */}
          <div
            className="w-full max-w-xl sm:max-w-2xl p-7 sm:p-10 rounded-md shadow-2xl border-b-4 border-[#02B2C6] space-y-4 animate-in fade-in slide-in-from-left-6 duration-700"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.92)' }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 dark:bg-cyan-950/60 text-[#02B2C6] text-xs font-black uppercase tracking-wider">
              <ActiveSlideIcon className="w-4 h-4" />
              <span>{activeSlide.badge}</span>
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-[#02B2C6]">
                {activeSlide.h1}
              </h2>
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#777777]">
                {activeSlide.h2}
              </p>
            </div>

            <p className="text-xs sm:text-sm text-[#525862] leading-relaxed font-normal">
              {activeSlide.description}
            </p>

            {/* Bullets de características */}
            <ul className="space-y-2 pt-1 border-t border-slate-100">
              {activeSlide.features.map((feat, idx) => (
                <li key={idx} className="flex items-center gap-2 text-xs text-[#525862]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#02B2C6] shrink-0" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>

            {/* Botones de Acción */}
            <div className="pt-3 flex flex-wrap items-center gap-3">
              <button
                onClick={handleBooking}
                className="px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider text-white bg-[#02B2C6] hover:bg-[#029baa] shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Calendar className="w-4 h-4" />
                <span>Agendar Cita</span>
              </button>

              <a
                href="https://wa.me/584220241622"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider text-[#525862] bg-slate-100 hover:bg-slate-200 transition flex items-center gap-2"
              >
                <WhatsAppIcon className="w-4 h-4 text-emerald-500" />
                <span>Consultar por WhatsApp</span>
              </a>

              <button
                onClick={() => setSelectedFilter(activeSlide.id)}
                className="text-xs font-bold text-[#02B2C6] hover:underline ml-auto cursor-pointer"
              >
                Filtrar en catálogo ↓
              </button>
            </div>
          </div>
        </div>

        {/* Flechas de Navegación a Ancho Completo */}
        <button
          onClick={prevSlide}
          aria-label="Especialidad anterior"
          className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-md bg-white/30 hover:bg-[#02B2C6] text-white flex items-center justify-center backdrop-blur-sm transition z-20 shadow-lg cursor-pointer active:scale-95"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          onClick={nextSlide}
          aria-label="Siguiente especialidad"
          className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-md bg-white/30 hover:bg-[#02B2C6] text-white flex items-center justify-center backdrop-blur-sm transition z-20 shadow-lg cursor-pointer active:scale-95"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Indicadores en Puntos (Dots) */}
        <div className="absolute bottom-6 right-8 z-20 hidden sm:flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full">
          {SPECIALTY_SLIDES.map((slide, idx) => (
            <button
              key={slide.id}
              onClick={() => setCurrentSlideIndex(idx)}
              className={`transition-all rounded-full cursor-pointer ${
                currentSlideIndex === idx ? 'w-6 h-2 bg-[#02B2C6]' : 'w-2 h-2 bg-white/60 hover:bg-white'
              }`}
              title={slide.h1}
            />
          ))}
        </div>
      </section>

      {/* 3. BARRA DE FILTROS Y BUSCADOR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Pestañas de Filtro Rápido */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0 scrollbar-thin">
            {[
              { id: 'all', label: 'Todas las Especialidades' },
              { id: 'consulta', label: 'Consulta General' },
              { id: 'hospitalizacion', label: 'Hospitalización 24/7' },
              { id: 'oftalmologia', label: 'Oftalmología' },
              { id: 'ginecologia', label: 'Ginecología' },
              { id: 'odontologia', label: 'Odontología' },
              { id: 'cardiologia', label: 'Cardiología' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedFilter(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  selectedFilter === tab.id
                    ? 'bg-[#02B2C6] text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-zinc-800 text-[#525862] dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Buscador en Vivo */}
          <div className="relative w-full lg:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Buscar por síntoma o especialidad..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#02B2C6]"
            />
          </div>
        </div>
      </section>

      {/* 4. CATÁLOGO DE SERVICIOS EN GRID (SIN MINUTOS) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => {
            const responsibleDoctor = doctors.find((d) => d.area === 'salud')

            return (
              <div
                key={service.id}
                className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:border-[#02B2C6]/50 transition-all duration-300 flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-[#02B2C6] flex items-center justify-center font-bold">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    {/* INFORMATIVO SANITARIO EN LUGAR DE LOS MINUTOS */}
                    <div className="flex items-center gap-1.5 text-xs text-[#02B2C6] font-semibold bg-cyan-50 dark:bg-cyan-950/60 px-2.5 py-1 rounded-full">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#02B2C6]" />
                      <span>Especialidad MPPS</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-[#525862] dark:text-zinc-100 group-hover:text-[#02B2C6] transition">
                      {service.name}
                    </h3>
                    <p className="text-xs text-[#777777] dark:text-zinc-400 mt-2 leading-[1.6]">
                      {service.description}
                    </p>
                  </div>

                  {responsibleDoctor && (
                    <div className="pt-2 flex items-center gap-2 text-[11px] text-[#777777]">
                      <Award className="w-3.5 h-3.5 text-[#02B2C6]" />
                      <span>Especialista colegiado disponible</span>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                  <div>
                    {currentUser ? (
                      <div>
                        <span className="text-[10px] text-[#777777] uppercase font-bold block">
                          Honorarios
                        </span>
                        <span className="text-base font-black text-[#525862] dark:text-white">
                          ${service.price.toFixed(2)}
                        </span>
                      </div>
                    ) : (
                      <div>
                        <span className="text-[10px] text-[#777777] uppercase font-bold block">
                          Arancel Clínico
                        </span>
                        <button
                          onClick={() => openAuthModal('signin')}
                          className="text-xs font-bold text-[#02B2C6] hover:underline"
                        >
                          Ver Tarifa
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleBooking}
                    className="px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-white bg-[#02B2C6] hover:bg-[#029baa] shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Agendar Cita</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {filteredServices.length === 0 && (
          <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 p-8">
            <Stethoscope className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700 dark:text-zinc-300">
              No se encontraron especialidades
            </h3>
            <p className="text-xs text-[#777777] mt-1">
              Prueba con otro término de búsqueda o selecciona &quot;Todas las Especialidades&quot;.
            </p>
          </div>
        )}
      </section>

      {/* 5. BANNER DE ASISTENCIA TELEFÓNICA CON LOGOS OFICIALES DE WHATSAPP E INSTAGRAM */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-[#525862] text-white p-6 sm:p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-zenit.png"
              alt="Grupo Médico Zenit"
              className="w-14 h-14 object-contain rounded-full bg-white p-1 shadow-md shrink-0"
            />
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#02B2C6]">
                Atención Inmediata & Citas Médicas
              </p>
              <h4 className="text-lg sm:text-xl font-black text-white tracking-tight">
                (422) 0241622 • CC Galerías Sebucán, Caracas
              </h4>
              <p className="text-xs text-slate-300">
                Lunes a Sábado de 8:00 AM a 7:00 PM • Hospitalización 24 Horas
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="https://wa.me/584220241622"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition flex items-center gap-2"
            >
              <WhatsAppIcon className="w-4 h-4 text-white" />
              <span>WhatsApp de Citas</span>
            </a>

            <a
              href="https://instagram.com/cmzenit"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider bg-white/10 hover:bg-white/20 text-white border border-white/20 transition flex items-center gap-2"
            >
              <InstagramIcon className="w-4 h-4 text-pink-400" />
              <span>@cmzenit</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
