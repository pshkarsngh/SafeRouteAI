"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "framer-motion";
import {
  Shield,
  Map,
  AlertTriangle,
  Bot,
  ArrowRight,
  ChevronRight,
  Zap,
  Eye,
  Brain,
  BarChart3,
  CheckCircle2,
} from "lucide-react";
import ThreeParticles from "@/components/ThreeParticles";
import FloatingShield from "@/components/FloatingShield";
import AnimatedSection from "@/components/AnimatedSection";
import ErrorBoundary from "@/components/ErrorBoundary";

gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    icon: Map,
    title: "Multi-Route Generation",
    desc: "Google Maps API generates multiple route options with polyline decoding and segmentation for granular analysis.",
    color: "from-blue-500 to-cyan-400",
    stat: "3+",
    statLabel: "routes compared",
  },
  {
    icon: Eye,
    title: "Computer Vision Detection",
    desc: "YOLOv8 model detects 5 hazard types: potholes, cracks, damaged roads, waterlogging, and uneven surfaces.",
    color: "from-amber-500 to-orange-400",
    stat: "87.3%",
    statLabel: "mAP@0.5",
  },
  {
    icon: Shield,
    title: "Safety Score Engine",
    desc: "Mathematical scoring formula (paper Eq. 3-6) combining hazard density, severity weights, and recency factors.",
    color: "from-emerald-500 to-teal-400",
    stat: "0-100",
    statLabel: "score range",
  },
  {
    icon: Brain,
    title: "LLM-Powered Intelligence",
    desc: "Natural language preference parsing and explainable route recommendations using GPT-4o-mini or Gemini.",
    color: "from-violet-500 to-purple-400",
    stat: "2x",
    statLabel: "LLM calls",
  },
];

const steps = [
  {
    num: "01",
    title: "Enter Your Trip",
    desc: "Type start and destination. Add preferences like 'avoid potholes' in natural language.",
    icon: Map,
  },
  {
    num: "02",
    title: "AI Fetches & Segments Routes",
    desc: "Multiple routes from Google Maps are divided into 300m segments for analysis.",
    icon: Zap,
  },
  {
    num: "03",
    title: "Vision Detects Hazards",
    desc: "YOLOv8 scans each segment for potholes, cracks, waterlogging, and road damage.",
    icon: Eye,
  },
  {
    num: "04",
    title: "Score, Rank & Explain",
    desc: "Routes are scored and ranked. LLM provides a human-readable explanation of the recommendation.",
    icon: BarChart3,
  },
];

const stats = [
  { value: "5", label: "Hazard Classes", icon: AlertTriangle },
  { value: "300m", label: "Segment Length", icon: Map },
  { value: "<4s", label: "Analysis Time", icon: Zap },
  { value: "100", label: "Max Safety Score", icon: Shield },
];

