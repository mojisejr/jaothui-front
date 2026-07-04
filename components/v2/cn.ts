import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * cn — merge conditional class names and resolve Tailwind conflicts.
 * Shared helper for the v2 (dark-gold-green) primitives in components/v2.
 * Pairs with class-variance-authority for typed variant APIs.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
