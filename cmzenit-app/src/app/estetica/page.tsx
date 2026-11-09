'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCMZenit } from '@/context/CMZenitContext'
import {
  Sparkles,
  Calendar,
  Search,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Heart,
  Star,
  ShieldCheck,
} from 'lucide-react'
import { WhatsAppIcon, InstagramIcon } from '@/components/SocialIcons'

// 6 Tratamientos Estéticos del Volante Oficial CMZenit
const AESTHETIC_SLIDES = [
  {
    id: 'post-op',
    badge: 'Protocolo Post-Cirugía',
    h1: 'MASAJES POST-OPERATORIOS & DRENAJE LINFÁTICO',
    h2: 'DESINFLAMACIÓN • RECUPERACIÓN • PREVENCIÓN DE FIBROSIS',
    description:
      'Técnica manual indolora especializada para drenar edemas linfáticos, desinflamar tejidos, prevenir la formación de fibrosis y acelerar la recuperación estética con total seguridad médica.',
    features: [
      'Drenaje linfático manual por cosmiatras y fisioterapeutas',
      'Reducción visible de hematomas, dolor y retención de líquidos',
      'Seguimiento médico personalizado acorde al tiempo quirúrgico',
    ],
    imageUrl:
      'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1600&q=80',
    filterTag: 'corporal',
  },
  {
    id: 'hydrafacial',
    badge: 'Aparatología Facial de Punta',
    h1: 'HIDRAFACIAL CON RADIOFRECUENCIA FACIAL',
    h2: 'LIMPIEZA PROFUNDA • COLÁGENO • EFECTO TENSOR',
    description:
      'Tratamiento hidro-dermoabrasivo con succión vorticial que extrae impurezas de los poros sin dolor, infusiona sueros de ácido hialurónico y reactiva el colágeno con radiofrecuencia tensora.',
    features: [
      'Limpieza profunda, exfoliación e hidratación dérmica simultánea',
      'Radiofrecuencia bipolar para compactar el óvalo facial',
      'Resultados de luminosidad y tersura desde la primera sesión',
    ],
    imageUrl:
      'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1600&q=80',
    filterTag: 'facial',
  },
  {
    id: 'dermoabrasion',
    badge: 'Renovación Cutánea',
    h1: 'DERMOABRASIÓN PUNTA DIAMANTE & PEELING',
    h2: 'MICROEXFOLIACIÓN • LUMINOSIDAD • POROS CERRADOS',
    description:
      'Exfoliación mecánica controlada que remueve la capa córnea engrosada y comedones mediante cabezales de diamante médico y espátula ultrasónica de alta vibración.',
    features: [
      'Atenuación suave de manchas superficiales y líneas de expresión',
      'Peeling ultrasónico sin enrojecimiento ni daño tisular',
      'Apertura de canales para máxima absorción de activos botánicos',
    ],
    imageUrl:
      'https://images.unsplash.com/photo-1512290900672-1f02e604f569?auto=format&fit=crop&w=1600&q=80',
    filterTag: 'facial',
  },
  {
    id: 'laser',
    badge: 'Depilación Permanente',
    h1: 'DEPILACIÓN LÁSER DIODO CON CABEZAL FRÍO',
    h2: 'SISTEMA DE ENFRIAMIENTO ZAFIRO • MÁXIMO CONFORT',
    description:
      'Eliminación progresiva y definitiva del vello corporal y facial. La punta refrigerada a temperatura bajo cero protege la epidermis logrando sesiones 100% confortables e indoloras.',
    features: [
      'Tecnología segura y certificada para todo tipo de fototipos cutáneos',
      'Enfriamiento dinámico de zafiro para evitar ardor o quemaduras',
      'Efectividad comprobada en zonas pequeñas y corporales extensas',
    ],
    imageUrl:
      'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?auto=format&fit=crop&w=1600&q=80',
    filterTag: 'laser',
  },
  {
    id: 'anticelulitico',
    badge: 'Escultura Corporal No Invasiva',
    h1: 'ANTICELULÍTICOS 4 EN 1 & VACUMTERAPIA',
    h2: 'CAVITACIÓN • RADIOFRECUENCIA • DRENAJE TONIFICANTE',
    description:
      'Tratamiento reductor y remodelador intensivo que fusiona ultracavitación para disolver grasa localizada, vacumterapia para despegar adherencias y radiofrecuencia tensora.',
    features: [
      'Alisamiento visible de la textura de piel de naranja',
      'Drenaje de toxinas y activación microcirculatoria',
      'Tonificación de glúteos, abdomen, flancos y piernas',
    ],
    imageUrl:
      'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=1600&q=80',
    filterTag: 'corporal',
  },
  {
    id: 'fototerapia',
    badge: 'Crioterapia & Fotónica Dérmica',
    h1: 'FOTOTERAPIA MÁSCARA LED & MARTILLO EN FRÍO',
    h2: 'REGENERACIÓN CELULAR • CALMANTE • CIERRE DE POROS',
    description:
      'Terapia espectral con longitudes de onda roja (síntesis de colágeno), azul (efecto bactericida para el acné) y verde (homogeneización del tono), finalizada con crioterapia para sellar nutrientes.',
    features: [
      'Acción calmante y antiinflamatoria dérmica inmediata',
      'Martillo en frío que minimiza el tamaño de los poros',
      'Sellado con protector solar dermatológico con filtro UV mineral',
    ],
    imageUrl:
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1600&q=80',
    filterTag: 'aparatologia',
  },
]

