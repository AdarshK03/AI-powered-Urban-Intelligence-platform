import { useState } from 'react';
import { useIssues } from '../../context/IssueContext';
import { CITIES } from '../../data/demoIssues';
import { BellIcon, ChevronDownIcon, PinIcon, SearchIcon } from './icons';
import { focusRing } from './ui';
 
// Location selector + notification bell + search box (shared by Home and Map).
export default function AppHeader({ query, onQuery, placeholder }) {
  const { city, setCity } = useIssues();
  const [open, setOpen] = useState(false);
 
  return (
    <header className="space-y-3 bg-white px-4 pb-3 pt-4">
      <div className="flex items-center justify-between">
        <div className="relative">
          <label htmlFor="city-select" className="sr-only">City</label>
          <PinIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-teal-700" />
          <select
            id="city-select"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className={`cursor-pointer appearance-none rounded-full bg-slate-100 py-2 pl-9 pr-9 text-sm font-semibold text-slate-900 ${focusRing}`}
          >
            {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        </div>
 
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label="Notifications (demo, 2 unread)"
            aria-expanded={open}
            className={`relative cursor-pointer rounded-full p-2 text-slate-800 hover:bg-slate-100 ${focusRing}`}
          >
            <BellIcon className="h-6 w-6" />
            <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
          </button>
          {open && (
            <div role="status" className="absolute right-0 top-12 z-40 w-64 rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-600 shadow-lg">
              <p className="font-semibold text-slate-900">Notifications (demo)</p>
              <p className="mt-1">Real notifications need a backend. None are sent or received in this prototype.</p>
            </div>
          )}
        </div>
      </div>
 
      <div className="relative">
        <label htmlFor="issue-search" className="sr-only">{placeholder}</label>
        <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          id="issue-search"
          type="search"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-slate-200 bg-slate-100 py-3 pl-11 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/30"
        />
      </div>
    </header>
  );
}