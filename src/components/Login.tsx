import React, { useState } from 'react'
import { Auth, signInWithEmailAndPassword } from 'firebase/auth' // Import Auth type from firebase/auth
import LoadingOverlay from './LoadingOverlay'

interface LoginProps {
  auth: Auth
}

const Login: React.FC<LoginProps> = ({ auth }) => {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSignin = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setIsLoading(true)
      const userCredential = await signInWithEmailAndPassword(auth, 'admin@gmail.com', password)
      setIsLoading(false)
      console.log('User signed in:', userCredential.user)
      setError(null)
    } catch (error) {
      //@ts-ignore
      console.error('Error signing in:', error.message)

      setIsLoading(false)

      //@ts-ignore
      setError('Failed to sign in, make sure your username and password are correct.')
    }
  }

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="rounded-lg border border-gray-500 p-10 text-center">
        <img src="banner.png" alt="Red CORAL logo" className="mb-10 w-80" />
        <h2 className="mb-10 text-3xl font-bold">Admin Login</h2>
        <form onSubmit={handleSignin} className="w-full text-left">
          <label htmlFor="password" className="mb-1 block text-sm">
            Password
          </label>
          <div className="mb-2 flex justify-between gap-2">
            <input
              type="password"
              className="flex-grow rounded-md border border-gray-500 px-2 py-1"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              id="password"
            />
            <button type="submit" className="rounded-md border-0 bg-harvard-putty px-2 py-1 hover:bg-harvard-slate">
              Sign In
            </button>
          </div>
        </form>
        {error && <p className="text-center text-red-dark">{error}</p>}
        <LoadingOverlay isVisible={isLoading} color={'#888888'} />
      </div>
    </div>
  )
}

export default Login
