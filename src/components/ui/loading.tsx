"use client";

import { cn } from "@/lib/utils";

interface SpinnerProps {
    size?: "sm" | "md" | "lg";
    className?: string;
}

export function Spinner({ size = "md", className }: SpinnerProps) {
    const sizeClasses = {
        sm: "w-4 h-4",
        md: "w-6 h-6",
        lg: "w-8 h-8",
    };

    return (
        <svg
            className={cn(
                "animate-spin text-current",
                sizeClasses[size],
                className
            )}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
        >
            <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
            />
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
        </svg>
    );
}

interface LoadingOverlayProps {
    message?: string;
}

export function LoadingOverlay({ message = "読み込み中..." }: LoadingOverlayProps) {
    return (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 animate-fade-in">
                <Spinner size="lg" className="text-indigo-600" />
                <p className="text-sm text-slate-600 font-medium">{message}</p>
            </div>
        </div>
    );
}

interface LoadingCardProps {
    rows?: number;
    className?: string;
}

export function LoadingCard({ rows = 3, className }: LoadingCardProps) {
    return (
        <div className={cn("bg-white rounded-2xl p-5 shadow-sm border border-slate-100", className)}>
            <div className="space-y-3">
                {/* Header skeleton */}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl skeleton-shimmer" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 w-1/3 rounded skeleton-shimmer" />
                        <div className="h-3 w-1/2 rounded skeleton-shimmer" />
                    </div>
                </div>

                {/* Content skeleton */}
                <div className="space-y-2 pt-2">
                    {Array.from({ length: rows }).map((_, i) => (
                        <div
                            key={i}
                            className="h-3 rounded skeleton-shimmer"
                            style={{ width: `${100 - i * 15}%` }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

interface LoadingDotsProps {
    className?: string;
}

export function LoadingDots({ className }: LoadingDotsProps) {
    return (
        <span className={cn("inline-flex items-center gap-1", className)}>
            <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </span>
    );
}

interface PulseRingProps {
    size?: "sm" | "md" | "lg";
    className?: string;
}

export function PulseRing({ size = "md", className }: PulseRingProps) {
    const sizeClasses = {
        sm: "w-3 h-3",
        md: "w-4 h-4",
        lg: "w-6 h-6",
    };

    return (
        <span className={cn("relative flex", sizeClasses[size], className)}>
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-full w-full bg-indigo-500" />
        </span>
    );
}
