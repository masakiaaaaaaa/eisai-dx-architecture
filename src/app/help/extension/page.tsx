"use client";

import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Download, AlertCircle, Copy, Terminal, Monitor, HelpCircle, Puzzle, ArrowLeft, ShieldCheck } from "lucide-react";
import React, { useState } from "react";
import Link from "next/link";

export default function ExtensionHelpPage() {
    const [copied, setCopied] = useState(false);

    return (
        <Layout>
            <div className="max-w-4xl mx-auto space-y-8 pb-12">
                <div className="flex items-center gap-4 animate-fade-in-up">
                    <Link href="/help">
                        <Button variant="ghost" className="gap-2">
                            <ArrowLeft className="w-4 h-4" />
                            ヘルプTOPへ戻る
                        </Button>
                    </Link>
                </div>

                <div className="text-center space-y-4 animate-fade-in-up">
                    <div className="inline-flex p-3 rounded-full bg-emerald-100 mb-2">
                        <Puzzle className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                        Chrome拡張機能の導入ガイド
                    </h1>
                    <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                        座席表上の生徒に「LINE未読」や「共有メモ」を表示するための<br />
                        ブラウザ拡張機能のインストール手順です。
                    </p>
                </div>

                {/* Prerequisite Section */}
                <Card className="border-amber-200 shadow-md animate-fade-in-up bg-amber-50">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-amber-800 text-lg">
                            <AlertCircle className="w-5 h-5" />
                            【重要】事前準備：本システムへのログイン
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-slate-700 space-y-2">
                        <p>
                            拡張機能が正しく動作するためには、<strong>同じブラウザ（Google Chrome）で本システムにログインしている状態</strong>であることが前提となります。
                        </p>
                        <p>
                            まだログインしていない場合は、先に以下のリンクからログインを済ませておいてください。<br />
                            <a href="https://eisai-api.vercel.app/" target="_blank" className="text-blue-600 hover:text-blue-800 underline font-bold">
                                👉 システムへログインする (https://eisai-api.vercel.app/)
                            </a>
                        </p>
                    </CardContent>
                </Card>

                {/* Download Section */}
                <Card className="border-emerald-100 shadow-lg overflow-hidden animate-fade-in-up stagger-1">
                    <CardHeader className="bg-emerald-50/50 border-b border-emerald-100">
                        <CardTitle className="flex items-center gap-2 text-emerald-900">
                            <Download className="w-5 h-5" />
                            1. 拡張機能のダウンロード
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            <div className="flex-1 text-center md:text-left space-y-4">
                                <p className="text-slate-700 font-medium">
                                    以下のボタンをクリックして、最新の拡張機能（ZIP形式）をダウンロードしてください。
                                </p>
                                <a href="/downloads/jukmane-extension-v1.3.94.zip" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded transition text-center shadow-lg">
                                    拡張機能をダウンロード (v1.3.94)
                                </a>
                                <div className="text-center bg-blue-100 text-blue-800 text-sm font-bold py-2 px-3 rounded mt-2">
                                    夕休み等の休憩行を無視して連続コマを厳密に判定し、空きコマを挟む場合は優先設定を正確に適用するよう修正 (v1.3.94)
                                </div>
                                <p className="text-slate-500 text-xs text-center mt-2 font-mono">
                                    ファイル名: <code>jukmane-extension-v1.3.94.zip</code>
                                </p>
                            </div>
                            <div className="flex-1 bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm text-slate-600 space-y-2">
                                <p className="font-bold text-slate-800">⚠️ ダウンロード後の注意</p>
                                <p>ダウンロードしたZIPファイルは、そのままでは使えません。</p>
                                <p>必ず <strong>右クリック → 「すべて展開」</strong> を行い、普通のフォルダの状態にしてから次の手順へ進んでください。</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Installation Steps */}
                <Card className="border-slate-200 shadow-md animate-fade-in-up stagger-2">
                    <CardHeader className="bg-slate-50 border-b border-slate-100">
                        <CardTitle className="flex items-center gap-2 text-slate-800">
                            <Monitor className="w-5 h-5" />
                            2. ブラウザへの登録手順
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="space-y-6">
                            {[
                                { title: "拡張機能画面を開く", desc: "Chromeのアドレスバーに `chrome://extensions` と入力するか、右上の「パズルアイコン🧩」→「拡張機能を管理」を開きます。" },
                                { title: "デベロッパーモードをONにする", desc: "画面右上にある「デベロッパーモード」というスイッチをONに切り替えます。" },
                                { title: "フォルダを読み込む", desc: "左上に現れる「パッケージ化されていない拡張機能を読み込む」ボタンを押し、先ほど展開した `jukmane-extension` フォルダを選択します。" },
                                { title: "アクセス権限の許可（重要）", desc: "追加されたカードの「詳細」ボタンを押し、「ファイルの URL へのアクセスを許可する」をONにします。" }
                            ].map((step, i) => (
                                <div key={i} className="flex gap-4">
                                    <div className="flex-none flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold">
                                        {i + 1}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800">{step.title}</h4>
                                        <p className="text-slate-600 text-sm mt-1">{step.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Security / FAQ */}
                <Card className="border-blue-100 shadow-md animate-fade-in-up stagger-3 bg-blue-50/30">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-blue-900">
                            <ShieldCheck className="w-5 h-5" />
                            データセキュリティと教室の分離について
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <div className="space-y-2">
                            <h4 className="font-bold text-slate-800">Q. 他の教室の生徒情報が混ざることはありませんか？</h4>
                            <p className="text-slate-700 leading-relaxed">
                                <strong>A. いいえ、混ざることはありません。</strong>
                            </p>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                この拡張機能は、<strong>「今あなたの画面に表示されている生徒」の情報だけ</strong>を読み取りに行きます。<br />
                                システム（Jukmane）にログインした状態で座席表を開くと、あなたの教室の生徒だけが表示されますよね。<br />
                                拡張機能はその表示された生徒に対してのみ、「この生徒のLINE状況はどうですか？」とサーバーに問い合わせを行います。<br />
                                そのため、画面に表示されていない（＝権限のない）他の教室の生徒情報には一切アクセスせず、混在することもありませんのでご安心ください。
                            </p>
                        </div>
                    </CardContent>
                </Card>

            </div>
        </Layout >
    );
}
