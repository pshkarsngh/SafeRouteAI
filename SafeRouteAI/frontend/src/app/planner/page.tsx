"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Route, Sparkles, Settings2, TrendingUp, AlertCircle, Wifi, WifiOff } from "lucide-react";
import dynamic from "next/dynamic";
import toast from "react-hot-toast";
import RouteInput from "@/components/RouteInput";
import SafetyScore from "@/components/SafetyScore";
import HazardList from "@/components/HazardList";
import RouteAlternatives from "@/components/RouteAlternatives";
import LoadingSpinner from "@/components/LoadingSpinner";
import IncidentFeed from "@/components/IncidentFeed";
import { geocode, checkRoute, healthCheck } from "@/services/api";
import type { RouteFormData, FullSafetyResponse } from "@/types";
import { useEffect } from "react";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

export default function PlannerPage() {
  const [searched, setSearched] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<FullSafetyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | undefined>();
  const [backendStatus, setBackendStatus] = useState<"checking" | "connected" | "disconnected">("checking");

  // Check backend health on mount
  useEffect(() => {
    healthCheck()
      .then(() => setBackendStatus("connected"))
      .catch(() => setBackendStatus("disconnected"));
  }, []);

  const handleSearch = useCallback(
    async (fd: RouteFormData) => {
      setSearched(true);
      setIsLoading(true);
      setError(null);
      setData(null);
      setSelectedRoute(0);

      const toastId = toast.loading("Geocoding locations...");

      try {
        // Step 1: Geocode start and destination
        const [startGeo, endGeo] = await Promise.all([
          geocode(fd.start),
          geocode(fd.destination),
        ]);

        toast.loading("Analyzing routes...", { id: toastId });

        const startCoord = { lat: startGeo.lat, lng: startGeo.lng };
        const endCoord = { lat: endGeo.lat, lng: endGeo.lng };

        setMapCenter({
          lat: (startCoord.lat + endCoord.lat) / 2,
          lng: (startCoord.lng + endCoord.lng) / 2,
        });

        // Step 2: Call the safety analysis API
        const result = await checkRoute(
          startCoord.lat,
          startCoord.lng,
          endCoord.lat,
          endCoord.lng,
          fd.preferences,
          startGeo.formatted_address || fd.start,
          endGeo.formatted_address || fd.destination
        );

        setData(result);
        toast.success(`Analysis complete! Safety score: ${result.safety_score ?? "--"}/100`, { id: toastId });
      } catch (err: any) {
        const msg = err?.message || "Failed to analyze route";
        setError(msg);
        toast.error(msg, { id: toastId });
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const handleSelectRoute = (index: number) => setSelectedRoute(index);

  const bestRoute = data?.alternatives?.[selectedRoute];
  const parsedPrefs = data?.user_preferences_parsed;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Backend status indicator */}
      <div className="flex justify-end">
        <div
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium ${
            backendStatus === "connected"
              ? "bg-safe/10 text-safe"
              : backendStatus === "disconnected"
              ? "bg-unsafe/10 text-unsafe"
              : "bg-muted/10 text-muted"
          }`}
        >
          {backendStatus === "connected" ? (
            <Wifi className="h-3 w-3" />
          ) : (
            <WifiOff className="h-3 w-3" />
          )}
          {backendStatus === "connected"
            ? "Backend connected"
            : backendStatus === "disconnected"
            ? "Backend offline"
            : "Checking..."}
        </div>
      </div>

      <RouteInput onSearch={handleSearch} loading={isLoading} />

      <AnimatePresence mode="wait">
        {!searched ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center py-24"
          >
            <div className="glass flex flex-col items-center rounded-3xl px-12 py-16 text-center">
              <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
                <Route className="h-10 w-10 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-text">Enter your route details</h3>
              <p className="max-w-sm text-sm text-muted">
                Provide start and destination points to find the safest path using AI-powered road analysis
              </p>

              <div className="mt-8 grid grid-cols-3 gap-4">
                {[
                  { icon: Settings2, label: "Analyze", desc: "Multiple routes" },
                  { icon: TrendingUp, label: "Score", desc: "Safety ranking" },
                  { icon: Sparkles, label: "Explain", desc: "AI reasoning" },
                ].map((f) => (
                  <div key={f.label} className="flex flex-col items-center rounded-xl border border-border bg-surface-light p-4">
                    <f.icon className="mb-2 h-5 w-5 text-primary" />
                    <span className="text-xs font-bold text-text">{f.label}</span>
                    <span className="text-[10px] text-muted">{f.desc}</span>
                  </div>
                ))}
              </div>

              {backendStatus === "disconnected" && (
                <div className="mt-6 flex items-center gap-2 rounded-xl border border-unsafe/20 bg-unsafe/5 px-4 py-3 text-xs text-unsafe">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  Backend server is not running. Start it with:{" "}
                  <code className="rounded bg-surface-light px-1.5 py-0.5 font-mono">uvicorn app.main:app --port 8000</code>
                </div>
              )}
            </div>
          </motion.div>
        ) : isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <MapView center={mapCenter} />
            <LoadingSpinner message="Analyzing route safety... Geocoding, fetching routes, detecting hazards." />
          </motion.div>
        ) : error ? (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="glass flex flex-col items-center rounded-2xl p-8 text-center"
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-unsafe/10">
              <AlertCircle className="h-7 w-7 text-unsafe" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-text">Analysis Failed</h3>
            <p className="mb-4 max-w-md text-sm text-muted">{error}</p>
            <button
              onClick={() => {
                setSearched(false);
                setError(null);
              }}
              className="rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-dark hover:bg-primary-light"
            >
              Try Again
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Parsed preferences badge */}
            {parsedPrefs && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass flex flex-wrap items-center gap-3 rounded-xl px-5 py-3"
              >
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold text-text">Parsed Preferences:</span>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  Safety weight: {Math.round((parsedPrefs.alpha ?? 0.5) * 100)}%
                </span>
                {parsedPrefs.avoidClasses?.map((c) => (
                  <span key={c} className="rounded-full bg-moderate/10 px-3 py-1 text-xs font-medium text-moderate capitalize">
                    Avoid {c}
                  </span>
                ))}
                <span className="rounded-full bg-info/10 px-3 py-1 text-xs font-medium text-info capitalize">
                  {parsedPrefs.priority}
                </span>
              </motion.div>
            )}

            <MapView center={mapCenter} />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <SafetyScore
                score={bestRoute?.safety_score ?? data?.safety_score ?? null}
                explanation={data?.explanation ?? ""}
                incidents={data?.incidents}
              />
              <HazardList hazards={data?.hazards ?? null} />
            </div>

            <RouteAlternatives
              routes={data?.alternatives ?? null}
              selectedIndex={selectedRoute}
              onSelect={handleSelectRoute}
            />

            <IncidentFeed incidents={data?.incidents} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
