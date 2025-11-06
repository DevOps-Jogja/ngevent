'use client';

import { useEffect, useRef, useState } from 'react';
import { Editor, rootCtx, defaultValueCtx } from '@milkdown/core';
import { commonmark } from '@milkdown/preset-commonmark';
import { Milkdown, MilkdownProvider, useEditor } from '@milkdown/react';
import { listener, listenerCtx } from '@milkdown/plugin-listener';

interface MilkdownEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    height?: string;
}

function MilkdownEditorInner({ value, onChange, placeholder = 'Write something...', height = '300px' }: MilkdownEditorProps) {
    const editorRef = useRef<Editor | null>(null);

    useEditor((root) => {
        const editor = Editor.make()
            .config((ctx) => {
                ctx.set(rootCtx, root);
                ctx.set(defaultValueCtx, value || '');
                ctx.get(listenerCtx).markdownUpdated((ctx, markdown) => {
                    onChange(markdown);
                });
            })
            .use(commonmark)
            .use(listener);

        editorRef.current = editor;
        return editor;
    }, []);

    // Update editor content when value changes externally
    useEffect(() => {
        if (editorRef.current && value !== undefined) {
            const editor = editorRef.current;
            editor.action((ctx) => {
                ctx.set(defaultValueCtx, value);
            });
        }
    }, [value]);

    return (
        <div
            className="milkdown-wrapper"
            style={{
                minHeight: height,
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                padding: '1rem',
                backgroundColor: '#fff'
            }}
        >
            <Milkdown />
        </div>
    );
}

export default function MilkdownEditor({ value, onChange, placeholder, height }: MilkdownEditorProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div
                className="h-64 bg-gray-100 dark:bg-dark-secondary animate-pulse rounded-lg"
                style={{ minHeight: height }}
            />
        );
    }

    return (
        <MilkdownProvider>
            <MilkdownEditorInner
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                height={height}
            />
            <style jsx global>{`
                .milkdown-wrapper {
                    font-family: inherit;
                }
                
                .milkdown .editor {
                    min-height: ${height};
                    max-height: 500px;
                    overflow-y: auto;
                    padding: 1rem;
                    outline: none;
                }
                
                /* Base prose styling */
                .milkdown .editor p {
                    margin-bottom: 1em;
                    line-height: 1.75;
                }
                
                .milkdown .editor h1 { 
                    font-size: 2em; 
                    font-weight: bold;
                    margin-top: 1em;
                    margin-bottom: 0.5em;
                }
                
                .milkdown .editor h2 { 
                    font-size: 1.5em; 
                    font-weight: bold;
                    margin-top: 1em;
                    margin-bottom: 0.5em;
                }
                
                .milkdown .editor h3 { 
                    font-size: 1.25em; 
                    font-weight: bold;
                    margin-top: 1em;
                    margin-bottom: 0.5em;
                }
                
                .milkdown .editor ul,
                .milkdown .editor ol {
                    padding-left: 1.5em;
                    margin-bottom: 1em;
                }
                
                .milkdown .editor li {
                    margin-bottom: 0.5em;
                }
                
                .milkdown .editor code {
                    background-color: #f3f4f6;
                    padding: 0.2em 0.4em;
                    border-radius: 0.25rem;
                    font-family: monospace;
                    font-size: 0.9em;
                    color: #22c55e;
                }
                
                .milkdown .editor pre {
                    background-color: #f3f4f6;
                    padding: 1em;
                    border-radius: 0.5rem;
                    overflow-x: auto;
                    margin: 1em 0;
                }
                
                .milkdown .editor pre code {
                    background-color: transparent;
                    padding: 0;
                }
                
                .milkdown .editor blockquote {
                    border-left: 4px solid #22c55e;
                    padding-left: 1em;
                    margin: 1em 0;
                    font-style: italic;
                    color: #6b7280;
                }
                
                .milkdown .editor a {
                    color: #22c55e;
                    text-decoration: underline;
                }
                
                .milkdown .editor strong {
                    font-weight: 700;
                }
                
                .milkdown .editor em {
                    font-style: italic;
                }
                
                /* Dark mode styles */
                .dark .milkdown-wrapper {
                    background-color: #1f2937 !important;
                    border-color: #4b5563 !important;
                }
                
                .dark .milkdown .editor {
                    background-color: #1f2937 !important;
                    color: #e5e7eb !important;
                }
                
                .dark .milkdown .editor h1,
                .dark .milkdown .editor h2,
                .dark .milkdown .editor h3,
                .dark .milkdown .editor h4,
                .dark .milkdown .editor h5,
                .dark .milkdown .editor h6 {
                    color: #fff !important;
                }
                
                .dark .milkdown .editor code {
                    background-color: #374151 !important;
                    color: #22c55e !important;
                }
                
                .dark .milkdown .editor pre {
                    background-color: #111827 !important;
                }
                
                .dark .milkdown .editor blockquote {
                    border-left-color: #16a34a !important;
                    color: #9ca3af !important;
                }
                
                /* Placeholder */
                .milkdown .ProseMirror > .is-empty::before {
                    content: '${placeholder}';
                    color: #9ca3af;
                    pointer-events: none;
                    position: absolute;
                }
            `}</style>
        </MilkdownProvider>
    );
}
