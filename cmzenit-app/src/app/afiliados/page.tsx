'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCMZenit } from '@/context/CMZenitContext'
import {
  MEMBERSHIP_PLANS,
  SPECIALTY_COVERAGE_TABLE,
  MEMBERSHIP_FAQS,
} from '@/lib/membershipsData'
import { MembershipTier, MembershipPlan } from '@/types/database.types'
import {
  ShieldCheck,
  Check,
  Users,
  Stethoscope,
  ChevronRight,
  Phone,
  Sparkles,
  HeartHandshake,
  Activity,
  HeartPulse,
  Award,
  HelpCircle,
  X,
  CreditCard,
  Building2,
  Calendar,
} from 'lucide-react'
import { WhatsAppIcon } from '@/components/SocialIcons'

export default function AfiliadosPage() {
  const {
    currentUser,
    openAuthModal,
    exchangeRate,
    subscribeToMembership,
    getPatientMembership,
  } = useCMZenit()
  const router = useRouter()

  const [billingCycle, setBillingCycle] = useState<'anual' | 'mensual'>('anual')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Estado para el modal de afiliación
  const [isAffiliateModalOpen, setIsAffiliateModalOpen] = useState(false)
  const [selectedPlanForModal, setSelectedPlanForModal] = useState<MembershipPlan | null>(null)
  const [patientName, setPatientName] = useState(currentUser?.name || '')
  const [patientCedula, setPatientCedula] = useState(currentUser?.cedula || '')
  const [patientEmail, setPatientEmail] = useState(currentUser?.email || '')
  const [patientPhone, setPatientPhone] = useState(currentUser?.phone || '')
  const [paymentMethod, setPaymentMethod] = useState<'pago_movil' | 'zelle' | 'efectivo_taquilla'>('pago_movil')
  const [beneficiaries, setBeneficiaries] = useState<
    Array<{ name: string; cedula: string; relationship: string }>
  >([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  // Membresía activa del usuario actual
  const currentMembership = getPatientMembership(currentUser?.cedula)

  // Abrir modal de afiliación con el plan seleccionado
  const handleOpenAffiliation = (plan: MembershipPlan) => {
    setSelectedPlanForModal(plan)
    setPatientName(currentUser?.name || '')
    setPatientCedula(currentUser?.cedula || '')
    setPatientEmail(currentUser?.email || '')
    setPatientPhone(currentUser?.phone || '')

    // Inicializar beneficiarios según el límite del plan
    const maxBeneficiaries = plan.affiliatesCount - 1
    if (maxBeneficiaries > 0) {
      setBeneficiaries(
        Array.from({ length: maxBeneficiaries }, () => ({
          name: '',
          cedula: '',
          relationship: 'Familiar directo',
        }))
      )
    } else {
      setBeneficiaries([])
    }

    setSuccessMessage('')
    setIsAffiliateModalOpen(true)
  }

  // Enviar formulario de afiliación
  const handleAffiliateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!patientName.trim() || !patientCedula.trim() || !patientPhone.trim()) {
      alert('Por favor completa Nombre, Cédula y WhatsApp del titular.')
      return
    }

    if (!selectedPlanForModal) return

    setIsSubmitting(true)

    // Filtrar beneficiarios no vacíos
    const validBeneficiaries = beneficiaries.filter(
      (b) => b.name.trim() !== '' && b.cedula.trim() !== ''
    )

    const res = await subscribeToMembership({
      patientCedula,
      patientName,
      patientEmail,
      patientPhone,
      tier: selectedPlanForModal.id,
      billingCycle,
      beneficiaries: validBeneficiaries,
    })

    setIsSubmitting(false)

    if (res.success) {
      const price =
        billingCycle === 'anual'
          ? selectedPlanForModal.priceAnnual
          : selectedPlanForModal.priceMonthly
      const priceBs = (price * exchangeRate).toFixed(2)

      setSuccessMessage(
        `¡Solicitud procesada con éxito! Tu membresía ${selectedPlanForModal.name} (${billingCycle === 'anual' ? 'Anual' : 'Mensual'}) ha sido pre-registrada.`
      )

      // Redirigir a WhatsApp para validación y entrega de carnet digital
      const waText = encodeURIComponent(
        `¡Hola Grupo Médico Zenit! 👋 Acabo de solicitar la Membresía *${selectedPlanForModal.name.toUpperCase()}* (${billingCycle === 'anual' ? 'Pago Anual $ ' + price : 'Pago Mensual $ ' + price}).\n\n` +
          `👤 *Titular:* ${patientName}\n` +
          `🪪 *Cédula:* ${patientCedula}\n` +
          `📱 *Teléfono:* ${patientPhone}\n` +
          `💳 *Método de Pago Seleccionado:* ${paymentMethod.toUpperCase()} (Ref. Bs. ${priceBs})\n` +
          (validBeneficiaries.length > 0
            ? `👨‍👩‍👧‍👦 *Beneficiarios:* ${validBeneficiaries.map((b) => `${b.name} (${b.relationship})`).join(', ')}\n`
            : '') +
          `\nDeseo formalizar la activación y recibir mi carnet digital Zenit.`
      )

      setTimeout(() => {
        window.open(`https://wa.me/584220241622?text=${waText}`, '_blank')
      }, 1500)
    }
  }

  // Filtrado de la tabla de cobertura por categoría
  const filteredCoverageTable = SPECIALTY_COVERAGE_TABLE.filter((item) => {
    if (selectedCategory === 'all') return true
    return item.category === selectedCategory
  })

  return (
    <div className="space-y-16 pb-20 font-sans bg-white dark:bg-zinc-950 text-[#525862] dark:text-zinc-200">
      {/* =========================================================================
          1. HEADER BANNER CORPORATIVO CON LOGO Y ACREDITACIÓN ZENIT
          ========================================================================= */}
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
                  <HeartPulse className="w-3.5 h-3.5" />
                  <span>Programa Oficial de Afiliados • Zenit Vital</span>
                </div>
                <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white">
                  Planes de <span className="text-[#02B2C6]">Afiliados</span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Membresías de salud integral Bronce, Plata y Oro: consultas con médicos especialistas colegiados,
                  medicina general, laboratorio clínico 24h, quirófanos y medicina estética en CC Galerías Sebucán.
                </p>
              </div>
            </div>

            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold bg-white/10 border border-white/15 px-4 py-2 rounded-xl self-start md:self-auto backdrop-blur-sm">
              <Link href="/" className="hover:text-[#02B2C6] transition">
                Inicio
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[#02B2C6]">Afiliados</span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          2. NOTIFICACIÓN DE MEMBRESÍA ACTIVA SI EL USUARIO YA ESTÁ AFILIADO
          ========================================================================= */}
      {currentMembership && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-transparent border border-emerald-500/30 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-600 dark:text-emerald-400">
                    Membresía Activa
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold uppercase">
                    {currentMembership.tier.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm font-bold text-[#525862] dark:text-zinc-100">
                  Titular: {currentMembership.patientName} (Vigente hasta{' '}
                  {currentMembership.expiryDate})
                </p>
                <p className="text-xs text-[#777777] dark:text-zinc-400">
                  Consultas restantes: General: {currentMembership.consultsRemaining.general} •
                  Especialista: {currentMembership.consultsRemaining.specialist}
                </p>
              </div>
            </div>

            <Link
              href="/#agendar-cita"
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#02B2C6] hover:bg-[#029baa] transition shadow-sm whitespace-nowrap"
            >
              Agendar Cita con Membresía
            </Link>
          </div>
        </section>
      )}

      {/* =========================================================================
          3. SELECTOR DE CICLO DE PAGO & TASA BCV INFORMATIVA
          ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 text-center space-y-6">
        <div className="max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#02B2C6]">
            Elige tu modalidad de respaldo
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#525862] dark:text-zinc-100">
            Niveles de Cobertura Médica Zenit
          </h2>
          <p className="text-xs sm:text-sm text-[#777777] dark:text-zinc-400">
            Diseñados para brindar tranquilidad a personas y familias en Caracas, con atención directa en
            nuestras instalaciones sin deducibles ni trámites burocráticos.
          </p>
        </div>

        {/* Toggle Anual vs Mensual */}
        <div className="inline-flex items-center p-1.5 rounded-2xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-inner">
          <button
            onClick={() => setBillingCycle('anual')}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              billingCycle === 'anual'
                ? 'bg-[#02B2C6] text-white shadow-md'
                : 'text-[#525862] dark:text-zinc-400 hover:text-[#02B2C6]'
            }`}
          >
            <span>Pago Anual (12 Meses)</span>
            <span className="text-[10px] bg-amber-400 text-slate-900 px-2 py-0.5 rounded-full font-black">
              Ahorra 15%
            </span>
          </button>
          <button
            onClick={() => setBillingCycle('mensual')}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
              billingCycle === 'mensual'
                ? 'bg-[#02B2C6] text-white shadow-md'
                : 'text-[#525862] dark:text-zinc-400 hover:text-[#02B2C6]'
            }`}
          >
            Suscripción Mensual
          </button>
        </div>

        <p className="text-xs text-[#777777] dark:text-zinc-400">
          💵 Tasa oficial de referencia: <strong className="text-[#02B2C6]">{exchangeRate.toFixed(2)} Bs / USD</strong> (BCV). Se puede cancelar en Bolívares vía Pago Móvil, Zelle o divisas en caja.
        </p>
      </section>

      {/* =========================================================================
          4. LAS 3 TARJETAS COMPARATIVAS DE MEMBRESÍA (BRONCE, PLATA, ORO)
          ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch">
          {MEMBERSHIP_PLANS.map((plan) => {
            const price = billingCycle === 'anual' ? plan.priceAnnual : plan.priceMonthly
            const priceBs = (price * exchangeRate).toLocaleString('es-VE', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })
            const isPopular = plan.id === 'plata'
            const isGold = plan.id === 'oro'

            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 border-2 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-2xl ${
                  plan.borderClass
                } ${isPopular ? 'scale-100 lg:-translate-y-2 ring-4 ring-[#02B2C6]/20' : ''}`}
              >
                {/* Insignia Superior */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span
                    className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full text-white shadow-sm"
                    style={{ backgroundColor: plan.color }}
                  >
                    {plan.badge}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-[#777777] dark:text-zinc-400">
                    <Users className="w-3.5 h-3.5 text-[#02B2C6]" />
                    <span>{plan.affiliatesDescription}</span>
                  </div>
                </div>

                {/* Encabezado del Plan */}
                <div className="space-y-2 mb-6">
                  <h3 className="text-2xl font-black text-[#525862] dark:text-zinc-100">
                    {plan.name}
                  </h3>
                  <p className="text-xs text-[#777777] dark:text-zinc-400 leading-relaxed">
                    {plan.tagline}
                  </p>
                </div>

                {/* Precio */}
                <div className="py-4 px-5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-800 mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-black text-[#525862] dark:text-white">
                      ${price}
                    </span>
                    <span className="text-xs text-[#777777] dark:text-zinc-400 font-bold">
                      USD / {billingCycle === 'anual' ? 'año' : 'mes'}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-[#02B2C6] mt-0.5">
                    ≈ Bs. {priceBs} (Tasa BCV del día)
                  </div>
                  {billingCycle === 'anual' && (
                    <span className="inline-block mt-2 text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded font-bold">
                      ✓ Pago único anual para 12 meses de cobertura
                    </span>
                  )}
                </div>

                {/* Consultas 100% Incluidas Destacadas */}
                <div className="space-y-4 mb-6">
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#525862] dark:text-zinc-300 flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-[#02B2C6]" />
                    <span>Consultas al 100% Sin Costo Adicional:</span>
                  </div>
                  <ul className="space-y-2.5 text-xs text-[#777777] dark:text-zinc-300">
                    {plan.includedServices.map((srv, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <div className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                        <span className="leading-snug">{srv}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Descuentos Permanentes en Aranceles */}
                <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-zinc-800 mb-6">
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#525862] dark:text-zinc-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Descuentos Ilimitados Todo el Año:</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800">
                      <span className="text-[#777777] block">Especialistas:</span>
                      <strong className="text-base text-[#02B2C6]">
                        {plan.specialistDiscountPercent}% DESC.
                      </strong>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800">
                      <span className="text-[#777777] block">Laboratorio 24h:</span>
                      <strong className="text-base text-emerald-600">
                        {plan.labDiscountPercent}% DESC.
                      </strong>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800">
                      <span className="text-[#777777] block">Estética Zenit:</span>
                      <strong className="text-base text-pink-600">
                        {plan.aestheticDiscountPercent}% DESC.
                      </strong>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800">
                      <span className="text-[#777777] block">Hospitalización:</span>
                      <strong className="text-base text-purple-600">
                        {plan.hospitalizationDiscountPercent}% DESC.
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Botón de Acción / Afiliación */}
                <button
                  onClick={() => handleOpenAffiliation(plan)}
                  className={`w-full py-3.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                    isPopular
                      ? 'bg-[#02B2C6] hover:bg-[#029baa] text-white shadow-cyan-500/20 active:scale-98'
                      : isGold
                      ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20 active:scale-98'
                      : 'bg-[#525862] hover:bg-[#3d434c] text-white active:scale-98'
                  }`}
                >
                  <Award className="w-4 h-4" />
                  <span>Afiliarme al {plan.name}</span>
                </button>
              </div>
            )
          })}
        </div>
      </section>

      {/* =========================================================================
          5. MATRIZ DETALLADA DE COBERTURA POR ESPECIALIDADES (31 ESPECIALIDADES)
          ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#02B2C6]">
            Transparencia médica
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#525862] dark:text-zinc-100">
            ¿Cómo se cubren las 31 Especialidades Médicas?
          </h2>
          <p className="text-xs sm:text-sm text-[#777777] dark:text-zinc-400">
            Revisa con exactitud qué beneficios ofrece cada membresía en consultas clínicas, cirugías,
            diagnóstico y tratamientos dermoestéticos.
          </p>
        </div>

        {/* Filtro por Categorías */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {[
            { id: 'all', label: 'Todas las Áreas' },
            { id: 'primaria', label: 'Atención Primaria & Dental' },
            { id: 'especialidad', label: 'Consultas de Especialidad' },
            { id: 'cirugia', label: 'Cirugías & Quirófano' },
            { id: 'diagnostico', label: 'Laboratorio & 24 Horas' },
            { id: 'estetica', label: 'Medicina Estética' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-[#02B2C6] text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-zinc-800 text-[#525862] dark:text-zinc-300 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Tabla Comparativa */}
        <div className="overflow-x-auto rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900">
          <table className="w-full text-left text-xs text-[#525862] dark:text-zinc-300">
            <thead className="bg-slate-50 dark:bg-zinc-800/80 text-[11px] font-extrabold uppercase tracking-wider text-[#525862] dark:text-zinc-200 border-b border-slate-200 dark:border-zinc-800">
              <tr>
                <th className="py-4 px-6">Especialidad / Servicio Clínico</th>
                <th className="py-4 px-6 text-amber-800 dark:text-amber-400">Zenit Bronce ($60/a)</th>
                <th className="py-4 px-6 text-[#02B2C6]">Zenit Plata ($140/a)</th>
                <th className="py-4 px-6 text-yellow-600 dark:text-yellow-400">Zenit Oro ($250/a)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
              {filteredCoverageTable.map((item, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                >
                  <td className="py-3.5 px-6 font-bold text-[#525862] dark:text-zinc-100">
                    {item.specialty}
                  </td>
                  <td className="py-3.5 px-6">{item.bronce}</td>
                  <td className="py-3.5 px-6 font-semibold text-[#02B2C6] bg-cyan-50/20 dark:bg-cyan-950/10">
                    {item.plata}
                  </td>
                  <td className="py-3.5 px-6 font-semibold text-amber-700 dark:text-yellow-300">
                    {item.oro}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* =========================================================================
          6. POR QUÉ ELEGIR LAS MEMBRESÍAS GRUPO MÉDICO ZENIT
          ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-gradient-to-br from-slate-50 via-white to-cyan-50/30 dark:from-zinc-900 dark:to-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-12 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#02B2C6]/10 text-[#02B2C6] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-[#525862] dark:text-zinc-100">
                  Sin Deducibles ni Cartas Avales
                </h4>
                <p className="text-xs text-[#777777] dark:text-zinc-400 leading-relaxed">
                  Atención directa e inmediata presentando tu cédula de identidad en la sede de CC Galerías Sebucán.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                <Building2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-[#525862] dark:text-zinc-100">
                  Instalaciones 24/7 en Sebucán
                </h4>
                <p className="text-xs text-[#777777] dark:text-zinc-400 leading-relaxed">
                  Quirófanos equipados, habitaciones individuales climatizadas y laboratorio clínico continuo las 24 horas.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-[#525862] dark:text-zinc-100">
                  Especialistas Colegiados MPPS
                </h4>
                <p className="text-xs text-[#777777] dark:text-zinc-400 leading-relaxed">
                  Cuerpo médico altamente calificado con récipes médicos electrónicos y seguimiento asistencial continuo.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          7. PREGUNTAS FRECUENTES (FAQS)
          ========================================================================= */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-zinc-800 text-[#525862] dark:text-zinc-300 text-xs font-bold">
            <HelpCircle className="w-3.5 h-3.5 text-[#02B2C6]" />
            <span>Respuestas a tus Dudas</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#525862] dark:text-zinc-100">
            Preguntas Frecuentes sobre las Membresías
          </h2>
        </div>

        <div className="space-y-3">
          {MEMBERSHIP_FAQS.map((faq, idx) => (
            <details
              key={idx}
              className="group bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 transition shadow-sm open:border-[#02B2C6]"
            >
              <summary className="font-bold text-xs sm:text-sm text-[#525862] dark:text-zinc-100 cursor-pointer list-none flex items-center justify-between gap-4">
                <span>{faq.q}</span>
                <ChevronRight className="w-4 h-4 text-[#02B2C6] transition-transform group-open:rotate-90 shrink-0" />
              </summary>
              <p className="mt-3 text-xs text-[#777777] dark:text-zinc-400 leading-relaxed border-t border-slate-100 dark:border-zinc-800 pt-3">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* =========================================================================
          8. MODAL DE AFILIACIÓN Y REGISTRO DE BENEFICIARIOS
          ========================================================================= */}
      {isAffiliateModalOpen && selectedPlanForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-zinc-800 space-y-6">
            {/* Header del Modal */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-zinc-800 pb-4">
              <div className="space-y-1">
                <span
                  className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: selectedPlanForModal.color }}
                >
                  Afiliación Directa
                </span>
                <h3 className="text-xl font-black text-[#525862] dark:text-zinc-100">
                  Solicitud de Membresía {selectedPlanForModal.name}
                </h3>
                <p className="text-xs text-[#777777] dark:text-zinc-400">
                  Modalidad:{' '}
                  <strong>{billingCycle === 'anual' ? 'Pago Anual (12 Meses)' : 'Pago Mensual'}</strong>{' '}
                  • ${billingCycle === 'anual' ? selectedPlanForModal.priceAnnual : selectedPlanForModal.priceMonthly} USD (≈ Bs.{' '}
                  {(
                    (billingCycle === 'anual'
                      ? selectedPlanForModal.priceAnnual
                      : selectedPlanForModal.priceMonthly) * exchangeRate
                  ).toFixed(2)}
                  )
                </p>
              </div>
              <button
                onClick={() => setIsAffiliateModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-[#777777] hover:text-[#525862] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {successMessage ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-emerald-700 dark:text-emerald-400">
                  {successMessage}
                </h4>
                <p className="text-xs text-[#777777] dark:text-zinc-400 max-w-md mx-auto">
                  Se ha generado tu ficha. En unos segundos se abrirá tu WhatsApp para formalizar la
                  entrega del carnet digital con el equipo de secretaría.
                </p>
                <button
                  onClick={() => setIsAffiliateModalOpen(false)}
                  className="px-6 py-2 rounded-xl bg-[#02B2C6] text-white text-xs font-bold"
                >
                  Entendido
                </button>
              </div>
            ) : (
              <form onSubmit={handleAffiliateSubmit} className="space-y-4">
                {/* Datos del Titular */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase text-[#525862] dark:text-zinc-300">
                    1. Datos del Titular de la Membresía
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-[#777777]">
                        Nombre Completo
                      </label>
                      <input
                        type="text"
                        required
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        placeholder="Ej. Juan Pérez"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs text-[#525862] dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02B2C6]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-[#777777]">
                        Cédula de Identidad
                      </label>
                      <input
                        type="text"
                        required
                        value={patientCedula}
                        onChange={(e) => setPatientCedula(e.target.value)}
                        placeholder="Ej. V-18456789"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs text-[#525862] dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02B2C6]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-[#777777]">
                        Teléfono / WhatsApp
                      </label>
                      <input
                        type="tel"
                        required
                        value={patientPhone}
                        onChange={(e) => setPatientPhone(e.target.value)}
                        placeholder="Ej. +58 412 1234567"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs text-[#525862] dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02B2C6]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-[#777777]">
                        Correo Electrónico
                      </label>
                      <input
                        type="email"
                        required
                        value={patientEmail}
                        onChange={(e) => setPatientEmail(e.target.value)}
                        placeholder="correo@ejemplo.com"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs text-[#525862] dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02B2C6]"
                      />
                    </div>
                  </div>
                </div>

                {/* Beneficiarios Adicionales (Plata u Oro) */}
                {beneficiaries.length > 0 && (
                  <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-zinc-800">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase text-[#525862] dark:text-zinc-300">
                        2. Beneficiarios Familiares (Hasta {beneficiaries.length} incluidos)
                      </h4>
                      <span className="text-[10px] text-[#02B2C6] font-semibold">Opcional</span>
                    </div>

                    <div className="space-y-2.5">
                      {beneficiaries.map((b, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/60 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-3 gap-2"
                        >
                          <div>
                            <label className="text-[9px] font-bold uppercase text-[#777777]">
                              Familiar #{idx + 1} - Nombre
                            </label>
                            <input
                              type="text"
                              value={b.name}
                              onChange={(e) => {
                                const copy = [...beneficiaries]
                                copy[idx].name = e.target.value
                                setBeneficiaries(copy)
                              }}
                              placeholder="Nombre y Apellido"
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold uppercase text-[#777777]">
                              Cédula / Documento
                            </label>
                            <input
                              type="text"
                              value={b.cedula}
                              onChange={(e) => {
                                const copy = [...beneficiaries]
                                copy[idx].cedula = e.target.value
                                setBeneficiaries(copy)
                              }}
                              placeholder="Ej. V-25123456"
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold uppercase text-[#777777]">
                              Parentesco
                            </label>
                            <select
                              value={b.relationship}
                              onChange={(e) => {
                                const copy = [...beneficiaries]
                                copy[idx].relationship = e.target.value
                                setBeneficiaries(copy)
                              }}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs"
                            >
                              <option value="Cónyuge / Pareja">Cónyuge / Pareja</option>
                              <option value="Hijo / Hija">Hijo / Hija</option>
                              <option value="Padre / Madre">Padre / Madre</option>
                              <option value="Hermano / Hermana">Hermano / Hermana</option>
                              <option value="Otro Familiar">Otro Familiar</option>
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Método de Pago */}
                <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
                  <h4 className="text-xs font-black uppercase text-[#525862] dark:text-zinc-300">
                    3. Método de Pago Preferido
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('pago_movil')}
                      className={`p-3 rounded-xl border text-xs font-bold text-left transition cursor-pointer ${
                        paymentMethod === 'pago_movil'
                          ? 'border-[#02B2C6] bg-cyan-50/50 dark:bg-cyan-950/30 text-[#02B2C6]'
                          : 'border-slate-200 dark:border-zinc-700 hover:bg-slate-50'
                      }`}
                    >
                      <CreditCard className="w-4 h-4 mb-1" />
                      <div>Pago Móvil / Transferencia</div>
                      <span className="text-[10px] font-normal text-[#777777]">
                        Tasa BCV del día
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('zelle')}
                      className={`p-3 rounded-xl border text-xs font-bold text-left transition cursor-pointer ${
                        paymentMethod === 'zelle'
                          ? 'border-[#02B2C6] bg-cyan-50/50 dark:bg-cyan-950/30 text-[#02B2C6]'
                          : 'border-slate-200 dark:border-zinc-700 hover:bg-slate-50'
                      }`}
                    >
                      <CreditCard className="w-4 h-4 mb-1" />
                      <div>Zelle (USD)</div>
                      <span className="text-[10px] font-normal text-[#777777]">
                        Transferencia directa
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('efectivo_taquilla')}
                      className={`p-3 rounded-xl border text-xs font-bold text-left transition cursor-pointer ${
                        paymentMethod === 'efectivo_taquilla'
                          ? 'border-[#02B2C6] bg-cyan-50/50 dark:bg-cyan-950/30 text-[#02B2C6]'
                          : 'border-slate-200 dark:border-zinc-700 hover:bg-slate-50'
                      }`}
                    >
                      <Building2 className="w-4 h-4 mb-1" />
                      <div>Divisas en Caja</div>
                      <span className="text-[10px] font-normal text-[#777777]">
                        CC Galerías Sebucán
                      </span>
                    </button>
                  </div>
                </div>

                {/* Botón de Enviar */}
                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsAffiliateModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-zinc-800"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-xl bg-[#02B2C6] hover:bg-[#029baa] text-white text-xs font-black uppercase tracking-wider shadow-md transition active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span>Procesando...</span>
                    ) : (
                      <>
                        <WhatsAppIcon className="w-4 h-4 text-white" />
                        <span>Confirmar & Activar con Secretaría</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
