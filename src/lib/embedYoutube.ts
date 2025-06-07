// src/lib/embedYoutube.ts

export function embedYouTube(content: string): string {
    // Split by new lines to ensure we're replacing line-by-line.
    return content.split('\n').map(line => {
        // Check if the line looks like a bare YouTube URL.
        const youtubeRegex = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})(?:\S*)?$/;

        const match = line.match(youtubeRegex);
        if (match) {
            const videoId = match[1];
            return `
                <div class="youtube-embed">
                    <iframe
                        width="560"
                        height="315"
                        src="https://www.youtube.com/embed/${videoId}"
                        frameborder="0"
                        allowfullscreen
                    ></iframe>
                </div>
            `;
        }

        return line; // Leave other lines untouched.
    }).join('\n');
}
