import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMontant(valeur: number): string {
  return `${valeur.toFixed(3)} DT`;
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("fr-TN");
}
