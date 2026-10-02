import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "COMMAND-X | Multi-Domain Decision-Making Trainer",
  description:
    "Tactical military decision-making simulation under degraded, delayed, conflicting, and severed communication environments (Problem Statement 26248).",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full bg-[#070a11] text-slate-100 antialiased">
      <body className="min-h-full flex flex-col bg-[#070a11] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
        {children}
      </body>
    </html>
  );
}
