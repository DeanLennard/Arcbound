// lib/colors.ts
export function metricColor(value: number) {
    if (value >= 10) return '#22c55e'  // tailwind-green-500
    if (value >= 5)  return '#f59e0b'  // tailwind-amber-500
    return             '#ef4444'      // tailwind-red-500
}
