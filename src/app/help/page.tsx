"use client";

import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Monitor, Download, Users, Lightbulb, MessageSquare, BookOpen, GraduationCap, ArrowRight, ExternalLink, ShieldAlert, Zap, Link as LinkIcon, DownloadCloud, School, Clock, CalendarDays, History, Puzzle, Star } from "lucide-react";
import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function NewCampusManualPage() {
    return (
        <Layout>
            <div className="max-w-5xl mx-auto space-y-12 pb-20">
                {/* HERO SECTION */}
                <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 text-white shadow-2xl p-10 md:p-16 animate-fade-in-up">
                    <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-96 h-96 bg-indigo-500 rounded-full blur-[100px] opacity-30 mix-blend-screen pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/3 w-80 h-80 bg-emerald-500 rounded-full blur-[120px] opacity-20 mix-blend-screen pointer-events-none"></div>
                    
                    <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-indigo-100 text-sm font-medium tracking-wide">
                            <Zap className="w-4 h-4 text-amber-400" />
                            最速で教室の立ち上げを完了させる
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-indigo-100 to-indigo-300">
                            システム導入・運用マニュアル
                        </h1>
                        <p className="text-lg md:text-xl text-slate-300 max-w-2xl font-light">
                            このガイドに沿って、教室へのシステム導入と初期設定を完了させてください。室長向けの必須運用ルールもまとめています。
                        </p>
                    </div>
                </div>

                {/* PREMISE ALERT */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-2xl p-6 shadow-sm flex gap-4 animate-fade-in-up stagger-1">
                    <div className="flex-shrink-0 w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center border border-amber-200 shadow-inner">
                        <CheckCircle2 className="w-6 h-6 text-amber-600" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="font-bold text-amber-900 text-lg">事前準備について（システム管理者側で完了済）</h3>
                        <p className="text-amber-800/80 leading-relaxed">
                            システム上での新校舎のデータ領域の作成、各種パスワードの発行はシステム側ですでに完了しています。また、各校舎ごとの「公式LINEアカウント」も別ルートでお渡ししております。
                        </p>
                    </div>
                </div>

                {/* PHASE 1: SETUP */}
                <section className="space-y-8 animate-fade-in-up stagger-2">
                    <div className="flex items-center gap-4 border-b-2 border-slate-100 pb-4">
                        <div className="w-12 h-12 rounded-[1rem] bg-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-indigo-200">
                            1
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">導入手順</h2>
                            <p className="text-slate-500 font-medium">教室PCへの初期セットアップ</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                        {/* Connecting Line for desktop */}
                        <div className="hidden md:block absolute top-[50%] left-0 w-full h-0.5 bg-gradient-to-r from-indigo-100 via-emerald-100 to-blue-100 -z-10"></div>
                        
                        <Card className="border-indigo-100 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group bg-white/60 backdrop-blur-xl">
                            <CardHeader className="pb-3 text-center">
                                <div className="mx-auto w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                    <Monitor className="w-8 h-8 text-indigo-600" />
                                </div>
                                <div className="text-indigo-600 font-bold tracking-widest text-sm mb-1">STEP 1</div>
                                <CardTitle className="text-xl">システムへログインする</CardTitle>
                            </CardHeader>
                            <CardContent className="text-center text-slate-600 text-sm space-y-3">
                                <p>
                                    まずは教室で利用する室長や講師が利用するすべてのパソコンからシステムにアクセスし、該当校舎の「合言葉（パスワード）」を入力してログインしてください。
                                </p>
                                <div className="bg-indigo-50 border border-indigo-100 rounded-lg py-2 px-3 inline-block">
                                    <p className="text-indigo-700 font-bold flex items-center justify-center gap-1.5">
                                        <Star className="w-4 h-4 fill-indigo-500 text-indigo-500" /> ブックマーク登録のお願い
                                    </p>
                                    <p className="text-xs text-indigo-600/80 mt-1">
                                        ログイン後、このページ（<a href="https://eisai-api.vercel.app/" className="underline">https://eisai-api.vercel.app/</a>）をブラウザのブックマークに登録してください。
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-cyan-100 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group bg-white/60 backdrop-blur-xl">
                            <CardHeader className="pb-3 text-center">
                                <div className="mx-auto w-16 h-16 rounded-2xl bg-cyan-50 border border-cyan-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                    <DownloadCloud className="w-8 h-8 text-cyan-600" />
                                </div>
                                <div className="text-cyan-600 font-bold tracking-widest text-sm mb-1">STEP 2</div>
                                <CardTitle className="text-xl">CSVインポート（名簿反映）</CardTitle>
                            </CardHeader>
                            <CardContent className="text-slate-600 text-sm space-y-4">
                                <p className="text-center">「生徒一覧」から、塾マネの最新生徒CSVを読み込ませます。</p>
                                
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left shadow-sm">
                                    <div className="font-bold text-slate-800 mb-2">
                                        📥 塾マネからのCSVダウンロード手順
                                    </div>
                                    <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-700 ml-1">
                                        <li>塾マネの<strong>「ホーム」</strong>画面を開く</li>
                                        <li><strong>「生徒検索」</strong>に進み、何も入力せずにそのまま下部の<strong>「Search」</strong>ボタンを押す</li>
                                        <li>画面を一番下までスクロールし、<strong>「CSV出力」</strong>ボタンを押してダウンロードする</li>
                                    </ol>
                                </div>

                                <div className="bg-cyan-50 border border-cyan-100 rounded-xl p-3 text-left">
                                    <div className="font-bold text-cyan-800 flex items-center gap-1.5 mb-1.5">
                                        <Lightbulb className="w-4 h-4" /> 新規入会者の設定
                                    </div>
                                    <p className="text-xs text-cyan-700/90 leading-relaxed">
                                        新規入会者にはここでフラグを立てておくと、座席表の拡張機能で<strong>青色の特別枠</strong>で表示されるため、声掛け漏れを防げます。
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-emerald-100 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group bg-white/60 backdrop-blur-xl">
                            <CardHeader className="pb-3 text-center">
                                <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                    <Puzzle className="w-8 h-8 text-emerald-600" />
                                </div>
                                <div className="text-emerald-600 font-bold tracking-widest text-sm mb-1">STEP 3</div>
                                <CardTitle className="text-xl">拡張機能のインストール</CardTitle>
                            </CardHeader>
                            <CardContent className="text-center text-slate-600 text-sm space-y-4">
                                <p>教室で塾マネの座席表を開く<strong>すべてのパソコン</strong>に対して、Chrome拡張機能を導入してください。</p>
                                <Link 
                                    href="/help/extension" 
                                    className="inline-flex items-center gap-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-lg font-bold transition-colors"
                                >
                                    拡張機能の導入ページへ <ExternalLink className="w-4 h-4" />
                                </Link>
                            </CardContent>
                        </Card>

                        <Card className="border-blue-100 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group bg-white/60 backdrop-blur-xl">
                            <CardHeader className="pb-3 text-center">
                                <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                    <MessageSquare className="w-8 h-8 text-blue-600" />
                                </div>
                                <div className="text-blue-600 font-bold tracking-widest text-sm mb-1">STEP 4</div>
                                <CardTitle className="text-xl">教室LINEグループへ招待</CardTitle>
                            </CardHeader>
                            <CardContent className="text-center text-slate-600 text-sm">
                                別途提供している「公式LINEアカウント」を、教室長・講師間で使用している<strong>LINEグループに「招待」</strong>してください。<br/>
                                <span className="text-blue-600/80 font-medium inline-block mt-2">※これだけで自動リマインド通知などが有効になります。</span>
                            </CardContent>
                        </Card>
                    </div>
                </section>

                {/* PHASE 2: OPERATION */}
                <section className="space-y-8 animate-fade-in-up stagger-3 pt-8">
                    <div className="flex items-center gap-4 border-b-2 border-slate-100 pb-4">
                        <div className="w-12 h-12 rounded-[1rem] bg-amber-500 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-amber-200">
                            2
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">室長向け 超基本運用ガイド</h2>
                            <p className="text-slate-500 font-medium">日々どう使うべきか、最短で価値を出す3つのルール</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:border-amber-300 transition-colors flex flex-col md:flex-row gap-6 items-start">
                            <div className="w-16 h-16 shrink-0 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                                <School className="w-8 h-8" />
                            </div>
                            <div className="space-y-3">
                                <h3 className="text-xl font-bold text-slate-800">1. 講師への「共有」記入の徹底</h3>
                                <p className="text-slate-600 leading-relaxed">
                                    講師には、生徒とのコミュニケーションや授業で<strong>「共有事項」「学習姿勢」「テスト日程」</strong>などが発生したら、<strong>必ず生徒個人のページからシステムへ入力する</strong>よう徹底させてください。<br/>
                                    <span className="text-amber-700/80 text-sm font-medium">属人化を排除し、誰が担当しても座席表から即座に状況を把握できる環境を作ります。</span>
                                </p>
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:border-amber-300 transition-colors flex flex-col md:flex-row gap-6 items-start">
                            <div className="w-16 h-16 shrink-0 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                                <CalendarDays className="w-8 h-8" />
                            </div>
                            <div className="space-y-3">
                                <h3 className="text-xl font-bold text-slate-800">2. 全体連絡の二重登録による自動リマインド</h3>
                                <p className="text-slate-600 leading-relaxed">
                                    講師全体への連絡やイベント告知は、これまで通りLINEグループに投げるとともに、<strong>必ず本システムの「連絡事項」や「イベント」にも登録</strong>してください。<br/>
                                    <span className="text-amber-700/80 text-sm font-medium">システムに登録しておけば、自動レポート内で「リマインド」として再通知され、見落としを完全に防ぎます。</span>
                                </p>
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:border-amber-300 transition-colors flex flex-col md:flex-row gap-6 items-start">
                            <div className="w-16 h-16 shrink-0 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                                <Users className="w-8 h-8" />
                            </div>
                            <div className="space-y-3">
                                <h3 className="text-xl font-bold text-slate-800">3. 面談記録をサクッと残す</h3>
                                <p className="text-slate-600 leading-relaxed">
                                    教室長が生徒・保護者と面談を行って決まった方針は、<strong>対象生徒のシステム上の個人ページ（共有事項）に書き捨てて</strong>ください。<br/>
                                    <span className="text-amber-700/80 text-sm font-medium">長々とLINEで引き継ぎの文章を作る手間が消滅し、担当講師は座席表を開くだけで面談結果に基づいた指導ができるようになります。</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="text-center pt-8 animate-fade-in-up stagger-4">
                    <Link 
                        href="/training" 
                        className="inline-flex items-center gap-2 bg-slate-900 text-white hover:bg-slate-800 px-8 py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1"
                    >
                        完全版「運用マニュアル」を読む <ArrowRight className="w-5 h-5" />
                    </Link>
                    <p className="mt-4 text-sm text-slate-500">さらに便利な機能や深い使い方を知りたい方はこちら</p>
                </div>

                {/* ARCHIVE COMPONENTS SECTION */}
                <div className="mt-20 pt-10 border-t-2 border-dashed border-slate-200 animate-fade-in-up stagger-5">
                    <div className="flex items-center justify-center gap-2 text-slate-400 mb-8">
                        <History className="w-5 h-5" />
                        <h3 className="text-sm font-bold tracking-widest uppercase">アーカイブ済みマニュアル</h3>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto opacity-70 hover:opacity-100 transition-opacity duration-300">
                        <Link href="/help/widget">
                            <Card className="border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 transition-all cursor-pointer">
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className="bg-slate-200 p-2 rounded-lg">
                                        <Monitor className="w-5 h-5 text-slate-600" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-700 text-sm">【旧】ウィジェット導入</div>
                                        <div className="text-xs text-slate-500">Windowsデスクトップ表示用</div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                        
                        <Link href="/help/manual">
                            <Card className="border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 transition-all cursor-pointer">
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className="bg-slate-200 p-2 rounded-lg">
                                        <BookOpen className="w-5 h-5 text-slate-600" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-700 text-sm">【旧】教室開設・LINE連携</div>
                                        <div className="text-xs text-slate-500">システム初期設定とAPI取得</div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    </div>
                </div>

            </div>
        </Layout>
    );
}
