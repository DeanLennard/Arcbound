// src/lib/safeImageSrc.ts
export function safeImageSrc(input?: string | null): string | null {
    if (!input) return null;

    const src = input.trim();
    if (!src) return null;

    // Allow local public files e.g. "/uploads/..."
    if (src.startsWith("/")) return src;

    // Allow absolute URLs (if you use them and have next.config images.remotePatterns set)
    if (src.startsWith("http://") || src.startsWith("https://")) return src;

    // Fix common case: "uploads/xyz.png" -> "/uploads/xyz.png"
    if (src.startsWith("uploads/")) return `/${src}`;

    // Otherwise treat as invalid (prevents next/image from throwing)
    return null;
}
