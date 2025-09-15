// src/components/ui/LoadingSpinner.tsx
'use client'

interface LoadingSpinnerProps {
  message?: string
}

export default function LoadingSpinner({ message = 'Cargando...' }: LoadingSpinnerProps) {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
        <div className="text-gray-600 text-lg">{message}</div>
      </div>
    </div>
  )
}