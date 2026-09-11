"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Layout from "@/components/layout";
import {
    BookOpen,
    Puzzle,
    Monitor,
    MessageCircle,
    Users,
    CalendarDays,
    ClipboardList,
    Edit3,
    Megaphone,
    Calendar,
    UserPlus,
    ChevronRight,
    ChevronLeft,
    ChevronDown,
    ArrowLeftRight,
    ArrowUpDown,
    Star,
    CheckCircle2,
    Smartphone,
    LayoutTemplate,
    AlertCircle
} from "lucide-react";

/* ================================================================
   GLOBAL STYLES
   ================================================================ */

const globalStyles = `
  .scrollbar-hide::-webkit-scrollbar { display: none; }
  .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .animate-reveal {
    animation: fadeInUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }

  @keyframes swipeHint {
    0%, 100% { transform: translateX(0); opacity: 0.6; }
    50% { transform: translateX(6px); opacity: 1; }
  }
  .animate-swipe-hint {
    animation: swipeHint 1.5s ease-in-out 3;
  }

  @keyframes blob {
    0% { transform: translate(0px, 0px) scale(1); }
    33% { transform: translate(30px, -50px) scale(1.1); }
    66% { transform: translate(-20px, 20px) scale(0.9); }
    100% { transform: translate(0px, 0px) scale(1); }
  }
  .animate-blob {
    animation: blob 8s infinite;
  }
  .animation-delay-2000 {
    animation-delay: 2s;
  }
  .animation-delay-4000 {
    animation-delay: 4s;
  }

  @keyframes pulseRing {
    0% { transform: translate(-50%, -50%) scale(0.7); opacity: 0; box-shadow: 0 0 0 0 var(--pulse-color); }
    20% { opacity: 1; }
    80% { transform: translate(-50%, -50%) scale(1.1); box-shadow: 0 0 0 20px rgba(0,0,0,0); }
    100% { transform: translate(-50%, -50%) scale(0.7); opacity: 0; box-shadow: 0 0 0 0 rgba(0,0,0,0); }
  }
  .animate-pulse-ring {
    animation: pulseRing 2.5s cubic-bezier(0.25, 1, 0.5, 1) infinite;
  }

  /* Shimmer text effect */
  @keyframes textShimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  .animate-text-shimmer {
    background-size: 200% auto;
    animation: textShimmer 4s linear infinite;
  }

  /* Skeleton loading shimmer */
  @keyframes skeletonShimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }

  /* Confetti sparkle */
  @keyframes sparkle {
    0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
    50% { opacity: 1; transform: scale(1) rotate(180deg); }
  }

  /* Progress bar glow */
  @keyframes progressGlow {
    0%, 100% { box-shadow: 0 0 4px rgba(99,102,241,0.4); }
    50% { box-shadow: 0 0 12px rgba(99,102,241,0.7); }
  }

  /* Gentle float */
  @keyframes gentleFloat {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-4px); }
  }
  .animate-gentle-float {
    animation: gentleFloat 3s ease-in-out infinite;
  }

  /* Device frame hover */
  .device-frame-hover {
    transition: transform 0.5s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.5s ease;
  }
  .device-frame-hover:hover {
    transform: perspective(800px) rotateY(-2deg) translateY(-4px);
    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.2);
  }

  /* Tab content transition */
  @keyframes tabSlideIn {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-tab-slide-in {
    animation: tabSlideIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }
`;

/* ================================================================
   HOOKS
   ================================================================ */

function useScrollReveal() {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([e]) => { if (e.isIntersecting) setVisible(true); },
            { threshold: 0.08, rootMargin: "0px 0px -30px 0px" }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, []);
    return { ref, visible };
}

function Reveal({ children, className = "", delay = 0 }: {
    children: React.ReactNode; className?: string; delay?: number;
}) {
    const { ref, visible } = useScrollReveal();
    return (
        <div
            ref={ref}
            className={className}
            style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(20px)",
                transition: `opacity 0.6s cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 0.6s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
            }}
        >
            {children}
        </div>
    );
}

/* ================================================================
   DEVICE FRAMES
   ================================================================ */

function ImgFallback({ alt }: { alt: string }) {
    return (
        <div className="w-full h-full relative bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 overflow-hidden">
            {/* Skeleton shimmer overlay */}
            <div className="absolute inset-0 overflow-hidden">
                <div
                    className="absolute inset-0 -translate-x-full"
                    style={{
                        background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)",
                        animation: "skeletonShimmer 2s ease-in-out infinite",
                    }}
                />
            </div>
            {/* Content placeholder */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                {/* Fake image block */}
                <div className="w-3/4 h-1/3 rounded-xl bg-slate-200/60 mb-3" />
                {/* Fake text lines */}
                <div className="space-y-2 w-3/4">
                    <div className="h-2.5 bg-slate-200/60 rounded-full w-full" />
                    <div className="h-2.5 bg-slate-200/60 rounded-full w-2/3" />
                </div>
                {/* Label */}
                <p className="text-[10px] text-slate-400 font-medium mt-3 bg-white/60 px-2 py-0.5 rounded-md">{alt}</p>
            </div>
        </div>
    );
}

function PulseHighlight({ top, left, size = 32, color = "amber" }: { top: string, left: string, size?: number, color?: "red" | "blue" | "amber" | "orange" | "purple" | "emerald" | "green" }) {
    const colors = {
        red: "rgba(239, 68, 68, 0.8)",    // text-red-500
        blue: "rgba(59, 130, 246, 0.8)",  // text-blue-500
        amber: "rgba(234, 179, 8, 0.8)",  // text-yellow-500
        orange: "rgba(249, 115, 22, 0.8)",// text-orange-500
        purple: "rgba(168, 85, 247, 0.8)",// text-purple-500
        emerald: "rgba(16, 185, 129, 0.8)", // text-emerald-500
        green: "rgba(34, 197, 94, 0.8)",    // text-green-500
    };
    return (
        <div
            className="absolute z-20 pointer-events-none"
            style={{
                top, left,
                width: size, height: size,
                transform: "translate(-50%, -50%)"
            }}
        >
            {/* Core dot */}
            <div
                className="absolute top-1/2 left-1/2 w-3 h-3 rounded-full shadow-md"
                style={{
                    transform: "translate(-50%, -50%)",
                    backgroundColor: colors[color].replace("0.8", "1")
                }}
            />
            {/* Pulsing ring */}
            <div
                className="absolute top-1/2 left-1/2 w-full h-full rounded-full animate-pulse-ring"
                style={{
                    backgroundColor: colors[color].replace("0.8", "0.2"),
                    "--pulse-color": colors[color]
                } as React.CSSProperties}
            />
        </div>
    );
}

function PhoneFrame({ src, alt, highlights }: { src: string; alt: string; highlights?: any[] }) {
    const [error, setError] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        setLoaded(false);
        setError(false);
        if (imgRef.current?.complete) {
            setLoaded(true);
        }
    }, [src]);

    return (
        <div className="relative mx-auto device-frame-hover" style={{ maxWidth: 220 }}>
            {/* Phone body */}
            <div
                className="rounded-[2.2rem] p-[5px] shadow-2xl shadow-black/15"
                style={{ background: "linear-gradient(145deg, #1a1a2e, #16162a)" }}
            >
                {/* Dynamic Island */}
                <div className="absolute top-[6px] left-1/2 -translate-x-1/2 z-10 flex items-center justify-center">
                    <div className="w-20 h-[18px] bg-[#1a1a2e] rounded-full flex items-center justify-center gap-2">
                        <div className="w-[6px] h-[6px] rounded-full bg-[#2a2a40]" />
                        <div className="w-[4px] h-[4px] rounded-full bg-[#2a2a40]" />
                    </div>
                </div>
                {/* Screen */}
                <div className="bg-white rounded-[1.9rem] overflow-hidden relative" style={{ aspectRatio: "9/19.5" }}>

                    {/* Glass Glare */}
                    <div className="absolute inset-0 pointer-events-none z-10 bg-gradient-to-tr from-white/0 via-white/5 to-white/20 transform -rotate-12 scale-[1.5] translate-x-8" />

                    {/* Loading skeleton (shows while image loads) */}
                    {!loaded && !error && <div className="absolute inset-0 z-[1]"><ImgFallback alt={alt} /></div>}

                    {error ? (
                        <ImgFallback alt={alt} />
                    ) : (
                        <>
                            <img
                                ref={imgRef}
                                src={src}
                                alt={alt}
                                className={`w-full h-full object-cover object-top relative z-0 transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
                                loading="lazy"
                                onLoad={() => setLoaded(true)}
                                onError={() => setError(true)}
                            />
                            {highlights?.map((h, i) => (
                                <PulseHighlight key={i} {...h} />
                            ))}
                        </>
                    )}
                </div>
            </div>
            {/* Side buttons */}
            <div className="absolute right-[-2px] top-[72px] w-[2px] h-8 bg-[#2a2a3e] rounded-r" />
            <div className="absolute left-[-2px] top-[56px] w-[2px] h-5 bg-[#2a2a3e] rounded-l" />
            <div className="absolute left-[-2px] top-[82px] w-[2px] h-10 bg-[#2a2a3e] rounded-l" />
            <div className="absolute left-[-2px] top-[96px] w-[2px] h-10 bg-[#2a2a3e] rounded-l" />
        </div>
    );
}

