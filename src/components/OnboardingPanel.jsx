import CityIllustration from '../assets/CityIllustration';
import { LogoMark } from '../assets/Icons';

export const SLIDES = [
  { title: 'Detect. Verify. Assign. Better Roads for Everyone.', text: 'Find road damage, confirm it, and track every repair.' },
  { title: 'Capture road damage automatically.', text: 'Vehicle cameras and GPS phones flag potholes and surface damage.' },
  { title: 'Review before anyone is dispatched.', text: 'Reviewers confirm detections and merge duplicates into one issue.' },
  { title: 'Assign repairs and follow them through.', text: 'Officers get tickets and progress stays visible until the road is fixed.' },
];

export default function OnboardingPanel({ step, onNext, onLogin }) {
  const slide = SLIDES[step];
  const last = step === SLIDES.length - 1;
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
      <button className="btn primary" onClick={onNext}>{last ? 'Continue to Login' : 'Get Started'}</button>
      <button className="btn outline" onClick={onLogin}>Login</button>
      <div className="dots" aria-label={`Step ${step + 1} of ${SLIDES.length}`}>
        {SLIDES.map((_, i) => <span key={i} className={i === step ? 'dot active' : 'dot'} />)}
      </div>
    </section>
  );
}
