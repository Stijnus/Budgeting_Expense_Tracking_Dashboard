import React, { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Auth() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(true) // Toggle between Sign Up and Sign In
  const [message, setMessage] = useState<string | null>(null) // For user feedback

  const handleAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setMessage(null) // Clear previous messages

    const credentials = { email, password }

    try {
      let error = null
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp(credentials)
        error = signUpError
        if (!error) setMessage("Check your email for the confirmation link!") // Default Supabase behavior
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword(credentials)
        error = signInError
        // No message needed on successful sign-in, App.tsx will handle redirect/UI change
      }

      if (error) throw error
    } catch (error: any) {
      console.error("Authentication error:", error)
      setMessage(`Error: ${error.error_description || error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const toggleAuthMode = () => {
    setIsSignUp(!isSignUp)
    setMessage(null) // Clear messages when switching modes
    setEmail('')     // Clear fields
    setPassword('')
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center text-gray-900">
          {isSignUp ? 'Create Account' : 'Sign In'}
        </h1>
        <form className="space-y-6" onSubmit={handleAuth}>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={isSignUp ? "new-password" : "current-password"}
              required
              minLength={6} // Supabase default minimum
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>
          {message && (
            <p className={`text-sm ${message.startsWith('Error:') ? 'text-red-600' : 'text-green-600'}`}>
              {message}
            </p>
          )}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
            </button>
          </div>
        </form>
        <p className="text-sm text-center text-gray-600">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            onClick={toggleAuthMode}
            disabled={loading}
            className="font-medium text-indigo-600 hover:text-indigo-500 disabled:opacity-50"
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  )
}
