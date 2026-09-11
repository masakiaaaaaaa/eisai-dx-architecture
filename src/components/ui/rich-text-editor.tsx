"use client";

import React, { useEffect, useRef } from 'react';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    minHeight?: string;
}

export function RichTextEditor({ value, onChange, placeholder, minHeight = '100px', className = '' }: RichTextEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (editorRef.current && value !== editorRef.current.innerHTML && editorRef.current.innerHTML !== '<br>') {
            editorRef.current.innerHTML = value || '';
        }
    }, [value]);

    const execCmd = (cmd: string, arg?: string) => {
        document.execCommand(cmd, false, arg);
        if (editorRef.current) onChange(editorRef.current.innerHTML);
    };

    const handleToolbarClick = (e: React.MouseEvent, cmd: string, arg?: string) => {
        e.preventDefault(); // Prevents losing focus!
        execCmd(cmd, arg);
    };

    const btnClass = "px-2 py-1 bg-white border border-slate-300 rounded text-sm font-bold text-slate-700 flex items-center justify-center min-w-[28px] hover:bg-slate-50";

    return (
        <div className={`border border-slate-300 rounded-md overflow-hidden bg-white ${className}`}>
            <div className="flex gap-1 p-1.5 border-b border-slate-300 bg-slate-50">
                <button type="button" onMouseDown={(e) => handleToolbarClick(e, 'bold')} className={btnClass} title="太字">B</button>
                <button type="button" onMouseDown={(e) => handleToolbarClick(e, 'italic')} className={`${btnClass} italic font-normal`} title="斜体">I</button>
                <button type="button" onMouseDown={(e) => handleToolbarClick(e, 'underline')} className={`${btnClass} underline font-normal`} title="下線">U</button>
                <div className="w-[1px] bg-slate-300 mx-1" />
                <button type="button" onMouseDown={(e) => handleToolbarClick(e, 'insertUnorderedList')} className={`${btnClass} font-normal`} title="箇条書きリスト">≡</button>
            </div>
            <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={() => { if (editorRef.current) onChange(editorRef.current.innerHTML); }}
                style={{
                    minHeight,
                    padding: '12px',
                    outline: 'none',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap',
                }}
                data-placeholder={placeholder}
            />
            {placeholder && (
                <style>{`
                    [contenteditable]:empty::before {
                        content: attr(data-placeholder);
                        color: #9ca3af;
                        pointer-events: none;
                        display: block;
                    }
                `}</style>
            )}
        </div>
    );
}
