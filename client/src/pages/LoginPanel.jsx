import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { EyeIcon } from '../assets/Icons';
import { useAuth } from '../context/AuthContext';
import { validateEmail } from '../utils/authValidation';
import {
  User,
  Wrench,
  Shield,
  AlertCircle,
  CheckCircle2,
  Mail,
  KeyRound,
  ArrowLeft,
  RefreshCw,
  Lock,
} from 'lucide-react';

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

  // Citizen Password Recovery State (Strictly for Citizen role)
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [forgotStep, setForgotStep] = useState('request'); // 'request' | 'verify_reset' | 'success'
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [devOtpHint, setDevOtpHint] = useState(null);

  // Resend cooldown timer
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

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
          navigate('/crew');
        } else {
          // Citizen portal
          navigate('/citizen');
        }
      }, 700);
    } else {
      setErrorMessage(result.message || 'Login failed. Please verify credentials.');
    }
  };

  // 1. Citizen Forgot Password: Send OTP to Gmail
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    const emailVal = validateEmail(forgotEmail);
    if (emailVal) {
      setForgotError(emailVal);
      return;
    }

    setForgotLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to dispatch verification code.');
      }
      setForgotSuccess(data.message);
      if (data.devOtp) {
        setDevOtpHint(data.devOtp);
      }
      setForgotStep('verify_reset');
      setResendCooldown(60);
    } catch (err) {
      setForgotError(err.message);
    } finally {
      setForgotLoading(false);
    }
  };

  // 2. Resend OTP code with cooldown
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || forgotLoading) return;
    await handleSendOtp();
  };

  // 3. Citizen Password Reset: Verify OTP & update password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    if (!forgotOtp || forgotOtp.trim().length !== 6) {
      setForgotError('Please enter the 6-digit verification code sent to your email.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setForgotError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setForgotError('Passwords do not match. Please verify both passwords.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotEmail.trim().toLowerCase(),
          otp: forgotOtp.trim(),
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to reset password.');
      }
      setForgotStep('success');
      setForgotSuccess(data.message);
    } catch (err) {
      setForgotError(err.message);
    } finally {
      setForgotLoading(false);
    }
  };

  // 4. Return to Citizen Sign In
  const handleReturnToLogin = () => {
    setIsForgotMode(false);
    setForgotStep('request');
    setEmail(forgotEmail);
    setPassword('');
    setForgotError('');
    setForgotSuccess('');
    setErrorMessage('');
    setSuccessMessage('Password reset successfully! Please sign in with your new password.');
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
                onClick={() => navigate('/crew')}
                className="w-full h-11 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-sm transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Wrench className="w-4 h-4" />
                <span>Go to Crew Leader Operations Portal →</span>
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

  // Citizen Password Recovery View
  if (isForgotMode) {
    return (
      <section
        aria-label="Citizen Password Recovery"
        className="min-h-[640px] rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7 lg:p-8 flex flex-col justify-between"
      >
        <div>
          <button
            type="button"
            onClick={() => {
              setIsForgotMode(false);
              setForgotError('');
              setForgotSuccess('');
            }}
            className="mb-1 text-sm font-semibold text-slate-500 transition hover:text-teal-700 cursor-pointer flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Sign In</span>
          </button>

          <div className="mx-auto flex max-w-md flex-col justify-center mt-3">
            {/* Step 1: Request OTP */}
            {forgotStep === 'request' && (
              <>
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-teal-50 border border-teal-200 text-teal-700 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xs">
                    <KeyRound className="w-6 h-6 text-teal-600" />
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    Recover Password
                  </h1>
                  <p className="mt-1 text-xs text-slate-500 max-w-xs mx-auto">
                    Exclusively for Citizen accounts. Enter your registered Gmail address to receive a 6-digit verification code.
                  </p>
                </div>

                {forgotError && (
                  <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span>{forgotError}</span>
                  </div>
                )}

                <form onSubmit={handleSendOtp} noValidate className="space-y-4">
                  <div>
                    <label htmlFor="forgotEmail" className="block text-xs font-semibold text-slate-800 mb-1.5">
                      Registered Gmail Address
                    </label>
                    <div className="relative">
                      <input
                        id="forgotEmail"
                        type="email"
                        autoComplete="email"
                        placeholder="citizen@gmail.com"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 pl-10 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-100 transition-colors"
                        required
                      />
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 active:bg-teal-800 disabled:opacity-70 cursor-pointer"
                  >
                    {forgotLoading ? (
                      <>
                        <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Sending Verification Code...</span>
                      </>
                    ) : (
                      <span>Send 6-Digit Verification Code</span>
                    )}
                  </button>
                </form>
              </>
            )}

            {/* Step 2: Verify OTP & Reset Password */}
            {forgotStep === 'verify_reset' && (
              <>
                <div className="text-center mb-5">
                  <div className="w-12 h-12 bg-teal-50 border border-teal-200 text-teal-700 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xs">
                    <Mail className="w-6 h-6 text-teal-600" />
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    Verify Code & Set Password
                  </h1>
                  <p className="mt-1 text-xs text-slate-500">
                    Enter the code sent to <span className="font-semibold text-slate-800">{forgotEmail}</span>
                  </p>
                </div>

                {devOtpHint && (
                  <div className="mb-4 rounded-xl border border-teal-200 bg-teal-50/70 p-2.5 text-xs text-teal-800 flex items-center justify-between">
                    <span>Local Dev OTP: <strong className="font-mono text-sm tracking-wider">{devOtpHint}</strong></span>
                    <button
                      type="button"
                      onClick={() => setForgotOtp(devOtpHint)}
                      className="text-[11px] underline font-bold cursor-pointer hover:text-teal-900"
                    >
                      Auto-fill
                    </button>
                  </div>
                )}

                {forgotError && (
                  <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span>{forgotError}</span>
                  </div>
                )}

                {forgotSuccess && (
                  <div className="mb-4 rounded-xl border border-teal-200 bg-teal-50 p-3 text-xs text-teal-800 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <span>{forgotSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleResetPassword} noValidate className="space-y-4">
                  {/* 6-Digit OTP */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="otp" className="block text-xs font-semibold text-slate-800">
                        6-Digit Verification Code
                      </label>
                      <button
                        type="button"
                        disabled={resendCooldown > 0 || forgotLoading}
                        onClick={handleResendOtp}
                        className="text-[11px] font-semibold text-teal-700 hover:text-teal-800 disabled:text-slate-400 cursor-pointer disabled:cursor-not-allowed"
                      >
                        {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Code'}
                      </button>
                    </div>
                    <input
                      id="otp"
                      type="text"
                      maxLength={6}
                      placeholder="• • • • • •"
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="h-11 w-full text-center font-mono text-base tracking-[0.35em] rounded-xl border border-slate-200 bg-white px-3.5 text-slate-900 placeholder:text-slate-300 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-100 transition-colors"
                      required
                    />
                  </div>

                  {/* New Password */}
                  <div>
                    <label htmlFor="newPassword" className="block text-xs font-semibold text-slate-800 mb-1.5">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        id="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        placeholder="At least 6 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 pr-11 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-100 transition-colors"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword((prev) => !prev)}
                        className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-teal-700 cursor-pointer"
                      >
                        <EyeIcon off={showNewPassword} />
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label htmlFor="confirmPassword" className="block text-xs font-semibold text-slate-800 mb-1.5">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Re-enter new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 pr-11 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-100 transition-colors"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-teal-700 cursor-pointer"
                      >
                        <EyeIcon off={showConfirmPassword} />
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 active:bg-teal-800 disabled:opacity-70 cursor-pointer"
                  >
                    {forgotLoading ? (
                      <>
                        <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <span>Reset Password & Sign In</span>
                    )}
                  </button>
                </form>
              </>
            )}

            {/* Step 3: Success Banner */}
            {forgotStep === 'success' && (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 bg-emerald-50 border-2 border-emerald-500/20 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                    Password Reset Complete!
                  </h2>
                  <p className="mt-1 text-xs text-slate-500 max-w-xs mx-auto">
                    Your citizen account password has been updated securely. You can now sign in with your new credentials.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleReturnToLogin}
                  className="w-full h-11 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-sm transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Sign In with New Password</span>
                  <span>→</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 pt-6 border-t border-slate-100">
          Citizen Security Verification &bull; Urban Intelligence Platform
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
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-xs font-semibold text-slate-800">
                  Password
                </label>
                {portal === 'citizen' && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotMode(true);
                      setForgotStep('request');
                      setForgotEmail(email.trim());
                      setForgotError('');
                      setForgotSuccess('');
                    }}
                    className="text-[11px] font-semibold text-teal-700 hover:text-teal-800 transition-colors cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
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