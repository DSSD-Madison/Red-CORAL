import { useState, useEffect } from 'react'

const ComingSoonModal = () => {
  const [isVisible, setIsVisible] = useState(true)

  // Check if modal has been dismissed before (use sessionStorage to persist during session)
  useEffect(() => {
    const dismissed = sessionStorage.getItem('coming-soon-dismissed')
    if (dismissed) {
      setIsVisible(false)
    }
  }, [])

  const handleClose = () => {
    setIsVisible(false)
    sessionStorage.setItem('coming-soon-dismissed', 'true')
  }

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  if (!isVisible) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      <div className="relative mx-4 max-w-lg rounded-xl bg-white p-8 shadow-2xl">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
          aria-label="Cerrar"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Logo */}
        <div className="mb-6 flex justify-center">
          <img
            src="/dssd_logo.svg"
            alt="RED-Coral Logo"
            className="h-24 w-auto"
          />
        </div>

        {/* Title */}
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-800">
          Próximamente disponible
        </h2>

        {/* Features list */}
        <ul className="space-y-4 text-gray-600">
          <li className="flex items-start gap-3">
            <span className="mt-1 text-red-600">•</span>
            <span>
              <strong className="font-semibold text-gray-800">Datos históricos completos:</strong> Acceso a más de 10 años de registros actualizados.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1 text-red-600">•</span>
            <span>
              <strong className="font-semibold text-gray-800">Visualización avanzada:</strong> herramientas interactivas, incluyendo mapas satelitales para un análisis geográfico detallado.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1 text-red-600">•</span>
            <span>
              <strong className="font-semibold text-gray-800">Análisis estadístico robusto:</strong> funcionalidades que permiten identificar patrones, tendencias y métricas clave para la toma de decisiones informadas.
            </span>
          </li>
        </ul>

        {/* Dismiss hint */}
        <p className="mt-6 text-center text-sm text-gray-400">
          Haz clic fuera o presiona el botón para cerrar
        </p>
      </div>
    </div>
  )
}

export default ComingSoonModal