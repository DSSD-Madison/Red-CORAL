import React, { useState } from 'react'
import { useDB } from '@/context/DBContext'
import { getApp } from 'firebase/app'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { Link } from 'react-router'
import { LucideCheck, LucideLoader2 } from 'lucide-react'
import LoadingOverlay from '@/components/LoadingOverlay'

const PRICE_ID = import.meta.env.VITE_STRIPE_PRICE_ID

const features = [
  'Acceso a descripciones detalladas de incidentes',
  'Próximamente: Chat con IA para análisis de datos',
  'Soporte prioritario',
  'Apoya el desarrollo continuo de Red CORAL',
]

const Pricing: React.FC = () => {
  const { isLoggedIn, userTier, permissions } = useDB()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isPaid = userTier === 'paid' || userTier === 'admin'
  const subscriptionStatus = permissions?.subscriptionStatus

  const handleSubscribe = async () => {
    if (!isLoggedIn) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const app = getApp()
      const functions = getFunctions(app)
      const createCheckoutSession = httpsCallable<
        { priceId: string; successUrl: string; cancelUrl: string },
        { url: string }
      >(functions, 'createCheckoutSession')

      const result = await createCheckoutSession({
        priceId: PRICE_ID,
        successUrl: `${window.location.origin}/pricing?success=true`,
        cancelUrl: `${window.location.origin}/pricing?canceled=true`,
      })

      // Redirect to Stripe Checkout
      if (result.data.url) {
        window.location.href = result.data.url
      }
    } catch (err: any) {
      console.error('Error creating checkout session:', err)
      setError('Error al iniciar el proceso de pago. Por favor, intente de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  // Check for success/cancel URL params
  const urlParams = new URLSearchParams(window.location.search)
  const isSuccess = urlParams.get('success') === 'true'
  const isCanceled = urlParams.get('canceled') === 'true'

  return (
    <div className="flex min-h-full flex-col items-center bg-slate-200 p-4">
      <div className="w-full max-w-lg">
        <h1 className="mb-6 text-center text-3xl font-bold">Planes de suscripción</h1>

        {isSuccess && (
          <div className="mb-6 rounded-lg bg-green-100 p-4 text-center text-green-800">
            ¡Gracias por suscribirte! Tu cuenta ha sido actualizada.
          </div>
        )}

        {isCanceled && (
          <div className="mb-6 rounded-lg bg-yellow-100 p-4 text-center text-yellow-800">
            El proceso de pago fue cancelado. Puedes intentar de nuevo cuando quieras.
          </div>
        )}

        {/* Pricing Card */}
        <div className="overflow-hidden rounded-xl bg-white shadow-lg">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
            <h2 className="text-2xl font-bold">Red CORAL Premium</h2>
            <div className="mt-2 flex items-baseline">
              <span className="text-4xl font-extrabold">$4.99</span>
              <span className="ml-2 text-lg opacity-80">USD / mes</span>
            </div>
          </div>

          <div className="p-6">
            <ul className="mb-6 space-y-3">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <LucideCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            {isPaid ? (
              <div className="rounded-lg bg-green-50 p-4 text-center">
                <p className="font-semibold text-green-800">
                  {userTier === 'admin' ? 'Tienes acceso de administrador' : 'Ya tienes una suscripción activa'}
                </p>
                {subscriptionStatus && (
                  <p className="mt-1 text-sm text-green-600">
                    Estado:{' '}
                    {subscriptionStatus === 'active'
                      ? 'Activa'
                      : subscriptionStatus === 'trialing'
                        ? 'Período de prueba'
                        : subscriptionStatus === 'past_due'
                          ? 'Pago pendiente'
                          : 'Cancelada'}
                  </p>
                )}
              </div>
            ) : isLoggedIn ? (
              <button
                onClick={handleSubscribe}
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <LucideLoader2 className="h-5 w-5 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  'Suscribirse ahora'
                )}
              </button>
            ) : (
              <div className="text-center">
                <p className="mb-4 text-gray-600">Inicia sesión para suscribirte</p>
                <Link
                  to="/login"
                  className="inline-block rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
                >
                  Iniciar sesión
                </Link>
              </div>
            )}

            {error && <p className="mt-4 text-center text-red-600">{error}</p>}
          </div>
        </div>

        {/* Free tier info */}
        <div className="mt-6 rounded-xl bg-white p-6 shadow-lg">
          <h3 className="mb-3 text-lg font-semibold text-gray-800">Plan gratuito</h3>
          <p className="text-gray-600">
            El acceso básico a Red CORAL es gratuito. Puedes ver el mapa de incidentes y las estadísticas sin necesidad
            de una suscripción.
          </p>
        </div>
      </div>

      <LoadingOverlay isVisible={isLoading} color="#3B82F6" />
    </div>
  )
}

export default Pricing
