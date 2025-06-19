// src/components/Editor.tsx
'use client';

import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { YouTubeEmbed } from '@/components/editor/extensions/YouTubeEmbed';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import ResizeImage from 'tiptap-extension-resize-image';
import Heading, { type Level } from '@tiptap/extension-heading';
import TextAlign from '@tiptap/extension-text-align'
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    List,
    ListOrdered,
    Image as ImageIcon,
    Link2 as LinkIcon,
    Youtube as YoutubeIcon,
    Quote as QuoteIcon,
    Code as CodeIcon,
    Table as TableIcon,
    Columns as ColumnsIcon,
    Trash2 as TrashIcon,
    Rows as RowsIcon,
    Minus,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify
} from 'lucide-react';

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
            ResizeImage,
            Link.configure({
                openOnClick: false,
            }),
            Heading.configure({ levels: [1, 2, 3] }),
            TextAlign.configure({
                // which node types it applies to:
                types: ['heading', 'paragraph'],
                // which alignment options you want
                alignments: ['left', 'center', 'right', 'justify'],
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
                {/* Heading dropdown */}
                <select
                    className="bg-gray-700 text-white px-2 py-1 rounded"
                    onChange={e => {
                        const val = e.target.value
                        if (val === '0') {
                            editor.chain().focus().setParagraph().run()
                        } else {
                            // val is "1" | "2" | "3" here
                            editor
                                .chain()
                                .focus()
                                .setHeading({ level: Number(val) as Level })
                                .run()
                        }
                    }}
                    value={
                        editor.isActive('heading', { level: 1 })
                            ? '1'
                            : editor.isActive('heading', { level: 2 })
                                ? '2'
                                : editor.isActive('heading', { level: 3 })
                                    ? '3'
                                    : '0'
                    }
                >
                    <option value="0">Paragraph</option>
                    <option value="1">H1</option>
                    <option value="2">H2</option>
                    <option value="3">H3</option>
                </select>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={`px-2 py-1 rounded ${
                        editor.isActive('bold') ? 'bg-blue-600 text-white' : 'bg-gray-500'
                    }`}
                >
                    <Bold size={16} />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`px-2 py-1 rounded ${
                        editor.isActive('italic') ? 'bg-blue-600 text-white' : 'bg-gray-500'
                    }`}
                >
                    <Italic size={16} />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    className={`px-2 py-1 rounded ${
                        editor.isActive('underline') ? 'bg-blue-600 text-white' : 'bg-gray-500'
                    }`}
                >
                    <UnderlineIcon size={16} />
                </button>
                <button
                    onClick={() => editor.chain().focus().setTextAlign('left').run()}
                    className={editor.isActive({ textAlign: 'left' }) ? 'bg-blue-600 text-white' : 'bg-gray-500'}
                >
                    <AlignLeft size={16} />
                </button>
                <button
                    onClick={() => editor.chain().focus().setTextAlign('center').run()}
                    className={editor.isActive({ textAlign: 'center' }) ? 'bg-blue-600 text-white' : 'bg-gray-500'}
                >
                    <AlignCenter size={16} />
                </button>
                <button
                    onClick={() => editor.chain().focus().setTextAlign('right').run()}
                    className={editor.isActive({ textAlign: 'right' }) ? 'bg-blue-600 text-white' : 'bg-gray-500'}
                >
                    <AlignRight size={16} />
                </button>
                <button
                    onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                    className={editor.isActive({ textAlign: 'justify' }) ? 'bg-blue-600 text-white' : 'bg-gray-500'}
                >
                    <AlignJustify size={16} />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={`px-2 py-1 rounded ${
                        editor.isActive('bulletList') ? 'bg-blue-600 text-white' : 'bg-gray-500'
                    }`}
                >
                    <List size={16} />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={`px-2 py-1 rounded ${
                        editor.isActive('orderedList') ? 'bg-blue-600 text-white' : 'bg-gray-500'
                    }`}
                >
                    <ListOrdered size={16} />
                </button>
                <button
                    type="button"
                    onClick={addImage}
                    className="px-2 py-1 rounded bg-green-600 text-white"
                >
                    <ImageIcon size={16} />
                </button>
                <button
                    type="button"
                    onClick={addLink}
                    className="px-2 py-1 rounded bg-purple-600 text-white"
                >
                    <LinkIcon size={16} />
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
                    <YoutubeIcon size={16} />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    className={`px-2 py-1 rounded ${
                        editor.isActive('blockquote') ? 'bg-blue-600 text-white' : 'bg-gray-500'
                    }`}
                >
                    <QuoteIcon size={16} />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleCode().run()}
                    className={`px-2 py-1 rounded ${
                        editor.isActive('code') ? 'bg-blue-600 text-white' : 'bg-gray-500'
                    }`}
                >
                    <CodeIcon size={16} />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                    className="px-2 py-1 rounded bg-yellow-600 text-white"
                >
                    <TableIcon size={16} />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().addColumnAfter().run()}
                    className="px-2 py-1 rounded bg-yellow-600 text-white"
                >
                    <ColumnsIcon size={16} />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().addRowAfter().run()}
                    className="px-2 py-1 rounded bg-yellow-600 text-white"
                >
                    <RowsIcon size={16} />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().deleteTable().run()}
                    className="px-2 py-1 rounded bg-red-600 text-white"
                >
                    <TrashIcon size={16} />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().deleteRow().run()}
                    className="px-2 py-1 rounded bg-red-600 text-white"
                >
                    <Minus size={16} />
                </button>

                <button
                    type="button"
                    onClick={() => editor.chain().focus().deleteColumn().run()}
                    className="px-2 py-1 rounded bg-red-600 text-white transform rotate-90"
                >
                    <Minus size={16} />
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
