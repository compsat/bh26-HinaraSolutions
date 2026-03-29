import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// This function was created using Generative AI
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
