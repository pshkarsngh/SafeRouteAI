"use client";

import { useState, type FormEvent } from "react";
import { Search, MapPin, Navigation, Sparkles, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import type { RouteFormData } from "@/types";

interface Props {
  onSearch: (data: RouteFormData) => void;
  loading: boolean;
}

const suggestions = [
  "Avoid potholes",
  "Take the safest route",
  "Avoid waterlogged roads",
  "Shortest path, moderate safety",
];

export default function RouteInput({ onSearch, loading }: Props) {
  const [start, setStart] = useState("");
  const [destination, setDestination] = useState("");
  const [preferences, setPreferences] = useState("");
  const [activeSuggestion, setActiveSuggestion] = useState<number | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!start.trim() || !destination.trim()) return;
    onSearch({ start: start.trim(), destination: destination.trim(), preferences: preferences.trim() });
  };

  const applySuggestion = (s: string) => {
    setPreferences(s);
    setActiveSuggestion(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-6 md:p-8"
    >
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Navigation className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-text">Plan Your Safe Route</h2>
          <p className="text-xs text-muted">AI-powered road safety analysis</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="relative">
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-text-dim">
              <MapPin className="h-3 w-3 text-primary" /> Start Location
            </label>
            <input
              type="text"
              placeholder="e.g. Bangalore City Railway Station"
              className="w-full rounded-xl border border-border bg-surface-light px-4 py-3 text-sm text-text placeholder:text-muted focus:border-primary focus:outline-none"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              required
            />
          </div>
          <div className="relative">
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-text-dim">
              <Navigation className="h-3 w-3 text-info" /> Destination
            </label>
            <input
              type="text"
              placeholder="e.g. MG Road, Bangalore"
              className="w-full rounded-xl border border-border bg-surface-light px-4 py-3 text-sm text-text placeholder:text-muted focus:border-primary focus:outline-none"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-text-dim">
            <Sparkles className="h-3 w-3 text-moderate" /> Preferences
            <span className="font-normal normal-case text-muted">(natural language)</span>
          </label>
          <textarea
            placeholder='e.g. "avoid roads with potholes" or "choose safest road even if longer"'
            className="w-full rounded-xl border border-border bg-surface-light px-4 py-3 text-sm text-text placeholder:text-muted focus:border-primary focus:outline-none"
            rows={2}
            value={preferences}
            onChange={(e) => setPreferences(e.target.value)}
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {suggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => applySuggestion(s)}
                className={`rounded-full border px-3 py-1 text-xs transition-all ${
                  activeSuggestion === i || preferences === s
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-text-dim hover:border-border-light hover:text-text"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !start.trim() || !destination.trim()}
          className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-dark transition-all hover:bg-primary-light hover:shadow-lg hover:shadow-primary/20 disabled:cursor-not-allowed disabled:opacity-40 md:w-auto"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing Routes...
            </>
          ) : (
            <>
              <Search className="h-4 w-4" />
              Find Safe Route
            </>
          )}
        </button>
      </form>
    </motion.div>
  );
}
