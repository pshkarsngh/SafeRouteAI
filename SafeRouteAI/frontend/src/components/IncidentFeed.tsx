"use client";

import { AlertTriangle, Info, XCircle, ExternalLink, Calendar, Newspaper } from "lucide-react";
import { motion } from "framer-motion";
import type { IncidentInfo } from "@/types";

interface Props {
  incidents: IncidentInfo[] | null | undefined;
}

const severityConfig = {
  critical: {
    icon: XCircle,
    bg: "bg-unsafe/10",
    border: "border-unsafe/20",
    text: "text-unsafe",
    dot: "bg-unsafe",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-moderate/10",
    border: "border-moderate/20",
    text: "text-moderate",
    dot: "bg-moderate",
  },
  info: {
    icon: Info,
    bg: "bg-info/10",
    border: "border-info/20",
    text: "text-info",
    dot: "bg-info",
  },
};

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffH = Math.round((now.getTime() - d.getTime()) / (1000 * 60 * 60));
    if (diffH < 1) return "Just now";
    if (diffH < 24) return `${diffH}h ago`;
    const diffD = Math.round(diffH / 24);
    if (diffD < 7) return `${diffD}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

export default function IncidentFeed({ incidents }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass rounded-2xl p-6"
    >
      <div className="mb-5 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-moderate/10">
          <Newspaper className="h-4.5 w-4.5 text-moderate" />
        </div>
        <div>
          <h3 className="text-base font-bold text-text">Incident Feed</h3>
          <p className="text-xs text-muted">
            {incidents && incidents.length > 0
              ? `${incidents.length} incident${incidents.length > 1 ? "s" : ""} found`
              : "Auto-updated every 6h"}
          </p>
        </div>
      </div>

      {!incidents || incidents.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-safe/10">
            <Newspaper className="h-6 w-6 text-safe" />
          </div>
          <p className="text-sm font-medium text-text">No recent incidents</p>
          <p className="mt-1 text-xs text-muted">No accidents or hazards reported along this route</p>
        </div>
      ) : (
        <div className="space-y-3">
          {incidents.map((inc, i) => {
            const cfg = severityConfig[inc.severity] || severityConfig.info;
            const Icon = cfg.icon;

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`rounded-xl border ${cfg.border} ${cfg.bg} p-4 transition-all hover:shadow-md`}
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${cfg.bg}`}>
                      <Icon className={`h-3.5 w-3.5 ${cfg.text}`} />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold leading-snug text-text">{inc.title}</h4>
                      <p className="mt-0.5 text-[11px] text-muted">{inc.source}</p>
                    </div>
                  </div>
                  <div className={`h-2 w-2 shrink-0 rounded-full ${cfg.dot}`} />
                </div>
                <p className="mb-3 text-xs leading-relaxed text-text-dim line-clamp-2">{inc.description}</p>
                <div className="flex items-center justify-between text-[11px] text-muted">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {formatDate(inc.date)}
                  </span>
                  {inc.url && (
                    <a
                      href={inc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 font-medium text-primary hover:underline"
                    >
                      Read more <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
