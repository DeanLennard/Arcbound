// src/lib/prepareHtmlForFrontend.ts

export function prepareHtmlForFrontend(content: string): string {
    let processed = content.replace(/<p><\/p>/g, '<p>&nbsp;</p>');
    return processed;
}
