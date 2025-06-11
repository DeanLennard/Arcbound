// src/components/Editor.tsx
'use client';

import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { YouTubeEmbed } from '@/components/editor/extensions/YouTubeEmbed';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';

interface EditorProps {
    value: string;
    onChange: (value: string) => void;
}

export default function Editor({ value, onChange }: EditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Table.configure({
                resizable: true,  // Optional: allows resizing columns
            }),
            TableRow,
            TableHeader,
            TableCell,
            Image,
            Link.configure({
                openOnClick: false,
            }),
            Underline,
            Placeholder.configure({
                placeholder: 'Start typing here...',
                showOnlyWhenEditable: true,
                emptyEditorClass: 'is-editor-empty',
            }),
            YouTubeEmbed,
        ],
        content: value || '',
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            handlePaste(view, event) {
                const text = event.clipboardData?.getData('text/plain');
                if (text) {
                    const YOUTUBE_REGEX = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]+)/;
                    const match = text.match(YOUTUBE_REGEX);
                    if (match) {
                        const videoId = match[1];
                        const embedUrl = `https://www.youtube.com/embed/${videoId}`;
                        view.dispatch(
                            view.state.tr.replaceSelectionWith(
                                view.state.schema.nodes.youtubeEmbed.create({
                                    src: embedUrl,
                                })
                            )
                        );
                        return true;  // prevents default paste
                    }
                }
                return false;
            },
        },
    });

    useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value);
        }
    }, [value, editor]);

    const addImage = async () => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.onchange = async () => {
            const file = fileInput.files?.[0];
            if (!file) return;

            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch(`${window.location.origin}/api/admin/upload`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.url) {
                editor?.chain().focus().setImage({ src: data.url }).run();
            }
        };
        fileInput.click();
    };

    const addLink = () => {
        const url = prompt('Enter URL');
        if (url) {
            editor?.chain().focus().setLink({ href: url }).run();
        }
    };

    if (!editor) return null;

    return (
        <div className="border rounded p-2">
            {/* Toolbar */}
            <div className="flex flex-wrap gap-2 mb-2">
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={`px-2 py-1 rounded ${
                        editor.isActive('bold') ? 'bg-blue-600 text-white' : 'bg-gray-500'
                    }`}
                >
                    B
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`px-2 py-1 rounded ${
                        editor.isActive('italic') ? 'bg-blue-600 text-white' : 'bg-gray-500'
                    }`}
                >
                    I
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    className={`px-2 py-1 rounded ${
                        editor.isActive('underline') ? 'bg-blue-600 text-white' : 'bg-gray-500'
                    }`}
                >
                    U
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={`px-2 py-1 rounded ${
                        editor.isActive('bulletList') ? 'bg-blue-600 text-white' : 'bg-gray-500'
                    }`}
                >
                    Bullet List
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={`px-2 py-1 rounded ${
                        editor.isActive('orderedList') ? 'bg-blue-600 text-white' : 'bg-gray-500'
                    }`}
                >
                    Numbered List
                </button>
                <button
                    type="button"
                    onClick={addImage}
                    className="px-2 py-1 rounded bg-green-600 text-white"
                >
                    Insert Image
                </button>
                <button
                    type="button"
                    onClick={addLink}
                    className="px-2 py-1 rounded bg-purple-600 text-white"
                >
                    Add Link
                </button>
                <button
                    type="button"
                    onClick={() => {
                        const url = prompt('Enter YouTube URL');
                        if (url) {
                            const videoIdMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]+)/);
                            if (videoIdMatch?.[1]) {
                                const embedUrl = `https://www.youtube.com/embed/${videoIdMatch[1]}`;
                                editor?.chain().focus().setYouTubeEmbed(embedUrl).run();
                            } else {
                                alert('Invalid YouTube URL');
                            }
                        }
                    }}
                    className="px-2 py-1 rounded bg-red-600 text-white"
                >
                    Insert YouTube
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                    className="px-2 py-1 rounded bg-yellow-600 text-white"
                >
                    Insert Table
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().addColumnAfter().run()}
                    className="px-2 py-1 rounded bg-yellow-600 text-white"
                >
                    Add Column
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().addRowAfter().run()}
                    className="px-2 py-1 rounded bg-yellow-600 text-white"
                >
                    Add Row
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().deleteTable().run()}
                    className="px-2 py-1 rounded bg-red-600 text-white"
                >
                    Delete Table
                </button>
            </div>

            {/* Editor Content */}
            <EditorContent
                editor={editor}
                className="prose max-w-none tiptap"
            ></EditorContent>
        </div>
    );
}
