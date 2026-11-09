'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCMZenit } from '@/context/CMZenitContext'
import {
  MessageSquare,
  X,
  Send,
  MapPin,
  Clock,
  Calendar,
  DollarSign,
  Stethoscope,
  Sparkles,
  Bot,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Maximize2,
  Minimize2,
  ChevronUp,
  ChevronDown,
  Home,
  RotateCcw,
} from 'lucide-react'
import { WhatsAppIcon } from '@/components/SocialIcons'

interface QuickAction {
  label: string
  query: string
  icon: React.ReactNode
}

interface Message {
  id: string
  sender: 'bot' | 'user'
  text: string
  timestamp: string
  actionType?: 'prices' | 'location' | 'services' | 'schedules' | 'booking' | 'doctor'
  categoryFilter?: 'salud' | 'estetica' | 'all'
}

let globalMsgCounter = 0
function getMsgId(prefix: string): string {
  globalMsgCounter += 1
  return `${prefix}-${globalMsgCounter}`
}

export function Chatbot() {
  const { services, doctors, currentUser, openAuthModal, setActiveArea } = useCMZenit()
  const router = useRouter()

  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [showWelcomeBubble, setShowWelcomeBubble] = useState(true)
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isQuickActionsVisible, setIsQuickActionsVisible] = useState(true)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Mensaje de bienvenida inicial
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      sender: 'bot',
      text: '¡Hola! 👋 Te doy la bienvenida al Asistente Virtual de Grupo Médico Zenit. Estoy aquí para brindarte información en tiempo real las 24 horas del día.',
      timestamp: 'Ahora',
    },
    {
      id: 'welcome-2',
      sender: 'bot',
      text: '¿En qué te puedo ayudar hoy? Puedes seleccionar una de las opciones rápidas o escribirme directamente.',
      timestamp: 'Ahora',
    },
  ])

  // Reiniciar la conversación al Menú de Inicio limpio
  const handleResetToHome = () => {
    setMessages([
      {
        id: getMsgId('welcome-1'),
        sender: 'bot',
        text: '¡Hola! 👋 Te doy la bienvenida al Asistente Virtual de Grupo Médico Zenit. Estoy aquí para brindarte información en tiempo real las 24 horas del día.',
        timestamp: 'Ahora',
      },
      {
        id: getMsgId('welcome-2'),
        sender: 'bot',
        text: '¿En qué te puedo orientar hoy? Aquí tienes las opciones principales del Menú de Inicio o puedes escribirme directamente:',
        timestamp: 'Ahora',
        actionType: 'services',
      },
    ])
    setIsQuickActionsVisible(true)
    setInputValue('')
  }

  // Scroll automático hacia el último mensaje
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom()
    }
  }, [messages, isOpen, isMinimized, isTyping])

  // Ocultar la burbuja flotante tras 15 segundos si el usuario no interactúa
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcomeBubble(false)
    }, 15000)
    return () => clearTimeout(timer)
  }, [])

  // Botones de acción rápida solicitados por el usuario
  const quickActions: QuickAction[] = [
    {
      label: 'Consultar Precios',
      query: 'precios',
      icon: <DollarSign className="w-3.5 h-3.5 text-[#02B2C6]" />,
    },
    {
      label: 'Ubicación y Sede',
      query: 'ubicacion',
      icon: <MapPin className="w-3.5 h-3.5 text-[#02B2C6]" />,
    },
    {
      label: 'Servicios Médicos',
      query: 'servicios',
      icon: <Stethoscope className="w-3.5 h-3.5 text-[#02B2C6]" />,
    },
    {
      label: 'Horarios de Atención',
      query: 'horarios',
      icon: <Clock className="w-3.5 h-3.5 text-[#02B2C6]" />,
    },
  ]

  // Motor conversacional heurístico e inteligente
  const processQuery = (rawText: string) => {
    const query = rawText.toLowerCase().trim()

    // 0. MENÚ DE INICIO / VOLVER
    if (
      query === 'inicio' ||
      query === 'menu' ||
      query === 'menú' ||
      query.includes('menu de inicio') ||
      query.includes('menú de inicio') ||
      query.includes('menu principal') ||
      query.includes('menú principal') ||
      query.includes('volver al inicio') ||
      query.includes('reiniciar') ||
      query === 'hola' ||
      query === 'buenas' ||
      query === 'empezar'
    ) {
      return {
        text: '¡Estás en el Menú de Inicio de ZenitBot! 👋 Te puedo orientar en lo que necesites: consulta aranceles de precios, ubicación de nuestra sede en Galerías Sebucán, especialidades médicas, estética o agendar tu cita:',
        actionType: 'services' as const,
      }
    }

    // 1. CONSULTA DE PRECIOS
    if (
      query.includes('precio') ||
      query.includes('costo') ||
      query.includes('cuanto') ||
      query.includes('cuánto') ||
      query.includes('tarifa') ||
      query.includes('arancel') ||
      query.includes('valor')
    ) {
      let filter: 'salud' | 'estetica' | 'all' = 'all'
      if (query.includes('estet') || query.includes('masaje') || query.includes('facial') || query.includes('laser')) {
        filter = 'estetica'
      } else if (query.includes('salud') || query.includes('medic') || query.includes('doctor') || query.includes('consulta')) {
        filter = 'salud'
      }

      return {
        text: 'Aquí tienes nuestro arancel de precios oficial en dólares (USD). Todos nuestros procedimientos son realizados por personal médico y cosmiatras acreditados:',
        actionType: 'prices' as const,
        categoryFilter: filter,
      }
    }

    // 2. CONSULTA DE UBICACIÓN
    if (
      query.includes('ubicacion') ||
      query.includes('ubicación') ||
      query.includes('donde') ||
      query.includes('dónde') ||
      query.includes('direccion') ||
      query.includes('dirección') ||
      query.includes('llegar') ||
      query.includes('sebucan') ||
      query.includes('sebucán') ||
      query.includes('caracas') ||
      query.includes('sede')
    ) {
      return {
        text: 'Nuestra sede principal se encuentra ubicada en una zona de fácil acceso y máxima seguridad en Caracas:',
        actionType: 'location' as const,
      }
    }

    // 3. CONSULTA DE HORARIOS
    if (
      query.includes('horario') ||
      query.includes('hora') ||
      query.includes('abren') ||
      query.includes('cierran') ||
      query.includes('sabado') ||
      query.includes('sábado') ||
      query.includes('domingo') ||
      query.includes('emergencia') ||
      query.includes('atencion') ||
      query.includes('atención')
    ) {
      return {
        text: 'Contamos con atención ininterrumpida para emergencias y consultas programadas de lunes a sábado:',
        actionType: 'schedules' as const,
      }
    }

    // 4. AGENDAR CITA
    if (
      query.includes('agendar') ||
      query.includes('cita') ||
      query.includes('turno') ||
      query.includes('reservar') ||
      query.includes('apartar') ||
      query.includes('consulta medica') ||
      query.includes('pedir cita')
    ) {
      return {
        text: '¡Con gusto te ayudo a coordinar tu cita! Puedes iniciar el proceso en línea directamente o contactar a nuestra recepcionista por WhatsApp:',
        actionType: 'booking' as const,
      }
    }

    // 5. CONSULTA DE SERVICIOS
    if (
      query.includes('servicio') ||
      query.includes('especialidad') ||
      query.includes('oftalmo') ||
      query.includes('gineco') ||
      query.includes('odonto') ||
      query.includes('cardio') ||
      query.includes('pediat') ||
      query.includes('hospital') ||
      query.includes('quirurg') ||
      query.includes('quirúrg') ||
      query.includes('tratamiento')
    ) {
      return {
        text: 'En Grupo Médico Zenit combinamos cuidados clínicos hospitalarios de alta complejidad con medicina dermoestética avanzada:',
        actionType: 'services' as const,
      }
    }

    // 6. CUERPO MÉDICO
    if (
      query.includes('doctor') ||
      query.includes('medico') ||
      query.includes('médico') ||
      query.includes('especialista') ||
      query.includes('mpps')
    ) {
      return {
        text: 'Nuestro cuerpo médico cuenta con más de 8 especialistas colegiados certificados ante el Ministerio de Salud (MPPS):',
        actionType: 'doctor' as const,
      }
    }

    // RESPUESTA POR DEFECTO
    return {
      text: `Entiendo tu mensaje sobre "${rawText}". Como asistente virtual de Zenit, puedo darte información inmediata de precios, ubicación, servicios, horarios o ayudarte a agendar tu cita:`,
      actionType: 'services' as const,
    }
  }

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputValue).trim()
    if (!text) return

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const userMsg: Message = {
      id: getMsgId('usr'),
      sender: 'user',
      text,
      timestamp: now,
    }

    setMessages((prev) => [...prev, userMsg])
    setInputValue('')
    setIsTyping(true)
    setShowWelcomeBubble(false)

    // Simular tiempo de respuesta natural del bot (500ms)
    setTimeout(() => {
      const response = processQuery(text)
      const botMsg: Message = {
        id: getMsgId('bot'),
        sender: 'bot',
        text: response.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionType: response.actionType,
        categoryFilter: response.categoryFilter,
      }
      setMessages((prev) => [...prev, botMsg])
      setIsTyping(false)
    }, 600)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleBookFromChat = (area: 'salud' | 'estetica') => {
    setActiveArea(area)
    setIsOpen(false)
    if (!currentUser) {
      openAuthModal('signin')
    } else {
      router.push('/#agendar-cita')
    }
  }

  return (
    <>
      {/* 1. BURBUJA DE INVITACIÓN FLOTANTE (AUTO-DISMISS) */}
      {!isOpen && showWelcomeBubble && (
        <div className="fixed bottom-24 right-6 z-50 max-w-xs animate-bounce-subtle bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-3.5 shadow-2xl space-y-2 font-sans">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-zenit.png"
                alt="Zenit Bot"
                className="w-7 h-7 object-contain rounded-full bg-white border border-slate-100 shadow-sm"
              />
              <div>
                <span className="text-xs font-bold text-[#525862] dark:text-zinc-100 block leading-none">
                  Asistente Zenit
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  En línea 24/7
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowWelcomeBubble(false)}
              className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[11px] text-[#777777] leading-relaxed">
            ¿Deseas consultar precios, horarios o agendar una cita médica?
          </p>
          <button
            onClick={() => {
              setIsOpen(true)
              setShowWelcomeBubble(false)
            }}
            className="w-full py-1.5 px-3 rounded-lg bg-[#02B2C6] hover:bg-[#029baa] text-white text-[11px] font-bold uppercase tracking-wider shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chatear ahora</span>
          </button>
        </div>
      )}

      {/* 2. BOTÓN DISPARADOR FLOTANTE PRINCIPAL */}
      <div className="fixed bottom-6 right-6 z-50 font-sans">
        {!isOpen && (
          <button
            onClick={() => {
              setIsOpen(true)
              setIsMinimized(false)
              setShowWelcomeBubble(false)
            }}
            aria-label="Abrir Asistente Virtual Zenit"
            className="relative w-14 h-14 rounded-full bg-[#02B2C6] hover:bg-[#029baa] text-white shadow-2xl flex items-center justify-center transition-transform hover:scale-110 active:scale-95 cursor-pointer group border-2 border-white"
          >
            <MessageSquare className="w-6 h-6 transition-transform group-hover:rotate-6" />
            {/* Ping de estado en vivo */}
            <span className="absolute top-0 right-0 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white" />
            </span>
          </button>
        )}
      </div>

      {/* 3. VENTANA MODAL / POPUP DEL CHATBOT */}
      {isOpen && (
        <div
          className={`fixed bottom-6 right-4 sm:right-6 z-50 w-[92vw] sm:w-[410px] bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800 flex flex-col overflow-hidden transition-all duration-300 font-sans ${
            isMinimized ? 'h-16' : 'h-[600px] max-h-[85vh]'
          }`}
        >
          {/* HEADER DEL CHATBOT (Color Secundario Pizarra #525862 con acentos #02B2C6) */}
          <div className="bg-[#525862] text-white p-3.5 sm:p-4 flex items-center justify-between gap-3 shadow-md border-b border-slate-600 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo-zenit.png"
                  alt="Grupo Médico Zenit"
                  className="w-10 h-10 rounded-full object-contain bg-white p-0.5 shadow-sm"
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold text-white tracking-tight leading-none">
                    ZenitBot
                  </h3>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-[#02B2C6] text-white">
                    Clínico
                  </span>
                </div>
                <p className="text-[10px] text-slate-300 font-normal mt-0.5 flex items-center gap-1">
                  <span>Asistente Oficial • CC Galerías Sebucán</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-300">
              <button
                type="button"
                onClick={handleResetToHome}
                aria-label="Volver al Menú de Inicio"
                className="flex items-center gap-1 p-1.5 px-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer text-xs"
                title="Volver al Menú de Inicio"
              >
                <Home className="w-3.5 h-3.5 text-[#02B2C6]" />
                <span className="text-[10px] font-bold">Inicio</span>
              </button>

              <button
                onClick={() => setIsMinimized(!isMinimized)}
                aria-label={isMinimized ? 'Maximizar chat' : 'Minimizar chat'}
                className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition cursor-pointer"
                title={isMinimized ? 'Expandir' : 'Minimizar'}
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Cerrar chat"
                className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition cursor-pointer"
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* CUERPO DEL CHAT (Si no está minimizado) */}
          {!isMinimized && (
            <>
              {/* ÁREA DE MENSAJES CON SCROLL */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/60 dark:bg-zinc-950/40 text-xs">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-3 sm:p-3.5 shadow-sm leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-[#02B2C6] text-white rounded-tr-none font-medium'
                          : 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-[#525862] dark:text-zinc-200 rounded-tl-none font-normal'
                      }`}
                    >
                      <p>{msg.text}</p>

                      {/* RESPUESTA: TARJETA DE PRECIOS */}
                      {msg.actionType === 'prices' && (
                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800 space-y-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#02B2C6] block">
                            Arancel de Servicios Más Solicitados
                          </span>
                          <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                            {services
                              .filter((s) => msg.categoryFilter === 'all' || s.category === msg.categoryFilter)
                              .slice(0, 7)
                              .map((srv) => (
                                <div
                                  key={srv.id}
                                  className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 text-[11px]"
                                >
                                  <div className="truncate pr-2">
                                    <span className="font-bold text-[#525862] dark:text-zinc-200 block truncate">
                                      {srv.name}
                                    </span>
                                    <span className="text-[9px] text-[#777777]">
                                      {srv.category === 'estetica' ? 'Espacio Estética' : 'Salud Médica'}
                                    </span>
                                  </div>
                                  <span className="font-extrabold text-[#02B2C6] shrink-0 text-xs">
                                    ${srv.price.toFixed(2)}
                                  </span>
                                </div>
                              ))}
                          </div>
                          <div className="pt-1 flex items-center justify-between text-[10px]">
                            <Link
                              href="/especialidades"
                              onClick={() => setIsOpen(false)}
                              className="font-bold text-[#02B2C6] hover:underline flex items-center gap-1"
                            >
                              <span>Ver todas las especialidades</span>
                              <ChevronRight className="w-3 h-3" />
                            </Link>
                            <Link
                              href="/estetica"
                              onClick={() => setIsOpen(false)}
                              className="font-bold text-[#02B2C6] hover:underline flex items-center gap-1"
                            >
                              <span>Espacio estética</span>
                              <ChevronRight className="w-3 h-3" />
                            </Link>
                          </div>
                        </div>
                      )}

                      {/* RESPUESTA: TARJETA DE UBICACIÓN */}
                      {msg.actionType === 'location' && (
                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800 space-y-2">
                          <div className="p-3 rounded-xl bg-cyan-50/70 dark:bg-cyan-950/40 border border-cyan-100 dark:border-cyan-900/40 space-y-1.5">
                            <div className="flex items-start gap-2">
                              <MapPin className="w-4 h-4 text-[#02B2C6] shrink-0 mt-0.5" />
                              <p className="text-[11px] text-[#525862] dark:text-zinc-200 font-medium leading-relaxed">
                                <strong>Av. Transversal 10, CC, Galerias Sebucan, con Av. los Chorros</strong>, Caracas 1071, Miranda, Venezuela.
                              </p>
                            </div>
                            <div className="pl-6 space-y-1 text-[10px] text-[#777777] dark:text-zinc-400">
                              <p>• <strong>Puntos de referencia:</strong> Piso 2, Torre Médica Zenit.</p>
                              <p>• <strong>Estacionamiento:</strong> Privado con vigilancia las 24 horas.</p>
                            </div>
                          </div>

                          <a
                            href="https://maps.google.com/?q=Galerias+Sebucan+Caracas"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-2 px-3 rounded-xl bg-[#02B2C6] hover:bg-[#029baa] text-white text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm transition"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Abrir en Google Maps</span>
                          </a>
                        </div>
                      )}

                      {/* RESPUESTA: TARJETA DE HORARIOS */}
                      {msg.actionType === 'schedules' && (
                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800 space-y-2">
                          <div className="grid grid-cols-1 gap-2 text-[11px]">
                            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 flex items-center gap-2.5">
                              <Clock className="w-4 h-4 text-[#02B2C6] shrink-0" />
                              <div>
                                <span className="font-bold text-[#525862] dark:text-white block">
                                  Consultas & Dermoestética
                                </span>
                                <span className="text-[10px] text-[#777777]">
                                  Lunes a Sábado: 8:00 AM - 7:00 PM
                                </span>
                              </div>
                            </div>

                            <div className="p-2.5 rounded-xl bg-cyan-50/80 dark:bg-cyan-950/40 border border-cyan-100 dark:border-cyan-900/50 flex items-center gap-2.5">
                              <ShieldCheck className="w-4 h-4 text-[#02B2C6] shrink-0" />
                              <div>
                                <span className="font-bold text-[#02B2C6] block">
                                  Hospitalización & Urgencias
                                </span>
                                <span className="text-[10px] text-[#525862] dark:text-zinc-300">
                                  Abierto las 24 Horas / 365 Días
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* RESPUESTA: TARJETA DE SERVICIOS */}
                      {msg.actionType === 'services' && (
                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800 space-y-2">
                          <div className="grid grid-cols-2 gap-2 text-[10px]">
                            <Link
                              href="/especialidades"
                              onClick={() => setIsOpen(false)}
                              className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:border-[#02B2C6] transition flex flex-col justify-between"
                            >
                              <div className="flex items-center gap-1.5 font-bold text-[#02B2C6] mb-0.5">
                                <Stethoscope className="w-3.5 h-3.5" />
                                <span>Salud Médica</span>
                              </div>
                              <p className="text-[9px] text-[#777777] line-clamp-1">
                                Hospitalización 24/7, consultas...
                              </p>
                            </Link>

                            <Link
                              href="/estetica"
                              onClick={() => setIsOpen(false)}
                              className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:border-[#02B2C6] transition flex flex-col justify-between"
                            >
                              <div className="flex items-center gap-1.5 font-bold text-[#02B2C6] mb-0.5">
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Espacio Estética</span>
                              </div>
                              <p className="text-[9px] text-[#777777] line-clamp-1">
                                Masajes, aparatología facial...
                              </p>
                            </Link>
                          </div>
                        </div>
                      )}

                      {/* RESPUESTA: TARJETA DE AGENDAR CITA */}
                      {msg.actionType === 'booking' && (
                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800 space-y-2">
                          <p className="text-[11px] text-[#525862] dark:text-zinc-200 font-medium">
                            Selecciona el área para agendar tu consulta:
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => handleBookFromChat('salud')}
                              className="p-2.5 rounded-xl bg-[#02B2C6] hover:bg-[#029baa] text-white font-bold text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
                            >
                              <Stethoscope className="w-3.5 h-3.5" />
                              <span>Cita Médica</span>
                            </button>
                            <button
                              onClick={() => handleBookFromChat('estetica')}
                              className="p-2.5 rounded-xl bg-[#525862] hover:bg-slate-700 text-white font-bold text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Cita Estética</span>
                            </button>
                          </div>

                          <a
                            href="https://wa.me/584220241622?text=Hola,%20deseo%20agendar%20una%20cita%20médica%20en%20Grupo%20Médico%20Zenit"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition"
                          >
                            <WhatsAppIcon className="w-4 h-4 text-white" />
                            <span>Agendar vía WhatsApp</span>
                          </a>
                        </div>
                      )}

                      {/* RESPUESTA: TARJETA DE DOCTORES */}
                      {msg.actionType === 'doctor' && (
                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800 space-y-2">
                          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                            {doctors.slice(0, 5).map((doc) => (
                              <div
                                key={doc.id}
                                className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 text-[10px]"
                              >
                                <span className="font-bold text-[#525862] dark:text-white block">
                                  {doc.name}
                                </span>
                                <span className="text-[#02B2C6] font-semibold">{doc.specialty_name}</span>
                                <span className="text-[9px] text-[#777777] block font-mono">
                                  {doc.mpps_license}
                                </span>
                              </div>
                            ))}
                          </div>
                          <Link
                            href="/cuerpo-medico"
                            onClick={() => setIsOpen(false)}
                            className="text-[10px] font-bold text-[#02B2C6] hover:underline flex items-center gap-1"
                          >
                            <span>Ver todo el directorio de especialistas</span>
                            <ChevronRight className="w-3 h-3" />
                          </Link>
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>
                  </div>
                ))}

                {/* Indicador de "Escribiendo..." */}
                {isTyping && (
                  <div className="flex items-center gap-2 text-slate-400 text-xs italic p-2 bg-white dark:bg-zinc-900 rounded-2xl w-fit border border-slate-100">
                    <Bot className="w-3.5 h-3.5 text-[#02B2C6] animate-pulse" />
                    <span>ZenitBot está escribiendo...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* CUADRÍCULA DE ACCIONES RÁPIDAS EN COLUMNAS */}
              <div className="bg-slate-50/95 dark:bg-zinc-900/95 border-t border-slate-200 dark:border-zinc-800 shrink-0 transition-all">
                {/* Cabecera */}
                <div className="px-3 py-1.5 flex items-center justify-between border-b border-slate-100 dark:border-zinc-800/60">
                  <button
                    type="button"
                    onClick={() => setIsQuickActionsVisible(!isQuickActionsVisible)}
                    className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#525862] dark:text-zinc-300 hover:text-[#02B2C6] transition cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-[#02B2C6]" />
                    <span>Consultas Rápidas</span>
                    {isQuickActionsVisible ? (
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                    ) : (
                      <ChevronUp className="w-3 h-3 text-slate-400" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleResetToHome}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold text-[#02B2C6] hover:bg-[#02B2C6] hover:text-white bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800 transition cursor-pointer active:scale-95 shadow-xs"
                    title="Volver al Menú de Inicio"
                  >
                    <Home className="w-3 h-3" />
                    <span>Menú de Inicio</span>
                  </button>
                </div>

                {/* Lista de Botones siempre en Columnas */}
                {isQuickActionsVisible && (
                  <div className="p-2 space-y-1.5">
                    <div className="grid grid-cols-2 gap-1.5 animate-in fade-in duration-200">
                      {quickActions.map((action, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSendMessage(action.query)}
                          className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold transition cursor-pointer active:scale-95 shadow-xs text-left bg-white dark:bg-zinc-800 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 hover:border-[#02B2C6] border-slate-200 dark:border-zinc-700 text-[#525862] dark:text-zinc-200"
                        >
                          <span className="shrink-0">{action.icon}</span>
                          <span className="truncate">{action.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* Fila Inferior: Menú de Inicio y Agendar una Cita */}
                    <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                      <button
                        type="button"
                        onClick={handleResetToHome}
                        className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl border border-cyan-300 dark:border-cyan-800 bg-white dark:bg-zinc-800 hover:bg-cyan-50 dark:hover:bg-cyan-950/60 text-[#02B2C6] text-[11px] font-bold transition cursor-pointer active:scale-95 shadow-xs"
                      >
                        <Home className="w-3.5 h-3.5 text-[#02B2C6]" />
                        <span>Menú de Inicio</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSendMessage('agendar cita')}
                        className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-[11px] font-bold transition cursor-pointer active:scale-95 shadow-xs bg-[#02B2C6] hover:bg-[#029baa] text-white shadow-cyan-600/20"
                      >
                        <Calendar className="w-3.5 h-3.5 text-white" />
                        <span>Agendar una Cita</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* INPUT PARA ESCRIBIR MENSAJES */}
              <div className="p-3 bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 flex items-center gap-2 shrink-0">
                <input
                  type="text"
                  placeholder="Escribe tu consulta (precios, cita, horario...)"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs text-[#525862] dark:text-zinc-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#02B2C6]"
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputValue.trim()}
                  aria-label="Enviar mensaje"
                  className="w-10 h-10 rounded-xl bg-[#02B2C6] hover:bg-[#029baa] disabled:opacity-40 text-white flex items-center justify-center transition shadow-sm cursor-pointer shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
