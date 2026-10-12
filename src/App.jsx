import { useState } from 'react';
import OnboardingPanel, { SLIDES } from './components/OnboardingPanel';
import LoginPanel from './components/LoginPanel';
import SignUpPanel from './components/SignUpPanel';
import './index.css';
 
export default function App() {
  const [page, setPage] = useState('welcome'); // welcome | login | signup
  const [step, setStep] = useState(0);
 
  const next = () => {
    if (step < SLIDES.length - 1) setStep(step + 1);
    else setPage('login');
  };
 
  return (
    <main className="layout">
      {page === 'welcome' && <OnboardingPanel step={step} onNext={next} onLogin={() => setPage('login')} />}
      {page === 'login' && <LoginPanel onBack={() => setPage('welcome')} onSignUp={() => setPage('signup')} />}
      {page === 'signup' && <SignUpPanel onBack={() => setPage('welcome')} onLogin={() => setPage('login')} />}
    </main>
  );
}
 
