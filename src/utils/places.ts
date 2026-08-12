export interface Place {
  id: string
  name: string
  region: string
  lngLat: [number, number]
  zoom: number
  tags: string[]
}

export const PLACES: Place[] = [
  { id: 'new-delhi', name: 'New Delhi', region: 'India', lngLat: [77.209, 28.6139], zoom: 12, tags: ['capital', 'city'] },
  { id: 'mumbai', name: 'Mumbai', region: 'India', lngLat: [72.8777, 19.076], zoom: 12, tags: ['city', 'finance'] },
  { id: 'bengaluru', name: 'Bengaluru', region: 'India', lngLat: [77.5946, 12.9716], zoom: 12, tags: ['city', 'tech'] },
  { id: 'kolkata', name: 'Kolkata', region: 'India', lngLat: [88.3639, 22.5726], zoom: 12, tags: ['city'] },
  { id: 'chennai', name: 'Chennai', region: 'India', lngLat: [80.2707, 13.0827], zoom: 12, tags: ['city'] },
  { id: 'jaipur', name: 'Jaipur', region: 'India', lngLat: [75.7873, 26.9124], zoom: 12, tags: ['city', 'heritage'] },
  { id: 'goa', name: 'Goa', region: 'India', lngLat: [73.9068, 15.2993], zoom: 11, tags: ['coast', 'tourist'] },
  { id: 'new-york', name: 'New York City', region: 'United States', lngLat: [-74.006, 40.7128], zoom: 12, tags: ['city', 'usa'] },
  { id: 'london', name: 'London', region: 'United Kingdom', lngLat: [-0.1276, 51.5072], zoom: 12, tags: ['city', 'uk'] },
  { id: 'paris', name: 'Paris', region: 'France', lngLat: [2.3522, 48.8566], zoom: 13, tags: ['city', 'europe'] },
  { id: 'singapore', name: 'Singapore', region: 'Singapore', lngLat: [103.8198, 1.3521], zoom: 12, tags: ['city', 'asia'] },
  { id: 'dubai', name: 'Dubai', region: 'United Arab Emirates', lngLat: [55.2708, 25.2048], zoom: 12, tags: ['city', 'uae'] },
  { id: 'tokyo', name: 'Tokyo', region: 'Japan', lngLat: [139.6917, 35.6895], zoom: 12, tags: ['city', 'japan'] },
  { id: 'bangkok', name: 'Bangkok', region: 'Thailand', lngLat: [100.5167, 13.7563], zoom: 12, tags: ['city', 'thailand'] },
  { id: 'sydney', name: 'Sydney', region: 'Australia', lngLat: [151.2093, -33.8688], zoom: 12, tags: ['city', 'australia'] },
  { id: 'los-angeles', name: 'Los Angeles', region: 'United States', lngLat: [-118.2437, 34.0522], zoom: 11, tags: ['city', 'usa'] },
]

export const FALLBACK_CENTER: [number, number] = [77.1025, 28.7041]