function PCFrame({ src, alt, highlights }: { src: string; alt: string; highlights?: any[] }) {
    const [error, setError] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        setLoaded(false);
        setError(false);
        if (imgRef.current?.complete) {
            setLoaded(true);
        }
    }, [src]);

    return (
        <div className="relative mx-auto device-frame-hover" style={{ maxWidth: 340 }}>
            {/* Monitor */}
            <div
                className="rounded-t-xl pt-2 px-[5px] pb-[5px] shadow-2xl shadow-black/15"
                style={{ background: "linear-gradient(145deg, #2d2d3f, #252535)" }}
            >
                {/* Top bar with window controls + webcam */}
                <div className="flex items-center justify-between px-2 mb-1.5">
                    {/* Window control dots */}
                    <div className="flex items-center gap-[4px]">
                        <div className="w-[7px] h-[7px] rounded-full bg-[#ff5f57]" />
                        <div className="w-[7px] h-[7px] rounded-full bg-[#febc2e]" />
                        <div className="w-[7px] h-[7px] rounded-full bg-[#28c840]" />
                    </div>
                    {/* Webcam dot */}
                    <div className="w-[5px] h-[5px] rounded-full" style={{ background: "radial-gradient(circle, #555, #333)" }} />
                    {/* Spacer for balance */}
                    <div className="w-8" />
                </div>
                {/* Screen */}
                <div className="bg-white rounded-sm overflow-hidden relative" style={{ aspectRatio: "16/9" }}>
                    {/* Glass Glare */}
                    <div className="absolute inset-0 pointer-events-none z-10 bg-gradient-to-tr from-white/0 via-white/5 to-white/10 transform rotate-12 scale-[1.5] translate-x-12" />

                    {/* Loading skeleton */}
                    {!loaded && !error && <div className="absolute inset-0 z-[1]"><ImgFallback alt={alt} /></div>}

                    {error ? (
                        <ImgFallback alt={alt} />
                    ) : (
                        <>
                            <img
                                ref={imgRef}
                                src={src}
                                alt={alt}
                                className={`w-full h-full object-cover object-top relative z-0 transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
                                loading="lazy"
                                onLoad={() => setLoaded(true)}
                                onError={() => setError(true)}
                            />
                            {highlights?.map((h, i) => (
                                <PulseHighlight key={i} {...h} />
                            ))}
                        </>
                    )}
                </div>
            </div>
            {/* Stand */}
            <div className="mx-auto">
                <div
                    className="h-[5px] rounded-b-sm mx-1"
                    style={{ background: "linear-gradient(180deg, #bbbbc4, #a0a0a8)" }}
                />
                <div
                    className="h-[3px] rounded-b-lg mx-14"
                    style={{ background: "linear-gradient(180deg, #aaaaB2, #909098)" }}
                />
            </div>
        </div>
    );
}

function NoneFrame({ src, alt, highlights }: { src: string; alt: string; highlights?: any[] }) {
    const [error, setError] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        setLoaded(false);
        setError(false);
        if (imgRef.current?.complete) {
            setLoaded(true);
        }
    }, [src]);

    return (
        <div className="relative mx-auto rounded-xl overflow-hidden shadow-lg border border-slate-200 bg-white" style={{ maxWidth: 640 }}>
            {/* Loading skeleton */}
            {!loaded && !error && <div className="absolute inset-0 z-[1]"><ImgFallback alt={alt} /></div>}

            {error ? (
                <div className="w-full aspect-video"><ImgFallback alt={alt} /></div>
            ) : (
                <>
                    <img
                        ref={imgRef}
                        src={src}
                        alt={alt}
                        className={`w-full h-auto object-contain transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
                        loading="lazy"
                        onLoad={() => setLoaded(true)}
                        onError={() => setError(true)}
                    />
                    {highlights?.map((h, i) => (
                        <PulseHighlight key={i} {...h} />
                    ))}
                </>
            )}
        </div>
    );
}

/* ================================================================
   STEP CAROUSEL
   ================================================================ */

type CarouselStep = {
    image: string;
    caption: React.ReactNode;
    highlights?: { top: string; left: string; size?: number; color?: "red" | "blue" | "amber" | "orange" | "purple" | "emerald" | "green" }[];
};

