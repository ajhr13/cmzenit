'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Calendar,
  Send,
  CheckCircle2,
  Building2,
  ShieldCheck,
  Compass,
  ArrowRight,
} from 'lucide-react'
import { WhatsAppIcon, InstagramIcon } from '@/components/SocialIcons'

export default function ContactoPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'Consulta Médica General',
    message: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      setSubmitted(true)
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: 'Consulta Médica General',
        message: '',
      })
    }, 600)
  }

  return (
    <div className="w-full bg-[#f8fafc] text-[#777777] min-h-screen">
      {/* 1. HERO HEADER DE CONTACTO */}
      <section className="bg-gradient-to-r from-[#525862] via-[#3d424b] to-[#2c313a] text-white py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#02B2C6]/20 text-cyan-300 text-xs font-semibold uppercase tracking-wider border border-[#02B2C6]/30">
              <Compass className="w-3.5 h-3.5 text-[#02B2C6]" />
              <span>Central de Atención & Ubicación Oficial</span>
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white uppercase">
              Contacto <span className="text-[#02B2C6]">CMZenit</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed">
              Estamos ubicados en el Centro Comercial Galerías Sebucán, Caracas. Comunícate con nuestra central
              telefónica, solicita tu turno médico por WhatsApp o visítanos en nuestras modernas instalaciones.
            </p>
          </div>
        </div>
      </section>

      {/* 2. TARJETAS DE CONTACTO PRINCIPALES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 -mt-8 relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Card 1: Dirección Sede */}
          <div className="bg-white border border-gray-100 p-6 rounded-md shadow-md hover:shadow-lg hover:border-[#02B2C6] transition-all flex flex-col justify-between space-y-3 group">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-md bg-[#02B2C6] text-white flex items-center justify-center shadow-sm">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-[#525862] group-hover:text-[#02B2C6] transition">
                  Sede Galerías Sebucán
                </h2>
                <p className="text-xs text-[#777777] mt-1 leading-[1.6]">
                  Av. Transversal 10 con Av. Los Chorros, CC Galerías Sebucán, Caracas 1071.
                </p>
              </div>
            </div>
            <span className="text-[10px] uppercase font-bold text-[#02B2C6] flex items-center gap-1 pt-2 border-t border-gray-100">
              <Building2 className="w-3.5 h-3.5" />
              <span>Estacionamiento 24h</span>
            </span>
          </div>

          {/* Card 2: Central Telefónica */}
          <div className="bg-white border border-gray-100 p-6 rounded-md shadow-md hover:shadow-lg hover:border-[#02B2C6] transition-all flex flex-col justify-between space-y-3 group">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-md bg-[#02B2C6] text-white flex items-center justify-center shadow-sm">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-[#525862] group-hover:text-[#02B2C6] transition">
                  Central Telefónica
                </h2>
                <a
                  href="tel:04220241622"
                  className="text-sm font-bold text-[#525862] hover:text-[#02B2C6] block mt-1 transition"
                >
                  (422) 0241622
                </a>
                <p className="text-xs text-[#777777] mt-0.5 leading-[1.6]">
                  +58 (212) 999-ZENIT
                </p>
              </div>
            </div>
            <a
              href="tel:04220241622"
              className="text-[10px] uppercase font-bold text-[#02B2C6] flex items-center gap-1 pt-2 border-t border-gray-100 hover:underline"
            >
              <span>Llamar ahora</span>
              <ArrowRight className="w-3 h-3" />
            </a>
          </div>

          {/* Card 3: WhatsApp Oficial */}
          <div className="bg-white border border-gray-100 p-6 rounded-md shadow-md hover:shadow-lg hover:border-emerald-500 transition-all flex flex-col justify-between space-y-3 group">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-md bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                <WhatsAppIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-[#525862] group-hover:text-emerald-600 transition">
                  WhatsApp Oficial
                </h2>
                <a
                  href="https://wa.me/584220241622"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-bold text-[#525862] hover:text-emerald-600 block mt-1 transition"
                >
                  (422) 0241622
                </a>
                <p className="text-xs text-[#777777] mt-0.5 leading-[1.6]">
                  Atención directa y turnos en línea
                </p>
              </div>
            </div>
            <a
              href="https://wa.me/584220241622"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] uppercase font-bold text-emerald-600 flex items-center gap-1 pt-2 border-t border-gray-100 hover:underline"
            >
              <span>Abrir WhatsApp</span>
              <ArrowRight className="w-3 h-3" />
            </a>
          </div>

          {/* Card 4: Horarios MPPS */}
          <div className="bg-white border border-gray-100 p-6 rounded-md shadow-md hover:shadow-lg hover:border-[#02B2C6] transition-all flex flex-col justify-between space-y-3 group">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-md bg-[#525862] text-white flex items-center justify-center shadow-sm">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-[#525862]">
                  Horario de Atención
                </h2>
                <p className="text-xs font-semibold text-[#525862] mt-1">
                  Lun - Sáb: 8:00 AM - 7:00 PM
                </p>
                <p className="text-xs text-[#777777] mt-0.5 leading-[1.6]">
                  Hospitalización & Urgencias: 24 Horas
                </p>
              </div>
            </div>
            <span className="text-[10px] uppercase font-bold text-[#02B2C6] flex items-center gap-1 pt-2 border-t border-gray-100">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>MPPS N° 45.892</span>
            </span>
          </div>
        </div>
      </section>

      {/* 3. SECCIÓN PRINCIPAL: FORMULARIO + MAPA / CÓMO LLEGAR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Columna Izquierda: Formulario de Mensaje */}
          <div className="lg:col-span-6 bg-white rounded-md border border-gray-100 shadow-xl overflow-hidden">
            {/* Header Cian con Ícono de Envío */}
            <div className="bg-[#02B2C6] text-white p-6 sm:p-7">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-white/20 flex items-center justify-center font-bold">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-cyan-100 block">
                    Atención al Paciente & Consultas
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-white">
                    Envíanos un Mensaje
                  </h3>
                </div>
              </div>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-4">
              {submitted && (
                <div className="p-4 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-start gap-2.5 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">¡Mensaje recibido con éxito!</p>
                    <p className="font-normal mt-0.5 text-emerald-700">
                      Nuestro equipo de recepción médica te responderá a la brevedad por correo o WhatsApp.
                    </p>
                  </div>
                </div>
              )}

              {/* Nombre Completo */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[#525862]">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Tu nombre y apellido"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-md border border-gray-200 bg-white text-xs text-[#525862] placeholder:text-[#777777] focus:outline-none focus:ring-2 focus:ring-[#02B2C6]"
                />
              </div>

              {/* Correo y Teléfono */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-[#525862]">
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="ejemplo@correo.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-md border border-gray-200 bg-white text-xs text-[#525862] placeholder:text-[#777777] focus:outline-none focus:ring-2 focus:ring-[#02B2C6]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-[#525862]">
                    Teléfono / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+58 422 0241622"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-md border border-gray-200 bg-white text-xs text-[#525862] placeholder:text-[#777777] focus:outline-none focus:ring-2 focus:ring-[#02B2C6]"
                  />
                </div>
              </div>

              {/* Asunto */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[#525862]">
                  Motivo de la Consulta
                </label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-md border border-gray-200 bg-white text-xs text-[#525862] focus:outline-none focus:ring-2 focus:ring-[#02B2C6]"
                >
                  <option value="Consulta Médica General">Consulta Médica Especializada</option>
                  <option value="Tratamiento Dermoestético">Tratamiento Estético / Spa</option>
                  <option value="Información de Quirófanos y Hospitalización">Quirófanos & Hospitalización</option>
                  <option value="Presupuesto y Formas de Pago">Presupuesto y Formas de Pago</option>
                  <option value="Otro Motivo">Otro Asunto</option>
                </select>
              </div>

              {/* Mensaje */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[#525862]">
                  Mensaje o Consulta *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Escribe aquí tu duda, requerimiento médico o solicitud de información..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-md border border-gray-200 bg-white text-xs text-[#525862] placeholder:text-[#777777] focus:outline-none focus:ring-2 focus:ring-[#02B2C6]"
                />
              </div>

              {/* Botón de Enviar */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-md text-xs font-semibold uppercase tracking-wider text-white bg-[#02B2C6] hover:bg-[#029baa] shadow-sm transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Enviando...' : 'Enviar Mensaje a Recepción'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Columna Derecha: Ubicación, Cómo Llegar e Información Detallada */}
          <div className="lg:col-span-6 space-y-6">
            {/* Mapa Interactivo Embebido */}
            <div className="bg-white rounded-md border border-gray-100 shadow-md overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#02B2C6]" />
                  <span className="text-xs font-bold text-[#525862] uppercase tracking-wider">
                    Ubicación en Google Maps
                  </span>
                </div>
                <a
                  href="https://maps.google.com/?q=Galerias+Sebucan+Caracas"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-bold text-[#02B2C6] hover:underline flex items-center gap-1"
                >
                  <span>Ver en app</span>
                  <ArrowRight className="w-3 h-3" />
                </a>
              </div>
              <div className="w-full h-[280px] sm:h-[320px] bg-slate-100 relative">
                <iframe
                  title="Mapa de Ubicación Grupo Médico Zenit - Galerías Sebucán"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3923.011681958564!2d-66.836854!3d10.499787!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8c2a5840d876a4df%3A0x6b86d91a92df468e!2sCentro%20Comercial%20Galer%C3%ADas%20Sebuc%C3%A1n!5e0!3m2!1ses!2sve!4v1700000000000!5m2!1ses!2sve"
                  className="w-full h-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>

            {/* Puntos Clave de Acceso */}
            <div className="bg-white rounded-md border border-gray-100 p-6 shadow-sm space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#525862] flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#02B2C6]" />
                <span>Facilidades de Acceso y Servicios de Sede</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#777777]">
                <div className="p-3 rounded-md bg-slate-50 border border-slate-100">
                  <p className="font-semibold text-[#525862]">Estacionamiento Privado</p>
                  <p className="text-[11px] mt-0.5">Vigilancia las 24 horas y acceso directo por rampa a la clínica.</p>
                </div>
                <div className="p-3 rounded-md bg-slate-50 border border-slate-100">
                  <p className="font-semibold text-[#525862]">Accesibilidad Universal</p>
                  <p className="text-[11px] mt-0.5">Ascensores amplios y rampas para sillas de ruedas y camillas.</p>
                </div>
                <div className="p-3 rounded-md bg-slate-50 border border-slate-100">
                  <p className="font-semibold text-[#525862]">Farmacia y Comercios</p>
                  <p className="text-[11px] mt-0.5">Ubicados dentro del mismo complejo comercial para tu comodidad.</p>
                </div>
                <div className="p-3 rounded-md bg-slate-50 border border-slate-100">
                  <p className="font-semibold text-[#525862]">Red de Especialistas</p>
                  <p className="text-[11px] mt-0.5">Consultorios médicos, quirófanos y espacio de dermoestética en un solo lugar.</p>
                </div>
              </div>

              {/* Botones de Acción Inmediata */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <Link
                  href="/#agendar-cita"
                  className="px-5 py-2.5 rounded-md font-semibold text-xs uppercase tracking-wider text-white bg-[#02B2C6] hover:bg-[#029baa] shadow-sm transition flex items-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Agendar Cita en Línea</span>
                </Link>
                <a
                  href="https://wa.me/584220241622"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-md font-semibold text-xs uppercase tracking-wider text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition flex items-center gap-1.5"
                >
                  <WhatsAppIcon className="w-3.5 h-3.5 text-white" />
                  <span>Escribir por WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
