"use client";

import React, { useEffect, useState } from 'react';
import Layout from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCampus } from '@/hooks/use-campus';
import { LayoutGrid, Save, RefreshCw, AlertCircle, CheckCircle2, User, Users, Trash2, ListOrdered } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Lecturer {
    id: number;
    name: string;
    fabocKoushiId: string | null;
    seatPreferences: number[];
}

export default function SeatingConfigPage() {
    const { campus, isLoading: isCampusLoading } = useCampus();
    const [lecturers, setLecturers] = useState<Lecturer[]>([]);
    const [defaultOrder, setDefaultOrder] = useState<string>('1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13');
    const [savingDefault, setSavingDefault] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [savingId, setSavingId] = useState<number | null>(null);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    // Fetch data
    const fetchConfig = async () => {
        if (!campus) return;
        setIsLoading(true);
        try {
            const res = await fetch('/api/extension/seat-config');
            if (!res.ok) {
                // Check if it's a table-not-found error (500)
                if (res.status === 500) {
                    const errData = await res.json().catch(() => ({}));
                    if (errData.error && errData.error.includes('does not exist')) {
                        // Auto-run migration
                        showMessage('テーブルを初期化中...', 'success');
                        const migrateRes = await fetch('/api/admin/migrate', { method: 'POST' });
                        if (migrateRes.ok) {
                            showMessage('初期化完了。データを再取得中...', 'success');
                            // Retry after migration
                            const retryRes = await fetch('/api/extension/seat-config');
                            if (retryRes.ok) {
                                const data = await retryRes.json();
                                if (data.lecturers) setLecturers(data.lecturers);
                                if (data.seatConfig?.defaultOrder) setDefaultOrder(data.seatConfig.defaultOrder.join(', '));
                                setIsLoading(false);
                                return;
                            }
                        }
                    }
                }
                throw new Error('Failed to fetch seat configuration');
            }
            const data = await res.json();
            if (data.lecturers) {
                setLecturers(data.lecturers);
            }
            if (data.seatConfig?.defaultOrder) {
                setDefaultOrder(data.seatConfig.defaultOrder.join(', '));
            }
        } catch (error) {
            console.error('Error fetching seat config:', error);
            showMessage('設定の取得に失敗しました', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchConfig();
    }, [campus]);

    const showMessage = (text: string, type: 'success' | 'error') => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 3000);
    };

    const handlePreferenceChange = (lecturerId: number, value: string) => {
        // Only allow numbers, commas, and spaces
        const sanitized = value.replace(/[^0-9,\s]/g, '');
        setLecturers(prev => prev.map(l => {
            if (l.id === lecturerId) {
                // Convert string "1, 2, 3" to number array [1, 2, 3] for internal state,
                // but we keep the raw string for the input field to allow smooth typing.
                // We'll parse it properly on save.
                return { ...l, rawInput: sanitized };
            }
            return l;
        }));
    };

    const savePreference = async (lecturer: Lecturer & { rawInput?: string }) => {
        setSavingId(lecturer.id);
        
        let newPrefs = lecturer.seatPreferences;
        if (lecturer.rawInput !== undefined) {
            newPrefs = lecturer.rawInput
                .split(',')
                .map(s => s.trim())
                .filter(s => s !== '')
                .map(Number)
                .filter(n => !isNaN(n));
        }

        try {
            const res = await fetch('/api/extension/seat-config', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lecturerId: lecturer.id,
                    seatPreferences: newPrefs
                })
            });

            if (res.ok) {
                showMessage(`${lecturer.name} 先生の設定を保存しました`, 'success');
                // Update local state to reflect saved preferences
                setLecturers(prev => prev.map(l => 
                    l.id === lecturer.id 
                        ? { ...l, seatPreferences: newPrefs, rawInput: undefined } 
                        : l
                ));
            } else {
                throw new Error('Failed to save');
            }
        } catch (error) {
            showMessage('保存に失敗しました', 'error');
        } finally {
            setSavingId(null);
        }
    };

    const deleteLecturer = async (lecturer: Lecturer) => {
        if (!confirm(`「${lecturer.name}」先生のデータを削除してもよろしいですか？\n※削除しても、座席表ページを開いた際に再度自動追加されます。`)) {
            return;
        }

        setSavingId(lecturer.id);
        try {
            const res = await fetch(`/api/extension/seat-config?lecturerId=${lecturer.id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                showMessage(`${lecturer.name} 先生を削除しました`, 'success');
                setLecturers(prev => prev.filter(l => l.id !== lecturer.id));
            } else {
                throw new Error('Failed to delete');
            }
        } catch (error) {
            showMessage('削除に失敗しました', 'error');
        } finally {
            setSavingId(null);
        }
    };

    if (isCampusLoading) {
        return (
            <Layout>
                <div className="flex justify-center items-center h-[50vh]">
                    <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                </div>
            </Layout>
        );
    }

    if (!campus) {
        return (
            <Layout>
                <div className="flex justify-center items-center h-[50vh]">
                    <div className="text-slate-500">校舎が選択されていません</div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <LayoutGrid className="w-6 h-6 text-indigo-600" />
                            座席表設定
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            講師ごとの優先座番を設定します。ここで設定した内容はChrome拡張機能の自動提案システムに反映されます。
                        </p>
                    </div>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={fetchConfig}
                        disabled={isLoading}
                        className="hidden sm:flex"
                    >
                        <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
                        最新の情報に更新
                    </Button>
                </div>

                {message && (
                    <div className={cn(
                        "p-4 rounded-xl flex items-center gap-3 transition-all",
                        message.type === 'success' ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
                    )}>
                        {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        <span className="font-medium">{message.text}</span>
                    </div>
                )}

                {/* Default order card */}
                <Card className="border-slate-200 shadow-sm overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <ListOrdered className="w-5 h-5 text-indigo-500" />
                            デフォルト座席順序
                        </CardTitle>
                        <CardDescription>
                            講師ごとの優先設定がない場合に使用される、座席の割り振り順序です。<br/>
                            カンマ区切りで座番を入力してください（例: 1, 3, 5, 2, 4）。先に入力された番号から優先的に割り振られます。
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6">
                        <div className="flex items-center gap-3">
                            <Input
                                value={defaultOrder}
                                onChange={(e) => setDefaultOrder(e.target.value.replace(/[^0-9,\s]/g, ''))}
                                placeholder="例: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13"
                                className="font-mono bg-white flex-1"
                            />
                            <Button
                                onClick={async () => {
                                    setSavingDefault(true);
                                    try {
                                        const newOrder = defaultOrder
                                            .split(',')
                                            .map(s => s.trim())
                                            .filter(s => s !== '')
                                            .map(Number)
                                            .filter(n => !isNaN(n));
                                        const res = await fetch('/api/extension/seat-config', {
                                            method: 'PATCH',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ defaultOrder: newOrder })
                                        });
                                        if (res.ok) {
                                            showMessage('デフォルト順序を保存しました', 'success');
                                            setDefaultOrder(newOrder.join(', '));
                                        } else throw new Error('Failed');
                                    } catch {
                                        showMessage('保存に失敗しました', 'error');
                                    } finally {
                                        setSavingDefault(false);
                                    }
                                }}
                                disabled={savingDefault}
                                size="sm"
                                className="bg-indigo-600 hover:bg-indigo-700 flex-shrink-0"
                            >
                                {savingDefault ? (
                                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4 mr-2" />
                                )}
                                保存
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Lecturer preferences card */}
                <Card className="border-slate-200 shadow-sm overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Users className="w-5 h-5 text-indigo-500" />
                            講師別の優先座番設定
                        </CardTitle>
                        <CardDescription>
                            優先して割り振りたい座番をカンマ区切り（例: 1, 2, 3）で入力してください。<br/>
                            未設定の場合は教室のデフォルト順序に従って提案されます。
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                <RefreshCw className="w-8 h-8 animate-spin mb-4 text-indigo-300" />
                                データを読み込み中...
                            </div>
                        ) : lecturers.length === 0 ? (
                            <div className="py-12 text-center text-slate-500">
                                登録されている講師がいません
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {lecturers.map((lecturer) => {
                                    // Use rawInput if user is typing, otherwise use saved preferences
                                    const displayValue = (lecturer as any).rawInput !== undefined 
                                        ? (lecturer as any).rawInput 
                                        : lecturer.seatPreferences.join(', ');
                                        
                                    return (
                                        <div key={lecturer.id} className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                                            <div className="flex items-center gap-3 min-w-[200px]">
                                                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                                    <User className="w-5 h-5 text-indigo-600" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-700">{lecturer.name}</div>
                                                    <div className="text-xs text-slate-400 font-mono">
                                                        ID: {lecturer.fabocKoushiId || '未同期'}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex-1 flex items-center gap-3 w-full sm:w-auto">
                                                <Input 
                                                    value={displayValue}
                                                    onChange={(e) => handlePreferenceChange(lecturer.id, e.target.value)}
                                                    placeholder="例: 1, 2, 3"
                                                    className="font-mono bg-white flex-1"
                                                />
                                                <Button 
                                                    onClick={() => savePreference(lecturer)}
                                                    disabled={savingId === lecturer.id}
                                                    size="sm"
                                                    className={cn(
                                                        "flex-shrink-0 transition-all",
                                                        (lecturer as any).rawInput !== undefined && (lecturer as any).rawInput !== lecturer.seatPreferences.join(', ')
                                                            ? "bg-indigo-600 hover:bg-indigo-700" 
                                                            : "bg-slate-800 hover:bg-slate-900"
                                                    )}
                                                >
                                                    {savingId === lecturer.id ? (
                                                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                                    ) : (
                                                        <Save className="w-4 h-4 mr-2" />
                                                    )}
                                                    保存
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => deleteLecturer(lecturer)}
                                                    disabled={savingId === lecturer.id}
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    title="削除"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
}
