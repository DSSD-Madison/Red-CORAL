import React from 'react'
import { useDB } from '@/context/DBContext'
import { Link } from 'react-router'
import { LucideLock } from 'lucide-react'

interface PaywallGateProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

const PaywallGate: React.FC<PaywallGateProps> = ({ children, fallback }) => {
  const { userTier, isLoggedIn } = useDB()

  const hasAccess = userTier === 'paid' || userTier === 'admin'

  if (hasAccess) {
    return <>{children}</>
  }

  if (fallback) {
    return <>{fallback}</>
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
      <LucideLock className="mb-3 h-10 w-10 text-gray-400" />
      <h3 className="mb-2 text-lg font-semibold text-gray-800">Contenido Premium</h3>
      <p className="mb-4 text-sm text-gray-600">
        {isLoggedIn
          ? 'Esta función está disponible para suscriptores premium.'
          : 'Inicia sesión y suscríbete para acceder a esta función.'}
      </p>
      <Link
        to={isLoggedIn ? '/pricing' : '/login'}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
      >
        {isLoggedIn ? 'Ver planes' : 'Iniciar sesión'}
      </Link>
    </div>
  )
}

export default PaywallGate
