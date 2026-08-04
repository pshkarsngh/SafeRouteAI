"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, Menu, X } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { path: "/", label: "Home" },
    { path: "/planner", label: "Planner" },
    { path: "/about", label: "About" },
  ];

  return (
    <nav className="glass sticky top-0 z-50 border-b border-border px-6 py-4">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 transition-all group-hover:bg-primary/20 group-hover:shadow-lg group-hover:shadow-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <span className="text-lg font-extrabold tracking-tight text-text">
            Safe<span className="gradient-text">Route</span>AI
          </span>
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.path}
              href={l.path}
              className={`relative rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                pathname === l.path
                  ? "text-primary"
                  : "text-text-dim hover:text-text hover:bg-white/5"
              }`}
            >
              {l.label}
              {pathname === l.path && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute inset-x-0 -bottom-[17px] h-0.5 bg-primary"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </Link>
          ))}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg p-2 text-text-dim hover:bg-white/5 md:hidden"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden md:hidden"
          >
            <div className="flex flex-col gap-1 pt-4">
              {links.map((l) => (
                <Link
                  key={l.path}
                  href={l.path}
                  onClick={() => setMobileOpen(false)}
                  className={`rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                    pathname === l.path
                      ? "bg-primary/10 text-primary"
                      : "text-text-dim hover:bg-white/5 hover:text-text"
                  }`}
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
