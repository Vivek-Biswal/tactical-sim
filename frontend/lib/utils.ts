import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { CommsStatus, MapStatus } from "../types/scenario";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatSimTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function getCommsStatusColor(status: CommsStatus) {
  switch (status) {
    case "normal":
      return {
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/40",
        text: "text-emerald-400",
        dot: "bg-emerald-500",
        glow: "shadow-[0_0_12px_rgba(16,185,129,0.3)]",
        label: "NORMAL"
      };
    case "delayed":
      return {
        bg: "bg-amber-500/10",
        border: "border-amber-500/40",
        text: "text-amber-400",
        dot: "bg-amber-500",
        glow: "shadow-[0_0_12px_rgba(245,158,11,0.3)]",
        label: "DELAYED"
      };
    case "degraded":
      return {
        bg: "bg-orange-500/10",
        border: "border-orange-500/40",
        text: "text-orange-400",
        dot: "bg-orange-500",
        glow: "shadow-[0_0_12px_rgba(249,115,22,0.3)]",
        label: "DEGRADED"
      };
    case "offline":
      return {
        bg: "bg-rose-500/10",
        border: "border-rose-500/40",
        text: "text-rose-400",
        dot: "bg-rose-500",
        glow: "shadow-[0_0_12px_rgba(244,63,94,0.3)]",
        label: "OFFLINE"
      };
  }
}

export function getMapStatusColor(status: MapStatus) {
  switch (status) {
    case "current":
      return {
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/40",
        text: "text-emerald-400",
        dot: "bg-emerald-500",
        label: "CURRENT"
      };
    case "outdated":
      return {
        bg: "bg-amber-500/10",
        border: "border-amber-500/40",
        text: "text-amber-400",
        dot: "bg-amber-500",
        label: "OUTDATED"
      };
    case "unavailable":
      return {
        bg: "bg-rose-500/10",
        border: "border-rose-500/40",
        text: "text-rose-400",
        dot: "bg-rose-500",
        label: "UNAVAILABLE"
      };
  }
}
