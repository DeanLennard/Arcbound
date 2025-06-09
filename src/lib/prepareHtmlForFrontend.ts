// src/lib/prepareHtmlForFrontend.ts

export function prepareHtmlForFrontend(content: string): string {
    const processed = content.replace(/<p><\/p>/g, '<p>&nbsp;</p>');
    return processed;
}
