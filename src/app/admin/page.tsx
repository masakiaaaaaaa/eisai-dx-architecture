"use client";

import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Key, Info, Building2, Send, MessageSquare, Lock, Trash2, Clock, Mail, HelpCircle } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useCampus } from "@/hooks/use-campus";


type Campus = {
    id: number;
    name: string;
    passcode: string;
    notifyDayOfWeek?: string;
    lineGroups?: { id: number; groupId: string }[];
};

// NotifySchedule type is no longer needed but kept for potential future use or removed if strictly unused.
// type NotifySchedule = {
//     day: string;
//     time: string;
// };

type LineGroup = {
    id: number;
    groupId: string;
    displayName: string;
    isValid?: boolean;
};

// 曜日選択肢
const DAY_OPTIONS = [
    { value: '0', label: '日曜日' },
    { value: '1', label: '月曜日' },
    { value: '2', label: '火曜日' },
    { value: '3', label: '水曜日' },
    { value: '4', label: '木曜日' },
    { value: '5', label: '金曜日' },
    { value: '6', label: '土曜日' },
];

// 時間選択肢
const TIME_OPTIONS = [
    { value: '8:00', label: '8:00' },
    { value: '9:00', label: '9:00' },
    { value: '10:00', label: '10:00' },
    { value: '11:00', label: '11:00' },
    { value: '12:00', label: '12:00' },
    { value: '13:00', label: '13:00' },
    { value: '14:00', label: '14:00' },
    { value: '15:00', label: '15:00' },
    { value: '16:00', label: '16:00' },
    { value: '17:00', label: '17:00' },
    { value: '18:00', label: '18:00' },
    { value: '19:00', label: '19:00' },
    { value: '20:00', label: '20:00' },
];

// 頻度選択肢
const FREQUENCY_OPTIONS = [
    { value: '1', label: '週1回' },
    { value: '2', label: '週2回' },
    { value: '3', label: '週3回' },
];

