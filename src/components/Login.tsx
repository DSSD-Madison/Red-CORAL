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
    <div className="p-20 text-center">
      <h2 className="bold text-3xl">Admin Sign In</h2>
      <form onSubmit={handleSignin} className="m-10">
        <label className="m-2 block">
          Password:
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        <div className="m-5 flex justify-center">
          <button type="submit" className="rounded-sm border-0 bg-harvard-putty pb-1 pl-2 pr-2 pt-1 hover:bg-harvard-slate">
            Sign In
          </button>
        </div>
      </form>
      {error && <p className="text-center text-red-dark">{error}</p>}
      <LoadingOverlay isVisible={isLoading} color={'#888888'} />
    </div>
  )
}

export default Login
