import { useEffect, useState } from 'react';

export interface GeoState {
  coords: { lat: number; lon: number } | null;
  error: string | null;
}

/**
 * Watches the device position via the W3C Geolocation API.
 * Requires a secure context (HTTPS or localhost).
 */
export function useGeolocation(): GeoState {
  const [state, setState] = useState<GeoState>(() => ({
    coords: null,
    error: navigator.geolocation ? null : 'unsupported',
  }));

  useEffect(() => {
    if (!navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      (p) => setState({ coords: { lat: p.coords.latitude, lon: p.coords.longitude }, error: null }),
      (err) => setState((s) => ({ ...s, error: err.message || 'denied' })),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  return state;
}
