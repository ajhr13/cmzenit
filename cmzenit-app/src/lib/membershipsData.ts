import { MembershipPlan, MembershipTier } from '@/types/database.types'

export function getInitialBenefitsForTier(tier: MembershipTier) {
  switch (tier) {
    case 'oro':
      return {
        general: 'ilimitadas' as const,
        specialist: 6,
        dental: 4,
        lab: 4,
        cardio: 3,
        aesthetic: 1,
      }
    case 'plata':
      return {
        general: 4,
        specialist: 3,
        dental: 2,
        lab: 2,
        cardio: 1,
        aesthetic: 0,
      }
    case 'bronce':
    default:
      return {
        general: 2,
        specialist: 1,
        dental: 1,
        lab: 1,
        cardio: 0,
        aesthetic: 0,
      }
  }
}

export const MEMBERSHIP_PLANS: MembershipPlan[] = [
  {
    id: 'bronce',
    name: 'Zenit Bronce',
    tagline: 'Prevención Individual Esencial',
    badge: 'Plan Personal',
    color: '#CD7F32',
    borderClass: 'border-amber-700/30 hover:border-amber-600',
    bgLightClass: 'bg-amber-50/50 dark:bg-amber-950/20',
    accentColor: 'text-amber-800 dark:text-amber-400',
    priceAnnual: 60,
    priceMonthly: 6,
    affiliatesCount: 1,
    affiliatesDescription: '1 Afiliado (Titular individual)',
    generalConsultsCount: 2,
    specialistConsultsCount: 1,
    specialtiesCoveredText: 'Acceso a las 31 especialidades médicas de la clínica',
    labDiscountPercent: 10,
    specialistDiscountPercent: 15,
    aestheticDiscountPercent: 10,
    hospitalizationDiscountPercent: 10,
    includedServices: [
      '2 Consultas de Medicina General o Familiar al año',
      '1 Consulta con Médico Especialista Colegiado al año',
      '1 Limpieza dental con profilaxis ultrasónica',
      '1 Perfil de laboratorio de rutina (Hematología, Glicemia, Urea, Creatinina, Orina)',
      'Triaje preferencial en Emergencia 24 Horas',
      'Récipes médicos y certificados de salud digitales MPPS',
    ],
    highlightedFeatures: [
      '15% de descuento en consultas adicionales con cualquier especialista',
      '10% de descuento en Laboratorio Clínico 24h',
      '10% de descuento en tratamientos de Espacio Estética Zenit',
      'Historial clínico y récipe digital centralizado',
    ],
    recommendedFor: 'Pacientes jóvenes, profesionales y personas que buscan respaldo médico preventivo y de emergencias a un costo muy accesible.',
  },
  {
    id: 'plata',
    name: 'Zenit Plata',
    tagline: 'Protección Integral Familiar',
    badge: 'Más Elegido por Familias',
    color: '#8A9BA8',
    borderClass: 'border-[#02B2C6] hover:border-[#029baa] ring-2 ring-[#02B2C6]/20',
    bgLightClass: 'bg-cyan-50/40 dark:bg-cyan-950/30',
    accentColor: 'text-[#02B2C6]',
    priceAnnual: 140,
    priceMonthly: 14,
    affiliatesCount: 3,
    affiliatesDescription: 'Titular + 2 Beneficiarios directos (3 personas en total)',
    generalConsultsCount: 4,
    specialistConsultsCount: 3,
    specialtiesCoveredText: 'Cardiología, Pediatría, Ginecología, Traumatología, etc.',
    labDiscountPercent: 20,
    specialistDiscountPercent: 25,
    aestheticDiscountPercent: 15,
    hospitalizationDiscountPercent: 15,
    includedServices: [
      '4 Consultas de Medicina General o Medicina Interna al año',
      '3 Consultas con Médicos Especialistas Colegiados al año',
      '2 Limpiezas dentales con profilaxis ultrasónica y despistaje',
      '2 Perfiles 20 completos en Laboratorio Clínico 24h',
      '1 Electrocardiograma digital de 12 derivaciones con informe',
      'Triaje prioritario continuo en Emergencia 24 Horas',
      'Atención y coordinación de citas vía WhatsApp Secretaría VIP',
    ],
    highlightedFeatures: [
      'Hasta 3 personas cubiertas (Titular, pareja, hijos o padres)',
      '25% de descuento en consultas con especialistas adicionales',
      '20% de descuento permanente en exámenes de Laboratorio 24h',
      '15% de descuento en Espacio Estética, Quirófanos y Hospitalización 24h',
    ],
    recommendedFor: 'Familias, parejas y adultos que desean consultas periódicas con especialistas, chequeos de laboratorio y atención preferencial.',
  },
  {
    id: 'oro',
    name: 'Zenit Oro',
    tagline: 'Cobertura Médica Total & VIP',
    badge: 'Máxima Cobertura Zenit',
    color: '#D4AF37',
    borderClass: 'border-yellow-500/40 hover:border-yellow-500',
    bgLightClass: 'bg-yellow-50/40 dark:bg-yellow-950/20',
    accentColor: 'text-amber-600 dark:text-yellow-400',
    priceAnnual: 250,
    priceMonthly: 25,
    affiliatesCount: 5,
    affiliatesDescription: 'Titular + hasta 4 Beneficiarios directos (5 personas en total)',
    generalConsultsCount: 'Ilimitadas',
    specialistConsultsCount: 6,
    specialtiesCoveredText: 'Todas las especialidades médicas, quirúrgicas y pediátricas',
    labDiscountPercent: 30,
    specialistDiscountPercent: 40,
    aestheticDiscountPercent: 25,
    hospitalizationDiscountPercent: 25,
    includedServices: [
      'Consultas de Medicina General e Interna ILIMITADAS todo el año',
      '6 Consultas con Médicos Especialistas Colegiados al año',
      '4 Limpiezas dentales profilácticas + Evaluación odontológica',
      '4 Perfiles 20 completos + Pruebas especiales en Laboratorio 24h',
      '2 Electrocardiogramas digitales + 1 Ecocardiograma o Ecografía integral',
      '1 Sesión de Limpieza Facial Hidrafacial Profunda en Espacio Estética',
      'Atención médica inmediata VIP sin esperas en Emergencia 24h',
      'Coordinador médico personal y asignación prioritaria en quirófano',
    ],
    highlightedFeatures: [
      'Consultas de medicina general e interna ilimitadas para el grupo',
      '40% de descuento en consultas adicionales con cualquier especialista',
      '30% de descuento en todos los exámenes de Laboratorio Clínico 24h',
      '25% de descuento en Hospitalización 24h y Espacio Estética Zenit',
    ],
    recommendedFor: 'Familias grandes, empresas o pacientes que exigen la máxima cobertura médica, chequeos preventivos completos y atención VIP inmediata.',
  },
]

