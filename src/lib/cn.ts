import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// ui-skills: must use `cn` for class logic.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

