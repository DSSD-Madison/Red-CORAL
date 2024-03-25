import React, { useState } from 'react'
import { Auth, signInWithEmailAndPassword } from 'firebase/auth' // Import Auth type from firebase/auth
import { useNavigate } from 'react-router-dom'

interface AdminProps {
  auth: Auth // Declare auth prop of type Auth
  onSignInSuccess: () => void
}

const Admin: React.FC<AdminProps> = ({ auth, onSignInSuccess }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleSignin = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      console.log('User signed in:', userCredential.user)
      setError(null)
      navigate('/')
      onSignInSuccess() // Call the callback function
    } catch (error) {
      //@ts-ignore
      console.error('Error signing in:', error.message)
      //@ts-ignore
      setError('Failed to sign in, make sure your username and password are correct.')
    }
  }

  return (
    <div className="p-20 text-center">
      <h2 className="bold text-3xl">Admin Sign In</h2>
      <form onSubmit={handleSignin} className="m-10">
        <label className="m-2 block">
          Email:
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
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
    </div>
  )
}

export default Admin
