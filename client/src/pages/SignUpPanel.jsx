import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { EyeIcon } from '../assets/Icons';
import { useAuth } from '../context/AuthContext';
import { validateFullName, validateEmail, checkPasswordStrength } from '../utils/authValidation';
import { User, Wrench, Shield, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

export default function SignUpPanel({ onBack: externalBack, onLogin: externalLogin }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { register, isLoading } = useAuth();

  // Active portal tab: 'citizen' | 'crew' (Admin registration is disabled)
  const initialPortal = searchParams.get('portal') || searchParams.get('role') || 'citizen';
  const [portal, setPortal] = useState(
    ['citizen', 'crew'].includes(initialPortal) ? initialPortal : 'citizen'
  );

  const [form, setForm] = useState({
    name: '',
    email: '',
    organisation: '', // For crew: crew name
    password: '',
    confirm: '',
  });

  const [touched, setTouched] = useState({
    name: false,
    email: false,
    organisation: false,
    password: false,
    confirm: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [notice, setNotice] = useState('');

  const handlePortalSwitch = (newPortal) => {
    setPortal(newPortal);
    setSearchParams({ portal: newPortal });
    setErrorMessage('');
    setNotice('');
  };

  const handleBack = () => {
    if (externalBack) {
      externalBack();
    } else {
      navigate('/login?portal=' + portal);
    }
  };

  const handleLogin = () => {
    if (externalLogin) {
      externalLogin();
    } else {
      navigate('/login?portal=' + portal);
    }
  };

  const setField = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    if (!touched[key]) {
      setTouched((prev) => ({ ...prev, [key]: true }));
    }
    if (errorMessage) setErrorMessage('');
  };

  const handleBlur = (key) => () => {
    setTouched((prev) => ({ ...prev, [key]: true }));
  };

  // Real-time validations
  const nameError = useMemo(() => {
    if (!form.name && !touched.name) return null;
    return validateFullName(form.name);
  }, [form.name, touched.name]);

  const emailError = useMemo(() => {
    if (!form.email && !touched.email) return null;
    return validateEmail(form.email);
  }, [form.email, touched.email]);

  // Real-time password strength
  const passwordStrength = useMemo(() => {
    return checkPasswordStrength(form.password);
  }, [form.password]);

  // Real-time confirm password matching feedback
  const confirmMatch = useMemo(() => {
    if (!form.confirm) return null;
    return form.confirm === form.password;
  }, [form.confirm, form.password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setNotice('');

    // Mark all as touched
    setTouched({
      name: true,
      email: true,
      organisation: true,
      password: true,
      confirm: true,
    });

    // 1. Full name validation
    const valName = validateFullName(form.name);
    if (valName) {
      setErrorMessage(valName);
      return;
    }

    // 2. Email validation
    const valEmail = validateEmail(form.email);
    if (valEmail) {
      setErrorMessage(valEmail);
      return;
    }

    // 3. Crew leader specific: Crew / Org name required
    if (portal === 'crew' && !form.organisation.trim()) {
      setErrorMessage('Please enter your Crew or Organisation name.');
      return;
    }

    // 4. Password length
    if (!form.password || form.password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    // 5. Confirm password matching
    if (form.confirm !== form.password) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    // Prepare payload
    const orgValue = portal === 'crew' ? form.organisation.trim() : 'Civic Participant';

    // Register user in the database
    const result = await register({
      name: form.name.trim(),
      email: form.email.trim(),
      role: portal,
      organisation: orgValue,
      password: form.password,
      confirmPassword: form.confirm,
    });

    if (result.success) {
      setNotice(
        portal === 'crew'
          ? 'Crew Leader account registered and synced to database! Redirecting...'
          : 'Account created successfully! Redirecting...'
      );

      setTimeout(() => {
        if (result.user.role === 'crew') {
          navigate('/crew');
        } else {
          navigate('/citizen');
        }
      }, 1100);
    } else {
      setErrorMessage(result.message || 'Registration failed.');
    }
  };

  return (
    <section aria-label="Sign Up Portal" className="min-h-[700px] rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7 lg:p-8 flex flex-col justify-between">
      <div>
        <button
          type="button"
          onClick={handleBack}
          className="mb-2 text-sm font-semibold text-slate-500 transition hover:text-teal-700 cursor-pointer"
        >
          ← Back to Login
        </button>

        <div className="mx-auto flex max-w-md flex-col justify-center">
          {/* Portal Selector Tabs (Citizen, Crew Leader) */}
          <div className="mb-6 flex rounded-xl bg-slate-100 p-1 border border-slate-200/80">
            <button
              type="button"
              onClick={() => handlePortalSwitch('citizen')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                portal === 'citizen'
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
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                portal === 'crew'
                  ? 'bg-white text-teal-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Crew Leader</span>
            </button>
          </div>

          {/* Dynamic Header based on selected portal */}
          {portal === 'citizen' && (
            <div className="text-center mb-5">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Create Citizen Account</h1>
              <p className="mt-1 text-xs text-slate-500">
                Join Urban Intelligence to report potholes and track road improvements.
              </p>
            </div>
          )}

          {portal === 'crew' && (
            <div className="text-center mb-5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 mb-2">
                <Wrench className="w-3 h-3 text-amber-600" />
                <span>Crew Leader Access Only</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Crew Leader Registration</h1>
              <p className="mt-1 text-xs text-slate-500">
                Register your road maintenance squad. Crew members do not sign up individually.
              </p>
            </div>
          )}

          {portal === 'admin' && (
            <div className="text-center mb-5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-cyan-50 text-cyan-800 border border-cyan-200 mb-2">
                <Shield className="w-3 h-3 text-cyan-600" />
                <span>Authorized Municipal Personnel</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Municipal Officer Registration</h1>
              <p className="mt-1 text-xs text-slate-500">
                Register administrative access for city works & governance.
              </p>
            </div>
          )}

          {/* Banner Messages */}
          {errorMessage && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-700 flex items-start gap-2" role="alert">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {notice && (
            <div className="mb-4 rounded-xl border border-teal-200 bg-teal-50 p-3 text-xs leading-5 text-teal-800 flex items-start gap-2" role="status">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <span>{notice}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* 1. Full Name */}
            <div>
              <label htmlFor="name" className="block text-xs font-semibold text-slate-800 mb-1.5">
                {portal === 'crew' ? 'Leader Full Name *' : portal === 'admin' ? 'Officer Full Name *' : 'Full Name *'}
              </label>
              <input
                id="name"
                type="text"
                placeholder={portal === 'crew' ? 'e.g. Rakesh Yadav' : 'e.g. Adarsh Sharma'}
                autoComplete="name"
                value={form.name}
                onChange={setField('name')}
                onBlur={handleBlur('name')}
                className={`h-11 w-full rounded-xl border px-3.5 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-colors ${
                  touched.name && nameError
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-100 bg-red-50/20'
                    : 'border-slate-200 focus:border-teal-600 focus:ring-teal-100 bg-white'
                }`}
                required
              />
              {touched.name && nameError && (
                <p className="mt-1 text-[11px] font-medium text-red-600 flex items-center gap-1">
                  <span>•</span>
                  <span>{nameError}</span>
                </p>
              )}
            </div>

            {/* 2. Email Address */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-800 mb-1.5">
                {portal === 'admin' ? 'Official Government Email *' : 'Email Address *'}
              </label>
              <input
                id="email"
                type="email"
                placeholder={
                  portal === 'admin'
                    ? 'officer@urban-intelligence.gov.in'
                    : portal === 'crew'
                    ? 'crewleader@urban-intelligence.in'
                    : 'citizen@example.com'
                }
                autoComplete="email"
                value={form.email}
                onChange={setField('email')}
                onBlur={handleBlur('email')}
                className={`h-11 w-full rounded-xl border px-3.5 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-colors ${
                  touched.email && emailError
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-100 bg-red-50/20'
                    : 'border-slate-200 focus:border-teal-600 focus:ring-teal-100 bg-white'
                }`}
                required
              />
              {touched.email && emailError && (
                <p className="mt-1 text-[11px] font-medium text-red-600 flex items-center gap-1">
                  <span>•</span>
                  <span>{emailError}</span>
                </p>
              )}
            </div>

            {/* 3. Crew Name / Org Name (ONLY for Crew and Admin; REMOVED for Citizen) */}
            {portal === 'crew' && (
              <div>
                <label htmlFor="organisation" className="block text-xs font-semibold text-slate-800 mb-1.5">
                  Crew / Organisation Name *
                </label>
                <input
                  id="organisation"
                  type="text"
                  placeholder="e.g. Rapid Asphalt Patch Crew #1 or South Drainage Unit"
                  autoComplete="organization"
                  value={form.organisation}
                  onChange={setField('organisation')}
                  onBlur={handleBlur('organisation')}
                  className={`h-11 w-full rounded-xl border px-3.5 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-colors ${
                    touched.organisation && !form.organisation.trim()
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-100 bg-red-50/20'
                      : 'border-slate-200 focus:border-teal-600 focus:ring-teal-100 bg-white'
                  }`}
                  required
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  This crew name will be registered in the platform database for repair dispatches.
                </p>
              </div>
            )}

            {/* 3. Password with Real-Time Strength Meter */}

            {/* 4. Password with Real-Time Strength Meter */}
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-800 mb-1.5">
                Password *
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={setField('password')}
                  onBlur={handleBlur('password')}
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

              {/* Real-Time Password Strength Meter (Weak / Moderate / Strong) */}
              {form.password && (
                <div className="mt-2.5 rounded-lg bg-slate-50 border border-slate-100 p-2.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-semibold text-slate-600">Password Strength:</span>
                    <span className={`text-[11px] font-bold ${passwordStrength.textColor}`}>
                      {passwordStrength.label}
                    </span>
                  </div>

                  {/* 3-Segment Strength Progress Bar */}
                  <div className="grid grid-cols-3 gap-1.5 h-1.5 w-full">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        passwordStrength.level === 'weak'
                          ? 'bg-red-500'
                          : passwordStrength.level === 'moderate'
                          ? 'bg-amber-500'
                          : passwordStrength.level === 'strong'
                          ? 'bg-emerald-500'
                          : 'bg-slate-200'
                      }`}
                    />
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        passwordStrength.level === 'moderate'
                          ? 'bg-amber-500'
                          : passwordStrength.level === 'strong'
                          ? 'bg-emerald-500'
                          : 'bg-slate-200'
                      }`}
                    />
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        passwordStrength.level === 'strong' ? 'bg-emerald-500' : 'bg-slate-200'
                      }`}
                    />
                  </div>

                  {passwordStrength.hints.length > 0 && (
                    <p className="mt-1.5 text-[10px] text-slate-500">
                      Recommendation: add {passwordStrength.hints.join(', ')}.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* 5. Confirm Password with Real-Time Feedback */}
            <div>
              <label htmlFor="confirm" className="block text-xs font-semibold text-slate-800 mb-1.5">
                Confirm Password *
              </label>
              <div className="relative">
                <input
                  id="confirm"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  value={form.confirm}
                  onChange={setField('confirm')}
                  onBlur={handleBlur('confirm')}
                  className={`h-11 w-full rounded-xl border px-3.5 pr-11 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-colors ${
                    form.confirm
                      ? confirmMatch
                        ? 'border-emerald-500 focus:border-emerald-500 focus:ring-emerald-100 bg-emerald-50/10'
                        : 'border-red-500 focus:border-red-500 focus:ring-red-100 bg-red-50/10'
                      : 'border-slate-200 focus:border-teal-600 focus:ring-teal-100 bg-white'
                  }`}
                  required
                />
              </div>

              {/* Real-time Match Indicator */}
              {form.confirm && (
                <div className="mt-1.5">
                  {confirmMatch ? (
                    <p className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Passwords match</span>
                    </p>
                  ) : (
                    <p className="text-[11px] font-semibold text-red-600 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                      <span>Passwords do not match</span>
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 active:bg-teal-800 disabled:opacity-70 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving to Database...</span>
                </>
              ) : (
                <span>
                  {portal === 'crew'
                    ? 'Register Crew Leader & Squad'
                    : 'Create Citizen Account'}
                </span>
              )}
            </button>
          </form>

          {/* Footer note */}
          <p className="mt-5 text-center text-xs text-slate-500">
            Already have an account?{' '}
            <button
              type="button"
              className="font-semibold text-teal-700 hover:text-teal-800 cursor-pointer"
              onClick={handleLogin}
            >
              Sign In
            </button>
          </p>

          <p className="mt-3 text-center text-[11px] text-slate-400">
            Credentials will be stored securely with hashed passwords in the PostgreSQL database.
          </p>
        </div>
      </div>
    </section>
  );
}