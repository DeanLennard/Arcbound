// src/lib/linkify.tsx
import React from 'react';

export type LinkifyOptions = {
    className?: string;
    target?: string; // default: "_blank"
    rel?: string;    // default: "noopener noreferrer"
};

const URL_RE = /(https?:\/\/[^\s<]+)|(www\.[^\s<]+)/gi;
const TRAILING_PUNCT_RE = /[.,!?;:)\]]+$/;

export function linkifyText(text: string, opts: LinkifyOptions = {}): React.ReactNode {
    const { className, target = '_blank', rel = 'noopener noreferrer' } = opts;
    if (!text) return null;

    const nodes: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    // Use global exec loop so we can capture indices
    while ((match = URL_RE.exec(text)) !== null) {
        const fullMatch = match[0];
        const matchIndex = match.index;

        // push the text before the match
        if (matchIndex > lastIndex) {
            nodes.push(text.slice(lastIndex, matchIndex));
        }

        // trim trailing punctuation from matched url, but preserve it in the plain text
        let url = fullMatch;
        let trailing = '';
        const punctMatch = url.match(TRAILING_PUNCT_RE);
        if (punctMatch) {
            trailing = punctMatch[0];
            url = url.slice(0, url.length - trailing.length);
        }

        // if it starts with www., add https:// to the href
        const href = url.startsWith('http') ? url : `https://${url}`;

        nodes.push(
            <a
                key={`link-${matchIndex}-${nodes.length}`}
                href={href}
                target={target}
                rel={rel}
                className={className}
            >
                {url}
            </a>
        );

        // push trailing punctuation as plain text
        if (trailing) nodes.push(trailing);

        lastIndex = matchIndex + fullMatch.length;
    }

    // push remaining text
    if (lastIndex < text.length) {
        nodes.push(text.slice(lastIndex));
    }

    return <>{nodes}</>;
}
