import { useState } from 'react';
import { useIssues } from '../context/IssueContext';
import { useNav } from '../hooks/useCitizenNav';
import { CATEGORIES, SEVERITIES, categoryById } from '../data/demoIssues';
import IssuePhoto from '../assets/IssuePhotos';
import { ArrowLeftIcon, CheckIcon, ChevronDownIcon, CloseIcon, LocateIcon, PlusIcon } from '../components/citizen/icons';
import MockMap from '../components/citizen/MockMap';
import { btnOutline, btnPrimary, errorCls, focusRing, inputBad, inputCls, inputOk, labelCls } from '../components/citizen/ui';
 
const MAX_PHOTOS = 5;
const MAX_MB = 10;
const STEPS = ['Details', 'Location', 'Review'];
 
function Stepper({ step, onGo }) {
  return (
    <ol className="mx-auto flex max-w-xs items-start justify-between px-2" aria-label="Report progress">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const done = n < step;
        const current = n === step;
        return (
          <li key={label} className="relative flex flex-1 flex-col items-center" aria-current={current ? 'step' : undefined}>
            {i > 0 && <span aria-hidden="true" className={`absolute right-1/2 top-4 h-0.5 w-full ${n <= step ? 'bg-teal-600' : 'bg-slate-200'}`} />}
            <button
              type="button"
              disabled={!done}
              onClick={() => onGo(n)}
              aria-label={`Step ${n}: ${label}${done ? ' (completed, tap to edit)' : ''}`}
              className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${current || done ? 'bg-teal-600 text-white' : 'border border-slate-300 bg-white text-slate-500'} ${done ? 'cursor-pointer' : 'cursor-default'} ${focusRing}`}
            >
              {done ? <CheckIcon className="h-4 w-4" /> : n}
            </button>
            <span className={`mt-1 text-xs ${current ? 'font-semibold text-teal-700' : 'text-slate-500'}`}>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
 
export default function ReportIssue() {
  const { addIssue } = useIssues();
  const { navigate, back } = useNav();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ title: '', description: '', category: 'pothole', severity: null, locationName: '', coords: null, mapPos: null });
  const [photos, setPhotos] = useState([]);
  const [errors, setErrors] = useState({});
  const [geo, setGeo] = useState({ status: 'idle', message: '' });
  const [created, setCreated] = useState(null);
 
  const update = (patch) => setForm((f) => ({ ...f, ...patch }));
 
  // ----- photos (previews only; nothing is uploaded anywhere) -----
  const addPhotos = (e) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    const next = [];
    let msg;
    for (const f of files) {
      if (!f.type.startsWith('image/')) { msg = 'Only image files can be added.'; continue; }
      if (f.size > MAX_MB * 1024 * 1024) { msg = `Each photo must be smaller than ${MAX_MB} MB.`; continue; }
      if (photos.length + next.length >= MAX_PHOTOS) { msg = `You can add up to ${MAX_PHOTOS} photos.`; break; }
      next.push({ id: `${Date.now()}-${next.length}-${f.name}`, name: f.name, url: URL.createObjectURL(f) });
    }
    setPhotos((p) => [...p, ...next]);
    setErrors((er) => ({ ...er, photos: msg }));
  };
  const removePhoto = (id) => {
    const p = photos.find((x) => x.id === id);
    if (p) URL.revokeObjectURL(p.url);
    setPhotos((list) => list.filter((x) => x.id !== id));
  };
 
  // ----- browser geolocation, only on explicit click -----
  const useMyLocation = () => {
    if (!('geolocation' in navigator)) {
      setGeo({ status: 'error', message: 'Your browser does not support location access. Please type the location instead.' });
      return;
    }
    setGeo({ status: 'loading', message: 'Waiting for your permission…' });
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        update({
          coords: { lat: +coords.latitude.toFixed(5), lng: +coords.longitude.toFixed(5), accuracy: Math.round(coords.accuracy) },
          locationName: form.locationName.trim() ? form.locationName : 'Current location (from device)',
        });
        setGeo({ status: 'ok', message: 'Device location captured. It cannot be plotted on the illustrative map, so tap the map to place a pin if you want this report shown there.' });
      },
      (err) => setGeo({
        status: 'error',
        message: err.code === 1
          ? 'Location permission was denied. You can type the location or tap the map instead.'
          : 'Could not get your location right now. Please type it instead.',
      }),
      { timeout: 10000 },
    );
  };
 
  // ----- validation -----
  const validateDetails = () => {
    const e = {};
    if (photos.length === 0) e.photos = 'Add at least one photo of the issue.';
    const title = form.title.trim();
    if (title.length < 5) e.title = 'Enter a short title (at least 5 characters).';
    else if (title.length > 80) e.title = 'Title must be 80 characters or fewer.';
    if (form.description.length > 500) e.description = 'Description must be 500 characters or fewer.';
    return e;
  };
  const validateLocation = () => (form.locationName.trim().length < 3 ? { location: 'Enter the street, landmark or area (at least 3 characters).' } : {});
 
  const next = () => {
    if (step === 1) {
      const e = validateDetails(); setErrors(e);
      if (Object.keys(e).length === 0) setStep(2);
    } else if (step === 2) {
      const e = validateLocation(); setErrors(e);
      if (Object.keys(e).length === 0) setStep(3);
    } else {
      // TODO: replace with POST /api/issues (multipart upload) once the backend exists.
      setCreated(addIssue({
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        severity: form.severity ?? 'medium',
        locationName: form.locationName.trim(),
        latitude: form.coords?.lat ?? null,
        longitude: form.coords?.lng ?? null,
        mapPos: form.mapPos,
        photos: photos.map(({ url, name }) => ({ url, name })),
      }));
    }
  };
 
  const goStep = (n) => { setErrors({}); setStep(n); };
  const onBack = () => (step > 1 ? goStep(step - 1) : back());
 
  // ----- confirmation -----
  if (created) {
    return (
      <div className="px-4 pb-10 pt-12 text-center lg:mx-auto lg:max-w-xl">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-700"><CheckIcon className="h-8 w-8" /></span>
        <h1 className="mt-4 text-xl font-bold text-slate-900">Demo report saved</h1>
        <p className="mt-2 text-sm text-slate-600">Reference number</p>
        <p className="font-mono text-lg font-bold text-teal-700" data-testid="reference">{created.referenceNumber}</p>
        <p className="mx-auto mt-4 max-w-sm rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
          This report is kept only in the app's temporary memory. It has <strong>not</strong> been sent to any municipality yet (issue storage is not built) and will be lost when you refresh.
        </p>
        <div className="mx-auto mt-6 max-w-xs space-y-3">
          <button type="button" className={btnPrimary} onClick={() => navigate('issue', { id: created.id }, { replace: true })}>View issue details</button>
          <button type="button" className={btnOutline} onClick={() => navigate('home', {}, { replace: true })}>Back to home</button>
        </div>
      </div>
    );
  }
 
  const cat = categoryById(form.category);
  const field = (hasError) => `${inputCls} ${hasError ? inputBad : inputOk}`;
 
  return (
    <div className="px-4 pb-10 pt-4 lg:mx-auto lg:max-w-2xl lg:pt-8">
      <div className="relative mb-4 flex items-center justify-center">
        <button type="button" onClick={onBack} aria-label={step > 1 ? 'Previous step' : 'Go back'} className={`absolute left-0 cursor-pointer rounded-full p-2 text-slate-800 hover:bg-slate-100 ${focusRing}`}>
          <ArrowLeftIcon className="h-6 w-6" />
        </button>
        <h1 className="text-lg font-bold text-slate-900">Report an Issue</h1>
      </div>
 
      <Stepper step={step} onGo={goStep} />
 
      {step === 1 && (
        <section className="mt-6" aria-label="Issue details">
          <h2 className="text-base font-bold text-slate-900">Upload Photos</h2>
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {photos.map((p, i) => (
              <div key={p.id} className="relative aspect-square overflow-hidden rounded-xl border border-slate-200">
                <IssuePhoto photo={p} alt={`Selected photo ${i + 1}: ${p.name}`} className="h-full w-full" />
                <button type="button" onClick={() => removePhoto(p.id)} aria-label={`Remove photo ${i + 1}`} className={`absolute right-1 top-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-slate-900/70 text-white hover:bg-slate-900 ${focusRing}`}>
                  <CloseIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {photos.length < MAX_PHOTOS && (
              <label htmlFor="photo-input" className={`flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-teal-300 bg-teal-50 text-center text-teal-700 hover:bg-teal-100 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-teal-600 ${photos.length === 0 ? 'col-span-3 aspect-auto py-8 sm:col-span-4' : ''}`}>
                <PlusIcon className="h-7 w-7" />
                <span className="text-sm font-semibold">{photos.length === 0 ? 'Add photos' : 'Add More'}</span>
                <span className="text-[11px] text-slate-500">(max {MAX_PHOTOS} photos)</span>
                <input id="photo-input" type="file" accept="image/*" multiple onChange={addPhotos} className="sr-only" />
              </label>
            )}
          </div>
          {errors.photos && <p role="alert" className={errorCls}>{errors.photos}</p>}
          <p className="mt-2 text-[11px] text-slate-500">Photos stay on your device in this prototype. They are not uploaded anywhere.</p>
 
          <h2 className="mt-6 text-base font-bold text-slate-900">Issue Details</h2>
          <div className="mt-3 space-y-4">
            <div>
              <label htmlFor="title" className={labelCls}>Title</label>
              <input id="title" value={form.title} onChange={(e) => update({ title: e.target.value })} placeholder="E.g. Large pothole on main road" aria-invalid={!!errors.title} aria-describedby={errors.title ? 'title-err' : undefined} className={field(errors.title)} />
              {errors.title && <p id="title-err" role="alert" className={errorCls}>{errors.title}</p>}
            </div>
            <div>
              <label htmlFor="description" className={labelCls}>Description <span className="font-normal text-slate-400">(optional)</span></label>
              <textarea id="description" rows={4} value={form.description} onChange={(e) => update({ description: e.target.value })} placeholder="Add more details about the issue..." aria-invalid={!!errors.description} className={`${field(errors.description)} resize-none`} />
              <p className="mt-1 text-right text-[11px] text-slate-400">{form.description.length}/500</p>
              {errors.description && <p role="alert" className={errorCls}>{errors.description}</p>}
            </div>
            <div>
              <label htmlFor="category" className={labelCls}>Select Category</label>
              <div className="relative">
                <select id="category" value={form.category} onChange={(e) => update({ category: e.target.value })} className={`${field(false)} cursor-pointer appearance-none pr-10`}>
                  {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
                <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              </div>
            </div>
            <fieldset>
              <legend className={labelCls}>Severity <span className="font-normal text-slate-400">(optional)</span></legend>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(SEVERITIES).reverse().map(([id, s]) => {
                  const on = form.severity === id;
                  return (
                    <button key={id} type="button" aria-pressed={on} onClick={() => update({ severity: on ? null : id })} className={`flex cursor-pointer items-center justify-center gap-1 rounded-lg py-3 text-sm font-semibold ${s.btn} ${on ? 'ring-2 ring-slate-900 ring-offset-2' : 'opacity-80'} ${focusRing}`}>
                      {on && <CheckIcon className="h-4 w-4" />}{s.label}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1.5 text-[11px] text-slate-500">If you skip this, the report is saved as Medium.</p>
            </fieldset>
          </div>
        </section>
      )}
 
      {step === 2 && (
        <section className="mt-6" aria-label="Issue location">
          <h2 className="text-base font-bold text-slate-900">Where is the issue?</h2>
          <div className="mt-3">
            <label htmlFor="location" className={labelCls}>Street, landmark or area</label>
            <input id="location" value={form.locationName} onChange={(e) => update({ locationName: e.target.value })} placeholder="E.g. MG Road near the metro station" aria-invalid={!!errors.location} className={field(errors.location)} />
            {errors.location && <p role="alert" className={errorCls}>{errors.location}</p>}
          </div>
          <div className="mt-3">
            <button type="button" onClick={useMyLocation} disabled={geo.status === 'loading'} className={btnOutline}>
              <LocateIcon className="h-5 w-5 text-teal-600" /> Use my current location
            </button>
            {geo.message && <p role="status" className={`mt-2 text-xs ${geo.status === 'error' ? 'font-medium text-red-600' : 'text-slate-600'}`}>{geo.message}</p>}
            {form.coords && <p className="mt-1 text-xs text-slate-500">Device coordinates: {form.coords.lat}, {form.coords.lng} (±{form.coords.accuracy} m, approximate)</p>}
          </div>
 
          <h3 className="mt-5 text-sm font-semibold text-slate-900">Drop a pin on the map <span className="font-normal text-slate-400">(optional)</span></h3>
          <MockMap className="mt-2 h-64 rounded-xl border border-slate-200" pin={form.mapPos} onPick={(pos) => update({ mapPos: pos })} />
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>{form.mapPos ? 'Pin placed on the illustrative map.' : 'Tap the map to place a pin. Without a pin, the report will not appear on the demo map.'}</span>
            {form.mapPos && <button type="button" onClick={() => update({ mapPos: null })} className={`cursor-pointer rounded font-semibold text-teal-700 ${focusRing}`}>Clear pin</button>}
          </div>
        </section>
      )}
 
      {step === 3 && (
        <section className="mt-6 space-y-4" aria-label="Review your report">
          <h2 className="text-base font-bold text-slate-900">Review</h2>
          <div className="rounded-xl border border-slate-200 p-3">
            <div className="flex items-center justify-between"><h3 className="text-sm font-semibold text-slate-900">Photos ({photos.length})</h3><button type="button" onClick={() => goStep(1)} className={`cursor-pointer rounded text-sm font-semibold text-teal-700 ${focusRing}`}>Edit</button></div>
            <div className="mt-2 flex gap-2 overflow-x-auto">
              {photos.map((p, i) => <IssuePhoto key={p.id} photo={p} alt={`Photo ${i + 1}`} className="h-20 w-20 shrink-0 rounded-lg" />)}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 p-3">
            <div className="flex items-center justify-between"><h3 className="text-sm font-semibold text-slate-900">Details</h3><button type="button" onClick={() => goStep(1)} className={`cursor-pointer rounded text-sm font-semibold text-teal-700 ${focusRing}`}>Edit</button></div>
            <dl className="mt-2 space-y-1.5 text-sm">
              <div className="flex gap-2"><dt className="w-24 shrink-0 text-slate-500">Title</dt><dd className="font-medium text-slate-900">{form.title.trim()}</dd></div>
              <div className="flex gap-2"><dt className="w-24 shrink-0 text-slate-500">Description</dt><dd>{form.description.trim() || <span className="text-slate-400">None</span>}</dd></div>
              <div className="flex gap-2"><dt className="w-24 shrink-0 text-slate-500">Category</dt><dd>{cat.label}</dd></div>
              <div className="flex gap-2"><dt className="w-24 shrink-0 text-slate-500">Severity</dt><dd>{SEVERITIES[form.severity ?? 'medium'].label}{form.severity ? '' : ' (default)'}</dd></div>
            </dl>
          </div>
          <div className="rounded-xl border border-slate-200 p-3">
            <div className="flex items-center justify-between"><h3 className="text-sm font-semibold text-slate-900">Location</h3><button type="button" onClick={() => goStep(2)} className={`cursor-pointer rounded text-sm font-semibold text-teal-700 ${focusRing}`}>Edit</button></div>
            <p className="mt-2 text-sm font-medium text-slate-900">{form.locationName.trim()}</p>
            {form.coords && <p className="text-xs text-slate-500">Device coordinates: {form.coords.lat}, {form.coords.lng}</p>}
            <p className="mt-1 text-xs text-slate-500">{form.mapPos ? 'Map pin placed: the report will appear on the demo map.' : 'No map pin: the report will not appear on the demo map.'}</p>
          </div>
          <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">Submitting keeps this report in temporary memory only. It is not sent to any municipality yet.</p>
        </section>
      )}
 
      <div className="mt-6">
        <button type="button" onClick={next} className={btnPrimary}>{step === 3 ? 'Submit demo report' : 'Next'}</button>
      </div>
    </div>
  );
}