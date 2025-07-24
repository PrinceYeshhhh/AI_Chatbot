// Utility for merging class names (like clsx)
export function cn(...args: any[]): string {
  return args.filter(Boolean).join(' ');
} 