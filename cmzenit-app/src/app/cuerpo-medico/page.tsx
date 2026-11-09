'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCMZenit } from '@/context/CMZenitContext'
import { Doctor } from '@/types/database.types'
import {
  Stethoscope,
  Calendar,
  Clock,
  ShieldCheck,
  Search,
  ChevronRight,
  ChevronLeft,
  Award,
  CheckCircle2,
} from 'lucide-react'
import { WhatsAppIcon, InstagramIcon } from '@/components/SocialIcons'

export default function CuerpoMedicoPage() {
  const { doctors, currentUser, openAuthModal, setActiveArea } = useCMZenit()
  const router = useRouter()
  const [selectedFilter, setSelectedFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Estado del Carrusel de Especialistas
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [isCarouselPaused, setIsCarouselPaused] = useState(false)

  const nextSlide = useCallback(() => {
    setCurrentSlideIndex((prev) => (prev + 1) % doctors.length)
  }, [doctors.length])

  const prevSlide = useCallback(() => {
    setCurrentSlideIndex((prev) => (prev - 1 + doctors.length) % doctors.length)
  }, [doctors.length])

  // Auto-play del carrusel cada 5 segundos
  useEffect(() => {
    if (isCarouselPaused || doctors.length === 0) return
    const interval = setInterval(nextSlide, 5000)
    return () => clearInterval(interval)
  }, [isCarouselPaused, nextSlide, doctors.length])

  const filteredDoctors = doctors.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.specialty_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.mpps_license.toLowerCase().includes(searchTerm.toLowerCase())

    if (!matchesSearch) return false

    if (selectedFilter === 'all') return true
    if (selectedFilter === 'salud') return doc.area === 'salud'
    if (selectedFilter === 'estetica') return doc.area === 'estetica'
    if (selectedFilter === 'ginecologia') return doc.specialty_name.toLowerCase().includes('gineco')
    if (selectedFilter === 'oftalmologia') return doc.specialty_name.toLowerCase().includes('oftalmo')
    if (selectedFilter === 'odontologia') return doc.specialty_name.toLowerCase().includes('odonto')
    if (selectedFilter === 'cardiologia') return doc.specialty_name.toLowerCase().includes('cardio')

    return true
  })

  const handleBooking = (doctor: Doctor) => {
    setActiveArea(doctor.area)
    if (!currentUser) {
      openAuthModal('signin')
    } else {
      router.push('/#agendar-cita')
    }
  }

  const activeDoc = doctors[currentSlideIndex] || doctors[0]

  return (
    <div className="space-y-12 pb-16 font-sans">
      {/* 1. HEADER BANNER UNIFICADO CON PALETA DE DISEÑO */}
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
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Directorio Médico Oficial MPPS</span>
                </div>
                <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white">
                  Cuerpo Médico <span className="text-[#02B2C6]">Colegiado</span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Especialistas médicos y cosmiatras certificados ante el Ministerio de Salud (MPPS). Ética profesional, trayectoria hospitalaria y calidez humana.
                </p>
              </div>
            </div>

            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold bg-white/10 border border-white/15 px-4 py-2 rounded-xl self-start md:self-auto backdrop-blur-sm">
              <Link href="/" className="hover:text-[#02B2C6] transition">
                Inicio
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[#02B2C6]">Cuerpo Médico</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CARRUSEL INTERACTIVO DE DOCTORES / ESPECIALISTAS (FONDO A ANCHO COMPLETO COMO EL INICIO) */}
      {activeDoc && (
        <section
          className="relative w-full min-h-[520px] sm:min-h-[560px] lg:min-h-[600px] flex items-center overflow-hidden bg-slate-900 select-none shadow-md"
          onMouseEnter={() => setIsCarouselPaused(true)}
          onMouseLeave={() => setIsCarouselPaused(false)}
        >
          {/* Fondo con Fotografía Médica Profesional a Ancho Completo */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-all duration-1000 transform scale-105"
            style={{
              backgroundImage:
                activeDoc.area === 'estetica'
                  ? 'url(https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1920&q=80)'
                  : 'url(https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=1920&q=80)',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/70 to-slate-900/40" />

          {/* Tarjeta Flotante en Blanco Semitransparente con Borde Acento Cyan #02B2C6 */}
          <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-16 w-full flex justify-start">
            <div
              className="w-full max-w-xl sm:max-w-2xl p-4 sm:p-7 md:p-10 rounded-xl shadow-2xl space-y-3 sm:space-y-4 border-b-4 border-[#02B2C6] animate-in fade-in slide-in-from-left-6 duration-700 overflow-hidden"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.94)' }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-cyan-50 dark:bg-cyan-950/60 text-[#02B2C6]">
                  <Stethoscope className="w-3.5 h-3.5" />
                  <span>{activeDoc.area === 'estetica' ? 'Espacio Estética' : 'Especialidad Médica'}</span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-[#02B2C6] font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="hidden sm:inline">Acreditación MPPS Activa</span>
                  <span className="sm:hidden">MPPS</span>
                </div>
              </div>

              {/* Nombre y Especialidad */}
              <div className="space-y-1">
                <h2 className="text-xl sm:text-3xl font-extrabold uppercase tracking-tight text-[#02B2C6] leading-tight break-words hyphens-auto">
                  {activeDoc.name}
                </h2>
                <p className="text-[11px] sm:text-xs md:text-sm font-semibold uppercase tracking-wider text-[#777777] break-words">
                  {activeDoc.specialty_name}
                </p>
              </div>

              {/* Credenciales y Horario */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 pt-2 border-t border-slate-100">
                <div className="bg-slate-50 p-2.5 sm:p-3 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Licencia Sanitaria</span>
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#525862]">
                    <Award className="w-4 h-4 text-[#02B2C6] shrink-0" />
                    <span className="truncate">{activeDoc.mpps_license}</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-2.5 sm:p-3 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Horario de Consultas</span>
                  <div className="flex items-center gap-2 text-xs font-bold text-[#525862]">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate">{activeDoc.schedule_text}</span>
                  </div>
                </div>
              </div>

              {/* Puntos destacados de atención */}
              <ul className="space-y-1.5 text-xs text-[#777777]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#02B2C6] shrink-0" />
                  <span className="truncate sm:whitespace-normal">Historia clínica confidencial y récipes médicos digitales</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#02B2C6] shrink-0" />
                  <span className="truncate sm:whitespace-normal">Consultorios equipados en CC Galerías Sebucán, Caracas</span>
                </li>
              </ul>

              {/* Botón Agendar Consulta */}
              <div className="pt-2 sm:pt-3 grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-2.5 sm:gap-3">
                <button
                  onClick={() => handleBooking(activeDoc)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider text-white bg-[#02B2C6] hover:bg-[#029baa] shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Agendar Consulta</span>
                </button>

                <a
                  href="https://wa.me/584220241622"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider text-[#525862] bg-slate-100 hover:bg-slate-200 transition flex items-center justify-center gap-2"
                >
                  <WhatsAppIcon className="w-4 h-4 text-emerald-500" />
                  <span>WhatsApp Recepción</span>
                </a>
              </div>
            </div>
          </div>

          {/* Flechas de Navegación a Ancho Completo (Ocultas en móvil) */}
          <button
            onClick={prevSlide}
            aria-label="Doctor anterior"
            className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-md bg-white/30 hover:bg-[#02B2C6] text-white hidden md:flex items-center justify-center backdrop-blur-sm transition z-20 shadow-lg cursor-pointer active:scale-95"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={nextSlide}
            aria-label="Siguiente doctor"
            className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-md bg-white/30 hover:bg-[#02B2C6] text-white hidden md:flex items-center justify-center backdrop-blur-sm transition z-20 shadow-lg cursor-pointer active:scale-95"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Indicadores en Puntos (Dots) - Visibles y centrados en móvil */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:bottom-6 sm:right-8 z-20 flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full">
            {doctors.map((d, idx) => (
              <button
                key={d.id}
                onClick={() => setCurrentSlideIndex(idx)}
                className={`transition-all rounded-full cursor-pointer ${
                  currentSlideIndex === idx ? 'w-6 h-2 bg-[#02B2C6]' : 'w-2 h-2 bg-white/60 hover:bg-white'
                }`}
                title={d.name}
              />
            ))}
          </div>
        </section>
      )}

      {/* 3. BARRA DE FILTROS Y BÚSQUEDA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0 scrollbar-thin">
            {[
              { id: 'all', label: 'Todos los Especialistas' },
              { id: 'salud', label: 'Especialidades Médicas' },
              { id: 'estetica', label: 'Espacio Estética' },
              { id: 'ginecologia', label: 'Ginecología' },
              { id: 'oftalmologia', label: 'Oftalmología' },
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

          <div className="relative w-full lg:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Buscar por médico o especialidad..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#02B2C6]"
            />
          </div>
        </div>
      </section>

      {/* 4. GRID DE PERFILES DE ESPECIALISTAS (SIN MINUTOS, CON PALETA UNIFICADA) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredDoctors.map((doc) => {
            return (
              <div
                key={doc.id}
                className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:border-[#02B2C6]/50 transition-all duration-300 flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  {/* Avatar con Insignia de Área Unificada */}
                  <div className="relative flex justify-center">
                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center font-black text-2xl text-white shadow-lg transition-transform group-hover:scale-105 bg-gradient-to-br from-[#02B2C6] to-[#525862] shadow-cyan-500/20">
                      {doc.name
                        .replace('Dr. ', '')
                        .replace('Dra. ', '')
                        .replace('Lic. ', '')
                        .charAt(0)}
                    </div>
                    <div className="absolute -bottom-2 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider text-white shadow-sm flex items-center gap-1 bg-[#02B2C6]">
                      <Stethoscope className="w-2.5 h-2.5" />
                      <span>{doc.area === 'estetica' ? 'Estética' : 'Salud'}</span>
                    </div>
                  </div>

                  {/* Nombre y Especialidad */}
                  <div className="text-center pt-2">
                    <h3 className="text-base font-bold text-[#525862] dark:text-zinc-100 group-hover:text-[#02B2C6] transition">
                      {doc.name}
                    </h3>
                    <p className="text-xs font-semibold text-[#02B2C6] dark:text-cyan-400 mt-0.5">
                      {doc.specialty_name}
                    </p>
                  </div>

                  {/* Licencia MPPS y Horarios de Atención (Sin Minutos) */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-zinc-800 text-[11px] text-[#777777] dark:text-zinc-400">
                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-zinc-800/60 p-2 rounded-xl">
                      <ShieldCheck className="w-4 h-4 text-[#02B2C6] shrink-0" />
                      <span className="font-mono font-medium truncate">{doc.mpps_license}</span>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-zinc-800/60 p-2 rounded-xl">
                      <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="truncate">{doc.schedule_text}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-zinc-800">
                  <button
                    onClick={() => handleBooking(doc)}
                    className="w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-white bg-[#02B2C6] hover:bg-[#029baa] shadow-md shadow-cyan-600/20 transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Agendar con Especialista</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* 5. BANNER DE ACREDITACIÓN CON LOGO OFICIAL Y REDES */}
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
                Acreditación Sanitaria Oficial
              </p>
              <h4 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Cuerpo Médico Colegiado • MPPS N° 45.892
              </h4>
              <p className="text-xs text-slate-300">
                Garantizamos protocolos de bioseguridad, historia médica digital y confidencialidad en CC Galerías Sebucán.
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
              <span>Consultar Disponibilidad</span>
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