export interface SpecialtyCoverageItem {
  specialty: string
  category: 'primaria' | 'especialidad' | 'cirugia' | 'diagnostico' | 'estetica'
  bronce: string
  plata: string
  oro: string
}

export const SPECIALTY_COVERAGE_TABLE: SpecialtyCoverageItem[] = [
  {
    specialty: 'Medicina General & Familiar',
    category: 'primaria',
    bronce: '2 consultas al año (100% cubiertas)',
    plata: '4 consultas al año (100% cubiertas)',
    oro: 'ILIMITADAS todo el año (100% cubiertas)',
  },
  {
    specialty: 'Medicina Interna',
    category: 'primaria',
    bronce: '15% de descuento',
    plata: 'Incluida en cupo anual o 25% desc.',
    oro: 'ILIMITADAS todo el año (100% cubiertas)',
  },
  {
    specialty: 'Pediatría & Control Infantil',
    category: 'primaria',
    bronce: '15% de descuento',
    plata: 'Incluida en cupo anual o 25% desc.',
    oro: 'Incluida en cupo anual + 40% desc.',
  },
  {
    specialty: 'Ginecología y Obstetricia',
    category: 'primaria',
    bronce: '15% de descuento',
    plata: 'Incluida en cupo anual o 25% desc.',
    oro: 'Incluida en cupo anual + 40% desc.',
  },
  {
    specialty: 'Cardiología Adulta & Infantil',
    category: 'especialidad',
    bronce: '15% de descuento',
    plata: 'Incluida en cupo anual + 1 ECG gratis',
    oro: 'Incluida en cupo + 2 ECG + 1 Ecocardiograma',
  },
  {
    specialty: 'Traumatología & Cirugía de la Mano',
    category: 'especialidad',
    bronce: '15% de descuento',
    plata: 'Incluida en cupo anual o 25% desc.',
    oro: 'Incluida en cupo anual + 40% desc.',
  },
  {
    specialty: 'Urología',
    category: 'especialidad',
    bronce: '15% de descuento',
    plata: 'Incluida en cupo anual o 25% desc.',
    oro: 'Incluida en cupo anual + 40% desc.',
  },
  {
    specialty: 'Gastroenterología & Neumonología',
    category: 'especialidad',
    bronce: '15% de descuento',
    plata: 'Incluida en cupo anual o 25% desc.',
    oro: 'Incluida en cupo anual + 40% desc.',
  },
  {
    specialty: 'Oncología Médica & Cirugía Oncológica',
    category: 'cirugia',
    bronce: '15% de descuento en consulta',
    plata: '25% desc. en consulta + 15% quirófano',
    oro: '40% desc. en consulta + 25% quirófano',
  },
  {
    specialty: 'Oftalmología & Evaluación Visual',
    category: 'especialidad',
    bronce: '15% de descuento',
    plata: 'Incluida en cupo anual o 25% desc.',
    oro: 'Incluida en cupo anual + 40% desc.',
  },
  {
    specialty: 'Odontología & Ortodoncia',
    category: 'primaria',
    bronce: '1 Profilaxis ultrasónica incluida',
    plata: '2 Profilaxis ultrasónicas incluidas',
    oro: '4 Profilaxis ultrasónicas incluidas',
  },
  {
    specialty: 'Neurología & Neurocirugía',
    category: 'especialidad',
    bronce: '15% de descuento',
    plata: '25% de descuento',
    oro: 'Incluida en cupo anual + 40% desc.',
  },
  {
    specialty: 'Nefrología / Diálisis',
    category: 'especialidad',
    bronce: '15% de descuento',
    plata: '25% de descuento',
    oro: 'Incluida en cupo anual + 40% desc.',
  },
  {
    specialty: 'Dermatología Clínica & Quirúrgica',
    category: 'especialidad',
    bronce: '15% de descuento',
    plata: 'Incluida en cupo anual o 25% desc.',
    oro: 'Incluida en cupo anual + 40% desc.',
  },
  {
    specialty: 'Nutrición, Psicología & Fisioterapia',
    category: 'especialidad',
    bronce: '15% de descuento',
    plata: '25% de descuento',
    oro: 'Incluida en cupo anual + 40% desc.',
  },
  {
    specialty: 'Laboratorio Clínico 24 Horas',
    category: 'diagnostico',
    bronce: '1 Perfil rutina gratis + 10% desc.',
    plata: '2 Perfiles 20 gratis + 20% desc.',
    oro: '4 Perfiles 20 gratis + 30% desc.',
  },
  {
    specialty: 'Emergencia 24 Horas & Hospitalización',
    category: 'diagnostico',
    bronce: 'Triaje preferencial + 10% desc.',
    plata: 'Triaje prioritario + 15% desc.',
    oro: 'Pase VIP inmediato + 25% desc.',
  },
  {
    specialty: 'Medicina Estética & Dermoestética',
    category: 'estetica',
    bronce: '10% de descuento',
    plata: '15% de descuento en tratamientos',
    oro: '1 Hidrafacial gratis + 25% desc.',
  },
]

