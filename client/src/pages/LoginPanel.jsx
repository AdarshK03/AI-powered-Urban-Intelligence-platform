import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { EyeIcon } from '../assets/Icons';
import { useAuth } from '../context/AuthContext';

const inputClass = (hasError) =>
  `h-12 w-full rounded-lg border bg-white px-3.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-100 transition-colors ${
    hasError ? 'border-red-500' : 'border-slate-200'
  }`;

export default function LoginPanel({ onBack: externalBack, onSignUp: externalSignUp, onAdmin: externalAdmin }) {
  const navigate = useNavigate();
  const { login, user, isAuthenticated, logout, getSavedCredentials, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Prepopulate saved credentials from localStorage if available
  useEffect(() => {
    const saved = getSavedCredentials();
    if (saved && saved.email) {
      setEmail(saved.email);
      if (saved.password) {
        setPassword(saved.password);
      }
    }
  }, [getSavedCredentials]);

  const handleBack = () => {
    if (externalBack) {
      externalBack();
    } else {
      navigate('/');
    }
  };

  const handleSignUp = () => {
    if (externalSignUp) {
      externalSignUp();
    } else {
      navigate('/signup');
    }
  };

  const handleAdmin = () => {
    if (externalAdmin) {
      externalAdmin();
    } else {
      navigate('/admin/login');
    }
  };

  const handleFillDemoCitizen = () => {
    setEmail('citizen@urban-intelligence.in');
    setPassword('citizen123');
    setErrorMessage('');
  };

  const handleFillDemoAdmin = () => {
    setEmail('admin@urban-intelligence.gov.in');
    setPassword('admin123');
    setErrorMessage('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    // Call Node.js backend authentication flow
    const result = await login({ email: email.trim(), password });

    if (result.success) {
      setSuccessMessage(`Welcome back, ${result.user.name}!`);
      // If user has administrative privileges, redirect to admin dashboard
      if (result.user.role === 'admin') {
        setTimeout(() => {
          navigate('/admin');
        }, 800);
      } else {
        // Citizens go to their home screen
        setTimeout(() => {
          navigate('/citizen');
        }, 800);
      }
    } else {
      setErrorMessage(result.message || 'Login failed.');
    }
  };

  // If already logged in, show authenticated state card
  if (isAuthenticated && user) {
    return (
      <section aria-label="Authenticated Session" className="min-h-[500px] rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 flex flex-col justify-between">
        <div>
          <button
            type="button"
            onClick={handleBack}
            className="mb-4 text-sm font-semibold text-slate-500 hover:text-teal-700 cursor-pointer"
          >
            ← Back to Home
          </button>

          <div className="text-center mt-6">
            <div className="w-16 h-16 bg-teal-50 border-2 border-teal-500/20 text-teal-700 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <h1 className="mt-4 text-xl font-bold text-slate-900">{user.name}</h1>
            <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
              <span className="w-2 h-2 rounded-full bg-teal-500" />
              Role: <span className="capitalize">{user.role}</span>
            </div>
            {user.organisation && (
              <p className="text-xs text-slate-400 mt-2">{user.organisation}</p>
            )}
          </div>

          <div className="mt-8 space-y-3">
            {user.role === 'admin' ? (
              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="w-full h-11 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-sm transition cursor-pointer"
              >
                Go to Admin Console →
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/citizen')}
                className="w-full h-11 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-sm transition cursor-pointer"
              >
                Return to Citizen Portal
              </button>
            )}

            <button
              type="button"
              onClick={logout}
              className="w-full h-11 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-semibold text-sm transition cursor-pointer"
            >
              Log Out
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 pt-6 border-t border-slate-100">
          Logged in via Node.js Backend • Credentials cached in LocalStorage
        </p>
      </section>
    );
  }

  return (
    <section aria-label="Login" className="min-h-[640px] rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7 lg:p-8 flex flex-col justify-between">
      <div>
        <button
          type="button"
          onClick={handleBack}
          className="mb-1 text-sm font-semibold text-slate-500 transition hover:text-teal-700 cursor-pointer"
        >
          ← Back
        </button>

        <div className="mx-auto flex max-w-md flex-col justify-center">
          <h1 className="mt-2 text-center text-2xl font-bold tracking-tight text-slate-900 sm:mt-6">Welcome Back</h1>
          <p className="mt-1 mb-6 text-center text-sm leading-6 text-slate-500">
            Sign in with your email and password to access the Urban Intelligence Platform.
          </p>

          {/* Error & Success Banners */}
          {errorMessage && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-700 flex items-start gap-2" role="alert">
              <span className="font-bold text-red-600">!</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 rounded-xl border border-teal-200 bg-teal-50 p-3 text-xs leading-5 text-teal-800 flex items-start gap-2" role="status">
              <span className="font-bold text-teal-600">✓</span>
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-800">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              placeholder="e.g. citizen@urban-intelligence.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass(!!errorMessage && !email)}
              required
            />

            <label htmlFor="password" className="mb-2 mt-4 block text-sm font-semibold text-slate-800">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${inputClass(!!errorMessage && !password)} pr-12`}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 hover:text-teal-700 cursor-pointer"
              >
                <EyeIcon off={showPassword} />
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 active:bg-teal-800 disabled:opacity-70 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <span>Login</span>
              )}
            </button>
          </form>

          {/* Quick Demo Pre-fill helpers for effortless testing */}
          <div className="mt-5 rounded-xl bg-slate-50 border border-slate-100 p-3">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Quick Test Credentials:
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleFillDemoCitizen}
                className="flex-1 py-1.5 px-2 bg-white hover:bg-teal-50 hover:border-teal-200 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 transition cursor-pointer"
              >
                Citizen Demo
              </button>
              <button
                type="button"
                onClick={handleFillDemoAdmin}
                className="flex-1 py-1.5 px-2 bg-white hover:bg-teal-50 hover:border-teal-200 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 transition cursor-pointer"
              >
                Admin Demo
              </button>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <button
              type="button"
              className="font-semibold text-teal-700 hover:text-teal-800 cursor-pointer"
              onClick={handleSignUp}
            >
              Sign Up
            </button>
          </p>

          <p className="mt-2 text-center text-xs text-slate-400">
            Municipal Officer?{' '}
            <button
              type="button"
              className="font-semibold text-teal-600 hover:text-teal-700 cursor-pointer"
              onClick={handleAdmin}
            >
              Access Admin Console →
            </button>
          </p>
        </div>
      </div>
    </section>
  );
}