import React, { useState } from 'react'
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore/lite'
import { useDB } from '@/context/DBContext'
import LoadingOverlay from '@/components/LoadingOverlay'

interface LoginProps {
  auth: Auth
}

const Login: React.FC<LoginProps> = ({ auth }) => {
  const { firestore } = useDB()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot-password'>('login')

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      setError('Por favor, ingrese su correo electrónico')
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      await sendPasswordResetEmail(auth, email)
      setSuccessMessage('Se ha enviado un correo electrónico con instrucciones para restablecer su contraseña')
    } catch (error: any) {
      console.error('Error sending password reset email:', error)
      if (error.code === 'auth/user-not-found') {
        setError('No existe una cuenta con este correo electrónico')
      } else if (error.code === 'auth/invalid-email') {
        setError('Correo electrónico inválido')
      } else {
        setError('Error al enviar el correo electrónico de restablecimiento de contraseña')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)

      // Create Permission document with isPaid: false
      await setDoc(doc(firestore, 'Permissions', userCredential.user.uid), {
        isAdmin: false,
        isPaid: false,
        countryCodes: [],
        createdAt: new Date().toISOString(),
      })

      setSuccessMessage('Cuenta creada exitosamente')
      setMode('login')
    } catch (error: any) {
      console.error('Error signing up:', error)

      if (error.code === 'auth/email-already-in-use') {
        setError('Este correo electrónico ya está registrado')
      } else if (error.code === 'auth/invalid-email') {
        setError('Correo electrónico inválido')
      } else if (error.code === 'auth/weak-password') {
        setError('La contraseña es demasiado débil')
      } else {
        setError('Error al crear la cuenta')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignin = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setIsLoading(true)
      setError(null)
      await signInWithEmailAndPassword(auth, email, password)
      setSuccessMessage(null)
    } catch (error: any) {
      console.error('Error signing in:', error.message)
      setIsLoading(false)

      if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        setError('Correo electrónico o contraseña incorrectos')
      } else if (error.code === 'auth/invalid-email') {
        setError('Correo electrónico inválido')
      } else {
        setError('Error al iniciar sesión')
      }
    }
  }

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="rounded-lg border border-black/10 p-10 text-center shadow-xl">
        <img src="/banner.png" alt="logo de Red CORAL" className="mx-auto mb-10 w-80" />
        <h2 className="mb-10 text-3xl font-bold">
          {mode === 'login' ? 'Iniciar sesión' : mode === 'signup' ? 'Crear cuenta' : 'Restablecer contraseña'}
        </h2>

        <form onSubmit={mode === 'login' ? handleSignin : mode === 'signup' ? handleSignup : handlePasswordReset} className="w-full text-left">
          <label htmlFor="email" className="block text-sm">
            Correo electrónico
          </label>
          <input
            type="email"
            className="mb-2 w-full rounded-md border border-black/20 px-2 py-1"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            id="email"
          />

          {mode !== 'forgot-password' && (
            <>
              <label htmlFor="password" className="block text-sm">
                Contraseña
              </label>
              <input
                type="password"
                className="mb-2 w-full rounded-md border border-black/20 px-2 py-1"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                id="password"
                minLength={6}
              />
            </>
          )}

          {mode === 'signup' && (
            <>
              <label htmlFor="confirmPassword" className="block text-sm">
                Confirmar contraseña
              </label>
              <input
                type="password"
                className="mb-2 w-full rounded-md border border-black/20 px-2 py-1"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                id="confirmPassword"
                minLength={6}
              />
            </>
          )}

          <button type="submit" className="w-full rounded-md bg-neutral-300 px-2 py-1 hover:bg-gray-200 active:bg-gray-100">
            {mode === 'login' ? 'Iniciar sesión' : mode === 'signup' ? 'Crear cuenta' : 'Enviar enlace de restablecimiento'}
          </button>
        </form>

        <div className="mt-4 flex flex-col gap-2">
          {mode === 'login' && (
            <>
              <button
                onClick={() => {
                  setMode('forgot-password')
                  setError(null)
                  setSuccessMessage(null)
                }}
                className="text-sm text-harvard-slate hover:text-harvard-putty"
              >
                ¿Olvidó su contraseña?
              </button>
              <button
                onClick={() => {
                  setMode('signup')
                  setError(null)
                  setSuccessMessage(null)
                }}
                className="text-sm text-harvard-slate hover:text-harvard-putty"
              >
                ¿No tiene cuenta? Crear una
              </button>
            </>
          )}

          {(mode === 'signup' || mode === 'forgot-password') && (
            <button
              onClick={() => {
                setMode('login')
                setError(null)
                setSuccessMessage(null)
              }}
              className="text-sm text-harvard-slate hover:text-harvard-putty"
            >
              Volver a iniciar sesión
            </button>
          )}
        </div>

        {error && <p className="mt-4 text-center text-red-dark">{error}</p>}
        {successMessage && <p className="mt-4 text-center text-green-600">{successMessage}</p>}
        <LoadingOverlay isVisible={isLoading} color={'#888888'} />
      </div>
    </div>
  )
}

export default Login
