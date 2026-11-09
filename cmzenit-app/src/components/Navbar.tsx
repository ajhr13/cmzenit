'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCMZenit } from '@/context/CMZenitContext'
import {
  User,
  LogOut,
  Stethoscope,
  ChevronDown,
  Clock,
  Shield,
  ClipboardList,
  Phone,
  MapPin,
  Calendar,
  Menu,
  X,
} from 'lucide-react'
import { WhatsAppIcon, InstagramIcon } from '@/components/SocialIcons'
import { RoleSubNavbar } from '@/components/RoleSubNavbar'

export function Navbar() {
  const pathname = usePathname()
  const { currentUser, openAuthModal, logout } = useCMZenit()

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Cerrar menús al hacer clic afuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Etiqueta e icono según el rol del usuario conectado
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'secretaria':
        return {
          label: 'Recepción & Admisión',
          icon: ClipboardList,
          color: 'text-[#525862] bg-slate-100 border-slate-300',
        }
      case 'doctor':
        return {
          label: 'Consultorio Médico',
          icon: Stethoscope,
          color: 'text-[#02B2C6] bg-cyan-50 border-cyan-200',
        }
      case 'admin':
        return {
          label: 'Dirección Médica',
          icon: Shield,
          color: 'text-[#02B2C6] bg-cyan-50 border-cyan-200',
        }
      default:
        return {
          label: 'Portal Paciente',
          icon: User,
          color: 'text-[#02B2C6] bg-cyan-50 border-cyan-200',
        }
    }
  }

  const roleInfo = currentUser ? getRoleBadge(currentUser.role) : null

  return (
    <header className="sticky top-0 z-40 transition-colors shadow-sm">
      {/* 1. TOP BAR DELGADA EN #525862 CON DATOS DE CONTACTO Y DIRECCIÓN OFICIAL EN BLANCO */}
      <div className="bg-[#525862] text-white text-[11px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-9 sm:h-10 flex items-center justify-between gap-4 font-normal">
          {/* Contacto Izquierda */}
          <div className="flex items-center gap-4 sm:gap-6 text-white">
            <a
              href="tel:04220241622"
              className="flex items-center gap-1.5 hover:text-[#02B2C6] transition"
              title="Central Telefónica"
            >
              <Phone className="w-3.5 h-3.5 text-white" />
              <span>(422) 0241622</span>
            </a>
            <a
              href="https://wa.me/584220241622"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 hover:text-[#02B2C6] transition"
              title="WhatsApp de Citas"
            >
              <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span>WhatsApp: (422) 0241622</span>
            </a>
            <a
              href="https://instagram.com/cmzenit"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-1.5 hover:text-[#02B2C6] transition"
              title="Instagram @cmzenit"
            >
              <InstagramIcon className="w-3.5 h-3.5 text-pink-400" />
              <span>@cmzenit</span>
            </a>
          </div>

          {/* Horario y Ubicación Oficial en CC Galerías Sebucán */}
          <div className="flex items-center gap-4 sm:gap-6 text-white/90">
            <div className="hidden lg:flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-white" />
              <span>Lun - Sáb: 8:00 AM - 7:00 PM</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#02B2C6]" />
              <span className="truncate max-w-[240px]">CC Galerías Sebucán, Caracas</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/20 text-white border border-white/30">
              MPPS N° 45.892
            </span>
          </div>
        </div>
      </div>

      {/* 2. NAVBAR BLANCA CON LOGO OFICIAL "GRUPO MÉDICO ZENIT" */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 sm:h-20 flex items-center justify-between gap-4">
          {/* LOGOTIPO OFICIAL: Imagen del Logo Circular + Texto Grupo Médico ZENIT */}
          <Link href="/" className="flex items-center gap-3 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-zenit.png"
              alt="Grupo Médico Zenit"
              className="w-12 h-12 sm:w-14 sm:h-14 object-contain rounded-full shadow-sm transition-transform group-hover:scale-105"
            />
            <div className="flex flex-col">
              <span className="text-lg sm:text-2xl tracking-tight leading-none">
                <span className="font-light text-[#777777]">GRUPO MÉDICO </span>
                <span className="font-bold text-[#525862]">ZENIT<span className="text-[#02B2C6]">.</span></span>
              </span>
              <span className="text-[9px] text-[#02B2C6] font-semibold tracking-wider uppercase mt-1">
                Salud & Estética Integral
              </span>
            </div>
          </Link>

          {/* MENÚ A LA DERECHA (Ítem activo: botón rectangular en #02B2C6 con texto blanco) */}
          <nav className="hidden xl:flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
            <Link
              href="/"
              className={`px-4 py-2.5 rounded-md transition ${
                pathname === '/'
                  ? 'bg-[#02B2C6] text-white shadow-sm font-bold'
                  : 'text-[#777777] hover:text-[#02B2C6]'
              }`}
            >
              Inicio
            </Link>
            <Link
              href="/especialidades"
              className={`px-4 py-2.5 rounded-md transition ${
                pathname === '/especialidades'
                  ? 'bg-[#02B2C6] text-white shadow-sm font-bold'
                  : 'text-[#777777] hover:text-[#02B2C6]'
              }`}
            >
              Especialidades
            </Link>
            <Link
              href="/estetica"
              className={`px-4 py-2.5 rounded-md transition ${
                pathname === '/estetica'
                  ? 'bg-[#02B2C6] text-white shadow-sm font-bold'
                  : 'text-[#777777] hover:text-[#02B2C6]'
              }`}
            >
              Espacio Estética
            </Link>
            <Link
              href="/cuerpo-medico"
              className={`px-4 py-2.5 rounded-md transition ${
                pathname === '/cuerpo-medico'
                  ? 'bg-[#02B2C6] text-white shadow-sm font-bold'
                  : 'text-[#777777] hover:text-[#02B2C6]'
              }`}
            >
              Cuerpo Médico
            </Link>
            <Link
              href="/contacto"
              className={`px-4 py-2.5 rounded-md transition ${
                pathname === '/contacto'
                  ? 'bg-[#02B2C6] text-white shadow-sm font-bold'
                  : 'text-[#777777] hover:text-[#02B2C6]'
              }`}
            >
              Contacto
            </Link>
          </nav>

          {/* ZONA DE ACCIÓN DERECHA: Rol / Usuario / Botón Agendar Cita */}
          <div className="flex items-center gap-2 sm:gap-3">
            {currentUser && roleInfo && (
              <div
                className={`hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${roleInfo.color}`}
              >
                <roleInfo.icon className="w-3.5 h-3.5" />
                <span>{roleInfo.label}</span>
              </div>
            )}

            {currentUser ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-md hover:bg-slate-100 transition cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-[#02B2C6] text-white flex items-center justify-center font-bold text-xs">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-xs font-semibold text-[#525862] truncate max-w-[120px]">
                      {currentUser.name}
                    </div>
                    <div className="text-[10px] text-[#777777] capitalize">
                      <span>{currentUser.role}</span>
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-[#777777] hidden sm:block" />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-100 rounded-xl shadow-xl p-3 z-50 animate-in fade-in">
                    <div className="px-3 py-2 border-b border-gray-100">
                      <p className="text-xs font-bold text-[#525862]">{currentUser.name}</p>
                      <p className="text-[11px] text-[#777777] truncate">{currentUser.email}</p>
                    </div>
                    <div className="py-2 space-y-1">
                      <button
                        onClick={() => {
                          openAuthModal('signin')
                          setIsUserMenuOpen(false)
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-medium text-[#777777] hover:bg-slate-50 hover:text-[#02B2C6] rounded-md flex items-center gap-2 cursor-pointer"
                      >
                        <User className="w-4 h-4" />
                        Cambiar de Cuenta
                      </button>
                      <button
                        onClick={() => {
                          logout()
                          setIsUserMenuOpen(false)
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-md flex items-center gap-2 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        Cerrar Sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {/* Acceso Directo y Exclusivo para Pacientes */}
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#525862] hover:text-[#02B2C6] bg-slate-50 hover:bg-cyan-50/60 border border-slate-200 hover:border-cyan-200 rounded-md transition shadow-2xs"
                  title="Acceso exclusivo para pacientes de Grupo Médico Zenit"
                >
                  <User className="w-3.5 h-3.5 text-[#02B2C6]" />
                  <span>Mi Portal Paciente</span>
                </Link>

                <Link
                  href="/#agendar-cita"
                  className="hidden sm:flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-white bg-[#02B2C6] hover:bg-[#029baa] rounded-md shadow-sm transition active:scale-95"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Agendar Cita</span>
                </Link>
              </div>
            )}

            {/* Botón Hamburger Móvil */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="xl:hidden p-2 rounded-md text-[#525862] hover:bg-slate-100 transition"
              aria-label="Abrir menú"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Menú Móvil */}
        {isMobileMenuOpen && (
          <div className="xl:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-2 animate-in slide-in-from-top-2">
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-md text-xs font-semibold uppercase ${
                pathname === '/' ? 'bg-[#02B2C6] text-white' : 'text-[#777777] hover:bg-slate-50'
              }`}
            >
              Inicio
            </Link>
            <Link
              href="/especialidades"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-md text-xs font-semibold uppercase ${
                pathname === '/especialidades' ? 'bg-[#02B2C6] text-white' : 'text-[#777777] hover:bg-slate-50'
              }`}
            >
              Especialidades
            </Link>
            <Link
              href="/estetica"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-md text-xs font-semibold uppercase ${
                pathname === '/estetica' ? 'bg-[#02B2C6] text-white' : 'text-[#777777] hover:bg-slate-50'
              }`}
            >
              Espacio Estética
            </Link>
            <Link
              href="/cuerpo-medico"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-md text-xs font-semibold uppercase ${
                pathname === '/cuerpo-medico' ? 'bg-[#02B2C6] text-white' : 'text-[#777777] hover:bg-slate-50'
              }`}
            >
              Cuerpo Médico
            </Link>
            <Link
              href="/#agendar-cita"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-xs font-semibold uppercase text-[#02B2C6] hover:bg-cyan-50"
            >
              Agendar Cita en Línea
            </Link>
            <Link
              href="/contacto"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-md text-xs font-semibold uppercase ${
                pathname === '/contacto' ? 'bg-[#02B2C6] text-white' : 'text-[#777777] hover:bg-slate-50'
              }`}
            >
              Contacto
            </Link>

            {!currentUser && (
              <div className="pt-2 mt-2 border-t border-gray-100">
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-md text-xs font-bold text-[#02B2C6] bg-cyan-50/70 border border-cyan-100"
                >
                  <User className="w-4 h-4 text-[#02B2C6]" />
                  <span>Mi Portal Paciente (Iniciar Sesión)</span>
                </Link>
              </div>
            )}
            <div className="pt-2 mt-2 border-t border-gray-100 flex items-center gap-2">
              <a
                href="https://wa.me/584220241622"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2 px-3 rounded-md bg-emerald-600 text-white text-xs font-bold uppercase flex items-center justify-center gap-1.5"
              >
                <WhatsAppIcon className="w-3.5 h-3.5 text-white" />
                <span>WhatsApp</span>
              </a>
              <a
                href="https://instagram.com/cmzenit"
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-3 rounded-md bg-slate-100 text-[#525862] text-xs font-bold uppercase flex items-center justify-center gap-1.5"
              >
                <InstagramIcon className="w-3.5 h-3.5 text-pink-500" />
                <span>Instagram</span>
              </a>
            </div>
          </div>
        )}
      </div>

      {/* 3. SUB-MENÚ OPERATIVO POR ROL (Aparece abajo cuando el usuario ha iniciado sesión) */}
      <RoleSubNavbar />
    </header>
  )
}
