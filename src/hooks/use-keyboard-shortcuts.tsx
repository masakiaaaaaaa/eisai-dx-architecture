"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

type KeyboardShortcut = {
    key: string;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    action: () => void;
    description: string;
};

const defaultShortcuts: KeyboardShortcut[] = [];

export function useKeyboardShortcuts(customShortcuts: KeyboardShortcut[] = []) {
    const router = useRouter();

    // Navigation shortcuts
    const navigationShortcuts: KeyboardShortcut[] = [
        { key: "h", alt: true, action: () => router.push("/dashboard"), description: "ホームへ移動" },
        { key: "c", alt: true, action: () => router.push("/collection"), description: "テスト回収へ移動" },
        { key: "t", alt: true, action: () => router.push("/test-schedule"), description: "テスト日程へ移動" },
        { key: "s", alt: true, action: () => router.push("/students"), description: "生徒一覧へ移動" },
        { key: "e", alt: true, action: () => router.push("/events"), description: "イベントへ移動" },
        { key: "a", alt: true, action: () => router.push("/announcements"), description: "連絡事項へ移動" },
    ];

    const allShortcuts = [...defaultShortcuts, ...navigationShortcuts, ...customShortcuts];

    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            // Ignore if user is typing in an input
            const target = event.target as HTMLElement;
            if (
                target.tagName === "INPUT" ||
                target.tagName === "TEXTAREA" ||
                target.isContentEditable
            ) {
                return;
            }

            for (const shortcut of allShortcuts) {
                const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
                const ctrlMatch = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
                const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
                const altMatch = shortcut.alt ? event.altKey : !event.altKey;

                if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
                    event.preventDefault();
                    shortcut.action();
                    return;
                }
            }
        },
        [allShortcuts]
    );

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    return { shortcuts: allShortcuts };
}

// Component to display available shortcuts
export function KeyboardShortcutsHelp({ shortcuts }: { shortcuts: KeyboardShortcut[] }) {
    const formatKey = (shortcut: KeyboardShortcut) => {
        const parts = [];
        if (shortcut.ctrl) parts.push("Ctrl");
        if (shortcut.alt) parts.push("Alt");
        if (shortcut.shift) parts.push("Shift");
        parts.push(shortcut.key.toUpperCase());
        return parts.join(" + ");
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-4 max-w-sm">
            <h3 className="font-bold text-slate-800 mb-3">キーボードショートカット</h3>
            <div className="space-y-2">
                {shortcuts.map((shortcut, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">{shortcut.description}</span>
                        <kbd className="px-2 py-1 bg-slate-100 rounded text-xs font-mono text-slate-700">
                            {formatKey(shortcut)}
                        </kbd>
                    </div>
                ))}
            </div>
        </div>
    );
}