function StepCarousel({ steps, device }: {
    steps: CarouselStep[];
    device: "phone" | "pc" | "none";
}) {
    const [active, setActive] = useState(0);
    const [dragOffset, setDragOffset] = useState(0);
    const dragRef = useRef({ startX: 0, startY: 0, isDragging: false, locked: false, isDown: false });
    const multi = steps.length > 1;
    const Frame = device === "phone" ? PhoneFrame : device === "pc" ? PCFrame : NoneFrame;

    const goTo = useCallback((idx: number) => {
        setActive(Math.max(0, Math.min(idx, steps.length - 1)));
        setDragOffset(0);
    }, [steps.length]);

    // Unified pointer start (touch + mouse)
    const onPointerDown = useCallback((clientX: number, clientY: number) => {
        if (!multi) return;
        dragRef.current = { startX: clientX, startY: clientY, isDragging: false, locked: false, isDown: true };
    }, [multi]);

    const onPointerMove = useCallback((clientX: number, clientY: number, preventDefault: () => void) => {
        if (!multi) return;
        const ref = dragRef.current;
        if (!ref.isDown) return;
        const dx = clientX - ref.startX;
        const dy = clientY - ref.startY;

        if (!ref.locked && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
            ref.locked = true;
            ref.isDragging = Math.abs(dx) > Math.abs(dy);
        }

        if (ref.isDragging) {
            preventDefault();
            let offset = dx;
            if ((active === 0 && dx > 0) || (active === steps.length - 1 && dx < 0)) {
                offset = dx * 0.3;
            }
            setDragOffset(offset);
        }
    }, [multi, active, steps.length]);

    const onPointerUp = useCallback(() => {
        const ref = dragRef.current;
        ref.isDown = false;
        if (!multi || !ref.isDragging) {
            setDragOffset(0);
            return;
        }
        const threshold = 50;
        if (dragOffset < -threshold && active < steps.length - 1) {
            goTo(active + 1);
        } else if (dragOffset > threshold && active > 0) {
            goTo(active - 1);
        } else {
            setDragOffset(0);
        }
    }, [multi, dragOffset, active, steps.length, goTo]);

    return (
        <div>
            {/* Step indicator */}
            {multi && (
                <div className="flex items-center justify-between mb-4 px-1">
                    <span className="text-[13px] font-bold text-slate-500 tracking-widest uppercase bg-slate-100 px-3 py-1 rounded-lg">
                        Step {active + 1} / {steps.length}
                    </span>
                </div>
            )}

            {/* Carousel — pointer-driven translateX (touch + mouse) */}
            <div className="relative group">
                {/* Navigation Arrows (All devices) */}
                {multi && (
                    <>
                        <button
                            onClick={() => goTo(active - 1)}
                            disabled={active === 0}
                            className="absolute left-0 top-[40%] -translate-y-1/2 -translate-x-2 md:-translate-x-6 xl:-translate-x-8 z-20 w-10 h-10 md:w-12 md:h-12 bg-white/95 backdrop-blur shadow-[0_8px_30px_-12px_rgba(0,0,0,0.3)] rounded-full flex items-center justify-center text-slate-700 disabled:opacity-0 disabled:pointer-events-none hover:scale-110 hover:bg-white hover:text-indigo-600 transition-all duration-300 border border-slate-200/60"
                            aria-label="Previous step"
                        >
                            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 ml-[-2px]" />
                        </button>
                        <button
                            onClick={() => goTo(active + 1)}
                            disabled={active === steps.length - 1}
                            className="absolute right-0 top-[40%] -translate-y-1/2 translate-x-2 md:translate-x-6 xl:translate-x-8 z-20 w-10 h-10 md:w-12 md:h-12 bg-white/95 backdrop-blur shadow-[0_8px_30px_-12px_rgba(0,0,0,0.3)] rounded-full flex items-center justify-center text-slate-700 disabled:opacity-0 disabled:pointer-events-none hover:scale-110 hover:bg-white hover:text-indigo-600 transition-all duration-300 border border-slate-200/60"
                            aria-label="Next step"
                        >
                            <ChevronRight className="w-5 h-5 md:w-6 md:h-6 mr-[-2px]" />
                        </button>
                    </>
                )}

                <div
                    className="overflow-hidden select-none"
                    style={{ touchAction: multi ? "pan-y" : "auto", cursor: multi ? (dragRef.current.isDragging ? "grabbing" : "grab") : "default" }}
                    onTouchStart={(e) => onPointerDown(e.touches[0].clientX, e.touches[0].clientY)}
                    onTouchMove={(e) => onPointerMove(e.touches[0].clientX, e.touches[0].clientY, () => e.preventDefault())}
                    onTouchEnd={onPointerUp}
                    onMouseDown={(e) => { e.preventDefault(); onPointerDown(e.clientX, e.clientY); }}
                    onMouseMove={(e) => onPointerMove(e.clientX, e.clientY, () => e.preventDefault())}
                    onMouseUp={onPointerUp}
                    onMouseLeave={onPointerUp}
                >
                    <div
                        className="flex"
                        style={{
                            transform: `translateX(calc(-${active * 100}% + ${dragOffset}px))`,
                            transition: dragOffset === 0 ? "transform 0.35s cubic-bezier(0.25, 1, 0.5, 1)" : "none",
                        }}
                    >
                        {steps.map((step, i) => (
                            <div
                                key={i}
                                className="flex-none w-full px-2"
                            >
                                {/* Device frame */}
                                <div className="flex justify-center">
                                    <Frame src={step.image} alt={typeof step.caption === 'string' ? step.caption : "Screenshot"} highlights={step.highlights} />
                                </div>

                                {/* Caption */}
                                <div className="mt-5 text-center px-2">
                                    {multi && (
                                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 text-white text-[13px] font-bold mb-2 shadow-sm">
                                            {i + 1}
                                        </span>
                                    )}
                                    <p className="text-[15px] text-slate-700 font-medium leading-relaxed">
                                        {step.caption}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Dots — tappable */}
            {multi && (
                <div className="flex justify-center gap-2 mt-5">
                    {steps.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => goTo(i)}
                            className="rounded-full transition-all duration-300 p-0 border-0 cursor-pointer"
                            style={{
                                width: i === active ? 24 : 8,
                                height: 8,
                                background: i === active
                                    ? "linear-gradient(90deg, #6366f1, #818cf8)"
                                    : "#e2e8f0",
                            }}
                            aria-label={`Step ${i + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function ToggleableStepCarousel({
    pcSteps,
    phoneSteps
}: {
    pcSteps: CarouselStep[];
    phoneSteps: CarouselStep[];
}) {
    const [mode, setMode] = useState<"pc" | "phone">("pc");

    return (
        <div className="flex flex-col items-center w-full">
            <div className="flex bg-slate-100/80 p-1 rounded-xl mb-6 shadow-inner w-[240px]">
                <button
                    onClick={() => setMode("pc")}
                    className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-4 rounded-lg text-[13px] font-bold transition-all duration-300 ${mode === "pc" ? "bg-white text-indigo-600 shadow-sm ring-1 ring-slate-900/5" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"}`}
                >
                    <Monitor className="w-4 h-4" /> PC表示
                </button>
                <button
                    onClick={() => setMode("phone")}
                    className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-4 rounded-lg text-[13px] font-bold transition-all duration-300 ${mode === "phone" ? "bg-white text-indigo-600 shadow-sm ring-1 ring-slate-900/5" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"}`}
                >
                    <Smartphone className="w-4 h-4" /> スマホ表示
                </button>
            </div>
            <div className="w-full relative flex justify-center transition-all duration-300">
                <div className={`w-full transition-all duration-500 ease-in-out ${mode === "pc" ? "opacity-100 block" : "opacity-0 hidden"}`}>
                    <StepCarousel key="pc" steps={pcSteps} device="pc" />
                </div>
                <div className={`w-full transition-all duration-500 ease-in-out ${mode === "phone" ? "opacity-100 block" : "opacity-0 hidden"}`}>
                    <StepCarousel key="phone" steps={phoneSteps} device="phone" />
                </div>
            </div>
        </div>
    );
}

/* ================================================================
   UI COMPONENTS
   ================================================================ */

function SectionDivider() {
    return (
        <div className="relative my-16">
            <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3">
                <div className="w-2 h-2 rotate-45 bg-gradient-to-br from-slate-200 to-slate-300 rounded-[2px]" />
            </div>
        </div>
    );
}

function SectionNum({ num, total, color }: { num: number; total: number; color: string }) {
    const gradients: Record<string, string> = {
        green: "from-green-500 to-emerald-600",
        blue: "from-blue-500 to-indigo-600",
        orange: "from-orange-500 to-amber-600",
        rose: "from-rose-500 to-red-600",
        purple: "from-purple-500 to-violet-600",
        emerald: "from-emerald-500 to-teal-600",
    };
    return (
        <div className="flex items-center gap-3 mb-5">
            <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${gradients[color] || gradients.blue} flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
                {num}
            </div>
            <span className="text-[13px] text-slate-400 font-bold tracking-widest uppercase">
                Step {num} <span className="text-slate-300">/ {total}</span>
            </span>
        </div>
    );
}

function TipBox({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex gap-3 bg-gradient-to-r from-blue-50/80 to-indigo-50/50 border border-blue-100 rounded-2xl p-4 mt-6 transition-all duration-300 hover:shadow-md hover:shadow-blue-100/40 hover:-translate-y-0.5">
            <div className="flex-shrink-0 mt-0.5 text-blue-400 animate-gentle-float">💡</div>
            <div className="text-[15px] text-blue-800 leading-relaxed">{children}</div>
        </div>
    );
}

function ImportantBox({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex gap-3 bg-gradient-to-r from-amber-50/80 to-orange-50/50 border border-amber-100 rounded-2xl p-4 mt-6 transition-all duration-300 hover:shadow-md hover:shadow-amber-100/40 hover:-translate-y-0.5">
            <div className="flex-shrink-0 mt-0.5 text-amber-400 animate-gentle-float">⚠️</div>
            <div className="text-[15px] text-amber-800 leading-relaxed">{children}</div>
        </div>
    );
}

function DifferenceCard({ icon: Icon, title, desc, examples, color }: {
    icon: React.ElementType;
    title: string;
    desc: string;
    examples: string[];
    color: "amber" | "purple";
}) {
    const styles = {
        amber: { bg: "from-amber-50 to-orange-50", border: "border-amber-100", iconColor: "text-amber-500", exBg: "bg-white/80 border-amber-100", exIcon: "text-amber-400" },
        purple: { bg: "from-purple-50 to-violet-50", border: "border-purple-100", iconColor: "text-purple-500", exBg: "bg-white/80 border-purple-100", exIcon: "text-purple-400" },
    };
    const s = styles[color];
    return (
        <div className={`bg-gradient-to-r ${s.bg} border ${s.border} rounded-2xl p-4`}>
            <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4.5 h-4.5 ${s.iconColor}`} />
                <h4 className="font-bold text-slate-800 text-base">{title}</h4>
            </div>
            <p className="text-base text-slate-600 leading-relaxed mb-3">{desc}</p>
            <div className="space-y-1.5">
                {examples.map((ex, i) => (
                    <div key={i} className={`flex items-center gap-2 ${s.exBg} rounded-lg px-3 py-1.5 text-[13px] text-slate-600 border`}>
                        <ChevronRight className={`w-3 h-3 ${s.exIcon} flex-shrink-0`} />
                        {ex}
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ================================================================
   LECTURER CONTENT
   ================================================================ */

function LecturerContent() {
    return (
        <div>
            {/* Intro card */}
            <Reveal>
                <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-700 rounded-3xl p-6 text-white mb-12 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-36 h-36 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-white/15 backdrop-blur rounded-xl flex items-center justify-center">
                                <Puzzle className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-blue-200 text-[13px] font-medium">講師の皆さんへ</p>
                                <h2 className="text-xl font-bold">覚えることは5つだけ</h2>
                            </div>
                        </div>
                        <div className="space-y-1.5 mt-4">
                            {[
                                { icon: MessageCircle, text: "LINE通知を確認する" },
                                { icon: Users, text: "生徒ページを事前に確認する" },
                                { icon: CalendarDays, text: "テスト期間を理解する" },
                                { icon: ClipboardList, text: "テスト回収タスクに対応する" },
                                { icon: Edit3, text: "特記事項・共有事項を確認・登録する" },
                            ].map(({ icon: Icon, text }, i) => (
                                <div key={i} className="flex items-center gap-2.5 bg-white/10 backdrop-blur-sm rounded-xl px-3.5 py-2">
                                    <Icon className="w-3.5 h-3.5 text-blue-200 flex-shrink-0" />
                                    <span className="text-[15px] font-medium">{text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </Reveal>

            {/* ── Section 1: LINE通知 ── */}
            <Reveal>
                <SectionNum num={1} total={5} color="green" />
                <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">LINE通知を確認する</h3>
                <p className="text-slate-500 text-[15px] xl:text-[16px] leading-relaxed mb-8">
                    毎週月曜に届く自動通知で、今週の重要情報を1分で把握します。
                </p>
            </Reveal>
            <Reveal delay={80}>
                <StepCarousel
                    device="phone"
                    steps={[
                        {
                            image: "/images/5.png",
                            caption: "グループLINEに届く週次通知を確認。テスト情報や連絡事項がまとめて表示されます",
                            highlights: []
                        },
                        {
                            image: "/training/ss_line_notify_step2.png",
                            caption: "詳しく確認するには「詳細を見る」を押して認証パスコードでシステムに接続します。パスワードは、各校舎ごとのライン通知に毎回表示されています。",
                            highlights: []
                        },
                    ]}
                />
                <TipBox>
                    教室の共有情報、イベント、学校のテスト期間や問題回収タスク、生徒の個人の共有事項がLINEで確認できます。
                </TipBox>
            </Reveal>

            <SectionDivider />

            {/* ── Section 2: 生徒ページ ── */}
            <Reveal>
                <SectionNum num={2} total={5} color="blue" />
                <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">生徒ページを確認する</h3>
                <p className="text-slate-500 text-[15px] xl:text-[16px] leading-relaxed mb-8">
                    授業の前に1分だけ確認するだけで、<strong className="text-indigo-600">指導品質が劇的に変わります。</strong>
                </p>
            </Reveal>
            <Reveal delay={80}>
                <StepCarousel
                    device="pc"
                    steps={[
                        {
                            image: "/training/ss_student_page_step1.png",
                            caption: "PCの座席表から、担当する生徒の個人ページを開きます",
                            highlights: []
                        },
                        {
                            image: "/images/3.png",
                            caption: "Chrome拡張機能から、その生徒の個人の予定や特記事項を素早く確認します",
                            highlights: []
                        },
                        {
                            image: "/images/4.png",
                            caption: "実際に登録されている特記事項や共有事項を確認し、授業に活かします（例：面談記録の詳細）",
                            highlights: []
                        },
                    ]}
                />
            </Reveal>
            <Reveal delay={120}>
                <div className="mt-6 mb-4">
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-indigo-400 to-blue-400" />
                        <h4 className="font-bold text-slate-800 mb-5 flex items-center gap-2 text-[17px]">
                            <Monitor className="w-5 h-5 text-indigo-500" />
                            座席表のマークが表示される基準
                        </h4>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="w-9 h-9 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0 mt-0.5 border border-yellow-200">
                                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800 text-[15px] mb-0.5">特記事項・共有・イベントマーク（黄色）</p>
                                    <p className="text-[14px] text-slate-500 leading-relaxed">生徒の特記事項、共有事項、またはイベントがある場合に点灯します。授業前に必ず内容を確認してください。</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5 border border-emerald-200">
                                    <Calendar className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800 text-[15px] mb-0.5">定期テストマーク（緑色）</p>
                                    <p className="text-[14px] text-slate-500 leading-relaxed">1ヶ月以内に定期テストが控えている生徒に点灯します。テスト対策への切り替え時期の目安になります。</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <ClipboardList className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800 text-[15px] mb-0.5">テスト回収マーク（紫色）</p>
                                    <p className="text-[14px] text-slate-500 leading-relaxed">回収対象であるテストが終了すると、点灯します。対象の生徒から実際の問題用紙と解答用紙を回収し、スキャンして完了報告をするまで点灯し続けます。</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5 border border-blue-200">
                                    <UserPlus className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800 text-[15px] mb-0.5">新規入会者マーク（青色）</p>
                                    <p className="text-[14px] text-slate-500 leading-relaxed">新規入会したばかりの生徒に、拡張機能の座席表で青色の枠（またはマーク）が表示されます。積極的な声掛けやフォローを行うための目印となります。</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Reveal>

            <SectionDivider />

            {/* ── Section 3: テスト期間 ── */}
            <Reveal>
                <SectionNum num={3} total={5} color="orange" />
                <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">テスト日程を確認、登録をする。</h3>
                <p className="text-slate-500 text-[15px] xl:text-[16px] leading-relaxed mb-8">
                    カレンダーからテスト日程を確認し、未登録の場合は登録します。
                </p>
            </Reveal>
            <Reveal delay={80}>
                <ToggleableStepCarousel
                    pcSteps={[
                        {
                            image: "/images/6.png",
                            caption: "カレンダーからテスト日程を確認し、未登録の場合は登録します",
                            highlights: []
                        },
                        {
                            image: "/images/25.png",
                            caption: "未設定の学校がある場合は「＋追加」からテスト日程を登録します",
                            highlights: []
                        }
                    ]}
                    phoneSteps={[
                        {
                            image: "/images/8.png",
                            caption: "ウェブページのテストのタブからテスト期間を確認できます",
                            highlights: []
                        },
                        {
                            image: "/images/9.png",
                            caption: "テスト期間を登録したいときは、追加のボタンを選択します",
                            highlights: []
                        },
                        {
                            image: "/images/10.png",
                            caption: "テスト名とテスト期間を入力します。（※テスト問題、解答回収についてはここで登録する必要はありません）",
                            highlights: []
                        },
                    ]}
                />                <TipBox>
                    テスト期間を設定しておくと、ラインや座席表で直近のテストをお知らせしてくれます。
                </TipBox>
            </Reveal>

            <SectionDivider />

            {/* ── Section 4: テスト回収 ── */}
            <Reveal>
                <SectionNum num={4} total={5} color="rose" />
                <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">テスト回収に対応する</h3>
                <p className="text-slate-500 text-[15px] xl:text-[16px] leading-relaxed mb-8">
                    テスト終了後、対象の学校からテスト問題と解答を回収し、Googleドライブに保存したらここで報告。
                </p>
            </Reveal>
            <Reveal delay={80}>
                <ToggleableStepCarousel
                    pcSteps={[
                        {
                            image: "/images/11.png",
                            caption: "座席表でテスト回収マーク（紫色）が点灯している生徒を確認し、問題用紙と解答用紙を回収します",
                            highlights: []
                        },
                        {
                            image: "/images/22.png",
                            caption: "回収後は教室情報パネル等から、テスト回収の完了報告ページへ進みます",
                            highlights: []
                        },
                        {
                            image: "/images/23.png",
                            caption: "回収した教科を見ながらスキャンし、Googleドライブに保存して報告を完了します",
                            highlights: []
                        },
                    ]}
                    phoneSteps={[
                        {
                            image: "/images/12.png",
                            caption: "テスト回収のタスクがライン通知で届きます",
                            highlights: []
                        },
                        {
                            image: "/images/13.png",
                            caption: "テスト回収のタブに飛んで、学校を選択します",
                            highlights: []
                        },
                        {
                            image: "/images/14.png",
                            caption: "回収した問題や解答を登録してください（問題と解答を個別に回収もできます）",
                            highlights: []
                        },
                    ]}
                />
            </Reveal>
            <TipBox>
                基本は主任講師がテストの回収を行います。手が空いている先生は協力をお願いします。テストの回収の仕方はお尋ねください。
            </TipBox>
            <SectionDivider />

            {/* ── Section 5: 共有事項・特記事項の登録 ── */}
            <Reveal>
                <SectionNum num={5} total={5} color="purple" />
                <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">共有事項を登録する</h3>
                <p className="text-slate-500 text-[15px] xl:text-[16px] leading-relaxed mb-8">
                    気づいたことは積極的に記録し、他の講師へ適切に引き継ぎましょう。
                </p>
            </Reveal>
            <Reveal delay={80}>
                <ToggleableStepCarousel
                    pcSteps={[
                        {
                            image: "/images/24.png",
                            caption: "生徒個人の情報ページより、生徒についての共有事項やワーク進捗を追加します",
                            highlights: []
                        },
                        {
                            image: "/images/26.png",
                            caption: "指導共有事項（学習指導メモや特記事項）、生徒のイベントを登録して、次の講師に引き継ぎます",
                            highlights: []
                        },
                    ]}
                    phoneSteps={[
                        {
                            image: "/images/20.png",
                            caption: "スマホの生徒詳細ページから、生徒についての情報を追加します",
                            highlights: []
                        },
                        {
                            image: "/images/21.png",
                            caption: "タップしてイベント、特記事項、共有事項を入力します",
                            highlights: []
                        },
                    ]}
                />
            </Reveal>
            <Reveal delay={120}>
                <div className="mt-6 mb-4 space-y-3">
                    <DifferenceCard
                        icon={Star}
                        title="特記事項（長期的・固定的な情報）"
                        desc="ずっと表示され続ける、全講師が常に把握し、指導の前提にすべき情報です。"
                        examples={["○○大学に指定校推薦で進学希望", "やる気がないときは○○をするとやるようになります", "保護者が厳しめの指導を望んでいる"]}
                        color="amber"
                    />
                    <DifferenceCard
                        icon={Megaphone}
                        title="共有事項（短期的な引き継ぎ）"
                        desc="直近の出来事や一時的な引き継ぎです。表示期間を過ぎると自動で非表示になります。"
                        examples={["フォレスタの答えをなくしたようなので見つかったら渡す", "テストの個表を持ってきたらコピーする"]}
                        color="purple"
                    />
                </div>
                <div className="mt-4">
                    <TipBox>
                        些細なことでも構いません。<strong>積極的な記入が、次に担当する先生たちの大きな助け</strong>になり、教室全体の指導品質向上に繋がります。<br />

                    </TipBox>
                </div>
            </Reveal>

            {/* Lecturer complete */}
            <Reveal>
                <div className="mt-16 bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border border-blue-100 shadow-sm rounded-[2rem] p-8 md:p-10 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/40 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-100/30 rounded-full blur-xl -ml-8 -mb-8 pointer-events-none" />
                    {/* Sparkle decorations */}
                    {[["12%", "15%", "1.2s"], ["85%", "20%", "2.1s"], ["25%", "80%", "0.8s"], ["75%", "85%", "1.6s"], ["50%", "10%", "2.5s"]].map(([left, top, delay], i) => (
                        <div key={i} className="absolute w-2 h-2 pointer-events-none" style={{ left, top }}>
                            <div className="w-full h-full bg-indigo-300/60 rounded-full" style={{ animation: `sparkle 3s ease-in-out ${delay} infinite` }} />
                        </div>
                    ))}
                    <div className="relative z-10">
                        <CheckCircle2 className="w-12 h-12 text-blue-500 mx-auto mb-4 drop-shadow-sm animate-gentle-float" />
                        <h3 className="text-[20px] md:text-[22px] font-black text-slate-800 mb-2 tracking-tight">以上が講師の皆さんのタスクです</h3>
                        <p className="text-[15px] md:text-[16px] text-slate-600 font-bold leading-relaxed max-w-lg mx-auto mb-4">
                            毎週の習慣にすることで、生徒一人ひとりに最適なサポートが実現できます。
                        </p>
                        <p className="text-[14px] text-slate-500 font-medium max-w-lg mx-auto bg-white/60 p-3 rounded-xl border border-white">
                            これまでのすべては、<strong className="text-indigo-600">PCやスマホでサイトから登録する方法</strong>と、<strong className="text-purple-600">Chrome拡張機能から登録する</strong>2パターンがあります。ぜひご自身の状況に合わせて、都合がいいほうを選択して活用してください。
                        </p>
                    </div>
                </div>
            </Reveal>
        </div>
    );
}

/* ================================================================
   MANAGER CONTENT
   ================================================================ */

function ManagerContent() {
    return (
        <div>
            {/* Intro card */}
            <Reveal>
                <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-teal-700 rounded-3xl p-6 text-white mb-12 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-36 h-36 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-white/15 backdrop-blur rounded-xl flex items-center justify-center">
                                <Monitor className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-emerald-200 text-[13px] font-medium">室長・教室長の皆さんへ</p>
                                <h2 className="text-xl font-bold">管理する項目は3つ</h2>
                            </div>
                        </div>
                        <p className="text-emerald-100 text-[15px] leading-relaxed mb-4">
                            登録作業はすべて<strong className="text-white">教室のPC</strong>で完結します。
                            登録すれば、ダッシュボード・LINE通知・座席表に自動反映されます。
                        </p>
                        <div className="space-y-1.5">
                            {[
                                { icon: Megaphone, text: "教室全体の連絡事項・イベントを登録する" },
                                { icon: UserPlus, text: "生徒情報の追加・管理を行う" },
                            ].map(({ icon: Icon, text }, i) => (
                                <div key={i} className="flex items-center gap-2.5 bg-white/10 backdrop-blur-sm rounded-xl px-3.5 py-2">
                                    <Icon className="w-3.5 h-3.5 text-emerald-200 flex-shrink-0" />
                                    <span className="text-[15px] font-medium">{text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </Reveal>

            {/* ── Section 1: 連絡事項・イベント ── */}
            <Reveal>
                <SectionNum num={1} total={2} color="purple" />
                <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">教室全体の連絡事項・イベントを登録する</h3>
                <p className="text-slate-500 text-[15px] xl:text-[16px] leading-relaxed mb-8">
                    座席表から教室全体のイベントや共有事項を登録します。<strong className="text-indigo-600">ここに登録すると、全講師のLINE通知に自動配信されます。</strong>
                </p>
            </Reveal>
            <Reveal delay={80}>
                <ToggleableStepCarousel
                    pcSteps={[
                        {
                            image: "/images/17.png",
                            caption: "座席表ページの右側にある「教室情報パネル」を開きます",
                            highlights: []
                        },
                        {
                            image: "/images/27.png",
                            caption: "ここで教室全体のイベントや、短期の連絡・共有事項を登録します",
                            highlights: []
                        },
                    ]}
                    phoneSteps={[
                        {
                            image: "/images/18.png",
                            caption: "スマホメニューから「教室情報」や「お知らせ」を開きます",
                            highlights: []
                        },
                        {
                            image: "/images/19.png",
                            caption: "スマホからも同様にイベントや短期の連絡事項を登録できます",
                            highlights: []
                        },
                    ]}
                />
                <TipBox>
                    重要度を「<strong>重要</strong>」に設定すると、講師のダッシュボードやLINEで赤色でハイライトされ、見落としを確実に防ぎます
                </TipBox>
            </Reveal>

            <SectionDivider />

            {/* ── Section 2: 生徒管理 ── */}
            <Reveal>
                <SectionNum num={2} total={2} color="emerald" />
                <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">生徒情報の追加・管理</h3>
                <p className="text-slate-500 text-[15px] xl:text-[16px] leading-relaxed mb-8">
                    塾マネのデータをそのまま活用。入退塾の変更に合わせて、定期的なインポートを行いましょう。
                </p>
            </Reveal>
            <Reveal delay={80}>
                <StepCarousel
                    device="pc"
                    steps={[
                        {
                            image: "/images/15.png",
                            caption: "塾マネから、最新の生徒情報のCSVをダウンロードします",
                            highlights: []
                        },
                        {
                            image: "/images/16.png",
                            caption: "教室サポートの「生徒」ページ右上の「インポート」からCSVをアップロードします",
                            highlights: []
                        },
                    ]}
                />
                <ImportantBox>
                    CSVに含まれていない生徒は自動的に「退塾」扱いになります（過去のデータは削除されません）。情報のズレを防ぐため、<strong>月1回の定期更新</strong>を推奨します。
                </ImportantBox>
            </Reveal>

            {/* Manager complete */}
            <Reveal>
                <div className="mt-16 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-100 shadow-sm rounded-[2rem] p-8 md:p-10 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/40 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-100/30 rounded-full blur-xl -ml-8 -mb-8 pointer-events-none" />

                    <div className="relative z-10">
                        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4 drop-shadow-sm animate-gentle-float" />
                        <h3 className="text-[20px] md:text-[22px] font-black text-slate-800 mb-2 tracking-tight">以上が管理業務のすべてです</h3>
                        <p className="text-[15px] md:text-[16px] text-slate-600 font-bold leading-relaxed max-w-lg mx-auto">
                            「マネジメントのためにシステムを覚える」のではなく、「登録すれば、あとはシステムがすべて自動でやる」のが教室サポートの設計思想です。
                        </p>
                    </div>
                </div>
            </Reveal>
        </div>
    );
}

/* ================================================================
   MAIN PAGE
   ================================================================ */

export default function TrainingPage() {
    const [role, setRole] = useState<"lecturer" | "manager">("lecturer");
    const [scrollProgress, setScrollProgress] = useState(0);

    useEffect(() => {
        const onScroll = () => {
            const h = document.documentElement;
            const scrollTop = h.scrollTop || document.body.scrollTop;
            const scrollHeight = h.scrollHeight - h.clientHeight;
            setScrollProgress(scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0);
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <Layout>
            <style dangerouslySetInnerHTML={{ __html: globalStyles }} />

            {/* Scroll progress bar */}
            <div className="fixed top-0 left-0 right-0 z-50 h-[3px] bg-transparent pointer-events-none">
                <div
                    className="h-full rounded-r-full"
                    style={{
                        width: `${scrollProgress}%`,
                        background: role === "lecturer"
                            ? "linear-gradient(90deg, #6366f1, #818cf8)"
                            : "linear-gradient(90deg, #10b981, #34d399)",
                        transition: "width 0.1s linear",
                        animation: scrollProgress > 0 ? "progressGlow 2s ease-in-out infinite" : "none",
                    }}
                />
            </div>

            <div className="max-w-4xl mx-auto pb-24 px-3 sm:px-6">
                {/* ── Hero ── */}
                <div className="relative pt-12 pb-10 px-4 mb-4 mt-4 rounded-[2.5rem] overflow-hidden bg-white shadow-[0_2px_40px_-12px_rgba(0,0,0,0.05)] border border-slate-100/50">
                    {/* Background blob effects */}
                    <div className="absolute top-0 -left-4 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob pointer-events-none" />
                    <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000 pointer-events-none" />
                    <div className="absolute -bottom-8 left-20 w-72 h-72 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000 pointer-events-none" />

                    <div className="relative z-10">
                        {/* Badge */}
                        <Reveal>
                            <div className="text-center mb-6">
                                <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-white/70 backdrop-blur-md border border-slate-200/80 shadow-sm transition-transform hover:scale-105 duration-300">
                                    <span className="flex h-2 w-2 rounded-full relative mr-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                                    </span>
                                    <span className="text-[13px] font-bold text-slate-600 tracking-widest">教室サポートシステム</span>
                                </div>
                            </div>
                        </Reveal>

                        {/* Headline */}
                        <Reveal delay={100}>
                            <div className="text-center mb-5">
                                <h1 className="text-[2rem] sm:text-[2.3rem] font-extrabold tracking-tight leading-[1.15] text-slate-900">
                                    登録するだけで、<br />
                                    <span
                                        className="text-transparent bg-clip-text animate-text-shimmer"
                                        style={{ backgroundImage: "linear-gradient(90deg, #4f46e5, #7c3aed, #6366f1, #a855f7, #4f46e5)" }}
                                    >あとは全部、自動。</span>
                                </h1>
                            </div>
                        </Reveal>

                        {/* Value Proposition */}
                        <Reveal delay={150}>
                            <div className="text-center mb-10">
                                <p className="text-slate-500 text-base leading-[1.8] max-w-[340px] mx-auto font-medium">
                                    教室と生徒の情報はすべてここに。<br />
                                    通知・座席表への反映が<strong className="text-slate-700">すべて自動</strong>で完了。<br />
                                    <span className="text-slate-400 text-base">口頭伝達・書き置き・連絡漏れ、すべて過去のものになります。</span>
                                </p>
                            </div>
                        </Reveal>

                        {/* ── 3つのプラットフォーム連携図 ── */}
                        <Reveal delay={200}>
                            <div className="relative max-w-3xl mx-auto mb-16 text-center">
                                <h3 className="text-[13px] font-extrabold text-slate-400 mb-8 tracking-widest uppercase">3つのプラットフォームが自動で繋がる</h3>

                                <div className="flex flex-col md:flex-row items-stretch justify-center gap-4 md:gap-6 relative">
                                    {/* Web App */}
                                    <div className="relative z-10 flex-1 bg-white/95 backdrop-blur-md rounded-2xl p-5 shadow-md shadow-indigo-100/40 border border-indigo-50 flex flex-col items-center text-center transition duration-300 hover:scale-[1.03] hover:-translate-y-1">
                                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center border border-indigo-100/50 text-indigo-600 mb-3">
                                            <Monitor className="w-6 h-6" />
                                        </div>
                                        <h4 className="font-bold text-[17px] text-slate-800 mb-2 flex flex-col items-center gap-1.5">
                                            Webアプリ
                                            <span className="bg-indigo-100 text-indigo-700 text-[9px] px-2 py-0.5 rounded-full font-bold">登録・管理</span>
                                        </h4>
                                        <p className="text-[13px] text-slate-500 leading-relaxed">連絡・イベント・生徒情報の登録と、ダッシュボードでの全体把握</p>
                                    </div>

                                    {/* Arrow (Desktop: LeftRight, Mobile: UpDown) */}
                                    <div className="hidden md:flex items-center justify-center text-slate-300 animate-pulse">
                                        <ArrowLeftRight className="w-8 h-8" />
                                    </div>
                                    <div className="md:hidden flex justify-center py-1 text-slate-300 animate-pulse">
                                        <ArrowUpDown className="w-6 h-6" />
                                    </div>

                                    {/* LINE通知 */}
                                    <div className="relative z-10 flex-1 bg-white/95 backdrop-blur-md rounded-2xl p-5 shadow-md shadow-emerald-100/40 border border-emerald-50 flex flex-col items-center text-center transition duration-300 hover:scale-[1.03] hover:-translate-y-1">
                                        <div className="w-12 h-12 bg-[#E1F5EB] rounded-2xl flex items-center justify-center border border-[#b2e8cd] text-emerald-600 mb-3">
                                            <MessageCircle className="w-6 h-6" />
                                        </div>
                                        <h4 className="font-bold text-[17px] text-slate-800 mb-2 flex flex-col items-center gap-1.5">
                                            LINE自動通知
                                            <span className="bg-[#E1F5EB] text-emerald-700 text-[9px] px-2 py-0.5 rounded-full font-bold">自動配信</span>
                                        </h4>
                                        <p className="text-[13px] text-slate-500 leading-relaxed">テスト情報・連絡事項・イベントを毎週スマホへ自動プッシュ</p>
                                    </div>

                                    {/* Arrow (Desktop: LeftRight, Mobile: UpDown) */}
                                    <div className="hidden md:flex items-center justify-center text-slate-300 animate-pulse">
                                        <ArrowLeftRight className="w-8 h-8" />
                                    </div>
                                    <div className="md:hidden flex justify-center py-1 text-slate-300 animate-pulse">
                                        <ArrowUpDown className="w-6 h-6" />
                                    </div>

                                    {/* Chrome拡張機能 */}
                                    <div className="relative z-10 flex-1 bg-white/95 backdrop-blur-md rounded-2xl p-5 shadow-md shadow-amber-100/40 border border-amber-50 flex flex-col items-center text-center transition duration-300 hover:scale-[1.03] hover:-translate-y-1">
                                        <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center border border-amber-100/50 text-amber-500 mb-3">
                                            <LayoutTemplate className="w-6 h-6" />
                                        </div>
                                        <h4 className="font-bold text-[17px] text-slate-800 mb-2 flex flex-col items-center gap-1.5">
                                            塾マネ拡張
                                            <span className="bg-amber-100 text-amber-700 text-[9px] px-2 py-0.5 rounded-full font-bold">シームレス</span>
                                        </h4>
                                        <p className="text-[13px] text-slate-500 leading-relaxed">座席表に共有事項・テスト回収アラートを自動で重ねて表示</p>
                                    </div>
                                </div>
                            </div>
                        </Reveal>

                        {/* ── できること一覧 ── */}
                        <Reveal delay={250}>
                            <div className="max-w-3xl mx-auto mb-10">
                                <h3 className="text-[13px] font-extrabold text-slate-400 mb-6 tracking-widest text-center uppercase">このシステムでできること</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                                    {[
                                        { icon: MessageCircle, label: "LINE週次レポート", desc: "テスト・連絡・イベントを毎週自動配信", color: "emerald" },
                                        { icon: Users, label: "生徒情報の共有", desc: "共有事項や生徒のイベントを引き継ぎ", color: "blue" },
                                        { icon: CalendarDays, label: "テスト日程管理", desc: "各学校のテスト期間をカレンダーで一括管理", color: "orange" },
                                        { icon: ClipboardList, label: "テスト回収管理", desc: "未回収テストの生徒を自動追跡・表示", color: "red" },
                                        { icon: Megaphone, label: "教室連絡事項", desc: "重要度と期間付きで、LINE・座席表に自動反映", color: "purple" },
                                        { icon: Calendar, label: "イベント管理", desc: "英検・講習・模試をLINE通知と連動管理", color: "indigo" },
                                    ].map(({ icon: Icon, label, desc, color }, i) => (
                                        <div key={i} className={`bg-white rounded-2xl p-4 md:p-5 border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.1)] transition-all duration-300 hover:-translate-y-1 group`}>
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110 ${color === "emerald" ? "bg-emerald-50 text-emerald-600" :
                                                color === "blue" ? "bg-blue-50 text-blue-600" :
                                                    color === "orange" ? "bg-orange-50 text-orange-500" :
                                                        color === "red" ? "bg-red-50 text-red-500" :
                                                            color === "purple" ? "bg-purple-50 text-purple-600" :
                                                                "bg-indigo-50 text-indigo-600"
                                                }`}>
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <h4 className="font-bold text-[15px] md:text-base text-slate-800 mb-1.5 leading-tight">{label}</h4>
                                            <p className="text-[13px] md:text-[14px] text-slate-500 leading-relaxed">{desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Reveal>

                        {/* ── Select your role ── */}
                        <Reveal delay={300}>
                            <div className="flex flex-col items-center justify-center gap-2 mb-2 text-center">
                                <p className="text-base font-bold text-slate-500">あなたの役割を選んで、操作方法を確認しましょう</p>
                                <ChevronRight className="w-4 h-4 text-slate-300 transform rotate-90 animate-bounce" />
                            </div>
                        </Reveal>
                    </div>
                </div>

                {/* ── Sticky tab ── */}
                <div className="sticky top-0 z-30 py-2.5 -mx-1 px-1 mb-10"
                    style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}>
                    <div className="flex gap-1.5 bg-slate-100/80 rounded-2xl p-1 max-w-xs mx-auto">
                        {([
                            { key: "lecturer" as const, icon: Puzzle, label: "講師向け", active: "text-blue-700 shadow-lg shadow-blue-100/50" },
                            { key: "manager" as const, icon: Monitor, label: "室長向け", active: "text-emerald-700 shadow-lg shadow-emerald-100/50" },
                        ]).map(({ key, icon: Icon, label, active }) => (
                            <button
                                key={key}
                                onClick={() => setRole(key)}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-[15px] transition-all duration-200 ${role === key ? `bg-white ${active}` : "text-slate-400"
                                    }`}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Content ── */}
                <div key={role} className="animate-tab-slide-in">
                    {role === "lecturer" ? <LecturerContent /> : <ManagerContent />}
                </div>

                {/* ── Footer ── */}
                <Reveal>
                    <div className="mt-16 pb-8">
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 mb-3">
                                <MessageCircle className="w-4.5 h-4.5 text-slate-400" />
                            </div>
                            <p className="text-[14px] text-slate-500 font-medium mb-1">ご不明な点はお気軽にお問い合わせください</p>
                            <p className="text-[12px] text-slate-400">教室サポートチームがサポートいたします</p>
                        </div>
                        <div className="mt-6 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
                        <p className="text-center text-[11px] text-slate-300 mt-4">教室サポートシステム</p>
                    </div>
                </Reveal>
            </div>
        </Layout>
    );
}
