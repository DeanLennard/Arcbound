// safeImageSrc.ts
export function safeImageSrc(input?: string | null): string | null {
    if (!input) return null;
    const src = input.trim();
    if (!src) return null;

    // reject common bad sentinels
    if (src === "null" || src === "undefined") return null;

    if (src.startsWith("/")) return src;
    if (src.startsWith("http://") || src.startsWith("https://")) return src;
    if (src.startsWith("uploads/")) return `/${src}`;
    return null;
}
