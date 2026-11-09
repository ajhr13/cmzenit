'use client'

import React, { ReactNode } from 'react'
import { CMZenitProvider } from '@/context/CMZenitContext'
import { Navbar } from '@/components/Navbar'
import { AuthModal } from '@/components/AuthModal'
import { Chatbot } from '@/components/Chatbot'
import { Footer } from '@/components/Footer'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <CMZenitProvider>
      <div className="min-h-screen bg-white text-[#777777] flex flex-col font-sans">
        <Navbar />
        <AuthModal />
        <Chatbot />
        <main className="flex-1 w-full pb-16 md:pb-0">
          {children}
        </main>
        <Footer />
      </div>
    </CMZenitProvider>
  )
}
