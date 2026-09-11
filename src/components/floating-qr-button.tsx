"use client";

import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { X, Smartphone, QrCode } from "lucide-react";

export function FloatingQRButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [currentUrl, setCurrentUrl] = useState("");

    const handleOpen = () => {
        setCurrentUrl(window.location.href);
        setIsOpen(true);
    };

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={handleOpen}
                className="fixed bottom-6 right-6 z-50 md:bottom-8 md:right-8 
                    w-14 h-14 rounded-2xl 
                    bg-gradient-to-br from-amber-400 to-orange-500
                    shadow-lg shadow-amber-500/30
                    flex items-center justify-center
                    transition-all duration-300 ease-out
                    hover:scale-110 hover:shadow-xl hover:shadow-amber-500/40
                    active:scale-95
                    group"
                title="このページのQRコードを表示"
            >
                <QrCode className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />

                {/* Pulse Ring */}
                <span className="absolute inset-0 rounded-2xl animate-ping bg-amber-400 opacity-20" />
            </button>

            {/* Modal Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4
                        bg-slate-900/80 backdrop-blur-md
                        animate-fade-in"
                    onClick={() => setIsOpen(false)}
                >
                    {/* Modal Card */}
                    <div
                        className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8
                            animate-scale-in
                            relative overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Decorative Gradient */}
                        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-amber-100 to-orange-100 -z-10" />

                        {/* Close Button */}
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-4 right-4 p-2 rounded-xl
                                bg-white/80 hover:bg-slate-100
                                transition-colors"
                        >
                            <X className="w-5 h-5 text-slate-500" />
                        </button>

                        {/* Header */}
                        <div className="text-center mb-6">
                            <div className="inline-flex items-center justify-center w-16 h-16 
                                bg-gradient-to-br from-amber-400 to-orange-500
                                rounded-2xl shadow-lg shadow-amber-500/30 mb-4">
                                <Smartphone className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-1">
                                📱 スマホでアクセス
                            </h3>
                            <p className="text-sm text-slate-500">
                                QRコードをスキャンしてこのページを開く
                            </p>
                        </div>

                        {/* QR Code */}
                        <div className="bg-white rounded-2xl p-6 border-2 border-dashed border-slate-200 mb-6
                            flex items-center justify-center">
                            <QRCodeSVG
                                value={currentUrl}
                                size={200}
                                level="H"
                                includeMargin={false}
                                fgColor="#1e293b"
                                bgColor="#ffffff"
                            />
                        </div>

                        {/* URL Display */}
                        <div className="bg-slate-50 rounded-xl p-3 mb-6">
                            <p className="text-xs text-slate-400 mb-1">現在のページ</p>
                            <p className="text-sm text-slate-600 font-mono truncate">
                                {currentUrl.replace("https://", "").replace("http://", "")}
                            </p>
                        </div>

                        {/* Tip */}
                        <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                            <p className="text-sm text-amber-800 text-center">
                                💡 <strong>ヒント:</strong> スキャン後、<br />
                                「ホーム画面に追加」でいつでもアクセス可能！
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
