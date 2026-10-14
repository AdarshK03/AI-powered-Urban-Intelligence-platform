import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useMap,
} from '@vis.gl/react-google-maps';
import { MapPin, Navigation, Layers, ZoomIn, ZoomOut, Key, Check, Search, ExternalLink } from 'lucide-react';
import { reverseGeocode, forwardGeocode } from '../../utils/geoUtils';

/**
 * Controller component to handle programmatically updating Google Map center
 */
function MapRecenter({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (map && center && center.lat && center.lng) {
      map.panTo({ lat: center.lat, lng: center.lng });
      if (zoom) map.setZoom(zoom);
    }
  }, [map, center, zoom]);
  return null;
}

export default function GoogleMapView({
  center = { lat: 28.6139, lng: 77.2090 }, // Default Delhi center or user center
  zoom = 15,
  pin = null, // Single marker position { lat, lng }
  markers = [], // Array of { id, lat, lng, title, severity, category, status }
  onLocationSelect = null, // Callback ({ lat, lng, address })
  selectedMarkerId = null,
  onMarkerClick = null,
  className = '',
  height = '340px',
  interactive = true,
  mapType = 'roadmap', // roadmap | satellite | hybrid | terrain
  showControls = true,
  children,
}) {
  // Support key from env or localStorage
  const envKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem('uip_gmaps_api_key') || envKey;
  });
  const [keyModalOpen, setKeyModalOpen] = useState(false);
  const [inputKey, setInputKey] = useState(apiKey);
  const [currentCenter, setCurrentCenter] = useState(pin || center);
  const [currentZoom, setCurrentZoom] = useState(zoom);
  const [activeMapType, setActiveMapType] = useState(mapType);
  const [isLocating, setIsLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [activeInfoWindowId, setActiveInfoWindowId] = useState(selectedMarkerId);

  // Sync center when pin changes
  useEffect(() => {
    if (pin && pin.lat && pin.lng) {
      setCurrentCenter(pin);
    }
  }, [pin]);

  // Handle map click in programmatic SDK mode
  const handleMapClick = useCallback(
    async (ev) => {
      if (!interactive || !onLocationSelect) return;
      if (ev?.detail?.latLng) {
        const lat = ev.detail.latLng.lat;
        const lng = ev.detail.latLng.lng;
        setCurrentCenter({ lat, lng });

        // Reverse geocode to get real-world street address
        const geoResult = await reverseGeocode(lat, lng, apiKey);
        onLocationSelect({
          lat: parseFloat(lat.toFixed(6)),
          lng: parseFloat(lng.toFixed(6)),
          address: geoResult?.shortAddress || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
          fullAddress: geoResult?.formattedAddress,
        });
      }
    },
    [interactive, onLocationSelect, apiKey]
  );

  // Get current device GPS location
  const handleLocateMe = () => {
    if (!('geolocation' in navigator)) {
      alert('Your browser does not support geolocation.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const newCoords = { lat, lng };
        setCurrentCenter(newCoords);
        setCurrentZoom(16);

        if (onLocationSelect) {
          const geoResult = await reverseGeocode(lat, lng, apiKey);
          onLocationSelect({
            lat: parseFloat(lat.toFixed(6)),
            lng: parseFloat(lng.toFixed(6)),
            address: geoResult?.shortAddress || 'Current GPS Location',
            fullAddress: geoResult?.formattedAddress,
            accuracy: Math.round(pos.coords.accuracy),
          });
        }
        setIsLocating(false);
      },
      (err) => {
        console.warn('Geolocation failed:', err.message);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Search address
  const handleSearchAddress = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const result = await forwardGeocode(searchQuery.trim(), apiKey);
      if (result) {
        const newPos = { lat: result.lat, lng: result.lng };
        setCurrentCenter(newPos);
        setCurrentZoom(16);
        if (onLocationSelect) {
          onLocationSelect({
            lat: parseFloat(result.lat.toFixed(6)),
            lng: parseFloat(result.lng.toFixed(6)),
            address: result.formattedAddress,
          });
        }
      } else {
        alert(`Location "${searchQuery}" not found. Try street or city name.`);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const saveCustomKey = (k) => {
    const trimmed = k.trim();
    setApiKey(trimmed);
    localStorage.setItem('uip_gmaps_api_key', trimmed);
    setKeyModalOpen(false);
  };

  const getPinColor = (severity) => {
    const s = String(severity || '').toLowerCase();
    if (s === 'high') return '#dc2626'; // red
    if (s === 'medium') return '#f59e0b'; // amber
    if (s === 'low') return '#16a34a'; // green
    if (s === 'resolved') return '#0f766e'; // teal
    return '#2563eb'; // blue default
  };

  const effectiveLat = pin?.lat || currentCenter?.lat || 28.6139;
  const effectiveLng = pin?.lng || currentCenter?.lng || 77.2090;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm ${className}`}
      style={{ height, minHeight: '260px' }}
    >
      {/* Top Search & Locate Bar if interactive */}
      {showControls && (
        <div className="absolute left-3 right-3 top-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-auto">
          {onLocationSelect && (
            <form
              onSubmit={handleSearchAddress}
              className="flex items-center rounded-xl bg-white/95 px-2.5 py-1.5 shadow-md backdrop-blur border border-slate-200/80 text-xs w-full sm:w-auto"
            >
              <Search className="mr-1.5 h-3.5 w-3.5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search street, area on map..."
                className="w-44 sm:w-56 bg-transparent text-slate-800 focus:outline-none"
              />
              <button
                type="submit"
                disabled={isSearching}
                className="ml-1 cursor-pointer rounded-lg bg-teal-700 px-2 py-0.5 font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
              >
                {isSearching ? '...' : 'Go'}
              </button>
            </form>
          )}

          <div className="flex items-center gap-1.5 ml-auto">
            {/* Locate Me button */}
            <button
              type="button"
              onClick={handleLocateMe}
              disabled={isLocating}
              title="Show my current location in real time"
              className="flex items-center gap-1 cursor-pointer rounded-xl bg-white/95 px-2.5 py-1.5 text-xs font-semibold text-teal-700 shadow-md backdrop-blur border border-slate-200 hover:bg-teal-50"
            >
              <Navigation className={`h-3.5 w-3.5 ${isLocating ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isLocating ? 'Locating...' : 'My GPS'}</span>
            </button>

            {/* Map layer toggle */}
            <button
              type="button"
              onClick={() =>
                setActiveMapType((t) => (t === 'roadmap' ? 'satellite' : 'roadmap'))
              }
              title="Toggle Map Style"
              className="cursor-pointer rounded-xl bg-white/95 p-1.5 text-slate-700 shadow-md backdrop-blur border border-slate-200 hover:bg-slate-50"
            >
              <Layers className="h-4 w-4" />
            </button>

            {/* Google Maps API Key Config button */}
            <button
              type="button"
              onClick={() => setKeyModalOpen(true)}
              title="Configure Google Maps API Key"
              className={`cursor-pointer rounded-xl p-1.5 shadow-md backdrop-blur border text-xs font-semibold flex items-center gap-1 ${
                apiKey
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-amber-50 border-amber-300 text-amber-800'
              }`}
            >
              <Key className="h-3.5 w-3.5" />
              <span className="hidden md:inline">{apiKey ? 'GMP Active' : 'API Key'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Map Rendering */}
      {apiKey ? (
        // Mode A: Programmatic Google Maps SDK with @vis.gl/react-google-maps
        <APIProvider apiKey={apiKey} libraries={['places', 'marker']}>
          <div className="h-full w-full">
            <Map
              defaultCenter={currentCenter}
              defaultZoom={currentZoom}
              mapId="DEMO_MAP_ID"
              internalUsageAttributionIds={['gmp_git_agentskills_v1']}
              mapTypeId={activeMapType}
              onClick={handleMapClick}
              disableDefaultUI={!showControls}
              style={{ width: '100%', height: '100%' }}
            >
              <MapRecenter center={currentCenter} zoom={currentZoom} />

              {/* Single pin mode for Report Location */}
              {pin && pin.lat && pin.lng && (
                <AdvancedMarker
                  position={{ lat: pin.lat, lng: pin.lng }}
                  title="Selected Hazard Location"
                >
                  <Pin
                    background="#dc2626"
                    borderColor="#ffffff"
                    glyphColor="#ffffff"
                    scale={1.2}
                  />
                </AdvancedMarker>
              )}

              {/* Multi-markers mode for Issue Map / Admin Map */}
              {markers.map((m) => {
                const isSelected = selectedMarkerId === m.id || activeInfoWindowId === m.id;
                return (
                  <AdvancedMarker
                    key={m.id}
                    position={{ lat: m.lat, lng: m.lng }}
                    onClick={() => {
                      setActiveInfoWindowId(m.id);
                      onMarkerClick?.(m.id);
                    }}
                  >
                    <Pin
                      background={getPinColor(m.severity || m.status)}
                      borderColor="#ffffff"
                      glyphColor="#ffffff"
                      scale={isSelected ? 1.3 : 1.0}
                    />
                    {isSelected && (
                      <InfoWindow
                        position={{ lat: m.lat, lng: m.lng }}
                        onCloseClick={() => setActiveInfoWindowId(null)}
                      >
                        <div className="p-1 max-w-xs text-slate-900">
                          <p className="font-bold text-xs">{m.title}</p>
                          <p className="text-[11px] text-slate-500">{m.category} · {m.severity}</p>
                          {m.locationName && (
                            <p className="text-[10px] text-slate-600 mt-0.5 truncate">{m.locationName}</p>
                          )}
                        </div>
                      </InfoWindow>
                    )}
                  </AdvancedMarker>
                );
              })}
            </Map>
          </div>
        </APIProvider>
      ) : (
        // Mode B: Interactive Google Maps Live View (works instantly without requiring an API key)
        <div className="relative h-full w-full flex flex-col justify-end">
          <iframe
            title="Real-Time Google Maps"
            width="100%"
            height="100%"
            style={{ border: 0, position: 'absolute', inset: 0 }}
            loading="lazy"
            allowFullScreen
            src={`https://maps.google.com/maps?q=${effectiveLat},${effectiveLng}&z=${currentZoom}&output=embed`}
          />

          {/* Interactive pin indicator centered in real time */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative -mt-8 flex flex-col items-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600/90 text-white shadow-xl ring-4 ring-white animate-bounce">
                <MapPin className="h-6 w-6" />
              </span>
              <span className="mt-1 rounded-full bg-slate-900/80 px-2 py-0.5 text-[10px] font-bold text-white shadow">
                Google Maps GPS: {effectiveLat.toFixed(5)}, {effectiveLng.toFixed(5)}
              </span>
            </div>
          </div>

          {/* Click to select prompt if picker mode */}
          {interactive && onLocationSelect && (
            <div className="relative z-10 m-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/95 p-2.5 text-xs text-slate-700 shadow-lg backdrop-blur">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-semibold text-slate-900">
                  Real-time Google Maps Location Accessed:
                </span>
                <span className="font-mono text-slate-600">
                  {effectiveLat.toFixed(4)}, {effectiveLng.toFixed(4)}
                </span>
              </div>
              <button
                type="button"
                onClick={handleLocateMe}
                className="cursor-pointer rounded-lg bg-teal-700 px-3 py-1 font-semibold text-white hover:bg-teal-800 transition"
              >
                Update to Current GPS
              </button>
            </div>
          )}
        </div>
      )}

      {/* Children overlays (like legend or custom cards) */}
      {children}

      {/* API Key Configuration Modal */}
      {keyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Key className="h-5 w-5 text-teal-700" />
                Google Maps Platform Key
              </h3>
              <button
                onClick={() => setKeyModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Google Maps is active in real-time view. To enable full JavaScript SDK controls,
              vector 3D markers, and custom Cloud styling, paste your <strong>Google Maps API Key</strong> or free <strong>Maps Demo Key</strong> below.
            </p>

            <div className="mt-3 rounded-lg bg-teal-50 p-2.5 text-[11px] text-teal-900">
              💡 Need a free prototyping key? Mint one in 30 seconds at{' '}
              <a
                href="https://mapsplatform.google.com/maps-demo-key?utm_campaign=gmp_git_agentskills_v1"
                target="_blank"
                rel="noreferrer"
                className="font-bold underline text-teal-800 hover:text-teal-950 inline-flex items-center gap-0.5"
              >
                Google Maps Demo Key <ExternalLink className="h-3 w-3 inline" />
              </a>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                API Key (or VITE_GOOGLE_MAPS_API_KEY)
              </label>
              <input
                type="text"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono text-slate-800 focus:border-teal-600 focus:outline-none"
              />
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setInputKey('');
                  saveCustomKey('');
                }}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Clear Key
              </button>
              <button
                type="button"
                onClick={() => saveCustomKey(inputKey)}
                className="cursor-pointer rounded-xl bg-teal-700 px-4 py-2 text-xs font-bold text-white hover:bg-teal-800 flex items-center gap-1.5"
              >
                <Check className="h-4 w-4" />
                Save Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
