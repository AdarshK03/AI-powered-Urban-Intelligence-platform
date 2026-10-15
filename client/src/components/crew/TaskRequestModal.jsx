import React, { useState } from 'react';
import { X, Send, MapPin, AlertCircle, Wrench, CheckCircle2 } from 'lucide-react';

export default function TaskRequestModal({
  isOpen,
  onClose,
  issue,
  crewCity,
  onRequestTask,
}) {
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !issue) return null;

  const isCityMismatch =
    issue.city &&
    crewCity &&
    issue.city.toLowerCase() !== 'all cities' &&
    issue.city.toLowerCase() !== crewCity.toLowerCase();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isCityMismatch) {
      setError(`Task requests are strictly restricted to your registered city (${crewCity}).`);
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await onRequestTask(issue.id, notes);
      setNotes('');
      setIsSubmitting(false);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit assignment request.');
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Request Assignment</h3>
              <p className="text-[11px] text-slate-500">
                Notify municipal admin to assign your team to this defect
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Selected Issue Preview */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              {issue.referenceNumber}
            </span>
            <span
              className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                issue.severity === 'high'
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {issue.severity?.toUpperCase()} PRIORITY
            </span>
          </div>

          <h4 className="font-bold text-slate-900 text-sm leading-tight">
            {issue.title}
          </h4>

          <div className="flex items-center gap-1.5 text-slate-600 font-medium">
            <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span className="truncate">{issue.locationName || issue.city}</span>
            <span className="text-slate-300">•</span>
            <span className="text-teal-700 font-semibold">{issue.city}</span>
          </div>
        </div>

        {isCityMismatch && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 font-medium">
            ⚠️ <strong>Jurisdiction Restriction:</strong> Your registered crew operations zone is <strong>{crewCity}</strong>. You cannot request work on defects located in {issue.city}.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Field Notes for Admin (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Our crew has 4 members and hot-mix asphalt ready on Sinhagad Road..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <div className="flex gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isCityMismatch}
              className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Sending Request...' : 'Send Request to Admin'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
