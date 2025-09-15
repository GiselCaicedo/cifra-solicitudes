// src/components/solicitudes/CreateSolicitudModal.tsx
'use client'

import { useEffect, useRef, useState } from 'react'

interface CreateSolicitudModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (titulo: string, descripcion: string) => Promise<void>
}

export default function CreateSolicitudModal({ isOpen, onClose, onSubmit }: CreateSolicitudModalProps) {
    const [titulo, setTitulo] = useState('')
    const [descripcion, setDescripcion] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const dialogRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!isOpen) return
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') handleClose()
        }
        document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
    }, [isOpen])

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            await onSubmit(titulo.trim(), descripcion.trim())
            setTitulo('')
            setDescripcion('')
            onClose()
        } catch {
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleClose = () => {
        setTitulo('')
        setDescripcion('')
        onClose()
    }

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) handleClose()
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm"
            onClick={handleBackdropClick}
            aria-hidden={false}
        >
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="create-solicitud-title"
                className="w-full max-w-lg bg-white rounded-xl shadow-2xl ring-1 ring-black/5 animate-[fadeIn_150ms_ease-out] mx-auto"
            >
                <div className="flex items-start justify-between px-6 pt-6">
                    <h3 id="create-solicitud-title" className="text-lg font-semibold text-gray-900">
                        Nueva Solicitud
                    </h3>
                    <button
                        onClick={handleClose}
                        className="p-2 -mr-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 rounded-md"
                    >
                        <span className="sr-only">Cerrar</span>
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="px-6 pb-6 pt-4 space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Título <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={titulo}
                            onChange={(e) => setTitulo(e.target.value)}
                            className="w-full rounded-md border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            placeholder="Describe brevemente tu solicitud"
                            disabled={isSubmitting}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Descripción <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            required
                            rows={5}
                            value={descripcion}
                            onChange={(e) => setDescripcion(e.target.value)}
                            className="w-full rounded-md border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-y"
                            placeholder="Proporciona todos los detalles necesarios para que podamos ayudarte..."
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isSubmitting}
                            className="inline-flex justify-center px-4 py-2 text-sm font-medium rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex justify-center px-4 py-2 text-sm font-semibold rounded-md text-white bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Creando...' : 'Crear Solicitud'}
                        </button>
                    </div>
                </form>
            </div>
            <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>
        </div>
    )
}
