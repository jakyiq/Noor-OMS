import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatIQD(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "IQD",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Strips all emojis, emoticons, pictographs, symbols and surrogate pairs using precise Unicode blocks.
 */
export function removeEmojis(str: string): string {
  if (!str) return "";
  // Using the /u (Unicode) flag correctly handles code points using \u{XXXXX} notation
  return str.replace(/[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
}

/**
 * Cleans textual name fields by stripping emojis and preventing any numeric digits (0-9 or Arabic ٠-٩).
 */
export function cleanNameInput(str: string): string {
  const noEmojis = removeEmojis(str);
  return noEmojis.replace(/[0-9٠-٩]/g, '');
}

/**
 * Cleans integer numeric inputs (prices, quantities, age) by stripping emojis and keeping only digits.
 */
export function cleanNumberOnlyInput(str: string): string {
  const noEmojis = removeEmojis(str);
  return noEmojis.replace(/[^0-9]/g, '');
}

/**
 * Cleans phone fields by keeping only digits and optional '+' prefix.
 */
export function cleanPhoneInput(str: string): string {
  const noEmojis = removeEmojis(str);
  return noEmojis.replace(/[^0-9+]/g, '');
}