export default function EsteticaPage() {
  const { services, currentUser, openAuthModal, setActiveArea } = useCMZenit()
  const router = useRouter()
  const [selectedFilter, setSelectedFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Estado del Carrusel Interactivo de Estética
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [isCarouselPaused, setIsCarouselPaused] = useState(false)

  const nextSlide = useCallback(() => {
    setCurrentSlideIndex((prev) => (prev + 1) % AESTHETIC_SLIDES.length)
  }, [])

  const prevSlide = useCallback(() => {
    setCurrentSlideIndex((prev) => (prev - 1 + AESTHETIC_SLIDES.length) % AESTHETIC_SLIDES.length)
  }, [])

  // Auto-play del carrusel cada 5 segundos
  useEffect(() => {
    if (isCarouselPaused) return
    const interval = setInterval(nextSlide, 5000)
    return () => clearInterval(interval)
  }, [isCarouselPaused, nextSlide])

  // Filtrar solo los servicios estéticos
  const aestheticServices = services.filter((s) => s.category === 'estetica')

  const filteredServices = aestheticServices.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.description || '').toLowerCase().includes(searchTerm.toLowerCase())

    if (!matchesSearch) return false

    if (selectedFilter === 'all') return true
    if (selectedFilter === 'facial') return s.name.toLowerCase().includes('facial') || s.name.toLowerCase().includes('hidra') || s.name.toLowerCase().includes('peeling') || s.name.toLowerCase().includes('dermo')
    if (selectedFilter === 'corporal') return s.name.toLowerCase().includes('masaje') || s.name.toLowerCase().includes('anticelul') || s.name.toLowerCase().includes('corporal')
    if (selectedFilter === 'laser') return s.name.toLowerCase().includes('lser') || s.name.toLowerCase().includes('laser')
    if (selectedFilter === 'aparatologia') return s.name.toLowerCase().includes('radiofrecuencia') || s.name.toLowerCase().includes('ultrasonido') || s.name.toLowerCase().includes('led') || s.name.toLowerCase().includes('martillo')

    return true
  })

  const handleBooking = () => {
    setActiveArea('estetica')
    if (!currentUser) {
      openAuthModal('signin')
    } else {
      router.push('/#agendar-cita')
    }
  }

  const activeSlide = AESTHETIC_SLIDES[currentSlideIndex]

  return (
    <div className="space-y-12 pb-16 font-sans">
      {/* 1. HEADER BANNER UNIFICADO CON PALETA DE DISEÑO (Gris Pizarra #525862 y Cian #02B2C6) */}
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
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Grupo Médico Zenit • Espacio Estética Médica</span>
                </div>
                <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white">
                  Espacio de <span className="text-[#02B2C6]">Estética</span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Ciencia médica y aparatología avanzada: masajes postquirúrgicos, hidrafacial con radiofrecuencia y depilación láser en CC Galerías Sebucán.
                </p>
              </div>
            </div>

            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold bg-white/10 border border-white/15 px-4 py-2 rounded-xl self-start md:self-auto backdrop-blur-sm">
              <Link href="/" className="hover:text-[#02B2C6] transition">
                Inicio
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[#02B2C6]">Espacio Estética</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CARRUSEL INTERACTIVO DE TRATAMIENTOS ESTÉTICOS (FONDO A ANCHO COMPLETO COMO EL INICIO) */}
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

        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/60 to-slate-900/40" />

        {/* Contenedor Centrado para la Tarjeta Flotante */}
        <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-16 w-full flex justify-start">
          {/* Tarjeta Flotante en Blanco Semitransparente con Borde Acento Cyan #02B2C6 */}
          <div
            className="w-full max-w-xl sm:max-w-2xl p-4 sm:p-7 md:p-10 rounded-xl shadow-2xl border-b-4 border-[#02B2C6] space-y-3 sm:space-y-4 animate-in fade-in slide-in-from-left-6 duration-700 overflow-hidden"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.94)' }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 dark:bg-cyan-950/60 text-[#02B2C6] text-xs font-black uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>{activeSlide.badge}</span>
            </div>

            <div className="space-y-1">
              <h2 className="text-xl sm:text-3xl font-extrabold uppercase tracking-tight text-[#02B2C6] leading-tight break-words hyphens-auto">
                {activeSlide.h1}
              </h2>
              <p className="text-[11px] sm:text-xs md:text-sm font-semibold uppercase tracking-wider text-[#777777] break-words">
                {activeSlide.h2}
              </p>
            </div>

            <p className="text-xs sm:text-sm text-[#525862] leading-relaxed font-normal line-clamp-4 sm:line-clamp-none">
              {activeSlide.description}
            </p>

            <ul className="space-y-1.5 sm:space-y-2 pt-1 border-t border-slate-100">
              {activeSlide.features.map((feat, idx) => (
                <li key={idx} className="flex items-center gap-2 text-xs text-[#525862]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#02B2C6] shrink-0" />
                  <span className="truncate sm:whitespace-normal">{feat}</span>
                </li>
              ))}
            </ul>

            {/* Botones de Acción */}
            <div className="pt-2 sm:pt-3 grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-2.5 sm:gap-3">
              <button
                onClick={handleBooking}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider text-white bg-[#02B2C6] hover:bg-[#029baa] shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Calendar className="w-4 h-4" />
                <span>Agendar Sesión</span>
              </button>

              <a
                href="https://wa.me/584220241622"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider text-[#525862] bg-slate-100 hover:bg-slate-200 transition flex items-center justify-center gap-2"
              >
                <WhatsAppIcon className="w-4 h-4 text-emerald-500" />
                <span>Consultar por WhatsApp</span>
              </a>

              <button
                onClick={() => setSelectedFilter(activeSlide.filterTag)}
                className="text-xs font-bold text-[#02B2C6] hover:underline sm:ml-auto text-center sm:text-left cursor-pointer py-1"
              >
                Ver en catálogo ↓
              </button>
            </div>
          </div>
        </div>

        {/* Flechas de Navegación del Carrusel a Ancho Completo (Ocultas en móvil) */}
        <button
          onClick={prevSlide}
          aria-label="Tratamiento anterior"
          className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-md bg-white/30 hover:bg-[#02B2C6] text-white hidden md:flex items-center justify-center backdrop-blur-sm transition z-20 shadow-lg cursor-pointer active:scale-95"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          onClick={nextSlide}
          aria-label="Siguiente tratamiento"
          className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-md bg-white/30 hover:bg-[#02B2C6] text-white hidden md:flex items-center justify-center backdrop-blur-sm transition z-20 shadow-lg cursor-pointer active:scale-95"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Dots Indicadores - Visibles y centrados en móvil */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:bottom-6 sm:right-8 z-20 flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full">
          {AESTHETIC_SLIDES.map((slide, idx) => (
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

      {/* 3. SHOWCASE DETALLADO DEL VOLANTE CMZENIT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-10 shadow-xl">
          {/* Encabezado con Logo Oficial de Zenit */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-100 dark:border-zinc-800">
            <div className="text-center sm:text-left space-y-1">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#02B2C6]">
                Protocolos Oficiales CMZenit
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#525862] dark:text-white uppercase">
                Tratamientos Corporales & Faciales con Aparatología
              </h2>
              <p className="text-xs text-[#777777] dark:text-zinc-400 max-w-xl leading-[1.6]">
                Diseñados y aplicados bajo estricta supervisión médica por cosmiatras y especialistas certificados.
              </p>
            </div>

            <div className="flex items-center gap-3 bg-white dark:bg-zinc-800 px-5 py-3 rounded-2xl shadow-md border border-slate-100 dark:border-zinc-700">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-zenit.png"
                alt="Grupo Médico Zenit"
                className="w-12 h-12 object-contain rounded-full shadow-inner"
              />
              <div className="text-left">
                <span className="block font-black text-xs text-[#525862] dark:text-white uppercase">
                  Grupo Médico Zenit
                </span>
                <span className="text-[10px] font-semibold text-[#02B2C6]">
                  Espacio Estética Médica
                </span>
              </div>
            </div>
          </div>

          {/* Dos Columnas: Masajes y Corporal vs Facial con Aparatología */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8">
            {/* Columna 1: Masajes y Corporal */}
            <div className="bg-slate-50/70 dark:bg-zinc-800/60 rounded-2xl p-6 border border-slate-100 dark:border-zinc-700/60 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200 dark:border-zinc-700">
                <div className="w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-950 text-[#02B2C6] flex items-center justify-center font-bold">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base uppercase tracking-wider text-[#525862] dark:text-white">
                  Masajes y Corporal
                </h3>
              </div>

              <ul className="space-y-3.5 text-xs text-slate-700 dark:text-zinc-300">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#02B2C6] shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold text-[#525862] dark:text-white">Masajes Post-Operatorios:</strong>
                    <span className="text-[#777777] dark:text-zinc-400 ml-1">Drenaje linfático manual para eliminar edemas, desinflamar tejidos y prevenir fibrosis postcirugía.</span>
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#02B2C6] shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold text-[#525862] dark:text-white">Masajes Relajantes:</strong>
                    <span className="text-[#777777] dark:text-zinc-400 ml-1">Técnicas manuales suaves para liberar tensiones corporales acumuladas y restaurar la serenidad.</span>
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#02B2C6] shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold text-[#525862] dark:text-white">Masajes Antiestrés:</strong>
                    <span className="text-[#777777] dark:text-zinc-400 ml-1">Enfoque cervical y dorsal con aromaterapia para descargar puntos de estrés muscular.</span>
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#02B2C6] shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold text-[#525862] dark:text-white">Anticelulíticos 4 en 1:</strong>
                    <span className="text-[#777777] dark:text-zinc-400 ml-1">Combinación de cavitación, radiofrecuencia, vacumterapia y drenaje para tonificar y alisar la piel.</span>
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#02B2C6] shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold text-[#525862] dark:text-white">Depilación Láser Diodo:</strong>
                    <span className="text-[#777777] dark:text-zinc-400 ml-1">Eliminación progresiva y definitiva del vello con sistema de enfriamiento de zafiro para máximo confort.</span>
                  </div>
                </li>
              </ul>
            </div>

            {/* Columna 2: Facial con Aparatología */}
            <div className="bg-slate-50/70 dark:bg-zinc-800/60 rounded-2xl p-6 border border-slate-100 dark:border-zinc-700/60 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200 dark:border-zinc-700">
                <div className="w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-950 text-[#02B2C6] flex items-center justify-center font-bold">
                  <Heart className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base uppercase tracking-wider text-[#525862] dark:text-white">
                  Facial con Aparatología
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { name: 'Hidrafacial Radiofrecuencia', desc: 'Estimulación de colágeno' },
                  { name: 'Ultrasonido Facial', desc: 'Penetración de activos' },
                  { name: 'Dermoabrasión Punta Diamante', desc: 'Exfoliación profunda' },
                  { name: 'Peeling Ultrasónico', desc: 'Limpieza de impurezas' },
                  { name: 'Martillo en Frío', desc: 'Cierra poros y calma' },
                  { name: 'Máscara LED', desc: 'Fototerapia dérmica' },
                  { name: 'Hidratación Profunda', desc: 'Ácido hialurónico' },
                  { name: 'Protector Solar Premium', desc: 'Escudo UV fotoprotector' },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700/50 flex flex-col justify-between"
                  >
                    <span className="font-bold text-[#525862] dark:text-white text-[11px] leading-tight">
                      {item.name}
                    </span>
                    <span className="text-[10px] text-[#777777] dark:text-zinc-400 mt-1">
                      {item.desc}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FILTROS Y GRID DE TRATAMIENTOS (SIN MINUTOS, CON PALETA UNIFICADA) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0 scrollbar-thin">
            {[
              { id: 'all', label: 'Todos los Tratamientos' },
              { id: 'facial', label: 'Facial & Skincare' },
              { id: 'corporal', label: 'Masajes & Corporal' },
              { id: 'laser', label: 'Depilación Láser' },
              { id: 'aparatologia', label: 'Aparatología' },
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
              placeholder="Buscar por tratamiento estético..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#02B2C6]"
            />
          </div>
        </div>

        {/* Grid de Tratamientos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:border-[#02B2C6]/50 transition-all duration-300 flex flex-col justify-between group"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-[#02B2C6] flex items-center justify-center font-bold">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  {/* INFORMATIVO ESTÉTICO EN LUGAR DE LOS MINUTOS */}
                  <div className="flex items-center gap-1.5 text-xs text-[#02B2C6] font-semibold bg-cyan-50 dark:bg-cyan-950/60 px-2.5 py-1 rounded-full">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#02B2C6]" />
                    <span>Protocolo Zenit</span>
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

                {service.promo_tag && (
                  <div className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                    <span>{service.promo_tag}</span>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  {currentUser ? (
                    <div>
                      <span className="text-[10px] text-[#777777] uppercase font-bold block">
                        Precio Sesión
                      </span>
                      <span className="text-base font-black text-[#525862] dark:text-white">
                        ${service.price.toFixed(2)}
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-[10px] text-[#777777] uppercase font-bold block">
                        Tarifa Especial
                      </span>
                      <button
                        onClick={() => openAuthModal('signin')}
                        className="text-xs font-bold text-[#02B2C6] hover:underline"
                      >
                        Ver Precio
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
          ))}
        </div>

        {filteredServices.length === 0 && (
          <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 p-8">
            <Sparkles className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700 dark:text-zinc-300">
              No se encontraron tratamientos
            </h3>
            <p className="text-xs text-[#777777] mt-1">
              Prueba con otro término de búsqueda o selecciona &quot;Todos los Tratamientos&quot;.
            </p>
          </div>
        )}
      </section>

      {/* 5. BANNER DE ASISTENCIA TELEFÓNICA CON LOGOS DE WHATSAPP E INSTAGRAM */}
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
                Atención Estética Personalizada
              </p>
              <h4 className="text-lg sm:text-xl font-black text-white tracking-tight">
                (422) 0241622 • CC Galerías Sebucán
              </h4>
              <p className="text-xs text-slate-300">
                Lunes a Sábado de 8:00 AM a 7:00 PM • Previa Cita
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
