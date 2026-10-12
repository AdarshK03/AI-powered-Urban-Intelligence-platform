
import { useState } from 'react';
import { EyeIcon } from '../assets/Icons';
 
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
 
export default function SignUpPanel({ onBack, onLogin }) {
  const [form, setForm] = useState({ name: '', email: '', organisation: '', password: '', confirm: '' });
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState('');
 
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
 
  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Enter your full name.';
    if (!form.email.trim()) e.email = 'Enter your work email.';
    else if (!EMAIL_RE.test(form.email.trim())) e.email = 'Enter a valid email address.';
    if (!form.password) e.password = 'Create a password.';
    else if (form.password.length < 8) e.password = 'Password must be at least 8 characters.';
    if (!form.confirm) e.confirm = 'Re-enter your password.';
    else if (form.confirm !== form.password) e.confirm = 'Passwords do not match.';
    return e;
  };
 
  const submit = (ev) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    setNotice('');
    if (Object.keys(e).length === 0) {
      // TODO: POST /api/auth/register (or an access-request endpoint). Roles are assigned by an admin on the server.
      setNotice('Details look valid, but sign up is not connected to a backend yet. No account was created.');
    }
  };
 
  const field = (id, label, type, placeholder, autoComplete) => (
    <>
      <label htmlFor={id}>{label}</label>
      <input id={id} type={type} placeholder={placeholder} autoComplete={autoComplete}
        value={form[id]} onChange={set(id)}
        aria-invalid={!!errors[id]} className={errors[id] ? 'invalid' : ''} />
      {errors[id] && <p className="error" role="alert">{errors[id]}</p>}
    </>
  );
 
  return (
    <section className="card login" aria-label="Sign up">
      <button type="button" className="back" onClick={onBack}>← Back</button>
      <h1 className="center">Create Account</h1>
      <p className="sub">Join Urban Intelligence to help keep roads safe.</p>
 
      <form onSubmit={submit} noValidate>
        {field('name', 'Full Name', 'text', 'Enter your full name', 'name')}
        {field('email', 'Work Email', 'email', 'Enter your work email', 'email')}
        {field('organisation', 'Organisation (optional)', 'text', 'Municipal body or company', 'organization')}
 
        <label htmlFor="password">Password</label>
        <div className="pw">
          <input id="password" type={show ? 'text' : 'password'} placeholder="At least 8 characters" autoComplete="new-password"
            value={form.password} onChange={set('password')}
            aria-invalid={!!errors.password} className={errors.password ? 'invalid' : ''} />
          <button type="button" className="eye" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}>
            <EyeIcon off={show} />
          </button>
        </div>
        {errors.password && <p className="error" role="alert">{errors.password}</p>}
 
        {field('confirm', 'Confirm Password', show ? 'text' : 'password', 'Re-enter your password', 'new-password')}
 
        <p className="hint">Your role is assigned by an administrator after approval.</p>
        <button type="submit" className="btn primary">Create Account</button>
        {notice && <p className="notice" role="status">{notice}</p>}
      </form>
 
      <p className="footer">Already have an account? <button type="button" className="link" onClick={onLogin}>Login</button></p>
    </section>
  );
}