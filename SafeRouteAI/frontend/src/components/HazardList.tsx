"use client";

import { AlertTriangle, Info, XCircle, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import type { HazardInfo } from "@/types";

interface Props {
  hazards: HazardInfo[] | null;
}

const severityConfig = {
  critical: {
    icon: XCircle,
    bg: "bg-unsafe/10",
    border: "border-unsafe/20",
    text: "text-unsafe",
    dot: "bg-unsafe",
    label: "Critical",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-moderate/10",
    border: "border-moderate/20",
    text: "text-moderate",
    dot: "bg-moderate",
    label: "Warning",
  },
  info: {
    icon: Info,
    bg: "bg-info/10",
    border: "border-info/20",
    text: "text-info",
    dot: "bg-info",
    label: "Info",
  },
};

export default function HazardList({ hazards }: Props) {
  if (!hazards || hazards.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass rounded-2xl p-6"
      >
        <div className="mb-4 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-safe/10">
            <AlertTriangle className="h-4.5 w-4.5 text-safe" />
          </div>
          <div>
            <h3 className="text-base font-bold text-text">Hazards</h3>
            <p className="text-xs text-muted">Road condition analysis</p>
          </div>
        </div>
        <div className="flex flex-col items-center py-8 text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-safe/10">
            <svg className="h-7 w-7 text-safe" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm font-medium text-text">No hazards detected</p>
          <p className="mt-1 text-xs text-muted">This route appears to be clear</p>
        </div>
      </motion.div>
    );
  }

  const grouped = hazards.reduce(
    (acc, h) => {
      const key = h.severity;
      if (!acc[key]) acc[key] = [];
      acc[key].push(h);
      return acc;
    },
    {} as Record<string, HazardInfo[]>
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass rounded-2xl p-6"
    >
      <div className="mb-5 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-moderate/10">
          <AlertTriangle className="h-4.5 w-4.5 text-moderate" />
        </div>
        <div>
          <h3 className="text-base font-bold text-text">
            Hazards Detected
            <span className="ml-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-moderate/10 px-1.5 text-xs font-bold text-moderate">
              {hazards.length}
            </span>
          </h3>
          <p className="text-xs text-muted">Road condition analysis</p>
        </div>
      </div>

      <div className="space-y-3">
        {(["critical", "warning", "info"] as const).map((sev) => {
          const items = grouped[sev];
          if (!items || items.length === 0) return null;
          const cfg = severityConfig[sev];
          const Icon = cfg.icon;

          return (
            <div key={sev}>
              <div className="mb-2 flex items-center gap-2">
                <div className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                <span className={`text-xs font-semibold uppercase tracking-wider ${cfg.text}`}>
                  {cfg.label} ({items.length})
                </span>
              </div>
              <div className="space-y-2">
                {items.map((h, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`flex items-start gap-3 rounded-xl border ${cfg.border} ${cfg.bg} p-3`}
                  >
                    <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${cfg.bg}`}>
                      <Icon className={`h-3.5 w-3.5 ${cfg.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-text">{h.type}</h4>
                        {h.confidence > 0 && (
                          <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-muted">
                            {Math.round(h.confidence * 100)}%
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-muted line-clamp-2">{h.description}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted/50" />
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
