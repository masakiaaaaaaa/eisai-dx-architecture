"use client";

import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Download, AlertCircle, Copy, Terminal, Monitor, HelpCircle, ExternalLink, Puzzle } from "lucide-react";
import React, { useState } from "react";
import Link from "next/link";

export default function HelpPage() {
    const [campuses, setCampuses] = useState<any[]>([]);
    const [selectedCampus, setSelectedCampus] = useState<string>("1");
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    React.useEffect(() => {
        fetch('/api/campuses')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setCampuses(data);
                    if (data.length > 0) setSelectedCampus(String(data[0].id));
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const installCommand = `$env:EisaiCampusId=${selectedCampus}; irm https://eisai-api.vercel.app/Install.ps1 | iex`;

    const copyCommand = () => {
        navigator.clipboard.writeText(installCommand);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Layout>
            <div className="max-w-4xl mx-auto space-y-8 pb-12">
                <div className="text-center space-y-4 animate-fade-in-up">
                    <h1 className="text-4xl font-bold tracking-tight text-slate-900">
                        Eisai 通知ウィジェット
                    </h1>
                    <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                        お知らせ、イベント、テスト回収情報をデスクトップに常時表示。<br />
                        パソコンを開くだけで、最新の情報を確認できます。
                    </p>
                </div>

                {/* Step 1: Rainmeter */}
                <Card className="border-blue-100 shadow-md overflow-hidden card-hover animate-fade-in-up stagger-1">
                    <CardHeader className="bg-blue-50/50 border-b border-blue-100">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-100 p-2 rounded-lg">
                                <Download className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <CardTitle className="text-xl text-blue-900">
                                    ステップ1: Rainmeter の準備
                                </CardTitle>
                                <CardDescription>
                                    まずベースとなるソフト「Rainmeter（レインメーター）」をインストールします。
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <div className="font-bold text-slate-700 flex items-center gap-2">
                                    <Badge className="bg-blue-500">1</Badge>
                                    公式サイトへ
                                </div>
                                <p className="text-sm text-slate-600">
                                    以下のリンクをクリックして公式サイトを開きます。
                                </p>
                                <a
                                    href="https://www.rainmeter.net/"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-blue-600 hover:underline text-sm font-medium"
                                >
                                    https://www.rainmeter.net/ <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>
                            <div className="space-y-2">
                                <div className="font-bold text-slate-700 flex items-center gap-2">
                                    <Badge className="bg-blue-500">2</Badge>
                                    ダウンロード
                                </div>
                                <p className="text-sm text-slate-600">
                                    画面にある青色の <strong>Download</strong> ボタンをクリックして保存します。
                                </p>
                            </div>
                            <div className="space-y-2">
                                <div className="font-bold text-slate-700 flex items-center gap-2">
                                    <Badge className="bg-blue-500">3</Badge>
                                    インストール
                                </div>
                                <p className="text-sm text-slate-600">
                                    「日本語」→「標準インストール」の順に進めて完了させます。デスクトップ右下に水滴アイコンが出ればOKです。
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Step 2: Widget Install */}
                <Card className="border-indigo-100 shadow-md overflow-hidden card-hover animate-fade-in-up stagger-2">
                    <CardHeader className="bg-indigo-50/50 border-b border-indigo-100">
                        <div className="flex items-center gap-3">
                            <div className="bg-indigo-100 p-2 rounded-lg">
                                <Terminal className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div>
                                <CardTitle className="text-xl text-indigo-900">
                                    ステップ2: ウィジェットのインストール
                                </CardTitle>
                                <CardDescription>
                                    PowerShellを使って一発でセットアップします。
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        {/* Campus Selection */}
                        <div className="bg-white p-4 rounded-lg border border-slate-200">
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                表示する教室（キャンパス）を選択
                            </label>
                            <select
                                value={selectedCampus}
                                onChange={(e) => setSelectedCampus(e.target.value)}
                                className="w-full md:w-64 p-2 border border-slate-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                disabled={loading}
                            >
                                {loading && <option>読み込み中...</option>}
                                {campuses.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                            <p className="text-xs text-slate-500 mt-2">
                                ※ 選択した教室の情報がウィジェットに表示されます。
                            </p>
                        </div>

                        <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm text-white relative group">
                            <div className="absolute top-3 right-3">
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    className="h-8 text-xs bg-slate-700 hover:bg-slate-600 text-white border-0"
                                    onClick={copyCommand}
                                >
                                    {copied ? <CheckCircle2 className="w-4 h-4 mr-1 text-green-400" /> : <Copy className="w-4 h-4 mr-1" />}
                                    {copied ? "コピーしました" : "コマンドをコピー"}
                                </Button>
                            </div>
                            <p className="text-slate-400 mb-2"># 以下のコマンドをコピーして実行してください</p>
                            <p className="select-all pr-32 break-all">{installCommand}</p>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                                <Monitor className="w-4 h-4" />
                                手順の詳細
                            </h4>
                            <ol className="list-decimal list-inside space-y-2 text-sm text-slate-600 ml-2">
                                <li>キーボードの <strong>Windowsキー</strong> を押して、「<strong>powershell</strong>」と入力</li>
                                <li>出てきた「<strong>Windows PowerShell</strong>」をクリックして起動</li>
                                <li>画面上で <strong>右クリック</strong> してコマンドを貼り付け</li>
                                <li><strong>Enterキー</strong> を押して実行</li>
                                <li>「完了」と出れば成功です。自動的にウィジェットが表示されます。</li>
                            </ol>
                        </div>
                    </CardContent>
                </Card>

                {/* Step 3: Chrome Extension */}
                <Link href="/help/extension">
                    <Card className="border-emerald-100 shadow-md overflow-hidden card-hover animate-fade-in-up stagger-3 cursor-pointer group hover:ring-2 hover:ring-emerald-400 transition-all">
                        <CardHeader className="bg-emerald-50/50 border-b border-emerald-100">
                            <div className="flex items-center gap-3">
                                <div className="bg-emerald-100 p-2 rounded-lg group-hover:bg-emerald-200 transition-colors">
                                    <Puzzle className="w-6 h-6 text-emerald-600" />
                                </div>
                                <div className="flex-1">
                                    <CardTitle className="text-xl text-emerald-900 flex items-center justify-between">
                                        ステップ3: Chrome拡張機能の導入
                                        <ExternalLink className="w-5 h-5 text-emerald-400 group-hover:text-emerald-600" />
                                    </CardTitle>
                                    <CardDescription>
                                        [必須] 座席表との連携機能をインストールします。（詳細ページへ移動）
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                    </Card>
                </Link>

                {/* Troubleshooting */}
                <div className="grid md:grid-cols-2 gap-6">
                    <Card className="card-hover animate-fade-in-up stagger-4">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <HelpCircle className="w-5 h-5 text-orange-500" />
                                表示されないときは？
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-slate-600 space-y-3">
                            <p>インストールしたのに画面に出ない場合は、手動でロードしてください。</p>
                            <ol className="list-decimal list-inside space-y-1 ml-2">
                                <li>タスクトレイの <strong>水滴アイコン</strong> をクリック</li>
                                <li>左側の一覧から <strong>Eisai</strong> フォルダを開く</li>
                                <li><strong>Final.ini</strong> を選択</li>
                                <li>右上の <strong>ロード</strong> ボタンをクリック</li>
                            </ol>
                        </CardContent>
                    </Card>

                    <Card className="card-hover animate-fade-in-up stagger-5">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-red-500" />
                                文字化けする場合
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-slate-600 space-y-3">
                            <p>文字がおかしい（□□□など）場合は、インストールが正しく行われていない可能性があります。</p>
                            <p>
                                ステップ2のコマンドをもう一度実行して、上書きインストールを試してください。
                                それでも直らない場合は、管理者にご連絡ください。
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="text-center pt-8 border-t border-slate-200">
                    <p className="text-sm text-slate-400">
                        Eisai API Widget Installer v1.0
                    </p>
                </div>
            </div>
        </Layout>
    );
}
