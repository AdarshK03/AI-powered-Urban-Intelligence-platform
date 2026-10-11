
import { useState } from 'react';
import { EyeIcon, GoogleIcon, PhoneIcon } from '../assets/Icons';
 
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9]{10,13}$/;
 
// Placeholder screen used for sign up / forgot password / integrations.
function Placeholder({ title, text, onBack }) {
  return (
    <section className="card login">
      <h1 className="center">{title}</h1>
      <p className="sub">{text}</p>
      <button className="btn primary" onClick={onBack}>Back to Login</button>
    </section>
  );
}
 
export default function LoginPanel({ onBack: goWelcome, onSignUp }) {
  const [screen, setScreen] = useState('login'); // login | forgot | google | phone
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState('');
 
  const back = () => { setScreen('login'); setNotice(''); };
 
  const validate = () => {
    const e = {};
    const id = identifier.trim();
    if (!id) e.identifier = 'Enter your email or phone number.';
    else if (!EMAIL_RE.test(id) && !PHONE_RE.test(id.replace(/[\s-]/g, ''))) e.identifier = 'Enter a valid email address or a 10-digit phone number.';
    if (!password) e.password = 'Enter your password.';
    else if (password.length < 8) e.password = 'Password must be at least 8 characters.';
    return e;
  };
 
  const submit = (ev) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    setNotice('');
    if (Object.keys(e).length === 0) {
      // TODO: call Node/Express endpoint, e.g. POST /api/auth/login { identifier, password } (role comes from the server)
      setNotice('Details look valid, but login is not connected to a backend yet.');
    }
  };
 
  if (screen === 'forgot') return <Placeholder title="Reset Password" text="Password reset is a placeholder. It needs a backend email or SMS service." onBack={back} />;
  if (screen === 'google') return <Placeholder title="Continue with Google" text="Google sign-in is an integration placeholder. No OAuth is configured yet." onBack={back} />;
  if (screen === 'phone') return <Placeholder title="Continue with Phone" text="Phone (OTP) sign-in is an integration placeholder. No SMS provider is configured yet." onBack={back} />;
 
  return (
    <section className="card login" aria-label="Login">
      <button type="button" className="back" onClick={goWelcome}>← Back</button>
      <h1 className="center">Welcome Back</h1>
      <p className="sub">Staff sign-in. Login to continue and make your city better.</p>
 
      <form onSubmit={submit} noValidate>
        <label htmlFor="identifier">Email or Phone</label>
        <input id="identifier" type="text" autoComplete="username" placeholder="Enter your email or phone"
          value={identifier} onChange={(e) => setIdentifier(e.target.value)}
          aria-invalid={!!errors.identifier} className={errors.identifier ? 'invalid' : ''} />
        {errors.identifier && <p className="error" role="alert">{errors.identifier}</p>}
 
        <label htmlFor="password">Password</label>
        <div className="pw">
          <input id="password" type={show ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password"
            value={password} onChange={(e) => setPassword(e.target.value)}
            aria-invalid={!!errors.password} className={errors.password ? 'invalid' : ''} />
          <button type="button" className="eye" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}>
            <EyeIcon off={show} />
          </button>
        </div>
        {errors.password && <p className="error" role="alert">{errors.password}</p>}
 
        <div className="forgot"><button type="button" className="link" onClick={() => setScreen('forgot')}>Forgot Password?</button></div>
        <button type="submit" className="btn primary">Login</button>
        {notice && <p className="notice" role="status">{notice}</p>}
      </form>
 
      <div className="or"><span>OR</span></div>
      <button type="button" className="btn soft" onClick={() => setScreen('google')}><GoogleIcon /> Continue with Google</button>
      <button type="button" className="btn soft" onClick={() => setScreen('phone')}><PhoneIcon /> Continue with Phone</button>
      <p className="footer">Don't have an account? <button type="button" className="link" onClick={onSignUp}>Sign Up</button></p>
    </section>
  );
}