import { Shield, Github, ExternalLink } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface-light mt-auto">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm font-bold text-text">
              Safe<span className="gradient-text">Route</span>AI
            </span>
          </div>

          <p className="text-center text-xs text-muted md:text-left">
            Intelligent Road Safety Navigation using Computer Vision, LLMs & Google Maps API
          </p>

          <div className="flex items-center gap-4 text-xs text-muted">
            <span>&copy; 2026 SafeRoute AI</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