export const MEMBERSHIP_FAQS = [
  {
    q: '¿Cómo funciona la activación de las consultas incluidas?',
    a: 'Una vez activada tu membresía, puedes solicitar tus citas desde el portal web, recepción o vía WhatsApp VIP. Las consultas incluidas se descuentan automáticamente de tu saldo anual sin ningún cobro adicional.',
  },
  {
    q: '¿Quiénes pueden ser registrados como beneficiarios?',
    a: 'En los planes Plata y Oro puedes registrar a tu pareja/cónyuge, hijos (sin límite de edad) y padres. Cada beneficiario recibe su carnet digital y acceso completo a los beneficios.',
  },
  {
    q: '¿Cuáles métodos de pago aceptan para las membresías?',
    a: 'Aceptamos transferencias en Bolívares y Pago Móvil a la tasa oficial del Banco Central de Venezuela (BCV) del día, transferencias bancarias internacionales, Zelle, y divisas en efectivo directamente en la taquilla de caja en CC Galerías Sebucán.',
  },
  {
    q: '¿Las consultas no utilizadas son transferibles o acumulables?',
    a: 'Las consultas incluidas pueden ser utilizadas por cualquiera de los beneficiarios registrados dentro del mismo grupo familiar durante los 12 meses de vigencia del plan.',
  },
  {
    q: '¿Los descuentos en especialistas y laboratorio aplican durante todo el año?',
    a: 'Sí, incluso después de haber consumido tus consultas incluidas al 100%, tú y tus beneficiarios disfrutan de los descuentos porcentuales (15%, 25% o 40% según tu plan) en todas las consultas y exámenes que requieran durante el año.',
  },
]
