// src/lib/prepareHtmlForFrontend.ts

export function prepareHtmlForFrontend(content: string): string {
    let processed = content
        // Replace any <p …>…</p> where there's no inner content with a non-breaking space
        .replace(
            /<p([^>]*)>\s*<\/p>/g,
            (_match, attrs) => `<p${attrs}>&nbsp;</p>`
        );

    // Inject a class and onclick handler for lightbox
    processed = processed.replace(
        /<img /g,
        '<img class="lightbox-image cursor-pointer" onclick="handleImageClick(this.src)" '
    );

    return processed;
}
