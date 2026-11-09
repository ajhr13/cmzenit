'use client'

import React from 'react'
import { X, Download, FileText, Image as ImageIcon } from 'lucide-react'

interface ImageLightboxModalProps {
  isOpen: boolean
  onClose: () => void
  imageUrl: string | null
  title?: string
  fileType?: string
}

export function ImageLightboxModal({
  isOpen,
  onClose,
  imageUrl,
  title = 'Documento Clínico / Récipe Adjunto',
  fileType,
}: ImageLightboxModalProps) {
  if (!isOpen || !imageUrl) return null

  const isPdf =
    fileType?.toLowerCase().includes('pdf') ||
    imageUrl.toLowerCase().includes('.pdf') ||
    imageUrl.startsWith('data:application/pdf')

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative bg-zinc-900 border border-zinc-700/80 rounded-2xl sm:rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Superior */}
        <div className="p-3 sm:p-4 bg-zinc-900/95 border-b border-zinc-800 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-2 truncate pr-2">
            <div className="w-7 h-7 rounded-lg bg-[#02B2C6]/20 text-[#02B2C6] flex items-center justify-center shrink-0">
              {isPdf ? <FileText className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
            </div>
            <div className="truncate">
              <h3 className="text-xs sm:text-sm font-bold text-zinc-100 truncate">{title}</h3>
              <p className="text-[10px] text-zinc-400">Expediente Médico Oficial CMZenit</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={imageUrl}
              download={title || 'documento-clinico'}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#02B2C6] hover:bg-[#029baa] text-white transition flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Descargar</span>
            </a>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              title="Cerrar visor"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Visor de Contenido (Imagen / PDF) */}
        <div className="p-2 sm:p-4 overflow-auto flex-1 flex items-center justify-center bg-black/60 min-h-[260px] sm:min-h-[400px]">
          {isPdf ? (
            <iframe
              src={imageUrl}
              title={title}
              className="w-full h-[65vh] rounded-xl border border-zinc-800 bg-white"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={title}
              className="max-w-full max-h-[72vh] object-contain rounded-xl shadow-2xl transition"
            />
          )}
        </div>
      </div>
    </div>
  )
}
