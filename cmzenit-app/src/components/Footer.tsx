'use client'

import React from 'react'
import { MapPin, Phone, Mail, ShieldCheck, Clock } from 'lucide-react'
import Link from 'next/link'
import { WhatsAppIcon, InstagramIcon } from '@/components/SocialIcons'

export function Footer() {
  return (
    <footer id="contacto-info" className="bg-[#383e48] text-slate-300 mt-auto border-t border-[#525862] transition-colors scroll-mt-16">
      {/* 1. TOP CARDS BAR: Gris Pizarra (#525862) */}
      <div className="border-b border-[#525862]/80 py-8 bg-[#525862]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Teléfono */}
          <div className="flex items-center gap-4 p-4 rounded-md bg-white/10 border border-white/10 hover:border-[#02B2C6] transition">
            <div className="w-12 h-12 rounded-md bg-[#02B2C6] text-white flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#02B2C6]">
                Central Telefónica
              </p>
              <a
                href="tel:04220241622"
                className="text-sm font-bold text-white hover:text-[#02B2C6] transition"
              >
                (422) 0241622
              </a>
              <p className="text-[11px] text-white/80">+58 (212) 999-ZENIT</p>
            </div>
          </div>

          {/* Card 2: WhatsApp Citas & Instagram */}
          <div className="flex items-center gap-4 p-4 rounded-md bg-white/10 border border-white/10 hover:border-[#02B2C6] transition">
            <div className="w-12 h-12 rounded-md bg-[#02B2C6] text-white flex items-center justify-center shrink-0">
              <WhatsAppIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#02B2C6]">
                WhatsApp Oficial
              </p>
              <a
                href="https://wa.me/584220241622"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-bold text-white hover:text-[#02B2C6] transition"
              >
                (422) 0241622
              </a>
              <p className="text-[11px] text-white/80">Instagram: @cmzenit</p>
            </div>
          </div>

          {/* Card 3: Horarios y Dirección Oficial */}
          <div className="flex items-center gap-4 p-4 rounded-md bg-white/10 border border-white/10 hover:border-[#02B2C6] transition">
            <div className="w-12 h-12 rounded-md bg-[#02B2C6] text-white flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#02B2C6]">
                Horario de Atención
              </p>
              <p className="text-sm font-bold text-white">Lun - Sáb: 8:00 AM - 7:00 PM</p>
              <p className="text-[11px] text-white/80">Hospitalización & Urgencias: 24 Horas</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN FOOTER CONTENT: 3 COLUMNAS */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 text-slate-300">
        {/* Columna 1: Marca, Ubicación & Contacto */}
        <div className="space-y-4">
          <Link href="/" className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-zenit.png"
              alt="Grupo Médico Zenit"
              className="w-12 h-12 object-contain rounded-full shadow-md bg-white"
            />
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold tracking-wider text-white/80 uppercase leading-none">
                Grupo Médico
              </span>
              <span className="text-xl font-bold tracking-tight text-white leading-none mt-0.5">
                ZENIT
              </span>
              <span className="text-[9px] text-[#02B2C6] font-semibold uppercase tracking-wide mt-0.5">
                Salud & Estética
              </span>
            </div>
          </Link>

          {/* Ubicación y Contacto */}
          <div className="pt-1 space-y-2.5 text-xs text-slate-300">
            <Link
              href="/contacto"
              className="font-bold uppercase text-xs sm:text-sm tracking-wider text-[#02B2C6] hover:underline block"
            >
              Ubicación & Contacto →
            </Link>
            <p className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-[#02B2C6] shrink-0 mt-0.5" />
              <span>Av. Transversal 10, CC Galerias Sebucan, con Av. los Chorros, Caracas 1071, Miranda, Venezuela.</span>
            </p>
            <p className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-[#02B2C6] shrink-0" />
              <a href="tel:04220241622" className="hover:text-white transition">
                (422) 0241622 / +58 (212) 999-ZENIT
              </a>
            </p>
            <p className="flex items-center gap-2.5">
              <InstagramIcon className="w-4 h-4 text-[#02B2C6] shrink-0" />
              <a
                href="https://instagram.com/cmzenit"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition"
              >
                @cmzenit
              </a>
            </p>
            <p className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-[#02B2C6] shrink-0" />
              <a href="mailto:contacto@cmzenit.com" className="hover:text-white transition">
                contacto@cmzenit.com
              </a>
            </p>
            <p className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-[#02B2C6] shrink-0" />
              <span>Estacionamiento privado CC Galerías Sebucán y vigilancia 24h</span>
            </p>
          </div>

          <div className="pt-1 flex items-center gap-2 text-xs text-[#02B2C6] font-semibold">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Acreditación Sanitaria MPPS N° 45.892</span>
          </div>
        </div>

        {/* Columna 2: Especialidades Clínicas (Tamaño Aumentado) */}
        <div className="space-y-4">
          <Link
            href="/especialidades"
            className="font-bold uppercase text-xs sm:text-sm tracking-wider text-[#02B2C6] hover:underline block"
          >
            Especialidades Médicas →
          </Link>
          <ul className="space-y-3 text-xs sm:text-sm text-slate-200">
            <li><Link href="/especialidades" className="hover:text-[#02B2C6] transition block">Consulta General & Medicina Familiar</Link></li>
            <li><Link href="/especialidades" className="hover:text-[#02B2C6] transition block">Hospitalización & Cuidados Clínicos 24/7</Link></li>
            <li><Link href="/especialidades" className="hover:text-[#02B2C6] transition block">Oftalmología & Evaluación Visual</Link></li>
            <li><Link href="/especialidades" className="hover:text-[#02B2C6] transition block">Ginecología & Obstetricia Integral</Link></li>
            <li><Link href="/especialidades" className="hover:text-[#02B2C6] transition block">Odontología & Salud Dental</Link></li>
            <li><Link href="/especialidades" className="hover:text-[#02B2C6] transition block">Cardiología & Ecocardiografía</Link></li>
          </ul>
        </div>

        {/* Columna 3: Espacio Estética & Dermo (Tamaño Aumentado) */}
        <div className="space-y-4">
          <Link
            href="/estetica"
            className="font-bold uppercase text-xs sm:text-sm tracking-wider text-[#02B2C6] hover:underline block"
          >
            Tu Espacio de Estética →
          </Link>
          <ul className="space-y-3 text-xs sm:text-sm text-slate-200">
            <li><Link href="/estetica" className="hover:text-[#02B2C6] transition block">Masajes Post-Operatorios & Drenaje</Link></li>
            <li><Link href="/estetica" className="hover:text-[#02B2C6] transition block">Masajes Relajantes & Antiestrés</Link></li>
            <li><Link href="/estetica" className="hover:text-[#02B2C6] transition block">Tratamientos Anticelulíticos 4 en 1</Link></li>
            <li><Link href="/estetica" className="hover:text-[#02B2C6] transition block">Hidrafacial con Radiofrecuencia</Link></li>
            <li><Link href="/estetica" className="hover:text-[#02B2C6] transition block">Dermoabrasión & Peeling Ultrasónico</Link></li>
            <li><Link href="/estetica" className="hover:text-[#02B2C6] transition block">Depilación Láser Diodo & Máscara LED</Link></li>
          </ul>
        </div>
      </div>

      {/* 3. BARRA INFERIOR DE DERECHOS */}
      <div className="border-t border-[#525862]/80 py-5 bg-[#2c313a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-3">
          <p>© 2026 Grupo Médico Zenit, C.A. Todos los derechos reservados.</p>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <span className="hover:text-white transition">Términos de Servicio</span>
            <span>•</span>
            <span className="hover:text-white transition">Privacidad del Paciente</span>
            <span>•</span>
            <Link
              href="/login/personal"
              className="text-slate-400 hover:text-[#02B2C6] transition flex items-center gap-1"
              title="Acceso para Médicos Especialistas y Recepción"
            >
              <span>Acceso Personal Clínico</span>
            </Link>
            <span>•</span>
            <Link
              href="/admin/login"
              className="text-slate-500 hover:text-slate-300 transition"
              title="Acceso exclusivo Dirección Médica"
            >
              <span>Gestión Directiva</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
