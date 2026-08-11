import type { Metadata } from "next";

import "./globals.css";

import { PreloaderProvider } from "@/components/preloader";

export const metadata: Metadata = {
  title: "Navora",
  description: "Built with Next.js 16, React 19, and TypeScript",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <PreloaderProvider>
          {children}
        </PreloaderProvider>
      </body>
    </html>
  );
}