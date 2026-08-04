"use client";

import { Shield, Clock, MapPin, AlertTriangle, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import type { RouteAlternative } from "@/types";

interface Props {
  routes: RouteAlternative[] | null;
  selectedIndex: number;
  onSelect: (index: number) => void;
}

export default function RouteAlternatives({ routes, selectedIndex, onSelect }: Props) {
  if (!routes || routes.length === 0) return null;

  const maxScore = Math.max(...routes.map((r) => r.safety_score));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass rounded-2xl p-6"
    >
      <div className="mb-5 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-info/10">
          <MapPin className="h-4.5 w-4.5 text-info" />
        </div>
        <div>
          <h3 className="text-base font-bold text-text">Route Alternatives</h3>
          <p className="text-xs text-muted">{routes.length} routes compared by safety & time</p>
        </div>
      </div>

      <div className="space-y-3">
        {routes.map((r, i) => {
          const isSelected = selectedIndex === i;
          const isBest = r.safety_score === maxScore;
          const safetyPct = r.safety_score;

          return (
            <motion.button
              key={i}
              onClick={() => onSelect(i)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className={`w-full rounded-xl border-2 p-4 text-left transition-all ${
                isSelected
                  ? "border-primary bg-primary/5 shadow-lg shadow-primary/5"
                  : "border-border hover:border-border-light hover:bg-card-hover/50"
              }`}
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-extrabold ${
                      isSelected
                        ? "bg-primary text-dark"
                        : "bg-surface-light text-text-dim"
                    }`}
                  >
                    {i + 1}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-text">
                      Route {i + 1}
                      {isBest && (
                        <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-safe/10 px-2 py-0.5 text-[10px] font-bold text-safe">
                          <CheckCircle2 className="h-2.5 w-2.5" /> SAFEST
                        </span>
                      )}
                    </h4>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-extrabold" style={{ color: getScoreColor(r.safety_score) }}>
                    {Math.round(r.safety_score)}
                  </div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                    safety
                  </div>
                </div>
              </div>

              {/* Safety bar */}
              <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-light">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${safetyPct}%` }}
                  transition={{ duration: 0.8, delay: i * 0.1 }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: getScoreColor(r.safety_score) }}
                />
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-dim">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-info" /> {r.duration}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-primary" /> {r.distance}
                </span>
                <span className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-moderate" /> {r.hazards} hazard{r.hazards !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Hazard summary */}
              {r.hazard_summary && Object.keys(r.hazard_summary).length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {Object.entries(r.hazard_summary).map(([name, info]) => (
                    <span
                      key={name}
                      className="rounded-md bg-surface-light px-2 py-0.5 text-[10px] font-medium text-text-dim capitalize"
                    >
                      {name}: {info.count}
                    </span>
                  ))}
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

function getScoreColor(score: number): string {
  if (score >= 80) return "#00d4aa";
  if (score >= 60) return "#22c55e";
  if (score >= 40) return "#f59e0b";
  return "#ef4444";
}
