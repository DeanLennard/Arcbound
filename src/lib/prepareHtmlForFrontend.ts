// src/lib/prepareHtmlForFrontend.ts

export function prepareHtmlForFrontend(content: string): string {
    let processed = content.replace(/<p><\/p>/g, '<p>&nbsp;</p>');

    // Inject a class and onclick handler for lightbox
    processed = processed.replace(
        /<img /g,
        '<img class="lightbox-image cursor-pointer" onclick="handleImageClick(this.src)" '
    );

    return processed;
}