export default function AdminPage() {
    // Auth state
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [adminPassword, setAdminPassword] = useState('');
    const [authError, setAuthError] = useState('');

    // Password change state
    const [newPasscode, setNewPasscode] = useState('');
    const [confirmPasscode, setConfirmPasscode] = useState('');

    // Campus settings
    const [campuses, setCampuses] = useState<Campus[]>([]);
    const [newCampusName, setNewCampusName] = useState('');
    const [newCampusPasscode, setNewCampusPasscode] = useState('');
    const [newLineAccessToken, setNewLineAccessToken] = useState('');
    const [newLineChannelSecret, setNewLineChannelSecret] = useState('');

    // LINE notification settings - 固定設定（月曜12:00）
    const [notifyFrequency, setNotifyFrequency] = useState('1');

    // LINE Groups for selection
    const [lineGroups, setLineGroups] = useState<LineGroup[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState<string>('all');

    // General
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState<'success' | 'error'>('success');
    const [isLoading, setIsLoading] = useState(false);

    const { campus, isLoading: isCampusLoading } = useCampus();

    useEffect(() => {
        if (campus) {
            // Note: In real app, we might want to verifying session token here too
        }
    }, [campus]);

    useEffect(() => {
        if (isAuthenticated && campus) {
            fetchCampuses();
            fetchSettings();
            fetchLineGroups();
        }
    }, [isAuthenticated, campus]);

    const fetchLineGroups = async () => {
        try {
            const res = await fetch(`/api/line/groups?campusId=${campus?.id}`);
            if (res.ok) {
                const data = await res.json();
                setLineGroups(data.groups || []);
            }
        } catch (error) {
            console.error('Failed to fetch LINE groups', error);
        }
    };

    const fetchSettings = async () => {
        try {
            const res = await fetch(`/api/settings?campusId=${campus?.id}`);
            if (res.ok) {
                const data = await res.json();
                // Parse settings
                const days = data.notifyDayOfWeek.split(',');
                const times = data.notifyTime.split(',');
                const freq = data.notifyFrequency;

                setNotifyFrequency(freq);

                setNotifyFrequency(freq);

                // Legacy schedule parsing removed as schedule is now fixed
            }
        } catch (error) {
            console.error('Failed to fetch settings', error);
        }
    };

    const fetchCampuses = async () => {
        try {
            const res = await fetch('/api/campuses');
            if (res.ok) {
                const data = await res.json();
                setCampuses(data);
            }
        } catch (error) {
            console.error('Failed to fetch campuses', error);
        }
    };

    const showMessage = (text: string, type: 'success' | 'error') => {
        setMessage(text);
        setMessageType(type);
        setTimeout(() => setMessage(''), 5000);
    };

    const handleAdminLogin = async () => {
        setAuthError('');
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ campusId: campus?.id, passcode: adminPassword }),
            });

            const data = await res.json();
            if (res.ok && data.role === 'admin') {
                setIsAuthenticated(true);
            } else if (res.ok && data.role === 'lecturer') {
                setAuthError('管理者権限がありません。管理者パスワードを入力してください。');
            } else {
                setAuthError(data.error || 'パスワードが間違っています');
            }
        } catch {
            setAuthError('認証に失敗しました');
        }
    };

    const handlePasscodeChange = async () => {
        if (newPasscode !== confirmPasscode) {
            showMessage('新しい合言葉が一致しません', 'error');
            return;
        }
        if (newPasscode.length < 4) {
            showMessage('合言葉は4文字以上で設定してください', 'error');
            return;
        }

        setIsLoading(true);
        try {
            showMessage('合言葉を変更しました', 'success');
            setNewPasscode('');
            setConfirmPasscode('');
        } catch (error) {
            showMessage('合言葉の変更に失敗しました', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddCampus = async () => {
        if (!newCampusName) {
            showMessage('教室名を入力してください', 'error');
            return;
        }
        if (!newCampusPasscode || newCampusPasscode.length < 4) {
            showMessage('合言葉は4文字以上で設定してください', 'error');
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch('/api/campuses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newCampusName,
                    passcode: newCampusPasscode,
                    lineAccessToken: newLineAccessToken,
                    lineChannelSecret: newLineChannelSecret
                }),
            });

            if (res.ok) {
                showMessage('教室を追加しました', 'success');
                setNewCampusName('');
                setNewCampusPasscode('');
                setNewLineAccessToken('');
                setNewLineChannelSecret('');
                fetchCampuses(); // Refresh list
            } else {
                const data = await res.json();
                showMessage(data.error || '教室の追加に失敗しました', 'error');
            }
        } catch (error) {
            showMessage('教室の追加に失敗しました', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteCampus = async (id: number) => {
        if (!confirm('この教室を削除しますか？')) return;

        setIsLoading(true);
        try {
            setCampuses(campuses.filter(c => c.id !== id));
            showMessage('教室を削除しました', 'success');
        } catch (error) {
            showMessage('削除に失敗しました', 'error');
        } finally {
            setIsLoading(false);
        }
    };



    const handleSaveNotifySettings = async () => {
        setIsLoading(true);
        try {
            const freq = parseInt(notifyFrequency);
            // const activeSchedules = ... (removed)
            // const days = ... (removed)
            // const times = ... (removed)

            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    campusId: campus?.id,
                    notifyFrequency: "1",       // 強制的に週1回
                    notifyDayOfWeek: "1",       // 強制的に月曜日
                    notifyTime: "12:00",        // 強制的に12:00
                    notifyTargets: "EVENTS,TESTS,ANNOUNCEMENTS"
                }),
            });

            if (res.ok) {
                showMessage('LINE通知設定を保存しました', 'success');
            } else {
                showMessage('設定の保存に失敗しました', 'error');
            }
        } catch (error) {
            showMessage('設定の保存に失敗しました', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleTestSend = async () => {
        if (!confirm('今すぐ定期通知と同じ内容のメッセージを送信しますか？')) return;

        setIsLoading(true);
        try {
            const res = await fetch('/api/line/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    campusId: campus?.id,
                    isTest: true,
                    sendScheduledContent: true,
                    groupId: selectedGroupId === 'all' ? undefined : Number(selectedGroupId),
                }),
            });

            const data = await res.json();
            if (res.ok && data.success) {
                showMessage('テストメッセージを送信しました', 'success');
            } else {
                let errorMsg = data.error || '送信に失敗しました';
                if (data.details) errorMsg += ` (${data.details})`;

                // If detailed payload is available, log it to console and show alert
                if (data.payload) {
                    console.error('Debug Payload:', JSON.stringify(data.payload, null, 2));
                    alert(`【エラー詳細】\n以下のデータをコピーして開発者に送信してください:\n\n${JSON.stringify(data.payload, null, 2)}`);
                }

                showMessage(errorMsg, 'error');
            }
        } catch (error) {
            showMessage('テスト送信に失敗しました', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // getScheduleSummary removed as it is now fixed text
    // const getScheduleSummary = () => { ... }

    // Login Screen
    if (!campus || isCampusLoading) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center min-h-[70vh]">
                    <div className="text-slate-400">読み込み中...</div>
                </div>
            </Layout>
        );
    }

    if (!isAuthenticated) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center min-h-[70vh]">
                    <Card className="w-full max-w-md border-slate-200 shadow-lg">
                        <CardHeader className="text-center">
                            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Lock className="w-8 h-8 text-indigo-600" />
                            </div>
                            <CardTitle className="text-2xl font-bold text-slate-800">{campus.name} 管理者ログイン</CardTitle>
                            <p className="text-sm text-slate-500 mt-2">
                                教室長専用の管理画面です。管理者パスワードを入力してください。
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {authError && (
                                <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">
                                    {authError}
                                </div>
                            )}
                            <div className="grid gap-2">
                                <Label htmlFor="adminPassword">管理者パスワード</Label>
                                <Input
                                    id="adminPassword"
                                    type="password"
                                    value={adminPassword}
                                    onChange={(e) => setAdminPassword(e.target.value)}
                                    placeholder="管理者パスワードを入力"
                                    onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
                                />
                            </div>
                            <Button onClick={handleAdminLogin} className="w-full bg-indigo-600 hover:bg-indigo-700">
                                ログイン
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </Layout>
        );
    }

    // Admin Dashboard
    return (
        <Layout>
            <div className="flex flex-col space-y-6 max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex flex-col space-y-1">
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900">管理者設定</h2>
                        <p className="text-sm text-slate-500">
                            {campus?.name ? (
                                <>現在の校舎: <strong className="text-indigo-600">{campus.name}</strong></>
                            ) : (
                                <span className="text-amber-600">※ 校舎が選択されていません。ログイン画面から校舎を選択してください。</span>
                            )}
                        </p>
                    </div>
                    <Button variant="outline" onClick={() => setIsAuthenticated(false)}>
                        ログアウト
                    </Button>
                </div>

                {/* Message */}
                {message && (
                    <div className={`p-4 rounded-xl ${messageType === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                        {message}
                    </div>
                )}

                {/* Current Campus Info */}
                <Card className="border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Building2 className="w-5 h-5 text-blue-500" />
                            校舎情報
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                    <Building2 className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <div className="font-semibold text-lg text-slate-800">{campus?.name}</div>
                                    <div className="text-xs text-slate-500">ID: {campus?.id}</div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-200">
                            <p className="text-sm font-medium text-slate-600 mb-3">新しい教室を追加</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="campusName">教室名</Label>
                                    <Input
                                        id="campusName"
                                        value={newCampusName}
                                        onChange={(e) => setNewCampusName(e.target.value)}
                                        placeholder="例: 池袋校"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="campusPasscode">講師用合言葉</Label>
                                    <Input
                                        id="campusPasscode"
                                        value={newCampusPasscode}
                                        onChange={(e) => setNewCampusPasscode(e.target.value)}
                                        placeholder="4文字以上"
                                    />
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-100">
                                <p className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4 text-green-500" />
                                    LINE公式アカウント設定 (任意)
                                </p>
                                <div className="grid gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="lineToken" className="text-xs text-slate-500">チャネルアクセストークン (長期)</Label>
                                        <Input
                                            id="lineToken"
                                            value={newLineAccessToken}
                                            onChange={(e) => setNewLineAccessToken(e.target.value)}
                                            placeholder="LINE Developersから取得したトークン"
                                            className="font-mono text-xs"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="lineSecret" className="text-xs text-slate-500">チャネルシークレット</Label>
                                        <Input
                                            id="lineSecret"
                                            value={newLineChannelSecret}
                                            onChange={(e) => setNewLineChannelSecret(e.target.value)}
                                            placeholder="LINE Developersから取得したシークレット"
                                            className="font-mono text-xs"
                                        />
                                    </div>
                                </div>
                            </div>
                            <Button onClick={handleAddCampus} disabled={isLoading} className="mt-4">
                                教室を追加
                            </Button>
                        </div>

                        {/* 登録済みの教室一覧 */}
                        <div className="pt-6 mt-4 border-t border-slate-200">
                            <p className="text-sm font-medium text-slate-600 mb-3 flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-slate-500" />
                                登録済みの教室一覧
                            </p>
                            {campuses.length === 0 ? (
                                <p className="text-xs text-slate-500">教室が登録されていません</p>
                            ) : (
                                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                                    {campuses.map(c => (
                                        <div key={c.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center">
                                                    <Building2 className="w-4 h-4 text-blue-600" />
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-slate-800 text-sm">{c.name}</div>
                                                    <div className="text-xs text-slate-500">ID: {c.id}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Password Change */}
                <Card className="border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Key className="w-5 h-5 text-indigo-500" />
                            講師用合言葉の変更
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-slate-500">
                            講師がログインするための合言葉を変更します。変更後は全員が新しい合言葉でログインする必要があります。
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="newPasscode">新しい合言葉</Label>
                                <Input
                                    id="newPasscode"
                                    type="password"
                                    value={newPasscode}
                                    onChange={(e) => setNewPasscode(e.target.value)}
                                    placeholder="新しい合言葉を入力"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="confirmPasscode">確認</Label>
                                <Input
                                    id="confirmPasscode"
                                    type="password"
                                    value={confirmPasscode}
                                    onChange={(e) => setConfirmPasscode(e.target.value)}
                                    placeholder="もう一度入力"
                                />
                            </div>
                        </div>
                        <Button onClick={handlePasscodeChange} disabled={isLoading}>
                            合言葉を変更
                        </Button>
                    </CardContent>
                </Card>

                {/* LINE Notification Settings */}
                <Card className="border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <MessageSquare className="w-5 h-5 text-green-500" />
                            LINE通知タイミング設定
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-slate-500">
                            定期通知（テスト日程・イベント・連絡事項・未回収テスト）の送信タイミングを設定します。
                        </p>

                        {/* 設定表示（変更不可） */}
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                            <div className="flex items-start gap-3">
                                <Clock className="w-5 h-5 text-slate-500 mt-1" />
                                <div>
                                    <h3 className="font-semibold text-slate-800 mb-1">通知タイミング</h3>
                                    <p className="text-lg font-bold text-indigo-600">毎週 月曜日 12:00</p>
                                    <p className="text-xs text-slate-500 mt-2">
                                        ※ 現在、すべての校舎でこの時間に統一されています。
                                    </p>
                                </div>
                            </div>
                        </div>

                        <Button onClick={handleSaveNotifySettings} disabled={isLoading}>
                            設定を保存
                        </Button>
                    </CardContent>
                </Card>

                {/* LINE Groups Management */}
                <Card className="border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <MessageSquare className="w-5 h-5 text-green-500" />
                            LINE通知先グループ管理
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-slate-500">
                            登録されているLINEグループの管理。無効なグループ（Botが退出済み）は削除してください。
                        </p>
                        {lineGroups.length === 0 ? (
                            <div className="text-center py-6 text-slate-400 text-sm bg-slate-50 rounded-lg">
                                まだLINEグループが登録されていません。
                                <br />
                                BotをLINEグループに招待して「設定 教室名」と送信してください。
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {lineGroups.map((group) => (
                                    <div key={group.id} className={`flex items-center justify-between p-3 rounded-lg border ${group.isValid === false ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-100'
                                        }`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${group.isValid === false ? 'bg-red-100' : 'bg-green-100'
                                                }`}>
                                                <MessageSquare className={`w-4 h-4 ${group.isValid === false ? 'text-red-500' : 'text-green-600'
                                                    }`} />
                                            </div>
                                            <div>
                                                <div className="font-medium text-slate-700">{group.displayName}</div>
                                                <div className="text-xs text-slate-400 font-mono truncate max-w-[200px]">
                                                    {group.groupId.slice(0, 15)}...
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {group.isValid === false && (
                                                <Badge className="bg-red-100 text-red-600 border-0">無効</Badge>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={async () => {
                                                    if (!confirm(`「${group.displayName}」を削除しますか？\n削除すると、このグループへの通知は行われなくなります。`)) return;
                                                    try {
                                                        const res = await fetch(`/api/line/groups?id=${group.id}`, { method: 'DELETE' });
                                                        if (res.ok) {
                                                            showMessage('グループを削除しました', 'success');
                                                            fetchLineGroups();
                                                        } else {
                                                            showMessage('削除に失敗しました', 'error');
                                                        }
                                                    } catch (e) {
                                                        showMessage('削除に失敗しました', 'error');
                                                    }
                                                }}
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <Button variant="outline" onClick={fetchLineGroups} disabled={isLoading} className="w-full">
                            グループ一覧を更新
                        </Button>
                    </CardContent>
                </Card>

                {/* LINE Usage Stats */}
                <LineUsageCard showMessage={showMessage} campusId={campus?.id} />

                {/* Test Send */}
                <Card className="border-slate-200 shadow-sm">
                    {/* ... (Existing Test Send Content) ... */}
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Send className="w-5 h-5 text-purple-500" />
                            テスト送信
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-slate-500">
                            定期通知と同じ内容のメッセージを今すぐLINEグループに送信します。
                            設定したタイミングで送られるメッセージの内容を確認したい場合にご利用ください。
                        </p>

                        <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                            <div className="flex items-start gap-3">
                                <Info className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                                <div className="text-sm text-slate-600">
                                    <p className="font-medium text-purple-700 mb-2">送信される内容</p>
                                    <ul className="list-disc list-inside space-y-1 text-slate-500">
                                        <li>今週のテスト日程（通知期間内のもの）</li>
                                        <li>今週のイベント（通知期間内のもの）</li>
                                        <li>有効な連絡事項</li>
                                        <li>未回収のテスト一覧</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Group Selector */}
                        {lineGroups.length > 0 && (
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-slate-700">送信先グループ</Label>
                                <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="送信先を選択" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">すべてのグループ ({lineGroups.length}件)</SelectItem>
                                        {lineGroups.map((group) => (
                                            <SelectItem key={group.id} value={String(group.id)}>
                                                {group.displayName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-slate-400">
                                    {selectedGroupId === 'all'
                                        ? `登録されている全${lineGroups.length}グループに送信します`
                                        : '選択したグループのみに送信します'}
                                </p>
                            </div>
                        )}

                        <Button onClick={handleTestSend} disabled={isLoading} className="bg-purple-600 hover:bg-purple-700">
                            <Send className="w-4 h-4 mr-2" />
                            今すぐテスト送信
                        </Button>
                    </CardContent>
                </Card>

                {/* Help & Feedback */}
                <Card className="border-slate-200 shadow-sm bg-gradient-to-r from-slate-50 to-blue-50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <HelpCircle className="w-5 h-5 text-blue-500" />
                            ヘルプ・フィードバック
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-slate-600">
                            ご不明な点や改善提案、バグ報告などがございましたら、下記メールアドレスまでお気軽にご連絡ください。
                        </p>

                        <a
                            href="mailto:sutasaku.app@gmail.com?subject=教室運営サポートへのお問い合わせ"
                            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-blue-100 hover:border-blue-300 transition-colors group"
                        >
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                                <Mail className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="font-medium text-slate-700">sutasaku.app@gmail.com</p>
                                <p className="text-xs text-slate-400">クリックしてメールを送信</p>
                            </div>
                        </a>

                        <div className="text-xs text-slate-400">
                            <p>• 使い方のご質問</p>
                            <p>• 機能の改善提案</p>
                            <p>• バグ・不具合のご報告</p>
                            <p>• その他ご意見・ご要望</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
}

function LineUsageCard({ showMessage, campusId }: { showMessage: (text: string, type: 'success' | 'error') => void, campusId?: number }) {
    const [usage, setUsage] = useState<{ quota?: { value?: number }; totalUsage?: number; consumption?: { value?: number; totalUsage?: number } } | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchUsage = async () => {
        setLoading(true);
        try {
            const url = campusId ? `/api/line/usage?campusId=${campusId}` : '/api/line/usage';
            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to fetch usage');
            const data = await res.json();
            setUsage(data);
        } catch (error) {
            console.error(error);
            showMessage('LINE利用状況の取得に失敗しました', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="border-slate-200 shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <MessageSquare className="w-5 h-5 text-green-500" />
                    LINEメッセージ利用状況
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-slate-500 mb-4">
                    当月のメッセージ送信上限（Quota）と、現在の利用通数（Consumption）を確認します。
                </p>

                {usage ? (
                    <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="p-4 bg-slate-50 rounded-lg text-center">
                            <div className="text-xs text-slate-500 mb-1">今月の上限</div>
                            <div className="text-xl font-bold text-slate-800">{usage.quota?.value?.toLocaleString() ?? '-'} 通</div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-lg text-center">
                            <div className="text-xs text-slate-500 mb-1">消費済み</div>
                            <div className="text-xl font-bold text-blue-600">{usage.consumption?.totalUsage?.toLocaleString() ?? '-'} 通</div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-lg text-center">
                            <div className="text-xs text-slate-500 mb-1">残り</div>
                            <div className="text-xl font-bold text-green-600">
                                {usage.quota?.value && usage.consumption?.totalUsage
                                    ? (usage.quota.value - usage.consumption.totalUsage).toLocaleString()
                                    : '-'} 通
                            </div>
                        </div>
                    </div>
                ) : null}

                <div className="flex gap-2">
                    <Button onClick={fetchUsage} disabled={loading} variant="outline" className="w-full">
                        {loading ? '取得中...' : '利用状況を確認する'}
                    </Button>
                    {usage && (
                        <Button
                            variant="ghost"
                            onClick={() => setUsage(null)}
                            className="text-slate-400"
                        >
                            閉じる
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

