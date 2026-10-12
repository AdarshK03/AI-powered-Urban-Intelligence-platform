import { useState } from 'react';
import { EyeIcon, GoogleIcon, PhoneIcon } from '../assets/Icons';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9]{10,13}$/;

function Placeholder({ title, text, onBack }) {
  return (
    <section className="flex min-h-[400px] flex-col justify-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:min-h-[740px]">
      <h1 className="text-center text-2xl font-bold text-slate-900">{title}</h1>
      <p className="mx-auto mt-3 mb-6 max-w-sm text-center text-sm leading-6 text-slate-500">{text}</p>
      <button type="button" onClick={onBack} className="h-12 w-full rounded-xl bg-teal-600 px-4 text-sm font-semibold text-white transition hover:bg-teal-700">Back to Login</button>
    </section>
  );
}

const inputClass = (hasError) =>
  `h-12 w-full rounded-lg border bg-white px-3.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-100 ${hasError ? 'border-red-500' : 'border-slate-200'}`;

export default function LoginPanel({ onBack: goWelcome, onSignUp }) {
  const [screen, setScreen] = useState('login');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState('');

  const back = () => { setScreen('login'); setNotice(''); };

  const validate = () => {
    const nextErrors = {};
    const value = identifier.trim();
    if (!value) nextErrors.identifier = 'Enter your email or phone number.';
    else if (!EMAIL_RE.test(value) && !PHONE_RE.test(value.replace(/[\s-]/g, ''))) {
      nextErrors.identifier = 'Enter a valid email address or a 10-digit phone number.';
    }
    if (!password) nextErrors.password = 'Enter your password.';
    else if (password.length < 8) nextErrors.password = 'Password must be at least 8 characters.';
    return nextErrors;
  };

  const submit = (event) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    setNotice('');
    if (Object.keys(nextErrors).length === 0) {
      setNotice('Details look valid, but login is not connected to a backend yet.');
    }
  };

  if (screen === 'forgot') return <Placeholder title="Reset Password" text="Password reset is a placeholder. It needs a backend email or SMS service." onBack={back} />;
  if (screen === 'google') return <Placeholder title="Continue with Google" text="Google sign-in is an integration placeholder. No OAuth is configured yet." onBack={back} />;
  if (screen === 'phone') return <Placeholder title="Continue with Phone" text="Phone (OTP) sign-in is an integration placeholder. No SMS provider is configured yet." onBack={back} />;

  return (
    <section aria-label="Login" className="min-h-[680px] rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7 lg:min-h-[740px] lg:p-8">
      <button type="button" onClick={goWelcome} className="mb-1 text-sm font-semibold text-slate-500 transition hover:text-teal-700 lg:hidden">← Back</button>
      <div className="mx-auto flex max-w-md flex-col justify-center">
        <h1 className="mt-4 text-center text-2xl font-bold tracking-tight text-slate-900 sm:mt-12">Welcome Back</h1>
        <p className="mt-2 mb-6 text-center text-sm leading-6 text-slate-500">Staff sign-in. Login to continue and make your city better.</p>

        <form onSubmit={submit} noValidate>
          <label htmlFor="identifier" className="mb-2 block text-sm font-semibold text-slate-800">Email or Phone</label>
          <input id="identifier" type="text" autoComplete="username" placeholder="Enter your email or phone" value={identifier}
            onChange={(event) => setIdentifier(event.target.value)} aria-invalid={!!errors.identifier} className={inputClass(errors.identifier)} />
          {errors.identifier && <p className="mt-1.5 text-xs text-red-600" role="alert">{errors.identifier}</p>}

          <label htmlFor="password" className="mb-2 mt-5 block text-sm font-semibold text-slate-800">Password</label>
          <div className="relative">
            <input id="password" type={show ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password"
              value={password} onChange={(event) => setPassword(event.target.value)} aria-invalid={!!errors.password}
              className={`${inputClass(errors.password)} pr-12`} />
            <button type="button" onClick={() => setShow((current) => !current)} aria-label={show ? 'Hide password' : 'Show password'}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 hover:text-teal-700">
              <EyeIcon off={show} />
            </button>
          </div>
          {errors.password && <p className="mt-1.5 text-xs text-red-600" role="alert">{errors.password}</p>}

          <div className="my-3 flex justify-end">
            <button type="button" className="text-sm font-semibold text-sky-600 hover:text-sky-700" onClick={() => setScreen('forgot')}>Forgot Password?</button>
          </div>
          <button type="submit" className="mt-2 flex h-12 w-full items-center justify-center rounded-xl bg-teal-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 active:bg-teal-800">Login</button>
          {notice && <p className="mt-3 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs leading-5 text-teal-800" role="status">{notice}</p>}
        </form>

        <div className="my-6 flex items-center gap-3 text-xs font-semibold text-slate-400"><span className="h-px flex-1 bg-slate-200" /><span>OR</span><span className="h-px flex-1 bg-slate-200" /></div>
        <div className="space-y-3">
          <button type="button" onClick={() => setScreen('google')} className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"><GoogleIcon /> Continue with Google</button>
          <button type="button" onClick={() => setScreen('phone')} className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"><PhoneIcon /> Continue with Phone</button>
        </div>
        <p className="mt-7 text-center text-sm text-slate-500">Don't have an account? <button type="button" className="font-semibold text-teal-700 hover:text-teal-800" onClick={onSignUp}>Sign Up</button></p>
      </div>
    </section>
  );
}
