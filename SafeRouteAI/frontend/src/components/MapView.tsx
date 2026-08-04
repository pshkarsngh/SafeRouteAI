"use client";

import { GoogleMap, LoadScript, Marker, Polyline } from "@react-google-maps/api";

const containerStyle = { width: "100%", height: "400px" };
const defaultCenter = { lat: 12.9716, lng: 77.5946 };

interface Props {
  center?: { lat: number; lng: number };
  routes?: { polyline: string; color: string }[];
  selectedRoute?: number;
}

export default function MapView({ center, routes, selectedRoute = 0 }: Props) {
  const mapCenter = center || defaultCenter;
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

  if (!apiKey || apiKey === "your_key_here") {
    return (
      <div className="glass mb-6 flex h-[400px] items-center justify-center overflow-hidden rounded-2xl">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-info/10">
            <svg className="h-8 w-8 text-info" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <p className="text-sm font-medium text-text">Map Preview</p>
          <p className="mt-1 text-xs text-muted">
            Add{" "}
            <code className="rounded bg-surface-light px-1.5 py-0.5 text-[10px]">NEXT_PUBLIC_GOOGLE_MAPS_KEY</code>{" "}
            to .env.local
          </p>
        </div>
      </div>
    );
  }

  const routeColors = ["#00d4aa", "#3b82f6", "#f59e0b"];

  return (
    <div className="glass mb-6 overflow-hidden rounded-2xl">
      <LoadScript googleMapsApiKey={apiKey}>
        <GoogleMap mapContainerStyle={containerStyle} center={mapCenter} zoom={13}>
          <Marker position={mapCenter} />
          {routes?.map((r, i) => (
            <Polyline
              key={i}
              path={decodePath(r.polyline)}
              options={{
                strokeColor: i === selectedRoute ? routeColors[i] : "#6b6b8d",
                strokeWeight: i === selectedRoute ? 5 : 3,
                strokeOpacity: i === selectedRoute ? 1 : 0.4,
              }}
            />
          ))}
        </GoogleMap>
      </LoadScript>
    </div>
  );
}

function decodePath(encoded: string): { lat: number; lng: number }[] {
  const points: { lat: number; lng: number }[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    for (const modifier of [1, -1]) {
      let shift = 0;
      let result = 0;
      while (true) {
        const b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
        if (b < 0x20) break;
      }
      lat += modifier === 1 ? result : ~result + 1;
    }

    let shift2 = 0;
    let result2 = 0;
    while (true) {
      const b = encoded.charCodeAt(index++) - 63;
      result2 |= (b & 0x1f) << shift2;
      shift2 += 5;
      if (b < 0x20) break;
    }
    lng += result2;

    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }

  return points;
}
