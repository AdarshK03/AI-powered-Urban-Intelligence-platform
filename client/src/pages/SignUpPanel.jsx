import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EyeIcon } from '../assets/Icons';
import { useAuth } from '../context/AuthContext';

export default function SignUpPanel({ onBack: externalBack, onLogin: externalLogin }) {
  const navigate = useNavigate();
  const { register, isLoading } = useAuth();

  const [form, setForm] = useState({
    name: '',
    email: '',
    organisation: '',
    password: '',
    confirm: '',
  });
  const [show, setShow] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [notice, setNotice] = useState('');

  const handleBack = () => {
    if (externalBack) {
      externalBack();
    } else {
      navigate('/login');
    }
  };

  const handleLogin = () => {
    if (externalLogin) {
      externalLogin();
    } else {
      navigate('/login');
    }
  };

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (ev) => {
    ev.preventDefault();
    setErrorMessage('');
    setNotice('');

    if (!form.name.trim()) {
      setErrorMessage('Full name is required.');
      return;
    }
    if (!form.email.trim()) {
      setErrorMessage('Email address is required.');
      return;
    }
    if (!form.password) {
      setErrorMessage('Password is required.');
      return;
    }
    if (form.password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }
    if (form.confirm !== form.password) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    // Call Node.js backend registration endpoint
    const result = await register({
      name: form.name.trim(),
      email: form.email.trim(),
      organisation: form.organisation.trim(),
      password: form.password,
      confirmPassword: form.confirm,
    });

    if (result.success) {
      setNotice('Account registered successfully! Redirecting...');
      setTimeout(() => {
        if (result.user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/citizen');
        }
      }, 1000);
    } else {
      setErrorMessage(result.message || 'Registration failed.');
    }
  };

  return (
    <section className="card login" aria-label="Sign up">
      <button type="button" className="back cursor-pointer" onClick={handleBack}>
        ← Back
      </button>
      <h1 className="center">Create Account</h1>
      <p className="sub">Join Urban Intelligence to help keep city roads safe.</p>

      {errorMessage && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700 leading-normal" role="alert">
          {errorMessage}
        </div>
      )}

      {notice && (
        <div className="mb-3 rounded-lg border border-teal-200 bg-teal-50 p-2.5 text-xs text-teal-800 leading-normal" role="status">
          {notice}
        </div>
      )}

      <form onSubmit={submit} noValidate>
        <label htmlFor="name">Full Name</label>
        <input
          id="name"
          type="text"
          placeholder="Enter your full name"
          autoComplete="name"
          value={form.name}
          onChange={set('name')}
          required
        />

        <label htmlFor="email">Email Address</label>
        <input
          id="email"
          type="email"
          placeholder="Enter your email"
          autoComplete="email"
          value={form.email}
          onChange={set('email')}
          required
        />

        <label htmlFor="organisation">Organisation / Community (optional)</label>
        <input
          id="organisation"
          type="text"
          placeholder="Municipal body, RWA, or company"
          autoComplete="organization"
          value={form.organisation}
          onChange={set('organisation')}
        />

        <label htmlFor="password">Password</label>
        <div className="pw">
          <input
            id="password"
            type={show ? 'text' : 'password'}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            value={form.password}
            onChange={set('password')}
            required
          />
          <button
            type="button"
            className="eye cursor-pointer"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Hide password' : 'Show password'}
          >
            <EyeIcon off={show} />
          </button>
        </div>

        <label htmlFor="confirm">Confirm Password</label>
        <div className="pw">
          <input
            id="confirm"
            type={show ? 'text' : 'password'}
            placeholder="Re-enter your password"
            autoComplete="new-password"
            value={form.confirm}
            onChange={set('confirm')}
            required
          />
        </div>

        <p className="hint">Your account and credentials will be registered securely in the backend.</p>

        <button type="submit" disabled={isLoading} className="btn primary cursor-pointer disabled:opacity-75">
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      <p className="footer">
        Already have an account?{' '}
        <button type="button" className="link cursor-pointer" onClick={handleLogin}>
          Login
        </button>
      </p>
    </section>
  );
}