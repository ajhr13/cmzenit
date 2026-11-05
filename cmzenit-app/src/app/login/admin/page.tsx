import { AdminLoginView } from '@/components/auth/AdminLoginView'

export const metadata = {
  title: 'Dirección Médica & Admin - Grupo Médico Zenit',
  description: 'Acceso a la Dirección Médica y Administración de Grupo Médico Zenit.',
}

export default function LoginAdminAliasPage() {
  return (
    <div className="min-h-[82vh] w-full flex items-center justify-center p-4 sm:p-6 bg-slate-900/5">
      <AdminLoginView />
    </div>
  )
}
