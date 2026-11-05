'use client'

import React from 'react'
import { MapPin, Phone, Mail, ShieldCheck, Clock } from 'lucide-react'
import Link from 'next/link'
import { WhatsAppIcon, InstagramIcon } from '@/components/SocialIcons'

export function Footer() {
  return (
    <footer className="bg-[#383e48] text-slate-300 mt-auto border-t border-[#525862] transition-colors">
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
                Horario de Consultas
              </p>
              <p className="text-sm font-bold text-white">Lun - Sáb: 8:00 AM - 7:00 PM</p>
              <p className="text-[11px] text-white/80">CC Galerías Sebucán, Caracas</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN FOOTER CONTENT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-8 text-xs text-slate-300">
        {/* Columna 1: Marca & Resumen */}
        <div className="space-y-4 md:col-span-1">
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
          <p className="leading-[1.6] text-slate-300 text-[11px]">
            Centro Médico Quirúrgico y Espacio de Estética Integral. Combinamos la excelencia del
            diagnóstico clínico con tecnología dermoestética certificada y récipes médicos digitales.
          </p>
          <div className="pt-1 flex items-center gap-2 text-[10px] text-[#02B2C6] font-semibold">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Acreditación Sanitaria MPPS N° 45.892</span>
          </div>
        </div>

        {/* Columna 2: Especialidades Clínicas */}
        <div className="space-y-3">
          <Link
            href="/especialidades"
            className="font-semibold uppercase text-[11px] tracking-wider text-[#02B2C6] hover:underline block"
          >
            Especialidades Médicas →
          </Link>
          <ul className="space-y-2 text-slate-300 text-[11px]">
            <li><Link href="/especialidades" className="hover:text-[#02B2C6] transition">Consulta General & Medicina Familiar</Link></li>
            <li><Link href="/especialidades" className="hover:text-[#02B2C6] transition">Hospitalización & Cuidados Clínicos 24/7</Link></li>
            <li><Link href="/especialidades" className="hover:text-[#02B2C6] transition">Oftalmología & Evaluación Visual</Link></li>
            <li><Link href="/especialidades" className="hover:text-[#02B2C6] transition">Ginecología & Obstetricia Integral</Link></li>
            <li><Link href="/especialidades" className="hover:text-[#02B2C6] transition">Odontología & Salud Dental</Link></li>
            <li><Link href="/especialidades" className="hover:text-[#02B2C6] transition">Cardiología & Ecocardiografía</Link></li>
          </ul>
        </div>

        {/* Columna 3: Espacio Estética & Dermo */}
        <div className="space-y-3">
          <Link
            href="/estetica"
            className="font-semibold uppercase text-[11px] tracking-wider text-[#02B2C6] hover:underline block"
          >
            Tu Espacio de Estética →
          </Link>
          <ul className="space-y-2 text-slate-300 text-[11px]">
            <li><Link href="/estetica" className="hover:text-[#02B2C6] transition">Masajes Post-Operatorios & Drenaje</Link></li>
            <li><Link href="/estetica" className="hover:text-[#02B2C6] transition">Masajes Relajantes & Antiestrés</Link></li>
            <li><Link href="/estetica" className="hover:text-[#02B2C6] transition">Tratamientos Anticelulíticos 4 en 1</Link></li>
            <li><Link href="/estetica" className="hover:text-[#02B2C6] transition">Hidrafacial con Radiofrecuencia</Link></li>
            <li><Link href="/estetica" className="hover:text-[#02B2C6] transition">Dermoabrasión & Peeling Ultrasónico</Link></li>
            <li><Link href="/estetica" className="hover:text-[#02B2C6] transition">Depilación Láser Diodo & Máscara LED</Link></li>
          </ul>
        </div>

        {/* Columna 4: Ubicación & Contacto Oficial */}
        <div className="space-y-3">
          <h4 className="font-semibold text-white uppercase text-[11px] tracking-wider text-[#02B2C6]">
            Ubicación & Contacto
          </h4>
          <div className="space-y-2 text-slate-300 text-[11px]">
            <p className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-[#02B2C6] shrink-0 mt-0.5" />
              <span>Av. Transversal 10, CC, Galerias Sebucan, con Av. los Chorros, Caracas 1071, Miranda, Venezuela.</span>
            </p>
            <p className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#02B2C6] shrink-0" />
              <span>(422) 0241622 / +58 (212) 999-ZENIT</span>
            </p>
            <p className="flex items-center gap-2">
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
            <p className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#02B2C6] shrink-0" />
              <span>contacto@cmzenit.com</span>
            </p>
            <p className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#02B2C6] shrink-0" />
              <span>Estacionamiento privado CC Galerías Sebucán y vigilancia 24h</span>
            </p>
          </div>
        </div>
      </div>

      {/* 3. BARRA INFERIOR DE DERECHOS */}
      <div className="border-t border-[#525862]/80 py-5 bg-[#2c313a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-3">
          <p>© 2026 Grupo Médico Zenit, C.A. Todos los derechos reservados.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-white transition">Términos de Servicio</span>
            <span>•</span>
            <span className="hover:text-white transition">Privacidad del Paciente</span>
            <span>•</span>
            <span className="hover:text-white transition">Protocolos Médicos MPPS</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
