import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CityIllustration from '../assets/CityIllustration';
import { LogoMark } from '../assets/Icons';

export const SLIDES = [
  { title: 'Detect. Verify. Assign. Better Roads for Everyone.', text: 'Find road damage, confirm it, and track every repair.' },
  { title: 'Capture road damage automatically.', text: 'Vehicle cameras and GPS phones flag potholes and surface damage.' },
  { title: 'Review before anyone is dispatched.', text: 'Reviewers confirm detections and merge duplicates into one issue.' },
  { title: 'Assign repairs and follow them through.', text: 'Officers get tickets and progress stays visible until the road is fixed.' },
];

export default function OnboardingPanel({ step: externalStep, onNext: externalNext, onLogin: externalLogin }) {
  const navigate = useNavigate();
  const [internalStep, setInternalStep] = useState(0);

  const step = typeof externalStep === 'number' ? externalStep : internalStep;
  const slide = SLIDES[step] || SLIDES[0];
  const last = step === SLIDES.length - 1;

  const handleNext = () => {
    if (externalNext) {
      externalNext();
      return;
    }
    if (step < SLIDES.length - 1) {
      setInternalStep((prev) => prev + 1);
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

  return (
    <section className="card onboarding" aria-label="Welcome">
      <div className="brand">
        <LogoMark />
        <h2>Urban Intelligence</h2>
        <p>Safer Roads • Smarter Cities • Together</p>
      </div>
      <CityIllustration />
      <h1>{slide.title}</h1>
      <p className="lead">{slide.text}</p>
      <button className="btn primary" onClick={handleNext}>
        {last ? 'Continue to Login' : 'Get Started'}
      </button>
      <button className="btn outline" onClick={handleLogin}>
        Login
      </button>

      <div className="dots" aria-label={`Step ${step + 1} of ${SLIDES.length}`}>
        {SLIDES.map((_, i) => (
          <span key={i} className={i === step ? 'dot active' : 'dot'} />
        ))}
      </div>

      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={() => navigate('/admin/login')}
          className="text-xs text-slate-400 hover:text-teal-700 font-medium transition cursor-pointer"
        >
          Municipal Administration Console →
        </button>
      </div>
    </section>
  );
}
