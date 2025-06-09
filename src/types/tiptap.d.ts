// src/types/tiptap.d.ts
import '@tiptap/core';

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        youTubeEmbed: {
            setYouTubeEmbed: (src: string) => ReturnType;
        };
    }
}
