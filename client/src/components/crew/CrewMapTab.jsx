import React, { useState, useMemo } from 'react';
import {
  MapPin,
  Filter,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Send,
  Camera,
  Layers,
  Search,
  Check,
} from 'lucide-react';
import GoogleMapView from '../common/GoogleMapView';
import { CATEGORIES, SEVERITIES, categoryById } from '../../data/demoIssues';
import IssuePhoto from '../../assets/IssuePhotos';
import TaskRequestModal from './TaskRequestModal';

export default function CrewMapTab({
  issues = [],
  crewCity = 'Pune',
  crewName = '',
  myRequests = [],
  onRequestTask,
}) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIssueId, setSelectedIssueId] = useState(null);
  const [requestModalOpen, setRequestModalOpen] = useState(false);

  // Filter issues by city (crew leader defaults to their registered city, but can view)
  const filteredIssues = useMemo(() => {
    return issues.filter((i) => {
      if (selectedCategory !== 'all' && i.category !== selectedCategory) return false;
      if (selectedSeverity !== 'all' && i.severity !== selectedSeverity) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (i.title || '').toLowerCase().includes(q);
        const matchLoc = (i.locationName || i.location || '').toLowerCase().includes(q);
        const matchCat = (i.category || '').toLowerCase().includes(q);
        if (!matchTitle && !matchLoc && !matchCat) return false;
      }
      return true;
    });
  }, [issues, selectedCategory, selectedSeverity, searchQuery]);

  // Coordinates filter
  const mapIssues = filteredIssues.filter(
    (i) => i.latitude !== null && i.longitude !== null && !isNaN(Number(i.latitude)) && !isNaN(Number(i.longitude))
  );

  const selectedIssue =
    mapIssues.find((i) => i.id === selectedIssueId) || (mapIssues.length > 0 ? mapIssues[0] : null);

  const mapMarkers = mapIssues.map((i) => ({
    id: i.id,
    lat: Number(i.latitude),
    lng: Number(i.longitude),
    title: i.title,
    severity: i.severity,
    category: categoryById(i.category)?.label || i.category,
    status: i.status,
  }));

  const mapCenter = selectedIssue && selectedIssue.latitude
    ? { lat: Number(selectedIssue.latitude), lng: Number(selectedIssue.longitude) }
    : mapMarkers.length > 0
    ? { lat: mapMarkers[0].lat, lng: mapMarkers[0].lng }
    : { lat: 18.5204, lng: 73.8567 }; // Pune default coordinates

  // Check if current selected issue has already been requested by this crew
  const hasAlreadyRequested = useMemo(() => {
    if (!selectedIssue) return false;
    return myRequests.some((r) => r.issueId === selectedIssue.id);
  }, [selectedIssue, myRequests]);

  const isAssignedToThisCrew =
    selectedIssue?.assignedCrew &&
    crewName &&
    selectedIssue.assignedCrew.toLowerCase() === crewName.toLowerCase();

  const isCityMatch =
    selectedIssue?.city &&
    crewCity &&
    (selectedIssue.city.toLowerCase() === crewCity.toLowerCase() ||
      selectedIssue.city.toLowerCase() === 'all cities');

  return (
    <div className="space-y-4">
      {/* Top Map Controls Banner */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-base font-bold text-slate-900">
              City Infrastructure Hazard Map
            </h2>
            <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
              📍 {crewCity} Zone
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            View live reported defects across the city and request official dispatch from municipal administration
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>

          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none"
          >
            <option value="all">All Severities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
        </div>
      </div>

      {/* Main Map Box */}
      <div className="relative h-[480px] w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
        <GoogleMapView
          center={mapCenter}
          zoom={mapIssues.length > 0 ? 14 : 12}
          markers={mapMarkers}
          selectedMarkerId={selectedIssue?.id}
          onMarkerClick={(id) => setSelectedIssueId(id)}
          height="100%"
          className="h-full w-full"
        >
          {/* Selected Defect Card Floating on Map */}
          {selectedIssue && (
            <div className="absolute inset-x-3 bottom-4 md:inset-x-auto md:left-4 md:bottom-4 md:max-w-md z-30 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-slate-200/90 animate-in fade-in duration-150">
              <div className="flex items-start gap-3">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                  <IssuePhoto
                    photo={selectedIssue.photos?.[0]}
                    alt={selectedIssue.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] font-bold text-teal-800 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200">
                      {selectedIssue.referenceNumber}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                        selectedIssue.severity === 'high'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {selectedIssue.severity?.toUpperCase()}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-slate-900 truncate mt-1">
                    {selectedIssue.title}
                  </h3>

                  <p className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-teal-600 shrink-0" />
                    <span>{selectedIssue.locationName || selectedIssue.city}</span>
                  </p>
                </div>
              </div>

              {/* Requirement: Crew leader button to request task assignment from admin */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="text-[10px] text-slate-400">
                  {selectedIssue.city} District
                </span>

                {isAssignedToThisCrew ? (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Assigned to Your Crew</span>
                  </span>
                ) : hasAlreadyRequested ? (
                  <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-xl flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Request Sent to Admin</span>
                  </span>
                ) : !isCityMatch ? (
                  <span
                    title={`You can only request tasks in your registered city (${crewCity})`}
                    className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-xl cursor-not-allowed"
                  >
                    Restricted to {crewCity}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setRequestModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Request to Work on This Task</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </GoogleMapView>
      </div>

      {/* Task Request Confirmation Modal */}
      {selectedIssue && (
        <TaskRequestModal
          isOpen={requestModalOpen}
          onClose={() => setRequestModalOpen(false)}
          issue={selectedIssue}
          crewCity={crewCity}
          onRequestTask={onRequestTask}
        />
      )}
    </div>
  );
}
