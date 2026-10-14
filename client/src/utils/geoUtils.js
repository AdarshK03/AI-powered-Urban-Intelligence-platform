/**
 * Utility functions for Geocoding and Reverse Geocoding
 */

export async function reverseGeocode(lat, lng, apiKey = '') {
  if (!lat || !lng) return null;

  // 1. Try Google Maps Geocoding API if key is available
  if (apiKey) {
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'OK' && data.results?.[0]) {
          return {
            formattedAddress: data.results[0].formatted_address,
            shortAddress:
              data.results[0].address_components?.slice(0, 3).map((c) => c.short_name).join(', ') ||
              data.results[0].formatted_address,
          };
        }
      }
    } catch (err) {
      console.warn('Google reverse geocode error, falling back:', err.message);
    }
  }

  // 2. OpenStreetMap Nominatim reverse geocode (safe, free fallback)
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      { headers: { 'User-Agent': 'UrbanIntelligencePlatform/1.0' } }
    );
    if (res.ok) {
      const data = await res.json();
      if (data?.display_name) {
        const parts = data.display_name.split(',').map((p) => p.trim());
        // Pick the top 2-3 most specific parts (e.g. street, neighborhood, city)
        const short = parts.slice(0, 3).join(', ');
        return {
          formattedAddress: data.display_name,
          shortAddress: short || data.display_name,
        };
      }
    }
  } catch (err) {
    console.warn('Nominatim reverse geocode error:', err.message);
  }

  return {
    formattedAddress: `Location at ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
    shortAddress: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
  };
}

export async function forwardGeocode(query, apiKey = '') {
  if (!query || query.trim().length < 3) return null;

  if (apiKey) {
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'OK' && data.results?.[0]) {
          const loc = data.results[0].geometry.location;
          return {
            lat: loc.lat,
            lng: loc.lng,
            formattedAddress: data.results[0].formatted_address,
          };
        }
      }
    } catch (err) {
      console.warn('Google forward geocode error:', err.message);
    }
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
      { headers: { 'User-Agent': 'UrbanIntelligencePlatform/1.0' } }
    );
    if (res.ok) {
      const data = await res.json();
      if (data?.[0]) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          formattedAddress: data[0].display_name,
        };
      }
    }
  } catch (err) {
    console.warn('Nominatim forward geocode error:', err.message);
  }

  return null;
}
