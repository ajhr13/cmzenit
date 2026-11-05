import { StaffLoginView } from '@/components/auth/StaffLoginView'

export const metadata = {
  title: 'Personal Médico & Recepción - Grupo Médico Zenit',
  description: 'Acceso para médicos especialistas y secretaría de recepción de Grupo Médico Zenit.',
}

export default function StaffLoginPage() {
  return (
    <div className="min-h-[82vh] w-full flex items-center justify-center p-4 sm:p-6 bg-slate-50">
      <StaffLoginView />
    </div>
  )
}
