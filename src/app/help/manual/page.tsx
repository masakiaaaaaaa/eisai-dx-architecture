"use client";

import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Building2,
    Settings,
    MessageSquare,
    CalendarDays,
    Megaphone,
    FileCheck,
    AlertTriangle,
    ArrowRight,
    Users,
    Puzzle,
    BookOpen,
    Smartphone,
    Bot,
    FileSpreadsheet,
    Download,
    ExternalLink,
    Check,
    CheckCircle2,
    UserPlus,
    MessageCircle,
    Send,
    Sparkles,
    HelpCircle,
    Copy
} from "lucide-react";
import React, { useState } from "react";
import Link from "next/link";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../../components/ui/accordion";

// Helper component for copy button
function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <button
            onClick={handleCopy}
            className="ml-2 p-1 rounded hover:bg-slate-200 transition-colors"
            title="コピー"
        >
            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-slate-400" />}
        </button>
    );
}

export default function ManualPage() {
    return (
        <Layout>
            <div className="max-w-5xl mx-auto space-y-12 pb-24">

                {/* Hero */}
                <div className="text-center space-y-6 pt-12 pb-8">
                    <div className="inline-flex items-center justify-center p-4 bg-indigo-50 rounded-full mb-2 ring-1 ring-indigo-100">
                        <BookOpen className="w-10 h-10 text-indigo-600" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
                        教室開設・完全ガイド
                    </h1>
                    <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                        この手順通りに進めるだけで、<strong>LINE連携から講師への情報共有まで</strong>すべてのセットアップが完了します。<br />
                        <span className="text-indigo-600 font-bold">専門知識は一切不要です。</span>
                    </p>
                    <div className="flex flex-wrap justify-center gap-2 pt-4">
                        <Badge variant="secondary" className="text-sm px-3 py-1">⏱️ 所要時間：約30分</Badge>
                        <Badge variant="secondary" className="text-sm px-3 py-1">📋 全5ステップ</Badge>
                    </div>
                </div>

                {/* Table of Contents */}
                <Card className="border-indigo-100 bg-indigo-50/50">
                    <CardContent className="p-6">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <FileCheck className="w-5 h-5 text-indigo-600" />
                            目次（クリックでジャンプ）
                        </h3>
                        <ol className="grid md:grid-cols-2 gap-2 text-sm">
                            <li><a href="#step1" className="text-indigo-600 hover:underline flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center">1</span>
                                教室の「器」を作る（システム登録）
                            </a></li>
                            <li><a href="#step2" className="text-indigo-600 hover:underline flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-green-600 text-white text-xs flex items-center justify-center">2</span>
                                LINE公式アカウントの準備
                            </a></li>
                            <li><a href="#step3" className="text-indigo-600 hover:underline flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">3</span>
                                <strong>グループへの招待と動作確認</strong>
                            </a></li>
                            <li><a href="#step4" className="text-indigo-600 hover:underline flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center">4</span>
                                データの準備（生徒・テスト日程）
                            </a></li>
                            <li><a href="#step5" className="text-indigo-600 hover:underline flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-slate-700 text-white text-xs flex items-center justify-center">5</span>
                                講師向けツールの導入
                            </a></li>
                        </ol>
                    </CardContent>
                </Card>

                {/* =========== STEP 1: System Registration =========== */}
                <section className="scroll-mt-20" id="step1">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="flex flex-col items-center">
                            <span className="text-sm font-bold text-slate-400 mb-1">STEP</span>
                            <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center text-xl font-bold shadow-lg ring-4 ring-white">1</div>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">教室の「器」を作る</h2>
                            <p className="text-slate-500">まずはシステム上に教室を登録します。（LINE連携は後で行います）</p>
                        </div>
                    </div>

                    <Card className="border-slate-200 shadow-sm overflow-hidden">
                        <CardHeader className="bg-slate-50 border-b border-slate-100">
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-slate-600" />
                                管理画面での登録手順
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8">
                            <ol className="relative border-l border-slate-200 ml-3 space-y-8">
                                <li className="ml-6">
                                    <span className="absolute -left-3 flex items-center justify-center w-6 h-6 bg-slate-200 rounded-full ring-4 ring-white">
                                        <span className="text-xs font-bold text-slate-600">1</span>
                                    </span>
                                    <h3 className="font-bold text-slate-800 mb-1">管理者設定ページへ移動</h3>
                                    <p className="text-sm text-slate-600">
                                        左サイドメニューの一番下にある<strong>「設定 (管理画面)」</strong>をクリックし、管理者パスワードでログインします。
                                    </p>
                                </li>
                                <li className="ml-6">
                                    <span className="absolute -left-3 flex items-center justify-center w-6 h-6 bg-slate-200 rounded-full ring-4 ring-white">
                                        <span className="text-xs font-bold text-slate-600">2</span>
                                    </span>
                                    <h3 className="font-bold text-slate-800 mb-1">教室を追加する</h3>
                                    <p className="text-sm text-slate-600 mb-2">
                                        「教室一覧・追加」セクションで以下の2つだけ入力し、<strong>「教室を追加」</strong>ボタンを押してください。
                                    </p>
                                    <div className="bg-slate-100 p-4 rounded-lg text-sm border border-slate-200">
                                        <ul className="space-y-2">
                                            <li className="flex items-center gap-2">
                                                <span className="font-bold text-slate-700 w-20">教室名:</span>
                                                <span className="text-slate-600">例：池袋校</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <span className="font-bold text-slate-700 w-20">合言葉:</span>
                                                <span className="text-slate-600">講師がログイン時に使うパスワード（4文字以上）</span>
                                            </li>
                                        </ul>
                                    </div>
                                    <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3" />
                                        この時点では「LINE設定」欄は空欄のままでOKです！STEP 2の後で入力します。
                                    </p>
                                </li>
                            </ol>
                        </CardContent>
                    </Card>
                </section>

                {/* =========== STEP 2: LINE Setup =========== */}
                <section className="scroll-mt-20" id="step2">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="flex flex-col items-center">
                            <span className="text-sm font-bold text-green-600 mb-1">STEP</span>
                            <div className="w-12 h-12 rounded-full bg-green-600 text-white flex items-center justify-center text-xl font-bold shadow-lg ring-4 ring-white">2</div>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">LINE公式アカウントの準備</h2>
                            <p className="text-slate-500">ここが一番重要です。手順を一つずつ正確に行ってください。</p>
                        </div>
                    </div>

                    <Card className="border-green-100 shadow-lg overflow-hidden">
                        <CardHeader className="bg-green-50 border-b border-green-100">
                            <CardTitle className="text-green-800 flex items-center gap-2">
                                <MessageSquare className="w-5 h-5" />
                                設定フロー
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Accordion type="single" collapsible className="w-full">

                                {/* 2-1: Account Creation */}
                                <AccordionItem value="line-1" className="bg-white border-b border-slate-100">
                                    <AccordionTrigger className="px-8 py-6 hover:bg-slate-50 hover:no-underline group">
                                        <div className="flex items-center gap-4 text-left">
                                            <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-sm group-data-[state=open]:bg-green-600 group-data-[state=open]:text-white transition-colors">1</div>
                                            <div>
                                                <div className="font-bold text-slate-800 text-lg">LINE公式アカウントを作成</div>
                                                <div className="text-xs text-slate-500">まだ持っていない場合のみ</div>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="px-8 pb-8 pt-2 text-slate-600 space-y-4">
                                        <ol className="list-decimal list-inside space-y-3 text-sm">
                                            <li>
                                                <a href="https://www.linebiz.com/jp/entry/" target="_blank" className="text-indigo-600 font-bold hover:underline inline-flex items-center">
                                                    LINE for Business 公式サイト <ExternalLink className="w-3 h-3 ml-1" />
                                                </a>
                                                にアクセス
                                            </li>
                                            <li>「アカウントの開設（無料）」ボタンをクリック</li>
                                            <li>LINEアカウント または メールアドレス でログイン</li>
                                            <li>アカウント情報を入力：
                                                <ul className="list-disc list-inside ml-4 mt-2 text-slate-500">
                                                    <li>アカウント名：<strong>教室名（例：個別指導塾○○ 池袋校）</strong></li>
                                                    <li>業種：「教育・学習支援業」＞「学習塾」</li>
                                                </ul>
                                            </li>
                                            <li>「確認」→「完了」でアカウント作成完了</li>
                                        </ol>
                                    </AccordionContent>
                                </AccordionItem>

                                {/* 2-2: Messaging API Enable */}
                                <AccordionItem value="line-2" className="bg-white border-b border-slate-100">
                                    <AccordionTrigger className="px-8 py-6 hover:bg-slate-50 hover:no-underline group">
                                        <div className="flex items-center gap-4 text-left">
                                            <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-sm group-data-[state=open]:bg-green-600 group-data-[state=open]:text-white transition-colors">2</div>
                                            <div>
                                                <div className="font-bold text-slate-800 text-lg">Messaging APIを有効化</div>
                                                <div className="text-xs text-slate-500">システム連携に必須の設定</div>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="px-8 pb-8 pt-2 text-slate-600 space-y-4">
                                        <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg text-sm">
                                            <div className="font-bold text-amber-800 mb-2 flex items-center gap-2">
                                                <AlertTriangle className="w-4 h-4" />
                                                重要：この手順なしではシステムが動作しません
                                            </div>
                                        </div>
                                        <ol className="list-decimal list-inside space-y-3 text-sm">
                                            <li>
                                                <a href="https://manager.line.biz/" target="_blank" className="text-indigo-600 font-bold hover:underline">
                                                    LINE Official Account Manager
                                                </a>
                                                にログイン
                                            </li>
                                            <li>右上の<strong>「設定」</strong>（歯車アイコン）をクリック</li>
                                            <li>左メニューの<strong>「Messaging API」</strong>をクリック</li>
                                            <li>「Messaging APIを利用する」ボタンをクリック</li>
                                            <li>プロバイダー名を入力（会社名でOK）→「同意する」→「OK」</li>
                                        </ol>
                                    </AccordionContent>
                                </AccordionItem>

                                {/* 2-3: Get Keys */}
                                <AccordionItem value="line-3" className="bg-white border-b border-slate-100">
                                    <AccordionTrigger className="px-8 py-6 hover:bg-slate-50 hover:no-underline group">
                                        <div className="flex items-center gap-4 text-left">
                                            <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-sm group-data-[state=open]:bg-green-600 group-data-[state=open]:text-white transition-colors">3</div>
                                            <div>
                                                <div className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                                    2つの「鍵」を取得
                                                    <Badge variant="destructive" className="ml-2 text-xs">ここが最難関</Badge>
                                                </div>
                                                <div className="text-xs text-slate-500">チャネルシークレットとアクセストークン</div>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="px-8 pb-8 pt-2 text-slate-600 space-y-6">
                                        <p className="text-sm">
                                            <a href="https://developers.line.biz/console/" target="_blank" className="text-indigo-600 font-bold underline">
                                                LINE Developers Console
                                            </a>
                                            を開き、先ほど作成したプロバイダー名 → チャネル を選択してください。
                                        </p>

                                        {/* Key 1 */}
                                        <div className="border-l-4 border-green-500 pl-4 space-y-2 bg-green-50/50 p-3 rounded-r-lg">
                                            <h4 className="font-bold text-slate-900">🔑 鍵1：チャネルシークレット</h4>
                                            <ol className="list-decimal list-inside text-sm space-y-1">
                                                <li>「Basic Settings」タブを開く</li>
                                                <li>「Channel secret」欄の値をコピー</li>
                                            </ol>
                                            <div className="bg-slate-800 text-green-400 p-2 rounded text-xs font-mono">
                                                例: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
                                            </div>
                                        </div>

                                        {/* Key 2 */}
                                        <div className="border-l-4 border-blue-500 pl-4 space-y-2 bg-blue-50/50 p-3 rounded-r-lg">
                                            <h4 className="font-bold text-slate-900">🔑 鍵2：チャネルアクセストークン（長期）</h4>
                                            <ol className="list-decimal list-inside text-sm space-y-1">
                                                <li>「Messaging API」タブを開く</li>
                                                <li>ページ下部の「Channel access token (long-lived)」で「Issue」ボタンをクリック</li>
                                                <li>表示された長い文字列をコピー</li>
                                            </ol>
                                            <div className="bg-slate-800 text-blue-400 p-2 rounded text-xs font-mono break-all">
                                                例: eyJhbGciOiJIUzI1NiJ9.eyJqdGk...（とても長い文字列）
                                            </div>
                                        </div>

                                        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                                            <p className="text-sm font-bold text-indigo-800">💡 この2つをメモ帳などに保存しておいてください</p>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>

                                {/* 2-4: Webhook URL */}
                                <AccordionItem value="line-4" className="bg-white border-b border-slate-100">
                                    <AccordionTrigger className="px-8 py-6 hover:bg-slate-50 hover:no-underline group">
                                        <div className="flex items-center gap-4 text-left">
                                            <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-sm group-data-[state=open]:bg-green-600 group-data-[state=open]:text-white transition-colors">4</div>
                                            <div>
                                                <div className="font-bold text-slate-800 text-lg">Webhook URLを登録</div>
                                                <div className="text-xs text-slate-500">システムがLINEと通信するための設定</div>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="px-8 pb-8 pt-2 text-slate-600 space-y-4">
                                        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                                            <div className="font-bold text-red-700 mb-2 flex items-center gap-2">
                                                <AlertTriangle className="w-4 h-4" />
                                                入力場所を間違えないでください
                                            </div>
                                            <p className="text-sm text-slate-700">
                                                <strong>LINE Official Account Manager</strong> の「設定」画面で行います（LINE Developersではありません）
                                            </p>
                                        </div>

                                        <ol className="list-decimal list-inside space-y-3 text-sm">
                                            <li>
                                                <a href="https://manager.line.biz/" target="_blank" className="text-indigo-600 font-bold hover:underline">
                                                    LINE Official Account Manager
                                                </a>
                                                を開く
                                            </li>
                                            <li>右上の<strong>「設定」</strong>（歯車アイコン）をクリック</li>
                                            <li>左メニューの<strong>「Messaging API」</strong>をクリック</li>
                                            <li>
                                                <strong>「Webhook URL」</strong>欄に以下を入力して「保存」
                                                <div className="my-2 p-3 bg-slate-100 rounded border border-slate-300 font-mono text-green-700 break-all select-all flex items-center justify-between">
                                                    <span>https://eisai-api.vercel.app/api/line/webhook</span>
                                                    <CopyButton text="https://eisai-api.vercel.app/api/line/webhook" />
                                                </div>
                                            </li>
                                            <li><strong>「検証」</strong>ボタンを押し、<Badge className="bg-green-500 text-white">成功</Badge>と出ることを確認</li>
                                            <li>「Webhookの利用」スイッチを<strong>ON</strong>にする</li>
                                        </ol>
                                    </AccordionContent>
                                </AccordionItem>

                                {/* 2-5: Response Settings */}
                                <AccordionItem value="line-5" className="bg-white border-b border-slate-100">
                                    <AccordionTrigger className="px-8 py-6 hover:bg-slate-50 hover:no-underline group">
                                        <div className="flex items-center gap-4 text-left">
                                            <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-sm group-data-[state=open]:bg-green-600 group-data-[state=open]:text-white transition-colors">5</div>
                                            <div>
                                                <div className="font-bold text-slate-800 text-lg">応答設定・チャット設定（重要）</div>
                                                <div className="text-xs text-slate-500">自動返信の停止とグループ参加機能の許可</div>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="px-8 pb-8 pt-2 text-slate-600 space-y-4">
                                        <ol className="list-decimal list-inside space-y-2 text-sm">
                                            <li>右上の「設定」＞ 左メニューの<strong>「応答設定」</strong>を開き、以下のように設定：
                                                <ul className="list-disc list-inside bg-slate-100 p-3 rounded text-sm text-slate-700 mt-2 space-y-1 mb-3">
                                                    <li>応答モード： <strong className="text-green-600">Bot</strong></li>
                                                    <li>あいさつメッセージ： どちらでもOK</li>
                                                    <li>応答メッセージ： <strong className="text-red-600">オフ</strong>（これがオンだと変な自動返信が返ります）</li>
                                                    <li>Webhook： <strong className="text-green-600">オン</strong></li>
                                                </ul>
                                            </li>
                                            <li className="pt-2">続いて、アカウント設定から<strong>「グループ・複数人トークへの参加」</strong>と<strong>「写真や動画の受け取り」</strong>を許可します：
                                                <ul className="list-disc list-inside bg-amber-50 border border-amber-200 p-3 rounded text-sm text-slate-700 mt-2 space-y-1">
                                                    <li>トークへの参加機能： <strong className="text-green-600">グループ・複数人トークへの参加を許可する</strong> にチェック（※これがないとグループに招待できません）</li>
                                                    <li>写真や動画の受け取り： <strong className="text-green-600">受け取る</strong> に設定</li>
                                                </ul>
                                            </li>
                                        </ol>
                                    </AccordionContent>
                                </AccordionItem>

                                {/* 2-6: Register Keys to System */}
                                <AccordionItem value="line-6" className="bg-white">
                                    <AccordionTrigger className="px-8 py-6 hover:bg-slate-50 hover:no-underline group">
                                        <div className="flex items-center gap-4 text-left">
                                            <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-sm group-data-[state=open]:bg-green-600 group-data-[state=open]:text-white transition-colors">6</div>
                                            <div>
                                                <div className="font-bold text-slate-800 text-lg">システムに鍵を登録</div>
                                                <div className="text-xs text-slate-500">STEP 1で空欄にした場所にキーを入力</div>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="px-8 pb-8 pt-2 text-slate-600 space-y-4">
                                        <ol className="list-decimal list-inside space-y-2 text-sm">
                                            <li>本システムの<strong>「設定 (管理画面)」</strong>に戻る</li>
                                            <li>教室一覧にある、作成した教室（池袋校など）を探す</li>
                                            <li>編集ボタン（ペンアイコン）をクリック、または削除→再作成</li>
                                            <li>
                                                <strong>「LINE公式アカウント設定」</strong>欄を開き、先ほど取得した2つの鍵を貼り付け：
                                                <ul className="list-disc list-inside ml-4 mt-2 text-slate-500">
                                                    <li>チャネルシークレット</li>
                                                    <li>チャネルアクセストークン</li>
                                                </ul>
                                            </li>
                                            <li>「保存」ボタンをクリック</li>
                                        </ol>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </CardContent>
                    </Card>
                </section>

                {/* =========== STEP 3: Group Invitation & Commands (NEW!) =========== */}
                <section className="scroll-mt-20" id="step3">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="flex flex-col items-center">
                            <span className="text-sm font-bold text-blue-600 mb-1">STEP</span>
                            <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold shadow-lg ring-4 ring-white">3</div>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">グループへの招待と動作確認</h2>
                            <p className="text-slate-500">講師全員が参加するLINEグループにBotを招待し、動作をテストします。</p>
                        </div>
                    </div>

                    <Card className="border-blue-100 shadow-lg overflow-hidden">
                        <CardHeader className="bg-blue-50 border-b border-blue-100">
                            <CardTitle className="text-blue-800 flex items-center gap-2">
                                <UserPlus className="w-5 h-5" />
                                グループ連携手順
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-8">

                            {/* 3-1: Create Group */}
                            <div className="border-l-4 border-blue-500 pl-4 space-y-3">
                                <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                                    <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold">1</span>
                                    講師用グループを作成（まだない場合）
                                </h3>
                                <p className="text-sm text-slate-600">
                                    LINEアプリで、教室長と全講師が参加するグループトークを作成してください。
                                    <br />
                                    <span className="text-xs text-slate-500">例：「○○塾 池袋校 講師グループ」</span>
                                </p>
                            </div>

                            {/* 3-2: Invite Bot */}
                            <div className="border-l-4 border-blue-500 pl-4 space-y-3">
                                <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                                    <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold">2</span>
                                    公式アカウントをグループに招待
                                </h3>
                                <ol className="list-decimal list-inside text-sm space-y-2">
                                    <li>グループトークを開く</li>
                                    <li>右上の「≡」メニュー →「招待」をタップ</li>
                                    <li>「友だち」リストから、<strong>STEP 2で作成した公式アカウント名</strong>を選択</li>
                                    <li>「招待」をタップ</li>
                                </ol>
                                <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-sm">
                                    <p className="text-amber-800">
                                        <strong>💡 ヒント：</strong>友だちに表示されない場合は、まず自分で公式アカウントを友だち追加してください。
                                    </p>
                                </div>
                            </div>

                            {/* 3-3: Auto Registration Complete */}
                            <div className="border-l-4 border-green-500 pl-4 space-y-3 bg-green-50/50 p-4 rounded-r-lg">
                                <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                                    <span className="w-7 h-7 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm font-bold">3</span>
                                    招待するだけで自動設定完了！
                                    <Badge className="bg-green-500 text-white">手動設定不要</Badge>
                                </h3>
                                <p className="text-sm text-slate-600">
                                    各校舎ごとにLINEアカウントが紐づいているため、<strong>招待した瞬間に自動で教室との連携が完了します。</strong>
                                    <br />手動でコマンドを入力する必要はありません。
                                </p>

                                <div className="bg-white rounded-lg border border-green-300 p-4">
                                    <div className="text-center">
                                        <p className="text-sm text-slate-600 mb-2">Botからの自動メッセージ：</p>
                                        <div className="inline-block bg-green-50 border border-green-200 px-6 py-3 rounded-lg text-sm text-slate-700 text-left">
                                            招待ありがとうございます！<br />
                                            「〇〇校」の通知グループとして登録しました。<br />
                                            毎週月曜日に自動でレポートをお届けします。
                                        </div>
                                        <p className="text-xs text-slate-500 mt-2">
                                            ※ このメッセージが届けば設定完了です
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-green-100 p-4 rounded-lg text-center">
                                    <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                                    <p className="font-bold text-green-800">これだけでLINE連携は完了です！🎉</p>
                                </div>
                            </div>

                            {/* 3-4: Test Commands */}
                            <div className="border-l-4 border-slate-300 pl-4 space-y-3 p-4 rounded-r-lg">
                                <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                                    <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-sm font-bold">4</span>
                                    動作テスト（任意）
                                </h3>
                                <p className="text-sm text-slate-600">
                                    正しく連携されたか確認するには、グループ内で以下を送信してください。
                                </p>

                                <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100">
                                    <div className="p-4 flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                                            <Send className="w-5 h-5 text-slate-600" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-mono text-lg text-blue-600 font-bold flex items-center">
                                                通知
                                                <CopyButton text="通知" />
                                            </div>
                                            <p className="text-sm text-slate-500 mt-1">
                                                → 今週のテスト日程・連絡事項・未回収リストが表示されればOK
                                            </p>
                                        </div>
                                    </div>
                                    <div className="p-4 flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                                            <HelpCircle className="w-5 h-5 text-slate-600" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-mono text-lg text-blue-600 font-bold flex items-center">
                                                ヘルプ
                                                <CopyButton text="ヘルプ" />
                                            </div>
                                            <p className="text-sm text-slate-500 mt-1">
                                                → 使い方ガイドが返ってくればOK
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-indigo-50 p-3 rounded-lg text-sm">
                                    <p className="text-indigo-800">
                                        <strong>💡 その他のコマンド：</strong>「今週」「レポート」でも同じ内容が表示されます。
                                    </p>
                                </div>
                            </div>

                            {/* Troubleshooting */}
                            <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                                <h4 className="font-bold text-red-700 mb-2 flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5" />
                                    応答が来ない場合のチェックリスト
                                </h4>
                                <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                                    <li>Webhook URLは正しく入力されていますか？（STEP 2-4）</li>
                                    <li>Webhookの利用はONになっていますか？</li>
                                    <li>応答設定で「応答メッセージ」がオフになっていますか？</li>
                                    <li>チャネルシークレット・アクセストークンは正しくコピーされていますか？</li>
                                    <li>管理画面で教室にLINE設定を保存しましたか？（STEP 2-6）</li>
                                    <li>公式アカウントを「友だち追加」してからグループに招待しましたか？</li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                {/* =========== STEP 4: Data Registration =========== */}
                <section className="scroll-mt-20" id="step4">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="flex flex-col items-center">
                            <span className="text-sm font-bold text-orange-500 mb-1">STEP</span>
                            <div className="w-12 h-12 rounded-full bg-orange-500 text-white flex items-center justify-center text-xl font-bold shadow-lg ring-4 ring-white">4</div>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">データの準備</h2>
                            <p className="text-slate-500">生徒データとテスト日程を登録して、本格運用を開始します。</p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Student CSV */}
                        <Card className="border-slate-200 shadow-sm md:col-span-2">
                            <CardHeader className="border-b border-slate-100 bg-slate-50">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                                    生徒情報のアップロード (CSV)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <p className="text-sm text-slate-600">
                                    「塾マネ」または「Comiru」などの基幹システムから生徒名簿CSVをエクスポートし、
                                    本システムにアップロードしてください。
                                </p>
                                <ol className="list-decimal list-inside text-sm space-y-2 text-slate-700">
                                    <li>サイドメニューの<strong>「生徒一覧」</strong>をクリック</li>
                                    <li>右上の<strong>「CSVインポート」</strong>ボタンをクリック</li>
                                    <li>CSVファイルを選択してアップロード</li>
                                </ol>
                                <div className="flex gap-4 items-start bg-indigo-50 p-4 rounded-lg">
                                    <div className="bg-white p-2 rounded shadow-sm">
                                        <Download className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-indigo-900 text-sm">CSV更新のルール</div>
                                        <p className="text-xs text-indigo-700 mt-1">
                                            ・月に1回程度、生徒の入退塾に合わせて更新してください。<br />
                                            ・CSVに含まれていない生徒は「卒業」扱いとなりますが、データは残ります。
                                        </p>
                                    </div>
                                </div>
                                <Link href="/students" className="text-indigo-600 text-sm font-bold hover:underline flex items-center">
                                    生徒一覧ページへ <ArrowRight className="w-4 h-4 ml-1" />
                                </Link>
                            </CardContent>
                        </Card>

                        {/* Test Schedule */}
                        <Card className="border-slate-200 shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <CalendarDays className="w-5 h-5 text-orange-500" />
                                    テスト日程の登録
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <p className="text-sm text-slate-600">
                                    各中学校のテスト期間を登録します。これが<strong>「未回収リスト自動生成」</strong>のトリガーになります。
                                </p>
                                <ol className="list-decimal list-inside text-sm space-y-1 text-slate-700">
                                    <li>「テスト日程」ページを開く</li>
                                    <li>学校を選択し、テスト期間を入力</li>
                                    <li>保存</li>
                                </ol>
                                <Link href="/test-schedule" className="text-indigo-600 text-sm font-bold hover:underline flex items-center">
                                    テスト日程ページへ <ArrowRight className="w-4 h-4 ml-1" />
                                </Link>
                            </CardContent>
                        </Card>

                        {/* Individual Notes */}
                        <Card className="border-slate-200 shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Users className="w-5 h-5 text-purple-500" />
                                    個別共有事項の入力
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <p className="text-sm text-slate-600">
                                    「生徒一覧」から、生徒ごとの特記事項（配慮事項など）を入力できます。
                                    これは<strong>Chrome拡張機能で座席表に表示</strong>されます。
                                </p>
                                <Link href="/students" className="text-indigo-600 text-sm font-bold hover:underline flex items-center">
                                    生徒一覧へ <ArrowRight className="w-4 h-4 ml-1" />
                                </Link>
                            </CardContent>
                        </Card>
                    </div>
                </section>

                {/* =========== STEP 5: Tools for Staff =========== */}
                <section className="scroll-mt-20" id="step5">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="flex flex-col items-center">
                            <span className="text-sm font-bold text-slate-500 mb-1">STEP</span>
                            <div className="w-12 h-12 rounded-full bg-slate-700 text-white flex items-center justify-center text-xl font-bold shadow-lg ring-4 ring-white">5</div>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">講師向けツールの導入</h2>
                            <p className="text-slate-500">各講師のPCにChrome拡張機能とデスクトップウィジェットをインストールします。</p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Chrome Extension */}
                        <Card className="border-slate-200 shadow-sm">
                            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Puzzle className="w-5 h-5 text-blue-600" />
                                    Chrome拡張機能
                                    <Badge className="bg-blue-500 text-white text-xs">必須</Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <p className="text-sm text-slate-600">
                                    塾マネの座席表に「共有事項」や「テスト未回収の色付け」をオーバーレイ表示します。
                                </p>
                                <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                                    <li>座席表で生徒の共有事項を即座に確認</li>
                                    <li>未回収テストがある生徒を赤枠で表示</li>
                                    <li>QRコードで生徒詳細をスマホで確認</li>
                                </ul>
                                <Button asChild className="w-full">
                                    <Link href="/help/extension">
                                        <Download className="w-4 h-4 mr-2" />
                                        拡張機能のダウンロード・設定ページへ
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Rainmeter Widget */}
                        <Card className="border-slate-200 shadow-sm">
                            <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Sparkles className="w-5 h-5 text-amber-600" />
                                    デスクトップウィジェット
                                    <Badge variant="secondary" className="text-xs">推奨</Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <p className="text-sm text-slate-600">
                                    PCのデスクトップに常時表示されるウィジェットで、全体連絡や今週の予定を一目で確認できます。
                                </p>
                                <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                                    <li>ブラウザを開かずに連絡事項を確認</li>
                                    <li>テスト日程が近づくと通知</li>
                                </ul>
                                <Button variant="outline" asChild className="w-full">
                                    <Link href="/help">
                                        <Settings className="w-4 h-4 mr-2" />
                                        ウィジェット導入ページへ
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </section>

                {/* =========== Daily Operation =========== */}
                <section className="scroll-mt-20">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="flex flex-col items-center">
                            <span className="text-sm font-bold text-indigo-500 mb-1">参考</span>
                            <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xl font-bold shadow-lg ring-4 ring-white">
                                <Bot className="w-6 h-6" />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">日々の運用フロー</h2>
                            <p className="text-slate-500">セットアップ完了後は、以下のサイクルを回します。</p>
                        </div>
                    </div>

                    <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-white to-slate-50">
                        <CardContent className="p-0 divide-y divide-slate-100">
                            <div className="p-6 flex gap-4">
                                <div className="mt-1">
                                    <Puzzle className="w-6 h-6 text-blue-500" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-base mb-1">1. 授業前（講師）</h3>
                                    <p className="text-sm text-slate-600">
                                        デスクトップウィジェットで<strong>「全体連絡」</strong>を確認。
                                        塾マネの座席表を開き、Chrome拡張機能で<strong>「担当生徒の共有事項」</strong>をチェック。
                                    </p>
                                </div>
                            </div>
                            <div className="p-6 flex gap-4">
                                <div className="mt-1">
                                    <FileCheck className="w-6 h-6 text-orange-500" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-base mb-1">2. テスト返却時（教室長）</h3>
                                    <p className="text-sm text-slate-600">
                                        テスト回収時に「テスト結果入力」画面を開き、回収した生徒に<strong>チェックを入れるだけ</strong>でOK。
                                    </p>
                                </div>
                            </div>
                            <div className="p-6 flex gap-4">
                                <div className="mt-1">
                                    <Bot className="w-6 h-6 text-green-500" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-base mb-1">3. 週次通知（全自動）</h3>
                                    <p className="text-sm text-slate-600">
                                        毎週月曜日に、LINEグループへ以下の情報が自動通知されます。
                                    </p>
                                    <ul className="list-disc list-inside text-xs text-slate-500 mt-2 ml-1">
                                        <li>今週のテスト日程・イベント</li>
                                        <li>未回収のテストリスト</li>
                                        <li>全体連絡事項</li>
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                {/* Complete Banner */}
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-8 text-center text-white shadow-lg">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">セットアップ完了！🎉</h2>
                    <p className="text-green-100">
                        これで教室の開設が完了しました。<br />
                        ご不明点があれば、お気軽にお問い合わせください。
                    </p>
                    <div className="mt-6">
                        <a
                            href="mailto:sutasaku.app@gmail.com?subject=教室運営サポートへのお問い合わせ"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-green-700 rounded-full font-bold hover:bg-green-50 transition-colors shadow-md"
                        >
                            <HelpCircle className="w-5 h-5" />
                            お問い合わせ
                        </a>
                    </div>
                </div>

                <div className="flex justify-center pt-4 pb-12">
                    <Button variant="outline" size="lg" asChild className="hover:bg-slate-50 shadow-sm">
                        <Link href="/dashboard">
                            <ArrowRight className="w-4 h-4 mr-2" />
                            ダッシュボードへ戻る
                        </Link>
                    </Button>
                </div>
            </div>
        </Layout>
    );
}
