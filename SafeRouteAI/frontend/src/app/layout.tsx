import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import QueryProvider from "@/components/QueryProvider";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "SafeRoute AI - Intelligent Road Safety Navigation",
  description:
    "SafeRoute AI combines computer vision, LLMs, and Google Maps to find the safest routes — not just the fastest.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="flex min-h-screen flex-col bg-surface">
        <QueryProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#16162a",
                color: "#e0e0f0",
                border: "1px solid #2a2a45",
              },
            }}
          />
          <Navbar />
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </main>
          <Footer />
        </QueryProvider>
      </body>
    </html>
  );
}