export default function LandingPage() {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [counters, setCounters] = useState({ routes: 0, hazards: 0, score: 0 });

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (titleRef.current) {
        gsap.fromTo(
          titleRef.current.querySelectorAll(".word"),
          { y: 60, opacity: 0, rotateX: -60 },
          { y: 0, opacity: 1, rotateX: 0, duration: 0.8, stagger: 0.1, ease: "back.out(1.4)" }
        );
      }
    });
    return () => ctx.revert();
  }, []);

  // Animate stats on scroll
  useEffect(() => {
    const timer = setTimeout(() => {
      setCounters({ routes: 3, hazards: 12, score: 94 });
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-0">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-dark via-dark-light to-dark px-8 py-24 text-white sm:px-16">
        <ErrorBoundary>
          <ThreeParticles />
        </ErrorBoundary>
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary/8 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-info/5 blur-[100px]" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative mx-auto max-w-4xl text-center"
        >
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2 text-xs font-medium text-primary backdrop-blur-sm"
          >
            <Shield className="h-3.5 w-3.5" /> Intelligent Road Safety Navigation
          </motion.div>

          <h1
            ref={titleRef}
            className="mb-6 text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl"
          >
            {"Navigate with Safety First".split(" ").map((word, i) => (
              <span key={i} className="word mr-[0.25em] inline-block">
                {word === "Safety" ? (
                  <span className="gradient-text">{word}</span>
                ) : (
                  word
                )}{" "}
              </span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7 }}
            className="mx-auto mb-10 max-w-2xl text-base leading-relaxed text-gray-400"
          >
            SafeRoute AI combines Google Maps, YOLOv8 computer vision, and Large Language Models
            to recommend the safest routes. Avoid potholes, waterlogging, and hazardous roads
            with AI-powered intelligence.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
          >
            <Link
              href="/planner"
              className="group flex items-center gap-2.5 rounded-xl bg-primary px-8 py-4 text-sm font-bold text-dark transition-all hover:bg-primary-light hover:shadow-xl hover:shadow-primary/20"
            >
              Plan Your Safe Route
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/about"
              className="flex items-center gap-2 rounded-xl border border-white/10 px-8 py-4 text-sm font-medium text-gray-400 transition-all hover:border-white/20 hover:text-white"
            >
              Learn More
            </Link>
          </motion.div>

          {/* Floating stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4"
          >
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4 + i * 0.1 }}
                className="rounded-xl border border-white/5 bg-white/5 p-4 backdrop-blur-sm"
              >
                <s.icon className="mb-2 h-4 w-4 text-primary" />
                <div className="text-2xl font-extrabold text-white">{s.value}</div>
                <div className="text-[11px] text-gray-500">{s.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* FEATURES */}
      <AnimatedSection className="mt-20" from="fade">
        <div className="mb-12 text-center">
          <h2 className="text-2xl font-extrabold text-text sm:text-3xl">
            Why SafeRoute <span className="gradient-text">AI</span>?
          </h2>
          <p className="mt-3 text-sm text-muted">
            Traditional navigation only cares about time. We care about your safety.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              whileHover={{ y: -6, scale: 1.02 }}
              className="glass glass-hover group cursor-pointer rounded-2xl p-6 transition-all"
            >
              <div
                className={`mb-4 inline-flex rounded-xl bg-gradient-to-br ${f.color} p-3 shadow-lg`}
              >
                <f.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="mb-2 text-base font-bold text-text">{f.title}</h3>
              <p className="mb-4 text-sm leading-relaxed text-muted">{f.desc}</p>
              <div className="border-t border-border pt-3">
                <div className="text-xl font-extrabold gradient-text">{f.stat}</div>
                <div className="text-[11px] text-muted">{f.statLabel}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </AnimatedSection>

      {/* HOW IT WORKS */}
      <AnimatedSection className="mt-24" from="bottom">
        <div className="mb-12 text-center">
          <h2 className="text-2xl font-extrabold text-text sm:text-3xl">
            How It <span className="gradient-text">Works</span>
          </h2>
          <p className="mt-3 text-sm text-muted">
            From query to recommendation in four intelligent steps.
          </p>
        </div>

        <div className="relative">
          <div className="absolute left-8 top-0 hidden h-full w-px bg-gradient-to-b from-primary/40 via-primary/20 to-transparent lg:block" />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
            {steps.map((s, i) => (
              <motion.div
                key={s.num}
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: i * 0.12, duration: 0.5 }}
                whileHover={{ scale: 1.02 }}
                className="group relative pl-16 lg:pl-0 lg:text-center"
              >
                <div className="absolute left-0 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-light text-lg font-extrabold text-dark shadow-lg shadow-primary/20 transition-transform group-hover:scale-110 lg:relative lg:mx-auto lg:mb-5">
                  {s.num}
                </div>
                <div className="mb-2 flex items-center gap-2 lg:justify-center">
                  <s.icon className="h-4 w-4 text-primary" />
                  <h3 className="text-base font-bold text-text">{s.title}</h3>
                </div>
                <p className="text-sm leading-relaxed text-muted">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* TECH STACK */}
      <AnimatedSection className="mt-24" from="fade">
        <div className="glass rounded-3xl p-8 md:p-12">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-extrabold text-text sm:text-3xl">
              Built with <span className="gradient-text">Modern Tech</span>
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { name: "YOLOv8", desc: "Vision" },
              { name: "FastAPI", desc: "Backend" },
              { name: "Next.js", desc: "Frontend" },
              { name: "GPT-4o", desc: "LLM" },
              { name: "Google Maps", desc: "Routing" },
              { name: "MongoDB", desc: "Database" },
            ].map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex flex-col items-center rounded-xl border border-border bg-surface-light p-4 text-center transition-all hover:border-primary/30 hover:bg-card-hover"
              >
                <span className="text-sm font-bold text-text">{t.name}</span>
                <span className="text-[11px] text-muted">{t.desc}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* CTA */}
      <AnimatedSection className="mt-24 mb-8" from="bottom">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-dark via-dark-light to-dark px-8 py-16 text-center text-white sm:px-16">
          <ErrorBoundary>
            <FloatingShield />
          </ErrorBoundary>
          <div className="pointer-events-none absolute -right-20 top-1/2 h-48 w-48 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />

          <h2 className="relative mb-4 text-2xl font-extrabold sm:text-3xl">
            Ready to find the safest route?
          </h2>
          <p className="relative mx-auto mb-8 max-w-lg text-sm text-gray-400">
            Stop guessing which road is safe. Let AI analyze every segment and give you
            a clear, explainable recommendation.
          </p>
          <div className="relative">
            <Link
              href="/planner"
              className="group inline-flex items-center gap-2.5 rounded-xl bg-primary px-8 py-4 text-sm font-bold text-dark transition-all hover:bg-primary-light hover:shadow-xl hover:shadow-primary/20"
            >
              Get Started Free
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </AnimatedSection>
    </div>
  );
}
