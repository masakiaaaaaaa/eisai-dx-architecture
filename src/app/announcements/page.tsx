"use client";

import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Megaphone, Plus, Bell, Info, Trash2, Edit, Clock, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
// Note: Clock icon used for sharing period display
import React, { useState, useEffect } from "react";
import { useCampus } from "@/hooks/use-campus";

type Announcement = {
    id: number;
    title: string;
    detail: string;
    importance: 'HIGH' | 'MEDIUM' | 'LOW';
    notifyStart?: string;
    notifyEnd?: string;
    createdAt: string;
};

type AnnouncementFormData = {
    title: string;
    detail: string;
    importance: 'HIGH' | 'MEDIUM' | 'LOW';
    notifyStart: string;
    notifyEnd: string;
};

export default function AnnouncementsPage() {
    const { campus } = useCampus();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [showExpired, setShowExpired] = useState(false);
    const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
    const [formData, setFormData] = useState<AnnouncementFormData>({
        title: '',
        detail: '',
        importance: 'MEDIUM',
        notifyStart: new Date().toISOString().split('T')[0],
        notifyEnd: '',
    });

    useEffect(() => {
        if (campus) {
            fetchAnnouncements();
        }
    }, [campus]);

    const fetchAnnouncements = async () => {
        if (!campus) return;
        try {
            const res = await fetch(`/api/announcements?campusId=${campus.id}`);
            if (res.ok) {
                const data = await res.json();
                setAnnouncements(data);
            }
        } catch (error) {
            console.error('Failed to fetch announcements', error);
        } finally {
            setLoading(false);
        }
    };

    const isExpired = (notifyEnd?: string) => {
        if (!notifyEnd) return false;
        return new Date(notifyEnd) < new Date();
    };

    const activeAnnouncements = announcements.filter(a => !isExpired(a.notifyEnd));
    const expiredAnnouncements = announcements.filter(a => isExpired(a.notifyEnd));

    const openCreateDialog = () => {
        setEditingId(null);
        setFormData({
            title: '',
            detail: '',
            importance: 'MEDIUM',
            notifyStart: new Date().toISOString().split('T')[0],
            notifyEnd: '',
        });
        setIsDialogOpen(true);
    };

    const openEditDialog = (announcement: Announcement) => {
        setEditingId(announcement.id);
        setFormData({
            title: announcement.title,
            detail: announcement.detail,
            importance: announcement.importance,
            notifyStart: announcement.notifyStart?.split('T')[0] || '',
            notifyEnd: announcement.notifyEnd?.split('T')[0] || '',
        });
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (saving) return; // Prevent double-click
        if (!formData.title || !formData.detail) {
            alert('タイトルと内容は必須です');
            return;
        }

        setSaving(true);
        try {
            const url = editingId
                ? `/api/announcements/${editingId}`
                : '/api/announcements';
            const method = editingId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    campusId: campus?.id,
                    title: formData.title,
                    detail: formData.detail,
                    importance: formData.importance,
                    notifyStart: formData.notifyStart || null,
                    notifyEnd: formData.notifyEnd || null,
                }),
            });

            if (res.ok) {
                fetchAnnouncements();
                setIsDialogOpen(false);
                setEditingId(null);
            } else {
                alert(editingId ? '更新に失敗しました' : '作成に失敗しました');
            }
        } catch (error) {
            console.error('Failed to save announcement', error);
            alert('エラーが発生しました');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (saving) return; // Prevent double-click
        if (!confirm('この連絡事項を削除しますか？')) return;

        setSaving(true);
        try {
            const res = await fetch(`/api/announcements/${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchAnnouncements();
            }
        } catch (error) {
            console.error('Failed to delete announcement', error);
        } finally {
            setSaving(false);
        }
    };

    const getImportanceBadge = (level: string) => {
        switch (level) {
            case 'HIGH': return <Badge className="bg-red-100 text-red-700 hover:bg-red-200">重要</Badge>;
            case 'MEDIUM': return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-200">通常</Badge>;
            case 'LOW': return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200">軽微</Badge>;
            default: return null;
        }
    };

    const toggleExpandCard = (id: number) => {
        setExpandedCards(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const renderAnnouncementCard = (announcement: Announcement, expired: boolean = false, index: number = 0) => {
        const isExpanded = expandedCards.has(announcement.id);
        const lines = announcement.detail.split('\n');
        const needsExpand = lines.length > 5 || announcement.detail.length > 300;
        const staggerClass = index < 8 ? `stagger-${index + 1}` : '';

        return (
            <div
                key={announcement.id}
                className={`bg-white border border-slate-200 rounded-2xl p-5 lg:p-6 shadow-sm card-hover animate-fade-in-up ${staggerClass} ${expired ? 'opacity-60 bg-slate-50' : ''}`}
            >
                {/* Header with badges and actions */}
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                        {getImportanceBadge(announcement.importance)}
                        {expired && <Badge variant="outline" className="text-slate-400 border-slate-300">期限切れ</Badge>}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-400">{new Date(announcement.createdAt).toLocaleDateString('ja-JP')}</span>
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); openEditDialog(announcement); }}
                            className="p-2 hover:bg-blue-50 rounded-lg text-blue-500 transition-colors"
                            title="編集"
                        >
                            <Edit className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleDelete(announcement.id); }}
                            className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-colors"
                            title="削除"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Title */}
                <h3 className="font-bold text-slate-800 text-lg lg:text-xl mb-3">{announcement.title}</h3>

                {/* Content */}
                <p className={`text-sm lg:text-base text-slate-600 whitespace-pre-wrap leading-relaxed ${!isExpanded && needsExpand ? 'line-clamp-5' : ''}`}>
                    {announcement.detail}
                </p>

                {needsExpand && (
                    <button
                        type="button"
                        onClick={() => toggleExpandCard(announcement.id)}
                        className="text-sm text-indigo-600 hover:text-indigo-800 mt-3 flex items-center gap-1 font-medium"
                    >
                        {isExpanded ? (
                            <><ChevronUp className="w-4 h-4" />閉じる</>
                        ) : (
                            <><ChevronDown className="w-4 h-4" />続きを読む</>
                        )}
                    </button>
                )}

                {/* LINE notification info */}
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center text-sm text-slate-500">
                    <Clock className="w-4 h-4 mr-2 text-slate-400" />
                    <span>共有期間: </span>
                    <span className="ml-1 font-medium">
                        {announcement.notifyStart
                            ? `${new Date(announcement.notifyStart).toLocaleDateString('ja-JP')} から${announcement.notifyEnd ? ` ${new Date(announcement.notifyEnd).toLocaleDateString('ja-JP')} まで` : ''}`
                            : '設定なし'}
                    </span>
                </div>
            </div>
        );
    };

    return (
        <Layout>
            <div className="flex flex-col space-y-6 max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex flex-col space-y-1">
                        <h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900">連絡事項設定</h2>
                        <p className="text-sm lg:text-base text-slate-500">講師への業務連絡や注意事項を管理します</p>
                    </div>
                    <Button onClick={openCreateDialog} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 rounded-xl px-6 py-3 lg:py-4 text-base">
                        <Plus className="w-5 h-5 mr-2" /> 連絡事項を追加
                    </Button>
                </div>

                {/* Help Card - Compact */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-xl p-4 lg:p-5">
                    <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                        <div className="text-sm lg:text-base text-slate-600">
                            <span className="font-medium text-purple-700">ヒント: </span>
                            重要度「重要」は赤色で表示。共有期間中はLINEグループに自動送信され、ダッシュボードにも表示されます。
                            <span className="text-amber-600 ml-2">⚠️ 個人的な内容は「生徒一覧」から作成してください。</span>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="grid gap-4 lg:gap-6 lg:grid-cols-2">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-40 rounded-2xl skeleton-shimmer" />
                        ))}
                    </div>
                ) : announcements.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200 animate-fade-in">
                        <Megaphone className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                        <p className="text-slate-500 font-medium">連絡事項がまだ登録されていません</p>
                        <p className="text-xs text-slate-400 mt-1">「連絡作成」ボタンから新しい連絡を作成してください</p>
                    </div>
                ) : (
                    <Tabs defaultValue="active" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-6">
                            <TabsTrigger value="active" className="text-sm">
                                有効な連絡
                                <Badge variant="secondary" className="ml-2 bg-slate-100 text-slate-600">{activeAnnouncements.length}</Badge>
                            </TabsTrigger>
                            <TabsTrigger value="expired" className="text-sm">
                                期限切れ
                                <Badge variant="secondary" className="ml-2 bg-slate-100 text-slate-600">{expiredAnnouncements.length}</Badge>
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="active" className="mt-0">
                            {activeAnnouncements.length === 0 ? (
                                <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                    <p className="text-slate-500 text-lg">有効な連絡事項はありません</p>
                                </div>
                            ) : (
                                <div className="grid gap-4 lg:gap-6 lg:grid-cols-2">
                                    {activeAnnouncements.map((a, i) => renderAnnouncementCard(a, false, i))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="expired" className="space-y-4 mt-0">
                            {expiredAnnouncements.length === 0 ? (
                                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                    <p className="text-slate-500 text-lg">期限切れの連絡事項はありません</p>
                                </div>
                            ) : (
                                <div className="grid gap-4 lg:gap-6 lg:grid-cols-2">
                                    {expiredAnnouncements.map((a) => renderAnnouncementCard(a, true))}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                )}

                {/* Create/Edit Dialog */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="w-[95%] md:max-w-4xl max-h-[85vh] overflow-y-auto rounded-xl">
                        <DialogHeader>
                            <DialogTitle>{editingId ? '連絡事項を編集' : '新規連絡事項'}</DialogTitle>
                            <DialogDescription>
                                {editingId
                                    ? '連絡事項の内容を編集します。'
                                    : '講師への業務連絡を作成します。登録された連絡はLINEグループに自動通知されます。'}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="title">タイトル <span className="text-red-500">*</span></Label>
                                <Input
                                    id="title"
                                    placeholder="例: 模試採点について、新規教材の確認"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="importance">重要度</Label>
                                <Select
                                    value={formData.importance}
                                    onValueChange={(val: 'HIGH' | 'MEDIUM' | 'LOW') => setFormData({ ...formData, importance: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="重要度を選択" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="HIGH">重要 - 必ず対応が必要</SelectItem>
                                        <SelectItem value="MEDIUM">通常 - 確認をお願いしたい内容</SelectItem>
                                        <SelectItem value="LOW">軽微 - 参考情報として共有</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="detail">内容 <span className="text-red-500">*</span></Label>
                                <Textarea
                                    id="detail"
                                    placeholder="講師に伝えたい内容、指示、注意事項などを記入してください"
                                    value={formData.detail}
                                    onChange={(e) => setFormData({ ...formData, detail: e.target.value })}
                                    className="min-h-[120px]"
                                />
                            </div>

                            {/* Sharing Period Settings */}
                            <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                    <Clock className="w-4 h-4" />
                                    共有期間
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="notifyStart">共有開始日</Label>
                                        <Input
                                            id="notifyStart"
                                            type="date"
                                            value={formData.notifyStart}
                                            onChange={(e) => setFormData({ ...formData, notifyStart: e.target.value })}
                                        />
                                        <p className="text-xs text-slate-400">この日からダッシュボード・LINEに共有されます</p>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="notifyEnd">共有終了日</Label>
                                        <Input
                                            id="notifyEnd"
                                            type="date"
                                            value={formData.notifyEnd}
                                            onChange={(e) => setFormData({ ...formData, notifyEnd: e.target.value })}
                                        />
                                        <p className="text-xs text-slate-400">この日まで共有されます</p>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500">
                                    設定した期間中、ダッシュボードに表示され、定期通知時にLINEグループにも送信されます。
                                    終了日を設定しない場合は、手動で削除するまで共有が続きます。
                                </p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={saving}>キャンセル</Button>
                            <Button onClick={handleSave} disabled={saving}>
                                {saving ? (
                                    <>
                                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                        保存中...
                                    </>
                                ) : (editingId ? '更新' : '作成')}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </Layout>
    );
}
