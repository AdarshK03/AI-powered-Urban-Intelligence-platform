import { useState, useRef } from 'react';
import { useIssues } from '../context/IssueContext';
import { useAuth } from '../context/AuthContext';
import { useNav } from '../hooks/useCitizenNav';
import { CATEGORIES, SEVERITIES, categoryById } from '../data/demoIssues';
import IssuePhoto from '../assets/IssuePhotos';
import { ArrowLeftIcon, CheckIcon, ChevronDownIcon, CloseIcon, LocateIcon, PlusIcon } from '../components/citizen/icons';
import GoogleMapView from '../components/common/GoogleMapView';
import { reverseGeocode } from '../utils/geoUtils';
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
  const { user, token } = useAuth();
  const { navigate, back } = useNav();
  const fileInputRef = useRef(null);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'under_review',
    severity: null,
    city: user?.city || 'Pune',
    locationName: '',
    coords: null,
    mapPos: null,
  });
  const [photos, setPhotos] = useState([]);
  const [errors, setErrors] = useState({});
  const [geo, setGeo] = useState({ status: 'idle', message: '' });
  const [created, setCreated] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState({
    status: 'idle', // 'idle' | 'analyzing' | 'detected' | 'unclear' | 'duplicate'
    message: '',
    prediction: null,
    duplicateReport: null,
  });

  // Instant duplicate alert modal state
  const [duplicateModal, setDuplicateModal] = useState({
    isOpen: false,
    photoId: null,
    report: null,
  });

  const update = (patch) => setForm((f) => ({ ...f, ...patch }));

  // Real-time photo inspection: duplicate checking and AI defect detection
  const inspectPhotoFile = async (photoId, dataUrl) => {
    setAiAnalysis((prev) => ({
      ...prev,
      status: prev.status === 'duplicate' ? 'duplicate' : 'analyzing',
      message: 'Inspecting photo for duplicates & analyzing defect with AI...',
    }));

    try {
      const res = await fetch('/api/issues/inspect-photo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ photo: dataUrl }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setPhotos((list) => list.map((p) => p.id === photoId ? { ...p, isScanning: false } : p));
        setAiAnalysis((prev) =>
          prev.status === 'duplicate'
            ? prev
            : {
                status: 'unclear',
                message: 'Automatic classification unavailable. Municipal administration will review and classify this report.',
                prediction: null,
                duplicateReport: null,
              }
        );
        update({ category: 'under_review' });
        return;
      }

      if (data.duplicate) {
        // AT THAT VERY INSTANT:
        // 1. Mark photo as duplicate in list and stop scanning
        setPhotos((list) =>
          list.map((p) =>
            p.id === photoId
              ? { ...p, isDuplicate: true, isScanning: false, duplicateInfo: data.originalReport }
              : p
          )
        );

        // 2. Set duplicate state
        setAiAnalysis({
          status: 'duplicate',
          message: data.message || 'This photo has already been reported.',
          prediction: null,
          duplicateReport: data.originalReport,
        });

        // 3. Immediately trigger instant Duplicate Alert Modal
        setDuplicateModal({
          isOpen: true,
          photoId,
          report: data.originalReport,
        });

        setErrors((prev) => ({
          ...prev,
          photos: 'Duplicate photo detected. Please remove it and upload a different photo.',
        }));
        return;
      }

      // Not a duplicate
      setPhotos((list) =>
        list.map((p) =>
          p.id === photoId ? { ...p, isScanning: false, isDuplicate: false } : p
        )
      );

      const pred = data.prediction;
      if (pred && !pred.needsReview && pred.mappedCategory && pred.mappedCategory !== 'under_review') {
        setAiAnalysis((prev) =>
          prev.status === 'duplicate'
            ? prev
            : {
                status: 'detected',
                message: `AI Model identified defect: ${pred.categoryLabel} (${pred.confidencePercent}% confidence)`,
                prediction: pred,
                duplicateReport: null,
              }
        );
        update({ category: pred.mappedCategory });
      } else {
        setAiAnalysis((prev) =>
          prev.status === 'duplicate'
            ? prev
            : {
                status: 'unclear',
                message: 'The photo is not clear enough for automated classification. Report will be forwarded to municipal administration to decide the defect type.',
                prediction: pred || null,
                duplicateReport: null,
              }
        );
        update({ category: 'under_review' });
      }
    } catch (err) {
      console.warn('Real-time inspection error:', err);
      setPhotos((list) => list.map((p) => p.id === photoId ? { ...p, isScanning: false } : p));
      setAiAnalysis((prev) =>
        prev.status === 'duplicate'
          ? prev
          : {
              status: 'unclear',
              message: 'Report will be submitted for municipal administration review and classification.',
              prediction: null,
              duplicateReport: null,
            }
      );
      update({ category: 'under_review' });
    }
  };

  // ----- photos (read into persistent Data URLs so they can be saved safely in DB) -----
  const addPhotos = (e) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    const valid = [];
    let msg;
    for (const f of files) {
      if (!f.type.startsWith('image/')) {
        msg = 'Only image files can be added.';
        continue;
      }
      if (f.size > MAX_MB * 1024 * 1024) {
        msg = `Each photo must be smaller than ${MAX_MB} MB.`;
        continue;
      }
      if (photos.length + valid.length >= MAX_PHOTOS) {
        msg = `You can add up to ${MAX_PHOTOS} photos.`;
        break;
      }
      valid.push(f);
    }

    valid.forEach((f) => {
      const reader = new FileReader();
      reader.onload = () => {
        const photoId = `${Date.now()}-${Math.random()}`;
        const photoObj = {
          id: photoId,
          name: f.name,
          url: reader.result,
          isScanning: true,
          isDuplicate: false,
        };
        setPhotos((p) => [...p, photoObj]);
        // Trigger inspection immediately at that very instant
        inspectPhotoFile(photoId, reader.result);
      };
      reader.readAsDataURL(f);
    });

    if (msg) setErrors((er) => ({ ...er, photos: msg }));
  };

  const removePhoto = (id) => {
    setPhotos((list) => {
      const filtered = list.filter((x) => x.id !== id);
      const remainingDuplicates = filtered.filter((x) => x.isDuplicate);
      if (filtered.length === 0) {
        setAiAnalysis({ status: 'idle', message: '', prediction: null, duplicateReport: null });
        update({ category: 'under_review' });
        setDuplicateModal({ isOpen: false, photoId: null, report: null });
        setErrors((prev) => {
          const { photos: _p, ...rest } = prev;
          return rest;
        });
      } else if (remainingDuplicates.length > 0) {
        const dup = remainingDuplicates[0];
        setAiAnalysis({
          status: 'duplicate',
          message: 'This photo has already been reported.',
          prediction: null,
          duplicateReport: dup.duplicateInfo,
        });
      } else {
        setAiAnalysis((prev) =>
          prev.status === 'duplicate'
            ? { status: 'idle', message: '', prediction: null, duplicateReport: null }
            : prev
        );
        setDuplicateModal({ isOpen: false, photoId: null, report: null });
        setErrors((prev) => {
          const { photos: _p, ...rest } = prev;
          return rest;
        });
      }
      return filtered;
    });
  };

  const handleReplaceDuplicate = (photoId) => {
    if (photoId) {
      removePhoto(photoId);
    } else {
      setPhotos([]);
    }
    setDuplicateModal({ isOpen: false, photoId: null, report: null });
    setErrors((prev) => {
      const { photos: _p, ...rest } = prev;
      return rest;
    });
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 100);
  };

  // ----- real-time browser GPS location -----
  const useMyLocation = () => {
    if (!('geolocation' in navigator)) {
      setGeo({
        status: 'error',
        message: 'Your browser does not support location access. Please search or tap on Google Maps.',
      });
      return;
    }
    setGeo({ status: 'loading', message: 'Accessing device GPS location…' });
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const lat = +coords.latitude.toFixed(6);
        const lng = +coords.longitude.toFixed(6);
        const geoResult = await reverseGeocode(lat, lng);
        const street = geoResult?.shortAddress || form.locationName.trim() || 'Current location (from device)';

        update({
          coords: { lat, lng, accuracy: Math.round(coords.accuracy) },
          locationName: street,
          mapPos: { x: 50, y: 50 },
        });
        setGeo({
          status: 'ok',
          message: `Real-time GPS coordinates accessed: ${lat}, ${lng} (shown on Google Maps below)`,
        });
      },
      (err) =>
        setGeo({
          status: 'error',
          message:
            err.code === 1
              ? 'Location permission was denied. Tap anywhere on Google Maps to place a pin.'
              : 'Could not access device location right now. Please tap on Google Maps or type it.',
        }),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // ----- validation -----
  const validateDetails = () => {
    const e = {};
    if (photos.length === 0) {
      e.photos = 'Add at least one photo of the issue.';
    } else if (photos.some((p) => p.isDuplicate) || aiAnalysis.status === 'duplicate') {
      e.photos = 'Duplicate photo detected. Please remove it and upload a different photo.';
    } else if (photos.some((p) => p.isScanning)) {
      e.photos = 'Please wait a moment while the photo is being verified.';
    }

    const title = form.title.trim();
    if (title.length < 5) e.title = 'Enter a short title (at least 5 characters).';
    else if (title.length > 80) e.title = 'Title must be 80 characters or fewer.';
    if (form.description.length > 500) e.description = 'Description must be 500 characters or fewer.';
    return e;
  };

  const validateLocation = () =>
    form.locationName.trim().length < 3
      ? { location: 'Enter the street, landmark or area (at least 3 characters).' }
      : {};

  const next = async () => {
    if (step === 1) {
      const e = validateDetails();
      setErrors(e);
      if (Object.keys(e).length === 0) setStep(2);
    } else if (step === 2) {
      const e = validateLocation();
      setErrors(e);
      if (Object.keys(e).length === 0) setStep(3);
    } else {
      setIsSubmitting(true);
      try {
        const res = await addIssue({
          title: form.title.trim(),
          description: form.description.trim(),
          category: form.category || 'under_review',
          severity: form.severity ?? 'medium',
          city: form.city || user?.city || 'Pune',
          locationName: form.locationName.trim(),
          latitude: form.coords?.lat ?? null,
          longitude: form.coords?.lng ?? null,
          mapPos: form.mapPos,
          photos: photos.map(({ url, name }) => ({ url, name })),
          aiPrediction: aiAnalysis.prediction,
        });
        setCreated(res);
      } catch (err) {
        setErrors({ submit: err.message || 'Failed to submit report. Please try again.' });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const goStep = (n) => {
    setErrors({});
    setStep(n);
  };
  const onBack = () => (step > 1 ? goStep(step - 1) : back());

  // ----- confirmation -----
  if (created) {
    return (
      <div className="px-4 pb-10 pt-12 text-center lg:mx-auto lg:max-w-xl">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <CheckIcon className="h-8 w-8" />
        </span>
        <h1 className="mt-4 text-xl font-bold text-slate-900">Report Submitted Successfully</h1>
        <p className="mt-2 text-sm text-slate-600">Reference number</p>
        <p className="font-mono text-lg font-bold text-teal-700" data-testid="reference">
          {created.referenceNumber}
        </p>
        <p className="mx-auto mt-4 max-w-sm rounded-xl bg-teal-50 p-3.5 text-xs text-teal-800 leading-relaxed border border-teal-200">
          Your live photo and real-time Google Maps location have been safely saved directly to the central PostgreSQL database and dispatched to civic authorities.
        </p>
        <div className="mx-auto mt-6 max-w-xs space-y-3">
          <button
            type="button"
            className={btnPrimary}
            onClick={() => navigate('issue', { id: created.id }, { replace: true })}
          >
            View issue details
          </button>
          <button
            type="button"
            className={btnOutline}
            onClick={() => navigate('home', {}, { replace: true })}
          >
            Back to home
          </button>
        </div>
      </div>
    );
  }

  const cat = categoryById(form.category);
  const field = (hasError) => `${inputCls} ${hasError ? inputBad : inputOk}`;

  return (
    <div className="px-4 pb-10 pt-4 lg:mx-auto lg:max-w-2xl lg:pt-8">
      <div className="relative mb-4 flex items-center justify-center">
        <button
          type="button"
          onClick={onBack}
          aria-label={step > 1 ? 'Previous step' : 'Go back'}
          className={`absolute left-0 cursor-pointer rounded-full p-2 text-slate-800 hover:bg-slate-100 ${focusRing}`}
        >
          <ArrowLeftIcon className="h-6 w-6" />
        </button>
        <h1 className="text-lg font-bold text-slate-900">Report a Road Issue</h1>
      </div>

      <Stepper step={step} onGo={goStep} />

      {step === 1 && (
        <section className="mt-6" aria-label="Issue details">
          <h2 className="text-base font-bold text-slate-900">Upload Issue Photos</h2>
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {photos.map((p, i) => (
              <div
                key={p.id}
                className={`relative aspect-square overflow-hidden rounded-xl border shadow-xs transition-all ${
                  p.isDuplicate
                    ? 'border-2 border-red-500 ring-2 ring-red-400'
                    : 'border-slate-200'
                }`}
              >
                <IssuePhoto photo={p} alt={`Selected photo ${i + 1}: ${p.name}`} className="h-full w-full" />

                {p.isScanning && (
                  <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-2xs flex flex-col items-center justify-center text-white p-1">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mb-1" />
                    <span className="text-[10px] font-bold">Scanning...</span>
                  </div>
                )}

                {p.isDuplicate && (
                  <div className="absolute inset-x-0 bottom-0 bg-red-600/90 text-white text-[10px] font-bold uppercase tracking-wider py-1 text-center shadow-xs">
                    Duplicate
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => removePhoto(p.id)}
                  aria-label={`Remove photo ${i + 1}`}
                  className={`absolute right-1 top-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-slate-900/70 text-white hover:bg-slate-900 ${focusRing}`}
                >
                  <CloseIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {photos.length < MAX_PHOTOS && (
              <label
                htmlFor="photo-input"
                className={`flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-teal-300 bg-teal-50 text-center text-teal-700 hover:bg-teal-100 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-teal-600 ${
                  photos.length === 0 ? 'col-span-3 aspect-auto py-8 sm:col-span-4' : ''
                }`}
              >
                <PlusIcon className="h-7 w-7" />
                <span className="text-sm font-semibold">{photos.length === 0 ? 'Upload photo of issue' : 'Add More'}</span>
                <span className="text-[11px] text-slate-500">(max {MAX_PHOTOS} photos, up to {MAX_MB}MB each)</span>
                <input
                  id="photo-input"
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={addPhotos}
                  className="sr-only"
                />
              </label>
            )}
          </div>

          {/* Instant Scanning Status Indicator */}
          {photos.some((p) => p.isScanning) && (
            <div className="mt-2.5 flex items-center gap-2 rounded-lg bg-teal-50 border border-teal-200 px-3 py-2 text-xs text-teal-800 animate-pulse">
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-teal-600 border-t-transparent shrink-0" />
              <span>Verifying photo with civic duplicate registry and AI classification...</span>
            </div>
          )}

          {/* Instant Duplicate Alert Banner right at the photo section */}
          {(photos.some((p) => p.isDuplicate) || aiAnalysis.status === 'duplicate') && (
            <div className="mt-3 rounded-xl border-2 border-red-500 bg-red-50 p-4 shadow-sm animate-in fade-in duration-200">
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-600 text-white font-bold text-sm">
                  ✕
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-block rounded-md bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                      Duplicate Photo Detected
                    </span>
                    {aiAnalysis.duplicateReport?.referenceNumber && (
                      <span className="text-xs font-mono font-bold text-red-950">
                        Incident #{aiAnalysis.duplicateReport.referenceNumber}
                      </span>
                    )}
                  </div>
                  <h4 className="mt-1 text-sm font-bold text-red-950">
                    This issue has already been reported!
                  </h4>
                  <p className="mt-1 text-xs text-red-800 leading-relaxed">
                    Our civic database verified that this exact photo was already submitted for{' '}
                    <strong>"{aiAnalysis.duplicateReport?.title || 'Existing Report'}"</strong> ({aiAnalysis.duplicateReport?.status || 'Pending'}).
                    Duplicate reports cannot be submitted to avoid dispatching duplicate maintenance crews.
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {aiAnalysis.duplicateReport?.id && (
                      <button
                        type="button"
                        onClick={() => navigate('issue', { id: aiAnalysis.duplicateReport.id })}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-red-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-800 transition cursor-pointer shadow-xs"
                      >
                        View Existing Incident #{aiAnalysis.duplicateReport.referenceNumber} →
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleReplaceDuplicate(duplicateModal.photoId || photos.find(p => p.isDuplicate)?.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 transition cursor-pointer shadow-2xs"
                    >
                      Upload Different Photo
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {errors.photos && !photos.some((p) => p.isDuplicate) && (
            <p role="alert" className={errorCls}>{errors.photos}</p>
          )}
          <p className="mt-2 text-[11px] text-teal-700 font-medium">
            ✓ Photos are safely stored on the server and archived in the central civic database.
          </p>

          <h2 className="mt-6 text-base font-bold text-slate-900">Issue Details</h2>
          <div className="mt-3 space-y-4">
            <div>
              <label htmlFor="title" className={labelCls}>
                Title
              </label>
              <input
                id="title"
                value={form.title}
                onChange={(e) => update({ title: e.target.value })}
                placeholder="E.g. Dangerous 2ft road pothole on main carriageway"
                aria-invalid={!!errors.title}
                aria-describedby={errors.title ? 'title-err' : undefined}
                className={field(errors.title)}
              />
              {errors.title && <p id="title-err" role="alert" className={errorCls}>{errors.title}</p>}
            </div>
            <div>
              <label htmlFor="description" className={labelCls}>
                Description <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <textarea
                id="description"
                rows={3}
                value={form.description}
                onChange={(e) => update({ description: e.target.value })}
                placeholder="Describe road defect depth, traffic impact, or hazard details..."
                aria-invalid={!!errors.description}
                className={`${field(errors.description)} resize-none`}
              />
              <p className="mt-1 text-right text-[11px] text-slate-400">{form.description.length}/500</p>
              {errors.description && <p role="alert" className={errorCls}>{errors.description}</p>}
            </div>
            {/* Real-Time AI Defect Detection & Status Card (User does not decide defect) */}
            <div>
              <label className={labelCls}>
                Defect Classification <span className="font-normal text-slate-400">(Automated by AI)</span>
              </label>

              {aiAnalysis.status === 'analyzing' && (
                <div className="rounded-xl border border-teal-200 bg-teal-50/70 p-3.5 flex items-center gap-3 animate-pulse">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-teal-600 border-t-transparent shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-teal-900">AI Model Analyzing Road Defect...</p>
                    <p className="text-[11px] text-teal-700 mt-0.5">Checking duplicate database and predicting defect classification.</p>
                  </div>
                </div>
              )}

              {aiAnalysis.status === 'detected' && aiAnalysis.prediction && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3.5 shadow-xs">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold tracking-wider text-emerald-800 uppercase">
                        ✓ AI Defect Identified
                      </span>
                      <h4 className="mt-1 text-base font-bold text-slate-900">
                        {aiAnalysis.prediction.categoryLabel}
                      </h4>
                      <p className="mt-0.5 text-xs text-emerald-800 leading-relaxed">
                        Classified with {aiAnalysis.prediction.confidencePercent}% confidence. Will be automatically assigned to the designated municipal division.
                      </p>
                    </div>
                    <span className="rounded-lg bg-white px-2.5 py-1 text-xs font-mono font-bold text-emerald-700 border border-emerald-200 shrink-0 shadow-xs">
                      {aiAnalysis.prediction.confidencePercent}%
                    </span>
                  </div>
                </div>
              )}

              {aiAnalysis.status === 'unclear' && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 shadow-xs">
                  <div className="flex items-start gap-2.5">
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-amber-200 text-amber-900 text-xs font-bold shrink-0 mt-0.5">
                      !
                    </span>
                    <div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold tracking-wider text-amber-900 uppercase">
                        Routed to Municipal Administrator
                      </span>
                      <h4 className="mt-1 text-sm font-bold text-slate-900">
                        Defect Type: Under Review
                      </h4>
                      <p className="mt-0.5 text-xs text-amber-800 leading-relaxed">
                        The uploaded photo is not distinct enough for instant AI classification. No action required from you—your report will be submitted normally and a municipal officer will review the image and classify the defect.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {aiAnalysis.status === 'duplicate' && (
                <div className="rounded-xl border border-red-300 bg-red-50 p-4 shadow-xs">
                  <div className="flex items-start gap-2.5">
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-200 text-red-900 text-xs font-bold shrink-0 mt-0.5">
                      ✕
                    </span>
                    <div className="flex-1">
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold tracking-wider text-red-900 uppercase">
                        Duplicate Photo Detected
                      </span>
                      <h4 className="mt-1 text-sm font-bold text-red-950">
                        This issue has already been reported
                      </h4>
                      <p className="mt-1 text-xs text-red-800 leading-relaxed">
                        This exact photo is already logged in the civic database under reference{' '}
                        <strong>{aiAnalysis.duplicateReport?.referenceNumber || aiAnalysis.duplicateReport?.title}</strong>.
                      </p>
                      {aiAnalysis.duplicateReport?.id && (
                        <button
                          type="button"
                          onClick={() => navigate('issue', { id: aiAnalysis.duplicateReport.id })}
                          className="mt-2.5 inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-white px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-100 cursor-pointer transition shadow-2xs"
                        >
                          View Existing Incident #{aiAnalysis.duplicateReport.referenceNumber} →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {photos.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-3 text-xs text-slate-500 leading-relaxed">
                  💡 <strong>Automated Defect Detection:</strong> Add a photo above. The YOLO AI model will automatically analyze and classify the defect. If the image is unclear, municipal administration will classify it.
                </div>
              )}
            </div>
            <fieldset>
              <legend className={labelCls}>
                Severity <span className="font-normal text-slate-400">(optional)</span>
              </legend>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(SEVERITIES)
                  .reverse()
                  .map(([id, s]) => {
                    const on = form.severity === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        aria-pressed={on}
                        onClick={() => update({ severity: on ? null : id })}
                        className={`flex cursor-pointer items-center justify-center gap-1 rounded-lg py-3 text-sm font-semibold ${s.btn} ${
                          on ? 'ring-2 ring-slate-900 ring-offset-2' : 'opacity-80'
                        } ${focusRing}`}
                      >
                        {on && <CheckIcon className="h-4 w-4" />}
                        {s.label}
                      </button>
                    );
                  })}
              </div>
              <p className="mt-1.5 text-[11px] text-slate-500">Defaults to Medium if unselected.</p>
            </fieldset>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="mt-6" aria-label="Issue location">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Select Location on Google Maps</h2>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Telemetry
            </span>
          </div>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label htmlFor="issue-city" className={labelCls}>
                City
              </label>
              <select
                id="issue-city"
                value={form.city}
                onChange={(e) => update({ city: e.target.value })}
                className={`${inputCls} cursor-pointer`}
              >
                {['Pune', 'New Delhi', 'Mumbai', 'Bengaluru', 'Hyderabad', 'Chennai', 'Kolkata'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="location" className={labelCls}>
                Street, landmark or area
              </label>
              <input
                id="location"
                value={form.locationName}
                onChange={(e) => update({ locationName: e.target.value })}
                placeholder="E.g. Ring Road near Metro Station"
                aria-invalid={!!errors.location}
                className={field(errors.location)}
              />
              {errors.location && <p role="alert" className={errorCls}>{errors.location}</p>}
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={useMyLocation}
              disabled={geo.status === 'loading'}
              className={`${btnOutline} flex items-center justify-center gap-1.5`}
            >
              <LocateIcon className="h-4 w-4 text-teal-600" />
              <span>{geo.status === 'loading' ? 'Accessing GPS...' : 'Use my current location'}</span>
            </button>
          </div>

          {geo.message && (
            <p
              role="status"
              className={`mt-2 text-xs rounded-lg p-2 ${
                geo.status === 'error'
                  ? 'font-medium text-red-700 bg-red-50 border border-red-200'
                  : 'text-teal-900 bg-teal-50 border border-teal-200'
              }`}
            >
              {geo.message}
            </p>
          )}

          {/* Real-time Google Map */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Google Maps Real-Time Location View
              </h3>
              {form.coords && (
                <span className="text-[11px] text-teal-700 font-mono font-semibold">
                  {form.coords.lat}, {form.coords.lng}
                </span>
              )}
            </div>

            <GoogleMapView
              pin={form.coords ? { lat: form.coords.lat, lng: form.coords.lng } : null}
              center={
                form.coords
                  ? { lat: form.coords.lat, lng: form.coords.lng }
                  : { lat: 28.6139, lng: 77.2090 }
              }
              zoom={form.coords ? 16 : 14}
              height="340px"
              interactive={true}
              onLocationSelect={({ lat, lng, address }) => {
                update({
                  coords: { lat, lng, accuracy: 10 },
                  locationName: address || form.locationName,
                  mapPos: { x: 50, y: 50 },
                });
                setGeo({
                  status: 'ok',
                  message: `Google Maps location selected in real time: ${lat}, ${lng}`,
                });
              }}
            />
            <p className="mt-2 text-[11px] text-slate-500">
              💡 Tap or search on Google Maps to pinpoint the exact location. The coordinates and street address are accessed in real time.
            </p>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="mt-6 space-y-4" aria-label="Review your report">
          <h2 className="text-base font-bold text-slate-900">Review Report</h2>
          <div className="rounded-xl border border-slate-200 p-3 bg-white">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Uploaded Photos ({photos.length})</h3>
              <button
                type="button"
                onClick={() => goStep(1)}
                className={`cursor-pointer rounded text-sm font-semibold text-teal-700 ${focusRing}`}
              >
                Edit
              </button>
            </div>
            <div className="mt-2 flex gap-2 overflow-x-auto">
              {photos.map((p, i) => (
                <IssuePhoto key={p.id} photo={p} alt={`Photo ${i + 1}`} className="h-20 w-20 shrink-0 rounded-lg" />
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-3 bg-white">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Details</h3>
              <button
                type="button"
                onClick={() => goStep(1)}
                className={`cursor-pointer rounded text-sm font-semibold text-teal-700 ${focusRing}`}
              >
                Edit
              </button>
            </div>
            <dl className="mt-2 space-y-1.5 text-sm">
              <div className="flex gap-2">
                <dt className="w-24 shrink-0 text-slate-500">Title</dt>
                <dd className="font-medium text-slate-900">{form.title.trim()}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-24 shrink-0 text-slate-500">Description</dt>
                <dd>{form.description.trim() || <span className="text-slate-400">None</span>}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-24 shrink-0 text-slate-500">Category</dt>
                <dd>{cat.label}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-24 shrink-0 text-slate-500">Severity</dt>
                <dd>
                  {SEVERITIES[form.severity ?? 'medium'].label}
                  {form.severity ? '' : ' (default)'}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-slate-200 p-3 bg-white">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Google Maps Location</h3>
              <button
                type="button"
                onClick={() => goStep(2)}
                className={`cursor-pointer rounded text-sm font-semibold text-teal-700 ${focusRing}`}
              >
                Edit
              </button>
            </div>
            <p className="mt-2 text-sm font-medium text-slate-900">{form.locationName.trim()}</p>
            {form.coords && (
              <p className="text-xs font-mono text-teal-700 mt-0.5">
                GPS: {form.coords.lat}, {form.coords.lng}
              </p>
            )}

            {form.coords && (
              <div className="mt-2 overflow-hidden rounded-lg border border-slate-200">
                <GoogleMapView
                  pin={{ lat: form.coords.lat, lng: form.coords.lng }}
                  center={{ lat: form.coords.lat, lng: form.coords.lng }}
                  zoom={16}
                  height="160px"
                  interactive={false}
                  showControls={false}
                />
              </div>
            )}
          </div>

          {errors.submit && <p role="alert" className={errorCls}>{errors.submit}</p>}
        </section>
      )}

      <div className="mt-6">
        <button
          type="button"
          onClick={next}
          disabled={
            isSubmitting ||
            (step === 1 &&
              (photos.some((p) => p.isDuplicate) ||
                aiAnalysis.status === 'duplicate' ||
                photos.some((p) => p.isScanning)))
          }
          className={`${btnPrimary} flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed`}
        >
          {isSubmitting
            ? 'Submitting to database...'
            : step === 1 && (photos.some((p) => p.isDuplicate) || aiAnalysis.status === 'duplicate')
            ? 'Duplicate Photo (Remove to Proceed)'
            : step === 1 && photos.some((p) => p.isScanning)
            ? 'Verifying Photo...'
            : step === 3
            ? 'Submit Civic Issue Report'
            : 'Next'}
        </button>
      </div>

      {/* Instant Duplicate Alert Modal */}
      {duplicateModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="duplicate-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-red-200 text-left"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <button
                type="button"
                onClick={() => setDuplicateModal({ isOpen: false, photoId: null, report: null })}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
                aria-label="Close"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            <h3 id="duplicate-title" className="mt-4 text-lg font-bold text-slate-900">
              Duplicate Photo Detected
            </h3>
            <p className="mt-1 text-xs text-slate-600 leading-relaxed">
              This exact photo was already submitted for an existing civic report. To prevent duplicate crew dispatches, duplicate submissions cannot be accepted.
            </p>

            {duplicateModal.report && (
              <div className="mt-3.5 rounded-xl border border-red-100 bg-red-50/70 p-3.5 space-y-1.5 text-xs text-slate-800">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-red-900">
                    Incident #{duplicateModal.report.referenceNumber}
                  </span>
                  <span className="rounded-full bg-red-200 px-2 py-0.5 text-[10px] font-bold text-red-900 uppercase">
                    {duplicateModal.report.status || 'Active'}
                  </span>
                </div>
                <p className="font-semibold text-slate-900 text-sm">
                  {duplicateModal.report.title}
                </p>
                {duplicateModal.report.locationName && (
                  <p className="text-[11px] text-slate-600">
                    📍 {duplicateModal.report.locationName}
                  </p>
                )}
              </div>
            )}

            <p className="mt-3 text-[11px] text-slate-500">
              You do not need to fill out this report. You can view and track the existing incident, or upload a fresh photo of a different defect.
            </p>

            <div className="mt-5 flex flex-col sm:flex-row gap-2">
              {duplicateModal.report?.id && (
                <button
                  type="button"
                  onClick={() => {
                    setDuplicateModal({ isOpen: false, photoId: null, report: null });
                    navigate('issue', { id: duplicateModal.report.id });
                  }}
                  className="flex-1 rounded-xl bg-teal-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-teal-800 transition cursor-pointer text-center shadow-xs"
                >
                  View Existing Incident
                </button>
              )}
              <button
                type="button"
                onClick={() => handleReplaceDuplicate(duplicateModal.photoId)}
                className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer text-center"
              >
                Upload Different Photo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}