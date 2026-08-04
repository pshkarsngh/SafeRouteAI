"use client";

import { Shield, Bot, Map, AlertTriangle, Users, BookOpen, Github } from "lucide-react";
import { motion } from "framer-motion";

const team = [
  { name: "Keerti Gooliyavar", role: "ML & Backend" },
  { name: "MR Nishitha", role: "Research & Testing" },
  { name: "Pruthvi Mudnur", role: "Frontend & UI" },
  { name: "Pushkar Singh Baghel", role: "Backend & Integration" },
];

const features = [
  { icon: Map, title: "Route Generation", desc: "Google Maps API generates multiple route options with polyline decoding" },
  { icon: AlertTriangle, title: "Hazard Detection", desc: "YOLOv8 detects potholes, cracks, waterlogging, road damage, uneven surfaces" },
  { icon: Shield, title: "Safety Scoring", desc: "Mathematical formula (Eq. 3-6) evaluates hazard density, severity, recency" },
  { icon: Bot, title: "LLM Integration", desc: "Natural language preference parsing and explainable route recommendations" },
];

const techStack = [
  { category: "Frontend", items: ["Next.js 16", "TypeScript", "Tailwind CSS v4", "Three.js", "GSAP", "Framer Motion", "Recharts"] },
  { category: "Backend", items: ["FastAPI", "Python 3.12", "Pydantic v2", "Motor (MongoDB)", "LangChain"] },
  { category: "ML/CV", items: ["YOLOv8", "PyTorch", "OpenCV", "Pillow", "NumPy"] },
  { category: "Infrastructure", items: ["Docker", "MongoDB", "Google Maps API", "GPT-4o-mini / Gemini"] },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <BookOpen className="h-8 w-8 text-primary" />
        </div>
        <h1 className="mb-3 text-3xl font-extrabold text-text">
          About SafeRoute <span className="gradient-text">AI</span>
        </h1>
        <p className="mx-auto max-w-2xl leading-relaxed text-muted">
          An intelligent navigation system that integrates computer vision-based hazard detection
          with LLM-based explanation modules on top of traditional path planning algorithms.
        </p>
      </motion.div>

      {/* Abstract */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-2xl p-8"
      >
        <h2 className="mb-4 text-xl font-bold text-text">Abstract</h2>
        <p className="text-sm leading-relaxed text-text-dim">
          Common navigation systems like Google Maps focus only on optimizing travel time and distance
          without considering road conditions. In India, cracks, potholes, wet patches, and rough
          roads are what travelers care about most, but such factors are not considered in conventional
          navigation. SafeRoute AI combines a computer vision-based hazard detection system with an
          LLM-based explanation module on top of traditional path planning. We use Google Maps
          Directions API to retrieve multiple routes, divide each into segments, assign scores using
          a YOLOv8 hazard detection model, then combine segment scores into a Safety Score added to
          the time/distance cost for ranking. The LLM is invoked twice: once for parsing unstructured
          user inputs and once for providing justification of the selected route.
        </p>
      </motion.section>

      {/* Features */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="mb-6 text-xl font-bold text-text">Core Components</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {features.map((f) => (
            <div key={f.title} className="glass glass-hover rounded-2xl p-6 transition-all">
              <div className="mb-3 inline-flex rounded-xl bg-primary/10 p-3">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mb-1.5 font-bold text-text">{f.title}</h3>
              <p className="text-sm text-muted">{f.desc}</p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Tech Stack */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass rounded-2xl p-8"
      >
        <h2 className="mb-6 text-xl font-bold text-text">Technology Stack</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {techStack.map((cat) => (
            <div key={cat.category}>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-primary">{cat.category}</h3>
              <div className="space-y-2">
                {cat.items.map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm text-text-dim">
                    <div className="h-1 w-1 rounded-full bg-primary" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Safety Formula */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass rounded-2xl p-8"
      >
        <h2 className="mb-4 text-xl font-bold text-text">Safety Scoring Formula</h2>
        <div className="rounded-xl bg-surface-light p-6 font-mono text-sm text-text-dim">
          <p className="mb-2"><span className="text-primary">Eq (3):</span> Hi,j = Σ γcm · wm · pm</p>
          <p className="mb-2"><span className="text-primary">Eq (4):</span> Hi = (1/Ni) · Σ Hi,j</p>
          <p className="mb-2"><span className="text-primary">Eq (5):</span> SafetyScore(ri) = 100 · e^(-λ · Hi)</p>
          <p><span className="text-primary">Eq (6):</span> Rank(ri) = α · SafetyScore(ri) + (1-α) · 100 · tmin/ti</p>
        </div>
        <p className="mt-4 text-sm text-muted">
          Where γc is the class weight, wm is the severity weight, pm is the confidence,
          λ = 0.15 (empirical), and α balances safety vs time priority.
        </p>
      </motion.section>

      {/* Team */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h2 className="mb-6 text-xl font-bold text-text">Team</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {team.map((m) => (
            <div key={m.name} className="glass glass-hover rounded-2xl p-5 text-center transition-all">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <h4 className="text-sm font-bold text-text">{m.name}</h4>
              <p className="mt-0.5 text-xs text-muted">{m.role}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-sm italic text-muted">
          Guide: Mrs. Vidya, Senior Assistant Professor, Dept. of CSE, AIET Mangalore
        </p>
      </motion.section>
    </div>
  );
}
