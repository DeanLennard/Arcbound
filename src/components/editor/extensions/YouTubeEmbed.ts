// YouTubeEmbed.ts
import { Node, mergeAttributes } from '@tiptap/core';

export const YouTubeEmbed = Node.create({
    name: 'youtubeEmbed',  // important

    group: 'block',
    atom: true,

    addAttributes() {
        return {
            src: { default: null },
        };
    },

    parseHTML() {
        return [{ tag: 'iframe[src*="youtube.com"]' }];
    },

    renderHTML({ HTMLAttributes }) {
        return [
            'div',
            { class: 'youtube-embed' },
            [
                'iframe',
                mergeAttributes({
                    width: '100%',
                    height: '100%',
                    frameborder: '0',
                    allowfullscreen: 'true',
                    src: HTMLAttributes.src,
                }),
            ],
        ];
    },

    addCommands() {
        return {
            setYouTubeEmbed:
                (src: string) =>
                    ({ commands }) => {
                        return commands.insertContent({
                            type: this.name,
                            attrs: { src },
                        });
                    },
        };
    },
});
