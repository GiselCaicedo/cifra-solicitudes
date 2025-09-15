// src/components/solicitudes/CreateSolicitudModal.tsx
'use client'

import { useState } from 'react'

interface CreateSolicitudModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (titulo: string, descripcion: string) => Promise<void>
}

export default function CreateSolicitudModal({ isOpen, onClose, onSubmit }: CreateSolicitudModalProps) {
    const [titulo, setTitulo] = useState('')
    const [descripcion, setDescripcion] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            await onSubmit(titulo, descripcion)
            setTitulo('')
            setDescripcion('')
            onClose()
        } catch (error) {
            console.error('Error creating solicitud:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleClose = () => {
        setTitulo('')
        setDescripcion('')
        onClose()
    }

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Nueva Solicitud</h3>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <span className="sr-only">Cerrar</span>
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Título <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={titulo}
                            onChange={(e) => setTitulo(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                            placeholder="Describe brevemente tu solicitud"
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Descripción <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            required
                            rows={4}
                            value={descripcion}
                            onChange={(e) => setDescripcion(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
                            placeholder="Proporciona todos los detalles necesarios para que podamos ayudarte..."
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Creando...' : 'Crear Solicitud'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}