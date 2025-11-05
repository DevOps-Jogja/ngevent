'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import 'react-markdown-editor-lite/lib/index.css';

// Import ReactMarkdown dynamically to avoid SSR issues
const ReactMarkdown = dynamic(() => import('react-markdown'), { ssr: false });
const MdEditor = dynamic(() => import('react-markdown-editor-lite'), { ssr: false });

interface MarkdownEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    height?: string;
}

export default function MarkdownEditor({ value, onChange, placeholder = 'Write description in Markdown...', height = '400px' }: MarkdownEditorProps) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleEditorChange = ({ text }: { text: string; html: string }) => {
        onChange(text);
    };

    if (!isMounted) {
        return (
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-dark-secondary" style={{ height }}>
                <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600 dark:border-primary-400"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="markdown-editor-wrapper">
            <MdEditor
                value={value}
                style={{ height }}
                renderHTML={(text) => (
                    <div className="markdown-preview">
                        <ReactMarkdown>{text}</ReactMarkdown>
                    </div>
                )}
                onChange={handleEditorChange}
                placeholder={placeholder}
                view={{ menu: true, md: true, html: true }}
                canView={{ menu: true, md: true, html: true, fullScreen: true, hideMenu: true }}
                config={{
                    view: {
                        menu: true,
                        md: true,
                        html: true,
                    },
                    imageUrl: '',
                    syncScrollMode: ['leftFollowRight', 'rightFollowLeft'],
                }}
            />
        </div>
    );
}
