import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { EyeIcon } from '../assets/Icons';
import { useAuth } from '../context/AuthContext';
import { validateEmail } from '../utils/authValidation';
import { User, Wrench, Shield, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function LoginPanel({
  onBack: externalBack,
  onSignUp: externalSignUp,
  onAdmin: externalAdmin,
}) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { login, user, isAuthenticated, logout, isLoading } = useAuth();

  // Active portal tab: 'citizen' | 'crew' | 'admin'
  const initialPortal = searchParams.get('portal') || searchParams.get('role') || 'citizen';
  const [portal, setPortal] = useState(
    ['citizen', 'crew', 'admin'].includes(initialPortal) ? initialPortal : 'citizen'
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handlePortalSwitch = (newPortal) => {
    setPortal(newPortal);
    setSearchParams({ portal: newPortal });
    setErrorMessage('');
    setSuccessMessage('');
  };

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
      navigate(`/signup?portal=${portal}`);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // Input validation
    const emailVal = validateEmail(email);
    if (emailVal) {
      setErrorMessage(emailVal);
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    // Call Node.js backend authentication flow with roleHint matching active portal
    const result = await login({
      email: email.trim(),
      password,
      roleHint: portal,
    });

    if (result.success) {
      setSuccessMessage(`Welcome back, ${result.user.name}!`);

      setTimeout(() => {
        if (result.user.role === 'admin') {
          navigate('/admin');
        } else if (result.user.role === 'crew') {
          // Requirement 9: Do not create a new page for crews UI yet.
          // Staying on this page will show the authenticated Crew Leader session card.
          setSuccessMessage(`Authenticated as Crew Leader: ${result.user.name}`);
        } else {
          // Citizen portal
          navigate('/citizen');
        }
      }, 700);
    } else {
      setErrorMessage(result.message || 'Login failed. Please verify credentials.');
    }
  };

  // If already logged in, show authenticated state card
  if (isAuthenticated && user) {
    const roleLabel =
      user.role === 'admin'
        ? 'Municipal Administrator'
        : user.role === 'crew'
          ? 'Crew Leader'
          : 'Citizen';

    return (
      <section
        aria-label="Authenticated Session"
        className="min-h-[500px] rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 flex flex-col justify-between"
      >
        <div>
          <button
            type="button"
            onClick={handleBack}
            className="mb-4 text-sm font-semibold text-slate-500 hover:text-teal-700 cursor-pointer"
          >
            ← Back to Home
          </button>

          <div className="text-center mt-4">
            <div className="w-16 h-16 bg-teal-50 border-2 border-teal-500/20 text-teal-700 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <h1 className="mt-3 text-xl font-bold text-slate-900">{user.name}</h1>
            <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>

            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
              <span className="w-2 h-2 rounded-full bg-teal-500" />
              Role: <span className="font-bold">{roleLabel}</span>
            </div>

            {user.organisation && (
              <p className="text-xs text-slate-600 font-medium mt-2 bg-slate-50 py-1 px-3 rounded-lg inline-block border border-slate-100">
                {user.role === 'crew' ? `Crew: ${user.organisation}` : user.organisation}
              </p>
            )}

            {user.role === 'crew' && (
              <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-left text-xs text-amber-800">
                <p className="font-semibold flex items-center gap-1">
                  <Wrench className="w-3.5 h-3.5 text-amber-600" />
                  <span>Crew Leader Session Active</span>
                </p>
                <p className="mt-1 text-amber-700 text-[11px] leading-relaxed">
                  You are signed in as the authorized leader for <strong>{user.organisation}</strong>.
                  Field dispatch tools and task workflows are in development.
                </p>
              </div>
            )}
          </div>

          <div className="mt-8 space-y-3">
            {user.role === 'admin' && (
              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="w-full h-11 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-sm transition cursor-pointer"
              >
                Go to Admin Console →
              </button>
            )}

            {user.role === 'citizen' && (
              <button
                type="button"
                onClick={() => navigate('/citizen')}
                className="w-full h-11 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-sm transition cursor-pointer"
              >
                Return to Citizen Portal
              </button>
            )}

            {user.role === 'crew' && (
              <button
                type="button"
                onClick={() => navigate('/citizen/map')}
                className="w-full h-11 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-sm transition cursor-pointer"
              >
                View Public Road Incidents Map →
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
          Authenticated Session • Synced with PostgreSQL Database
        </p>
      </section>
    );
  }

  return (
    <section
      aria-label="Login Portal"
      className="min-h-[640px] rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7 lg:p-8 flex flex-col justify-between"
    >
      <div>
        <button
          type="button"
          onClick={handleBack}
          className="mb-1 text-sm font-semibold text-slate-500 transition hover:text-teal-700 cursor-pointer"
        >
          ← Back
        </button>

        <div className="mx-auto flex max-w-md flex-col justify-center">
          {/* Portal Selector Tabs */}
          <div className="mt-2 mb-6 flex rounded-xl bg-slate-100 p-1 border border-slate-200/80">
            <button
              type="button"
              onClick={() => handlePortalSwitch('citizen')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${portal === 'citizen'
                ? 'bg-white text-teal-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Citizen</span>
            </button>

            <button
              type="button"
              onClick={() => handlePortalSwitch('crew')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${portal === 'crew'
                ? 'bg-white text-teal-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Crew Leader</span>
            </button>

            <button
              type="button"
              onClick={() => handlePortalSwitch('admin')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${portal === 'admin'
                ? 'bg-white text-teal-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Officer</span>
            </button>
          </div>

          {/* Dynamic Header */}
          {portal === 'citizen' && (
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Citizen Sign In</h1>
              <p className="mt-1 text-xs text-slate-500">
                Sign in to report road issues and track urban improvements.
              </p>
            </div>
          )}

          {portal === 'crew' && (
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 mb-2">
                <Wrench className="w-3 h-3 text-amber-600" />
                <span>Crew Leader Access</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Crew Leader Portal</h1>
              <p className="mt-1 text-xs text-slate-500">
                Crew members do not sign up individually; access is reserved for Crew Leaders.
              </p>
            </div>
          )}

          {portal === 'admin' && (
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-cyan-50 text-cyan-800 border border-cyan-200 mb-2">
                <Shield className="w-3 h-3 text-cyan-600" />
                <span>Municipal Governance</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Municipal Officer Sign In</h1>
              <p className="mt-1 text-xs text-slate-500">
                Administrative access for municipal road governance and department oversight.
              </p>
            </div>
          )}

          {/* Error & Success Banners */}
          {errorMessage && (
            <div
              className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-700 flex items-start gap-2"
              role="alert"
            >
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div
              className="mb-4 rounded-xl border border-teal-200 bg-teal-50 p-3 text-xs leading-5 text-teal-800 flex items-start gap-2"
              role="status"
            >
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-800 mb-1.5">
                {portal === 'admin'
                  ? 'Officer Email Address'
                  : portal === 'crew'
                    ? 'Crew Leader Email'
                    : 'Email Address'}
              </label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                placeholder={
                  portal === 'admin'
                    ? 'officer@urban-intelligence.gov.in'
                    : portal === 'crew'
                      ? 'leader@repair-crew.org'
                      : 'citizen@example.com'
                }
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-100 transition-colors"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-800 mb-1.5">
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
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 pr-11 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-100 transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-teal-700 cursor-pointer"
                >
                  <EyeIcon off={showPassword} />
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 active:bg-teal-800 disabled:opacity-70 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <span>
                  {portal === 'crew'
                    ? 'Sign In as Crew Leader'
                    : portal === 'admin'
                      ? 'Sign In as Municipal Officer'
                      : 'Sign In'}
                </span>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <button
              type="button"
              className="font-semibold text-teal-700 hover:text-teal-800 cursor-pointer"
              onClick={portal === 'admin' ? '' : handleSignUp}
            >
              {portal === 'crew' ? 'Sign Up (Crew Leader)' : portal === 'admin' ? 'Contact Admin for Access' : 'Sign Up (Citizen)'}
            </button>
          </p>
        </div>
      </div>
    </section>
  );
}