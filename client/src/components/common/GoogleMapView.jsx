import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useMap,
} from '@vis.gl/react-google-maps';
import {
  MapPin,
  Navigation,
  Layers,
  ZoomIn,
  ZoomOut,
  Key,
  Check,
  Search,
  ExternalLink,
  Crosshair,
  Loader2,
} from 'lucide-react';
import { reverseGeocode, forwardGeocode } from '../../utils/geoUtils';

/**
 * Controller component to handle programmatically updating Google Map center in SDK mode
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

// ----------------------------------------------------------------------
// Web Mercator Slippy Map Math (High Precision)
// ----------------------------------------------------------------------
const TILE_SIZE = 256;

function lngToTileX(lng, zoom) {
  return ((lng + 180) / 360) * Math.pow(2, zoom);
}

function latToTileY(lat, zoom) {
  const rad = (lat * Math.PI) / 180;
  return (
    ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) *
    Math.pow(2, zoom)
  );
}

function tileXToLng(x, zoom) {
  return (x / Math.pow(2, zoom)) * 360 - 180;
}

function tileYToLat(y, zoom) {
  const n = Math.PI - (2 * Math.PI * y) / Math.pow(2, zoom);
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

function screenToCoords(px, py, centerLat, centerLng, zoom, width, height) {
  const centerTileX = lngToTileX(centerLng, zoom);
  const centerTileY = latToTileY(centerLat, zoom);
  const centerPx = centerTileX * TILE_SIZE;
  const centerPy = centerTileY * TILE_SIZE;

  const targetPx = centerPx + (px - width / 2);
  const targetPy = centerPy + (py - height / 2);

  const targetTileX = targetPx / TILE_SIZE;
  const targetTileY = targetPy / TILE_SIZE;

  const lng = tileXToLng(targetTileX, zoom);
  const lat = tileYToLat(targetTileY, zoom);

  return {
    lat: Math.max(-85, Math.min(85, lat)),
    lng: ((((lng + 180) % 360) + 360) % 360) - 180,
  };
}

function coordsToScreen(lat, lng, centerLat, centerLng, zoom, width, height) {
  const centerTileX = lngToTileX(centerLng, zoom);
  const centerTileY = latToTileY(centerLat, zoom);

  const targetTileX = lngToTileX(lng, zoom);
  const targetTileY = latToTileY(lat, zoom);

  const px = (targetTileX - centerTileX) * TILE_SIZE + width / 2;
  const py = (targetTileY - centerTileY) * TILE_SIZE + height / 2;

  return { px, py };
}

export default function GoogleMapView({
  center = { lat: 28.6139, lng: 77.2090 }, // Default Delhi or user coordinates
  zoom = 15,
  pin = null, // Single marker position { lat, lng }
  markers = [], // Array of { id, lat, lng, title, severity, category, status }
  onLocationSelect = null, // Callback ({ lat, lng, address, fullAddress })
  selectedMarkerId = null,
  onMarkerClick = null,
  className = '',
  height = '340px',
  interactive = true,
  mapType = 'roadmap', // roadmap | satellite
  showControls = true,
  children,
}) {
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
  const [selectedAddressPreview, setSelectedAddressPreview] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Slippy map interactive canvas refs & state
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 340 });
  const dragRef = useRef({
    isDown: false,
    startX: 0,
    startY: 0,
    startCenter: { lat: 28.6139, lng: 77.2090 },
    hasMoved: false,
    moveDistance: 0,
  });

  // Track container dimensions with ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect) {
          setDimensions({
            width: Math.max(200, Math.round(entry.contentRect.width)),
            height: Math.max(150, Math.round(entry.contentRect.height)),
          });
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Sync center when pin changes externally
  useEffect(() => {
    if (pin && typeof pin.lat === 'number' && typeof pin.lng === 'number') {
      setCurrentCenter(pin);
    }
  }, [pin]);

  // Sync selected marker id
  useEffect(() => {
    setActiveInfoWindowId(selectedMarkerId);
  }, [selectedMarkerId]);

  // Helper to trigger location selection & reverse geocode
  const triggerLocationSelected = useCallback(
    async (lat, lng) => {
      if (!onLocationSelect) return;
      const cleanLat = parseFloat(Number(lat).toFixed(6));
      const cleanLng = parseFloat(Number(lng).toFixed(6));

      setCurrentCenter({ lat: cleanLat, lng: cleanLng });
      setIsGeocoding(true);
      try {
        const geoResult = await reverseGeocode(cleanLat, cleanLng, apiKey);
        const shortAddr = geoResult?.shortAddress || `${cleanLat}, ${cleanLng}`;
        const fullAddr = geoResult?.formattedAddress || shortAddr;
        setSelectedAddressPreview(shortAddr);

        onLocationSelect({
          lat: cleanLat,
          lng: cleanLng,
          address: shortAddr,
          fullAddress: fullAddr,
        });
      } catch (err) {
        console.warn('Geocoding error:', err);
        const fallbackAddr = `${cleanLat}, ${cleanLng}`;
        setSelectedAddressPreview(fallbackAddr);
        onLocationSelect({
          lat: cleanLat,
          lng: cleanLng,
          address: fallbackAddr,
          fullAddress: fallbackAddr,
        });
      } finally {
        setIsGeocoding(false);
      }
    },
    [apiKey, onLocationSelect]
  );

  // Google Maps SDK click handler (safe for function or property latLng)
  const handleGoogleSdkClick = useCallback(
    (ev) => {
      if (!interactive || !onLocationSelect) return;
      const raw = ev?.detail?.latLng || ev?.latLng;
      if (!raw) return;

      const lat = typeof raw.lat === 'function' ? raw.lat() : Number(raw.lat);
      const lng = typeof raw.lng === 'function' ? raw.lng() : Number(raw.lng);
      if (!isNaN(lat) && !isNaN(lng)) {
        triggerLocationSelected(lat, lng);
      }
    },
    [interactive, onLocationSelect, triggerLocationSelected]
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
        setCurrentCenter({ lat, lng });
        setCurrentZoom(16);
        if (onLocationSelect) {
          await triggerLocationSelected(lat, lng);
        }
        setIsLocating(false);
      },
      (err) => {
        console.warn('Geolocation failed:', err.message);
        setIsLocating(false);
        alert('Could not access device GPS. Please check location permissions.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Search address (forward geocoding)
  const handleSearchAddress = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const result = await forwardGeocode(searchQuery.trim(), apiKey);
      if (result && typeof result.lat === 'number' && typeof result.lng === 'number') {
        const newPos = { lat: result.lat, lng: result.lng };
        setCurrentCenter(newPos);
        setCurrentZoom(16);
        setSelectedAddressPreview(result.formattedAddress);
        if (onLocationSelect) {
          onLocationSelect({
            lat: parseFloat(result.lat.toFixed(6)),
            lng: parseFloat(result.lng.toFixed(6)),
            address: result.formattedAddress,
            fullAddress: result.formattedAddress,
          });
        }
      } else {
        alert(`Location "${searchQuery}" not found. Try searching with a landmark or city.`);
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

  // ----------------------------------------------------------------------
  // Slippy Map Mouse & Touch Drag / Click Handlers
  // ----------------------------------------------------------------------
  const handleMouseDown = (e) => {
    if (!interactive) return;
    dragRef.current = {
      isDown: true,
      startX: e.clientX,
      startY: e.clientY,
      startCenter: { ...currentCenter },
      hasMoved: false,
      moveDistance: 0,
    };
  };

  const handleMouseMove = (e) => {
    if (!dragRef.current.isDown || !interactive) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 4) {
      dragRef.current.hasMoved = true;
      dragRef.current.moveDistance = dist;

      // Pan center by dragging delta
      const startTileX = lngToTileX(dragRef.current.startCenter.lng, currentZoom);
      const startTileY = latToTileY(dragRef.current.startCenter.lat, currentZoom);

      const newTileX = startTileX - dx / TILE_SIZE;
      const newTileY = startTileY - dy / TILE_SIZE;

      const newLng = tileXToLng(newTileX, currentZoom);
      const newLat = tileYToLat(newTileY, currentZoom);

      setCurrentCenter({
        lat: Math.max(-85, Math.min(85, newLat)),
        lng: ((((newLng + 180) % 360) + 360) % 360) - 180,
      });
    }
  };

  const handleMouseUp = (e) => {
    if (!dragRef.current.isDown) return;
    const wasDragging = dragRef.current.hasMoved && dragRef.current.moveDistance > 6;
    dragRef.current.isDown = false;

    // If user clicked without dragging, select this exact location!
    if (!wasDragging && interactive && onLocationSelect && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const coords = screenToCoords(
        clickX,
        clickY,
        currentCenter.lat,
        currentCenter.lng,
        currentZoom,
        dimensions.width,
        dimensions.height
      );

      triggerLocationSelected(coords.lat, coords.lng);
    }
  };

  // Touch event handlers for mobile
  const handleTouchStart = (e) => {
    if (!interactive || e.touches.length === 0) return;
    const touch = e.touches[0];
    dragRef.current = {
      isDown: true,
      startX: touch.clientX,
      startY: touch.clientY,
      startCenter: { ...currentCenter },
      hasMoved: false,
      moveDistance: 0,
    };
  };

  const handleTouchMove = (e) => {
    if (!dragRef.current.isDown || !interactive || e.touches.length === 0) return;
    const touch = e.touches[0];
    const dx = touch.clientX - dragRef.current.startX;
    const dy = touch.clientY - dragRef.current.startY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 5) {
      dragRef.current.hasMoved = true;
      dragRef.current.moveDistance = dist;

      const startTileX = lngToTileX(dragRef.current.startCenter.lng, currentZoom);
      const startTileY = latToTileY(dragRef.current.startCenter.lat, currentZoom);

      const newTileX = startTileX - dx / TILE_SIZE;
      const newTileY = startTileY - dy / TILE_SIZE;

      const newLng = tileXToLng(newTileX, currentZoom);
      const newLat = tileYToLat(newTileY, currentZoom);

      setCurrentCenter({
        lat: Math.max(-85, Math.min(85, newLat)),
        lng: ((((newLng + 180) % 360) + 360) % 360) - 180,
      });
    }
  };

  const handleTouchEnd = (e) => {
    if (!dragRef.current.isDown) return;
    const wasDragging = dragRef.current.hasMoved && dragRef.current.moveDistance > 6;
    dragRef.current.isDown = false;

    if (!wasDragging && interactive && onLocationSelect && containerRef.current) {
      const touch = e.changedTouches?.[0];
      if (touch) {
        const rect = containerRef.current.getBoundingClientRect();
        const clickX = touch.clientX - rect.left;
        const clickY = touch.clientY - rect.top;

        const coords = screenToCoords(
          clickX,
          clickY,
          currentCenter.lat,
          currentCenter.lng,
          currentZoom,
          dimensions.width,
          dimensions.height
        );

        triggerLocationSelected(coords.lat, coords.lng);
      }
    }
  };

  // Zoom handlers
  const zoomIn = () => setCurrentZoom((z) => Math.min(18, z + 1));
  const zoomOut = () => setCurrentZoom((z) => Math.max(4, z - 1));

  // Determine active pin coordinates
  const activePinCoords = pin?.lat && pin?.lng ? pin : currentCenter;

  const getPinColor = (severity) => {
    const s = String(severity || '').toLowerCase();
    if (s === 'high' || s === 'severe') return '#dc2626'; // red
    if (s === 'medium' || s === 'moderate') return '#f59e0b'; // amber
    if (s === 'low') return '#16a34a'; // green
    if (s === 'resolved' || s === 'work_completed') return '#0f766e'; // teal
    return '#0284c7'; // cyan default
  };

  // ----------------------------------------------------------------------
  // Compute visible slippy map tiles for OpenStreetMap / Satellite layer
  // ----------------------------------------------------------------------
  const renderSlippyTiles = () => {
    const numTiles = Math.pow(2, currentZoom);
    const centerTileX = lngToTileX(currentCenter.lng, currentZoom);
    const centerTileY = latToTileY(currentCenter.lat, currentZoom);

    const centerPx = centerTileX * TILE_SIZE;
    const centerPy = centerTileY * TILE_SIZE;

    const minX = Math.floor((centerPx - dimensions.width / 2 - 128) / TILE_SIZE);
    const maxX = Math.floor((centerPx + dimensions.width / 2 + 128) / TILE_SIZE);
    const minY = Math.floor((centerPy - dimensions.height / 2 - 128) / TILE_SIZE);
    const maxY = Math.floor((centerPy + dimensions.height / 2 + 128) / TILE_SIZE);

    const tiles = [];
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        if (y < 0 || y >= numTiles) continue;

        const normalizedX = ((x % numTiles) + numTiles) % numTiles;
        const left = Math.round(x * TILE_SIZE - centerPx + dimensions.width / 2);
        const top = Math.round(y * TILE_SIZE - centerPy + dimensions.height / 2);

        const tileUrl =
          activeMapType === 'satellite'
            ? `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${currentZoom}/${y}/${normalizedX}`
            : `https://tile.openstreetmap.org/${currentZoom}/${normalizedX}/${y}.png`;

        tiles.push(
          <img
            key={`${currentZoom}-${x}-${y}`}
            src={tileUrl}
            alt=""
            loading="lazy"
            draggable={false}
            className="absolute select-none pointer-events-none transition-opacity duration-150"
            style={{
              left: `${left}px`,
              top: `${top}px`,
              width: `${TILE_SIZE}px`,
              height: `${TILE_SIZE}px`,
            }}
          />
        );
      }
    }
    return tiles;
  };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm select-none ${className}`}
      style={{ height, minHeight: '260px' }}
    >
      {/* Top Controls Bar */}
      {showControls && (
        <div className="absolute left-3 right-3 top-3 z-30 flex flex-wrap items-center justify-between gap-2 pointer-events-auto">
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
                className="w-44 sm:w-56 bg-transparent text-slate-800 placeholder:text-slate-400 focus:outline-none"
              />
              <button
                type="submit"
                disabled={isSearching}
                className="ml-1 cursor-pointer rounded-lg bg-teal-700 px-2 py-0.5 font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
              >
                {isSearching ? <Loader2 className="w-3 h-3 animate-spin inline" /> : 'Go'}
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
              className="flex items-center gap-1 cursor-pointer rounded-xl bg-white/95 px-2.5 py-1.5 text-xs font-semibold text-teal-700 shadow-md backdrop-blur border border-slate-200 hover:bg-teal-50 active:scale-95 transition"
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
              title={`Switch to ${activeMapType === 'roadmap' ? 'Satellite' : 'Roadmap'} View`}
              className="cursor-pointer rounded-xl bg-white/95 p-1.5 text-slate-700 shadow-md backdrop-blur border border-slate-200 hover:bg-slate-50 active:scale-95 transition"
            >
              <Layers className="h-4 w-4" />
            </button>

            {/* Google Maps API Key Config button */}
            <button
              type="button"
              onClick={() => setKeyModalOpen(true)}
              title="Configure Google Maps API Key"
              className={`cursor-pointer rounded-xl p-1.5 shadow-md backdrop-blur border text-xs font-semibold flex items-center gap-1 active:scale-95 transition ${
                apiKey
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-teal-50 border-teal-200 text-teal-800'
              }`}
            >
              <Key className="h-3.5 w-3.5" />
              <span className="hidden md:inline">{apiKey ? 'GMP Active' : 'Live Map'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Zoom In/Out Floating Controls */}
      {showControls && (
        <div className="absolute right-3 bottom-14 z-20 flex flex-col gap-1">
          <button
            type="button"
            onClick={zoomIn}
            title="Zoom In"
            className="w-8 h-8 rounded-lg bg-white/95 shadow-md border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50 active:scale-95 transition cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={zoomOut}
            title="Zoom Out"
            className="w-8 h-8 rounded-lg bg-white/95 shadow-md border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50 active:scale-95 transition cursor-pointer"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Map Rendering */}
      {apiKey ? (
        // Mode A: Google Maps JavaScript SDK with @vis.gl/react-google-maps
        <APIProvider apiKey={apiKey} libraries={['places', 'marker']}>
          <div className="h-full w-full">
            <Map
              defaultCenter={currentCenter}
              defaultZoom={currentZoom}
              mapId="DEMO_MAP_ID"
              internalUsageAttributionIds={['gmp_git_agentskills_v1']}
              mapTypeId={activeMapType}
              onClick={handleGoogleSdkClick}
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

              {/* Multi-markers mode */}
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
                          <p className="text-[11px] text-slate-500">
                            {m.category} · {m.severity}
                          </p>
                          {m.locationName && (
                            <p className="text-[10px] text-slate-600 mt-0.5 truncate">
                              {m.locationName}
                            </p>
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
        // Mode B: Interactive Full-Fledged Slippy Map (Drag-to-pan, Click/tap-to-pin anywhere!)
        <div
          className={`relative h-full w-full overflow-hidden ${
            interactive ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
          }`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Tile layer */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {renderSlippyTiles()}
          </div>

          {/* Render Multi-Markers (for IssueMap / Admin / Crew tabs) */}
          {markers.map((m) => {
            const screen = coordsToScreen(
              m.lat,
              m.lng,
              currentCenter.lat,
              currentCenter.lng,
              currentZoom,
              dimensions.width,
              dimensions.height
            );

            // Hide if offscreen
            if (
              screen.px < -40 ||
              screen.px > dimensions.width + 40 ||
              screen.py < -40 ||
              screen.py > dimensions.height + 40
            ) {
              return null;
            }

            const isSelected = selectedMarkerId === m.id || activeInfoWindowId === m.id;
            const markerColor = getPinColor(m.severity || m.status);

            return (
              <div
                key={m.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveInfoWindowId(m.id);
                  onMarkerClick?.(m.id);
                }}
                className="absolute z-20 -translate-x-1/2 -translate-y-full cursor-pointer transition-transform hover:scale-125"
                style={{
                  left: `${screen.px}px`,
                  top: `${screen.py}px`,
                }}
              >
                <div
                  className="flex items-center justify-center rounded-full p-1.5 shadow-lg ring-2 ring-white"
                  style={{ backgroundColor: markerColor }}
                >
                  <MapPin className="w-4 h-4 text-white" />
                </div>

                {isSelected && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-44 rounded-xl bg-white p-2 text-xs shadow-xl border border-slate-200 z-30">
                    <p className="font-bold text-slate-900 truncate">{m.title}</p>
                    <p className="text-[10px] text-slate-500 capitalize">
                      {m.category} · {m.severity || m.status}
                    </p>
                    {m.locationName && (
                      <p className="text-[10px] text-slate-600 truncate mt-0.5">
                        {m.locationName}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Render Selected Pin (Single Marker Mode) */}
          {activePinCoords && activePinCoords.lat && activePinCoords.lng && (
            (() => {
              const screen = coordsToScreen(
                activePinCoords.lat,
                activePinCoords.lng,
                currentCenter.lat,
                currentCenter.lng,
                currentZoom,
                dimensions.width,
                dimensions.height
              );

              return (
                <div
                  className="pointer-events-none absolute z-25 -translate-x-1/2 -translate-y-full flex flex-col items-center"
                  style={{
                    left: `${screen.px}px`,
                    top: `${screen.py}px`,
                  }}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-600 text-white shadow-xl ring-3 ring-white animate-bounce">
                    <MapPin className="h-5 w-5" />
                  </span>
                  <div className="w-2.5 h-1 rounded-full bg-slate-950/40 blur-[1px] -mt-0.5" />
                </div>
              );
            })()
          )}

          {/* Map Attribution */}
          <div className="absolute right-2 bottom-1 z-10 text-[9px] text-slate-600 bg-white/70 px-1.5 py-0.5 rounded shadow pointer-events-none">
            © OpenStreetMap contributors
          </div>
        </div>
      )}

      {/* Bottom Floating Banner: Shows Selected Location Status & Coordinates */}
      {interactive && onLocationSelect && (
        <div className="absolute inset-x-3 bottom-3 z-30 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/95 p-2 text-xs text-slate-700 shadow-lg backdrop-blur border border-slate-200 pointer-events-auto">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span
              className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                isGeocoding ? 'bg-amber-500 animate-ping' : 'bg-emerald-500 animate-pulse'
              }`}
            />
            <div className="min-w-0">
              <span className="font-semibold text-slate-900 block truncate">
                {isGeocoding
                  ? 'Retrieving address...'
                  : selectedAddressPreview || 'Tap anywhere on the map to pin location'}
              </span>
              <span className="text-[10px] font-mono text-slate-500 block truncate">
                Lat: {activePinCoords.lat.toFixed(5)}, Lng: {activePinCoords.lng.toFixed(5)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleLocateMe}
              disabled={isLocating}
              className="cursor-pointer rounded-lg bg-teal-50 border border-teal-200 px-2 py-1 text-[11px] font-semibold text-teal-700 hover:bg-teal-100 transition"
            >
              GPS Center
            </button>
          </div>
        </div>
      )}

      {/* Children overlays (e.g. legends, preview cards) */}
      {children}

      {/* API Key Configuration Modal */}
      {keyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Key className="h-5 w-5 text-teal-700" />
                Map Service Options
              </h3>
              <button
                onClick={() => setKeyModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Urban Intelligence Platform includes an interactive high-resolution slippy map with full click-to-pin, search, and reverse geocoding enabled by default. If you wish to use Google Maps Platform JS SDK with custom styling, paste your key below.
            </p>

            <div className="mt-3 rounded-lg bg-teal-50 p-2.5 text-[11px] text-teal-900">
              💡 Need a Google Maps prototyping key? Get one at{' '}
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
                Google Maps API Key (Optional)
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
                Use Built-in Live Map
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
