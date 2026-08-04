"use client";

import { useMemo } from "react";
import { Shield, AlertTriangle, TrendingUp, Info } from "lucide-react";
import { motion } from "framer-motion";
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
} from "recharts";
import type { IncidentInfo } from "@/types";

interface Props {
  score: number | null;
  explanation: string;
  incidents?: IncidentInfo[] | null;
}

export default function SafetyScore({ score, explanation, incidents }: Props) {
  const scoreMeta = useMemo(() => {
    if (score === null) return { color: "#6b6b8d", label: "Not Evaluated", ring: "#2a2a45" };
    if (score >= 80) return { color: "#00d4aa", label: "Excellent", ring: "#00d4aa" };
    if (score >= 60) return { color: "#22c55e", label: "Good", ring: "#22c55e" };
    if (score >= 40) return { color: "#f59e0b", label: "Moderate", ring: "#f59e0b" };
    return { color: "#ef4444", label: "Unsafe", ring: "#ef4444" };
  }, [score]);

  const chartData = [
    {
      name: "Safety",
      value: score ?? 0,
      fill: scoreMeta.color,
    },
  ];

  const incCount = incidents?.length ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass rounded-2xl p-6"
    >
      <div className="mb-5 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
          <Shield className="h-4.5 w-4.5 text-primary" />
        </div>
        <div>
          <h3 className="text-base font-bold text-text">Safety Score</h3>
          <p className="text-xs text-muted">AI-powered route assessment</p>
        </div>
      </div>

      {/* Score Circle */}
      <div className="relative mx-auto mb-4 h-48 w-48">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="70%"
            outerRadius="100%"
            barSize={12}
            data={chartData}
            startAngle={90}
            endAngle={-270}
          >
            <RadialBar
              dataKey="value"
              cornerRadius={6}
              background={{ fill: "#1a1a2e" }}
              max={100}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-4xl font-extrabold"
            style={{ color: scoreMeta.color }}
          >
            {score !== null ? Math.round(score) : "--"}
          </span>
          <span className="mt-0.5 text-xs font-semibold uppercase tracking-wider" style={{ color: scoreMeta.color }}>
            {scoreMeta.label}
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div className="mb-5 flex items-center justify-center gap-4">
        {incCount > 0 && (
          <div className="flex items-center gap-1.5 rounded-lg bg-moderate/10 px-3 py-1.5 text-xs font-medium text-moderate">
            <AlertTriangle className="h-3 w-3" />
            {incCount} incident{incCount > 1 ? "s" : ""}
          </div>
        )}
        {score !== null && score >= 70 && (
          <div className="flex items-center gap-1.5 rounded-lg bg-safe/10 px-3 py-1.5 text-xs font-medium text-safe">
            <TrendingUp className="h-3 w-3" />
            Route Recommended
          </div>
        )}
      </div>

      {/* Explanation */}
      {explanation && (
        <div className="rounded-xl border-l-4 border-primary/40 bg-primary/5 p-4">
          <div className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-text">
            <Info className="h-3.5 w-3.5 text-primary" />
            AI Explanation
          </div>
          <p className="text-sm leading-relaxed text-text-dim">{explanation}</p>
        </div>
      )}
    </motion.div>
  );
}
