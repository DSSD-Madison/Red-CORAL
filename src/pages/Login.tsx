import React, { useState } from 'react'
import { Auth, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth'
import LoadingOverlay from '@/components/LoadingOverlay'

interface LoginProps {
  auth: Auth
}

const Login: React.FC<LoginProps> = ({ auth }) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handlePasswordReset = async () => {
    if (!username) {
      setError('Por favor, ingrese su correo electrónico para restablecer la contraseña')
      return
    }

    try {
      setIsLoading(true)
      await sendPasswordResetEmail(auth, username)
      setSuccessMessage('Se ha enviado un correo electrónico con instrucciones para restablecer su contraseña')
      setError(null)
    } catch (error) {
      console.error('Error sending password reset email:', error)
      setError('Error al enviar el correo electrónico de restablecimiento de contraseña')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignin = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setIsLoading(true)
      await signInWithEmailAndPassword(auth, username, password)
      setIsLoading(false)
      setError(null)
    } catch (error) {
      console.error('Error signing in:', error instanceof Error ? error.message : String(error))
      setIsLoading(false)
      setError('Error al iniciar sesión, asegúrese de que su nombre de usuario y contraseña sean correctos.')
    }
  }

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="rounded-lg border border-gray-500 p-10 text-center shadow-xl">
        <img src="banner.png" alt="logo de Red CORAL" className="mx-auto mb-10 w-80" />
        <h2 className="mb-10 text-3xl font-bold">Inicio de sesión de administrador</h2>
        <form onSubmit={handleSignin} className="w-full text-left">
          <label htmlFor="username" className="block text-sm">
            Correo electrónico
          </label>
          <div className="mb-2 flex flex-col">
            <input
              type="text"
              className="mb-2 w-full rounded-md border border-gray-500 px-2 py-1"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              id="username"
            />
            <label htmlFor="password" className="block text-sm">
              Contraseña
            </label>
            <input
              type="password"
              className="mb-2 w-full rounded-md border border-gray-500 px-2 py-1"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              id="password"
            />
            <button type="submit" className="w-full rounded-md bg-neutral-300 px-2 py-1 hover:bg-gray-200 active:border-b-0 active:bg-gray-100">
              Iniciar sesión
            </button>
          </div>
        </form>
        <button
          onClick={(e) => {
            e.preventDefault()
            handlePasswordReset()
          }}
          className="mb-4 text-sm text-harvard-slate hover:text-harvard-putty"
        >
          ¿Olvidó su contraseña?
        </button>
        {error && <p className="text-center text-red-dark">{error}</p>}
        {successMessage && <p className="text-center text-green-600">{successMessage}</p>}
        <LoadingOverlay isVisible={isLoading} color={'#888888'} />
      </div>
    </div>
  )
}

export default Login
