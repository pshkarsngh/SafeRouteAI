import type { FullSafetyResponse, IncidentInfo } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  let res: Response;
  try {
    res = await fetch(url, options);
  } catch (err) {
    throw new Error(`Cannot connect to backend at ${API_BASE}. Is the server running?`);
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API error ${res.status}: ${text || res.statusText}`);
  }
  return res.json();
}

export interface GeocodeResult {
  lat: number;
  lng: number;
  formatted_address: string;
  status: string;
}

export async function geocode(query: string): Promise<GeocodeResult> {
  return apiFetch<GeocodeResult>(
    `/api/geocoding/geocode?q=${encodeURIComponent(query)}`
  );
}

export async function reverseGeocode(lat: number, lng: number): Promise<{ name: string; status: string }> {
  return apiFetch(`/api/geocoding/reverse-geocode?lat=${lat}&lng=${lng}`);
}

export async function checkRoute(
  startLat: number,
  startLon: number,
  endLat: number,
  endLon: number,
  preferences = "",
  startName = "",
  endName = ""
): Promise<FullSafetyResponse> {
  return apiFetch<FullSafetyResponse>("/api/safety/check-route", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      start_lat: startLat,
      start_lon: startLon,
      end_lat: endLat,
      end_lon: endLon,
      preferences,
      start_name: startName,
      end_name: endName,
    }),
  });
}

export async function fetchImages(lat: number, lon: number) {
  return apiFetch(`/api/images/fetch?lat=${lat}&lon=${lon}`);
}

export async function searchIncidents(
  lat: number,
  lon: number,
  placeName = ""
): Promise<IncidentInfo[]> {
  return apiFetch<IncidentInfo[]>(
    `/api/incidents/search?lat=${lat}&lon=${lon}&place_name=${encodeURIComponent(placeName)}`
  );
}

export async function detectHazards(file: File) {
  const form = new FormData();
  form.append("file", file);
  const url = `${API_BASE}/api/images/detect`;
  let res: Response;
  try {
    res = await fetch(url, { method: "POST", body: form });
  } catch (err) {
    throw new Error(`Cannot connect to backend at ${API_BASE}`);
  }
  if (!res.ok) throw new Error("Failed to detect hazards");
  return res.json();
}

export async function healthCheck() {
  return apiFetch("/health");
}
