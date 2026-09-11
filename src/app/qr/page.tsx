"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Smartphone, Download, Share2 } from "lucide-react";

export default function QRCodePage() {
    const [mounted, setMounted] = useState(false);
    const dashboardUrl = "https://eisai-api.vercel.app/dashboard";

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-slate-100 flex items-center justify-center">
                <div className="animate-pulse text-slate-400">読み込み中...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-slate-100 flex flex-col items-center justify-center p-8">
            {/* Header */}
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-slate-800 mb-2">
                    📱 スマホでアクセス
                </h1>
                <p className="text-slate-500">
                    QRコードをスキャンしてダッシュボードを開く
                </p>
            </div>

            {/* QR Code Card */}
            <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8">
                <div className="bg-white p-4 rounded-2xl border-4 border-indigo-100">
                    <QRCodeSVG
                        value={dashboardUrl}
                        size={280}
                        level="H"
                        includeMargin={true}
                        fgColor="#1e293b"
                        bgColor="#ffffff"
                    />
                </div>
            </div>

            {/* Instructions */}
            <div className="max-w-md space-y-4 text-center">
                <div className="flex items-center justify-center gap-3 text-slate-600">
                    <Smartphone className="w-5 h-5 text-indigo-500" />
                    <span>スマホのカメラでスキャン</span>
                </div>

                <div className="bg-indigo-50 rounded-2xl p-6 space-y-3">
                    <h3 className="font-bold text-indigo-900 flex items-center justify-center gap-2">
                        <Download className="w-5 h-5" />
                        ホーム画面に追加する方法
                    </h3>
                    <ol className="text-left text-sm text-indigo-800 space-y-2">
                        <li className="flex gap-2">
                            <span className="font-bold">1.</span>
                            <span>ダッシュボードを開く</span>
                        </li>
                        <li className="flex gap-2">
                            <span className="font-bold">2.</span>
                            <span>
                                <Share2 className="w-4 h-4 inline-block mr-1" />
                                共有ボタンをタップ
                            </span>
                        </li>
                        <li className="flex gap-2">
                            <span className="font-bold">3.</span>
                            <span>「ホーム画面に追加」を選択</span>
                        </li>
                    </ol>
                </div>

                <p className="text-xs text-slate-400 mt-4">
                    URL: {dashboardUrl}
                </p>
            </div>
        </div>
    );
}
