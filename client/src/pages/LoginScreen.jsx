import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { LogIn, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function LoginScreen({ onLogin, onBack }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      navigate('/login')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')

    if (!email.trim()) {
      setErrorMessage('Officer email is required.')
      return
    }
    if (!password) {
      setErrorMessage('Access key / password is required.')
      return
    }

    const result = await login({
      email: email.trim(),
      password,
      roleHint: 'admin'
    })

    if (result.success) {
      if (onLogin) {
        onLogin()
      }
      const destination = location.state?.from?.pathname || '/admin'
      navigate(destination, { replace: true })
    } else {
      setErrorMessage(result.message || 'Authentication failed. Please verify credentials.')
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#082832] flex items-center justify-center p-4">
      {/* Background radial effects */}
      <div className="absolute inset-0 bg-[radial-gradient(#0e4e61_1px,transparent_1px)] [background-size:20px_20px] opacity-20 pointer-events-none" />

      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-2xl relative z-10 border border-slate-100">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full border border-cyan-400/50 flex items-center justify-center text-cyan-300 bg-[#0a2e3a] mx-auto mb-3">
            <svg
              className="w-6 h-6 text-cyan-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              <path d="M2 12h20" />
            </svg>
          </div>

          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Urban Intelligence Platform</h2>
          <p className="text-xs text-slate-500 mt-1">
            Municipal Road Quality & Telemetry Administration
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-700 flex items-start gap-2" role="alert">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block text-slate-700 font-semibold mb-1 text-xs">
              Officer Email
            </label>
            <input
              type="email"
              value={email}
              autoComplete="username"
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. admin@urban-intelligence.gov.in"
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-600"
              required
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1 text-xs">
              Secure Key / Access Token
            </label>
            <input
              type="password"
              value={password}
              autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-600"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-[#0c6b82] hover:bg-[#0a5c70] text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-75 cursor-pointer"
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <LogIn className="w-4 h-4" />
            )}
            <span>{isLoading ? 'Verifying with Backend...' : 'Sign In as Municipal Administrator'}</span>
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center space-y-2">
          <span className="text-[11px] text-slate-400 block">
            Authorized Personnel Only • GovTech Urban Systems
          </span>
          <button
            type="button"
            onClick={handleBack}
            className="text-xs text-cyan-700 hover:text-cyan-800 font-medium cursor-pointer"
          >
            ← Back to Citizen Portal
          </button>
        </div>
      </div>
    </div>
  )
}
