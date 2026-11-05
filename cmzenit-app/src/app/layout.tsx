import type { Metadata } from 'next'
import { Readex_Pro } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/Providers'

const readexPro = Readex_Pro({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-readex-pro',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Grupo Médico Zenit - Salud & Estética Integral',
  description:
    'Grupo Médico Zenit en CC Galerías Sebucán, Caracas. Consultas médicas especializadas, quirófano, hospitalización y medicina estética avanzada.',
  icons: {
    icon: '/logo-zenit.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="es"
      className={`${readexPro.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-white text-[#777777]">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
