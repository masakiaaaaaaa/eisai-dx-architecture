"use client";

import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Users, Plus, Search, School, Upload, FileText, AlertTriangle, Info, RefreshCw, Calendar, Filter, FileSpreadsheet, Loader2, X, Trash2, Megaphone, AlertCircle, Bell, NotebookPen, Sparkles, ChevronRight, Lock, MoreHorizontal, Edit3, CheckCircle, Circle, ChevronDown, Clock, ArrowUpRight } from "lucide-react";
import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";

type Student = {
    id: number;
    studentId: string;
    name: string;
    furigana: string;
    grade: string;
    description?: string;
    schoolId?: number;
    school?: {
        id: number;
        name: string;
    };
    isActive: boolean;
    isHighlighted?: boolean;
    isChurnRisk?: boolean;
    churnRiskReason?: string;
    graduatedAt?: string;
    createdAt?: string;
};

type SchoolOption = {
    id: number;
    name: string;
};

type StudentEvent = {
    id: number;
    title: string;
    date: string;
    endDate?: string;
    type: string;
    description?: string;
    resolvedAt?: string | null;
};

type StudentAnnouncement = {
    id: number;
    title: string;
    detail: string;
    importance: string;
    notifyStart?: string;
    notifyEnd?: string;
    resolvedAt?: string | null;
};

type ActiveItem = {
    id: number;
    type: 'event' | 'announcement';
    title: string;
    date: string;
    studentId: number;
    studentName: string;
};

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import { useCampus } from "@/hooks/use-campus";

// ... (imports)

function StudentsPageContent() {
    const { campus } = useCampus(); // Hook
    const [students, setStudents] = useState<Student[]>([]);
    const [schools, setSchools] = useState<SchoolOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
    const [previewStudents, setPreviewStudents] = useState<any[]>([]);
    const [isManualDialogOpen, setIsManualDialogOpen] = useState(false);
    const [isStudentDetailOpen, setIsStudentDetailOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [studentEvents, setStudentEvents] = useState<StudentEvent[]>([]);
    const [studentAnnouncements, setStudentAnnouncements] = useState<StudentAnnouncement[]>([]);
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [descriptionDraft, setDescriptionDraft] = useState('');
    const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
    const [isAnnouncementDialogOpen, setIsAnnouncementDialogOpen] = useState(false);
    const [eventFormData, setEventFormData] = useState({
        title: '',
        date: new Date().toISOString().split('T')[0],
        endDate: '',
        type: 'OTHER' as 'EXAM' | 'EIKEN' | 'SEASONAL_COURSE' | 'OTHER',
        description: '',
        notifyWeeksBefore: '1',
    });
    const [announcementFormData, setAnnouncementFormData] = useState({
        title: '',
        detail: '',
        importance: 'MEDIUM' as 'HIGH' | 'MEDIUM' | 'LOW',
        notifyStart: new Date().toISOString().split('T')[0],
        notifyEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
    const [editingEventId, setEditingEventId] = useState<number | null>(null);
    const [editingAnnouncementId, setEditingAnnouncementId] = useState<number | null>(null);
    const [formData, setFormData] = useState<Partial<Student>>({
        grade: '高1',
    });
    const [importPassword, setImportPassword] = useState('');
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [isEventSubmitting, setIsEventSubmitting] = useState(false);
    const [isAnnouncementSubmitting, setIsAnnouncementSubmitting] = useState(false);
    const [isStudentSubmitting, setIsStudentSubmitting] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const searchParams = useSearchParams();
    const initialIdProcessed = useRef(false);

    const [activeItems, setActiveItems] = useState<ActiveItem[]>([]);
    const [weeklyItems, setWeeklyItems] = useState<ActiveItem[]>([]);
    const [showGraduated, setShowGraduated] = useState(false);
    const [gradeFilter, setGradeFilter] = useState<string>('ALL');
    const [schoolTestDates, setSchoolTestDates] = useState<any[]>([]);
    const [churnRiskSaving, setChurnRiskSaving] = useState(false);
    const [churnRiskReasonDraft, setChurnRiskReasonDraft] = useState('');

    const GRADE_OPTIONS = [
        { value: 'ALL', label: '全学年' },
        { value: '小1', label: '小学1年' },
        { value: '小2', label: '小学2年' },
        { value: '小3', label: '小学3年' },
        { value: '小4', label: '小学4年' },
        { value: '小5', label: '小学5年' },
        { value: '小6', label: '小学6年' },
        { value: '中1', label: '中学1年' },
        { value: '中2', label: '中学2年' },
        { value: '中3', label: '中学3年' },
        { value: '高1', label: '高校1年' },
        { value: '高2', label: '高校2年' },
        { value: '高3', label: '高校3年' },
    ];

    // ...

    useEffect(() => {
        if (campus) {
            fetchStudents();
            fetchSchools();
            fetchActiveItems();
            fetchWeeklyItems();
        }
    }, [campus]);

    useEffect(() => {
        if (students.length > 0 && !initialIdProcessed.current) {
            const idParam = searchParams.get('id');
            const studentIdParam = searchParams.get('studentId');

            let student: Student | undefined;

            if (idParam) {
                // Search by numeric database id
                student = students.find(s => s.id === parseInt(idParam));
            } else if (studentIdParam) {
                // Search by string studentId (code like "S001")
                student = students.find(s => s.studentId === studentIdParam);
            }

            if (student) {
                handleStudentClick(student);
                initialIdProcessed.current = true;
            }
        }
    }, [students, searchParams]);

    const fetchStudents = async () => {
        if (!campus) return;
        try {
            const res = await fetch(`/api/students?campusId=${campus.id}`);
            if (res.ok) {
                const data = await res.json();
                setStudents(data);
            }
        } catch (error) {
            console.error('Failed to fetch students', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSchools = async () => {
        if (!campus) return;
        try {
            const res = await fetch(`/api/schools?campusId=${campus.id}`);
            if (res.ok) {
                const data = await res.json();
                setSchools(data);
            }
        } catch (error) {
            console.error('Failed to fetch schools', error);
        }
    };

    const fetchActiveItems = async () => {
        if (!campus) return;
        try {
            const res = await fetch(`/api/students/active-items?campusId=${campus.id}`);
            if (res.ok) {
                const data = await res.json();
                const items: ActiveItem[] = [];

                data.events.forEach((e: any) => {
                    if (e.student) {
                        items.push({
                            id: e.id,
                            type: 'event',
                            title: e.title,
                            date: e.date,
                            studentId: e.studentId,
                            studentName: e.student.name,
                        });
                    }
                });

                data.announcements.forEach((a: any) => {
                    if (a.student) {
                        items.push({
                            id: a.id,
                            type: 'announcement',
                            title: a.title,
                            date: a.notifyEnd,
                            studentId: a.studentId,
                            studentName: a.student.name,
                        });
                    }
                });

                // Sort by date asc
                items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                setActiveItems(items);
            }
        } catch (error) {
            console.error('Failed to fetch active items', error);
        }
    };

    // NEW: Fetch items registered in the past week
    const fetchWeeklyItems = async () => {
        if (!campus) return;
        try {
            const res = await fetch(`/api/students/active-items?campusId=${campus.id}`);
            if (res.ok) {
                const data = await res.json();
                const items: ActiveItem[] = [];
                const now = new Date();
                const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

                data.events.forEach((e: any) => {
                    const createdAt = new Date(e.createdAt || e.date);
                    if (e.student && createdAt >= oneWeekAgo) {
                        items.push({
                            id: e.id,
                            type: 'event',
                            title: e.title,
                            date: e.date,
                            studentId: e.studentId,
                            studentName: e.student.name,
                        });
                    }
                });

                data.announcements.forEach((a: any) => {
                    const createdAt = new Date(a.createdAt || a.notifyStart);
                    if (a.student && createdAt >= oneWeekAgo) {
                        items.push({
                            id: a.id,
                            type: 'announcement',
                            title: a.title,
                            date: a.notifyEnd,
                            studentId: a.studentId,
                            studentName: a.student.name,
                        });
                    }
                });

                // Sort by date desc (newest first)
                items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                setWeeklyItems(items);
            }
        } catch (error) {
            console.error('Failed to fetch weekly items', error);
        }
    };

    const fetchStudentDetails = async (student: Student) => {
        try {
            const [eventsRes, announcementsRes] = await Promise.all([
                fetch(`/api/students/${student.id}/events`),
                fetch(`/api/students/${student.id}/announcements`),
            ]);

            if (eventsRes.ok) {
                const events = await eventsRes.json();
                setStudentEvents(events);
            }
            if (announcementsRes.ok) {
                const announcements = await announcementsRes.json();
                setStudentAnnouncements(announcements);
            }

            // Fetch school test dates if student has a school
            if (student.schoolId) {
                try {
                    if (campus) {
                        const schoolRes = await fetch(`/api/test-schedule?campusId=${campus.id}`);
                        if (schoolRes.ok) {
                            const schoolsData = await schoolRes.json();
                            const studentSchool = schoolsData.find((s: any) => s.id === student.schoolId);
                            if (studentSchool && studentSchool.testDates) {
                                const testDates = JSON.parse(studentSchool.testDates || '[]');
                                // Filter for upcoming or current tests
                                const now = new Date();
                                now.setHours(0, 0, 0, 0);
                                const relevantTests = testDates.filter((t: any) => {
                                    const endDate = new Date(t.end);
                                    endDate.setHours(23, 59, 59, 999);
                                    return endDate >= now;
                                });
                                setSchoolTestDates(relevantTests);
                            }
                        }
                    }
                } catch (e) {
                    console.error('Failed to fetch school test dates', e);
                }
            }
        } catch (error) {
            console.error('Failed to fetch student details', error);
        }
    };

    const handleSaveDescription = async () => {
        if (!selectedStudent) return;
        try {
            const res = await fetch(`/api/students/${selectedStudent.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ description: descriptionDraft }),
            });
            if (res.ok) {
                const updatedStudent = await res.json();
                setSelectedStudent(updatedStudent);
                // Update local list
                setStudents(students.map(s => s.id === updatedStudent.id ? updatedStudent : s));
                setIsEditingDescription(false);
            } else {
                alert('更新に失敗しました');
            }
        } catch (e) {
            alert('エラーが発生しました');
        }
    };

    const handleChurnRiskToggle = async () => {
        if (!selectedStudent || churnRiskSaving) return;
        setChurnRiskSaving(true);
        const newValue = !selectedStudent.isChurnRisk;
        try {
            const res = await fetch(`/api/students/${selectedStudent.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isChurnRisk: newValue, churnRiskReason: newValue ? churnRiskReasonDraft : null }),
            });
            if (res.ok) {
                const updated = await res.json();
                setSelectedStudent(updated);
                setStudents(students.map(s => s.id === updated.id ? updated : s));
                if (!newValue) setChurnRiskReasonDraft('');
            } else {
                alert('更新に失敗しました');
            }
        } catch (e) {
            alert('エラーが発生しました');
        } finally {
            setChurnRiskSaving(false);
        }
    };

    const handleChurnRiskReasonSave = async () => {
        if (!selectedStudent || !selectedStudent.isChurnRisk) return;
        try {
            const res = await fetch(`/api/students/${selectedStudent.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ churnRiskReason: churnRiskReasonDraft || null }),
            });
            if (res.ok) {
                const updated = await res.json();
                setSelectedStudent(updated);
                setStudents(students.map(s => s.id === updated.id ? updated : s));
            }
        } catch (e) {
            // silent
        }
    };

    const handleStudentClick = (student: Student) => {
        // Clear stale data first
        setStudentEvents([]);
        setStudentAnnouncements([]);
        if (student) {
            setSelectedStudent(student);
            setDescriptionDraft(student.description || '');
            setChurnRiskReasonDraft(student.churnRiskReason || '');
            setIsEditingDescription(false);
            fetchStudentDetails(student);
            setIsStudentDetailOpen(true);
        }
    };

    const handleCreateEvent = async () => {
        if (!selectedStudent || !eventFormData.title || !eventFormData.date) {
            alert('必須項目を入力してください');
            return;
        }

        if (isEventSubmitting) return;
        setIsEventSubmitting(true);

        try {
            const isUpdate = !!editingEventId;
            const url = isUpdate ? `/api/events/${editingEventId}` : '/api/events';
            const method = isUpdate ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...eventFormData,
                    campusId: campus?.id,
                    studentId: selectedStudent.id,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                await fetchStudentDetails(selectedStudent);
                fetchActiveItems(); // Refresh active items
                setIsEventDialogOpen(false);
                setEditingEventId(null);
                setEventFormData({
                    title: '',
                    date: new Date().toISOString().split('T')[0],
                    endDate: '', // Reset endDate
                    type: 'OTHER',
                    description: '',
                    notifyWeeksBefore: '1' // Reset to default
                });
                alert(isUpdate ? 'イベントを更新しました' : 'イベントを作成しました');
            } else {
                console.error('Save event failed:', data);
                alert(`保存に失敗しました: ${data.details || data.error || '不明なエラー'}`);
            }
        } catch (error) {
            console.error('Failed to create event', error);
            alert('エラーが発生しました: ' + (error as Error).message);
        } finally {
            setIsEventSubmitting(false);
        }
    };

    const handleCreateAnnouncement = async () => {
        if (!selectedStudent || !announcementFormData.title || !announcementFormData.detail) {
            alert('必須項目を入力してください');
            return;
        }

        if (isAnnouncementSubmitting) return;
        setIsAnnouncementSubmitting(true);

        try {
            const isUpdate = !!editingAnnouncementId;
            const url = isUpdate ? `/api/announcements/${editingAnnouncementId}` : '/api/announcements';
            const method = isUpdate ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId: selectedStudent.id,
                    campusId: campus?.id,
                    ...announcementFormData,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                await fetchStudentDetails(selectedStudent);
                fetchActiveItems();
                setIsAnnouncementDialogOpen(false);
                setEditingAnnouncementId(null);
                setAnnouncementFormData({
                    title: '',
                    detail: '',
                    importance: 'MEDIUM',
                    notifyStart: new Date().toISOString().split('T')[0],
                    notifyEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                });
                alert(isUpdate ? '連絡を更新しました' : '連絡を作成しました');
            } else {
                console.error('Save announcement failed:', data);
                alert(`保存に失敗しました: ${data.details || data.error || '不明なエラー'}`);
            }
        } catch (error) {
            console.error('Failed to create announcement', error);
            alert('エラーが発生しました: ' + (error as Error).message);
        } finally {
            setIsAnnouncementSubmitting(false);
        }
    };

    const handleImportClick = () => {
        setImportPassword('');
        setPasswordError('');
        setIsPasswordDialogOpen(true);
    };

    const handlePasswordSubmit = async () => {
        if (!campus || !importPassword) return;

        try {
            const res = await fetch('/api/campus/verify-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ campusId: campus.id, password: importPassword })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setIsPasswordDialogOpen(false);
                setIsDialogOpen(true);
            } else {
                setPasswordError('パスワードが間違っています');
            }
        } catch (e) {
            setPasswordError('認証中にエラーが発生しました');
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        if (campus) {
            formData.append('campusId', campus.id.toString());
        }
        formData.append('password', importPassword);

        try {
            if (!campus) throw new Error("Campus not found");
            
            // If students array is empty, it's an initial campus setup.
            // Branch to the preview API so we can confirm highlights individually.
            const apiTarget = students.length === 0 ? '/api/students/import/preview' : '/api/students/import';
            
            const res = await fetch(apiTarget, {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();

            if (res.ok) {
                if (students.length === 0) {
                    // Show confirmation dialogue with individual highlight mapping
                    setPreviewStudents(data.students || []);
                    setIsDialogOpen(false);
                    setIsPreviewDialogOpen(true);
                } else {
                    alert(`インポート完了\n追加: ${data.created}件\n更新: ${data.updated}件\n退塾: ${data.deleted || 0}件\n未照合（変更なし）: ${data.unmatched || 0}件\n失敗: ${data.failed}件`);
                    if (data.failed > 0) {
                        console.error('Import errors:', data.errors);
                        alert(`エラー詳細:\n${data.errors.slice(0, 5).join('\n')}${data.errors.length > 5 ? '\n...' : ''}`);
                    }
                    if (data.debug) {
                        console.log('Import Debug Info:', data.debug);
                    }
                    fetchStudents();
                    fetchSchools();
                    setIsDialogOpen(false);
                }
            } else {
                alert('インポート失敗: ' + (data.error || '不明なエラー'));
                if (data.debug) {
                    console.log('Import Debug Info:', data.debug);
                    alert('デバッグ情報がコンソールに出力されました。');
                }
            }
        } catch (error) {
            console.error('Import failed', error);
            alert('インポート中にエラーが発生しました');
        } finally {
            setUploading(false);
            if (event.target) {
                event.target.value = '';
            }
        }
    };

    const handleConfirmImport = async () => {
        setUploading(true);
        try {
            const res = await fetch('/api/students/import/batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    campusId: campus?.id,
                    password: importPassword,
                    students: previewStudents
                })
            });
            const data = await res.json();
            
            if (res.ok) {
                alert(`初回インポート登録完了\n追加: ${data.created}件`);
                if (data.failed > 0) {
                    console.error('Import errors:', data.errors);
                }
                fetchStudents();
                fetchSchools();
                setIsPreviewDialogOpen(false);
            } else {
                alert('登録失敗: ' + (data.error || '不明なエラー'));
            }
        } catch (error) {
            console.error('Batch Import failed', error);
            alert('一括登録中にエラーが発生しました');
        } finally {
            setUploading(false);
        }
    };

    const handleManualCreate = async () => {
        if (!formData.studentId || !formData.name || !formData.furigana || !formData.schoolId || !formData.grade) {
            alert('必須項目を入力してください');
            return;
        }

        if (isStudentSubmitting) return;
        setIsStudentSubmitting(true);

        try {
            const res = await fetch('/api/students', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    campusId: campus?.id,
                }),
            });

            if (res.ok) {
                fetchStudents();
                setIsManualDialogOpen(false);
                setFormData({ grade: '高1' });
                alert('生徒を登録しました');
            } else {
                alert('登録に失敗しました');
            }
        } catch (error) {
            console.error('Failed to create student', error);
            alert('エラーが発生しました');
        } finally {
            setIsStudentSubmitting(false);
        }
    };



    const filteredStudents = students.filter((student) => {
        const matchesSearch = student.name.includes(searchQuery) ||
            student.furigana.includes(searchQuery) ||
            student.studentId.includes(searchQuery);

        const matchesGrade = gradeFilter === 'ALL' || student.grade === gradeFilter;
        // Logic Change: Toggle ON = Show ONLY Graduated (!isActive), Toggle OFF = Show ONLY Active
        const matchesActive = showGraduated ? !student.isActive : student.isActive;

        return matchesSearch && matchesGrade && matchesActive;
    }).sort((a, b) => a.studentId.localeCompare(b.studentId, undefined, { numeric: true, sensitivity: 'base' }));

    const getGradeBadgeColor = (grade: string) => {
        if (grade.includes('高3') || grade.includes('中3')) return 'bg-red-100 text-red-700';
        if (grade.includes('高2') || grade.includes('中2')) return 'bg-orange-100 text-orange-700';
        if (grade.includes('高1') || grade.includes('中1')) return 'bg-blue-100 text-blue-700';
        return 'bg-slate-100 text-slate-700';
    };

    return (
        <Layout>
            <div className="flex flex-col space-y-6 max-w-5xl mx-auto">
                {/* Header */}
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-col space-y-1">
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900">生徒一覧</h2>
                        <p className="text-sm text-slate-500 whitespace-nowrap md:whitespace-normal">生徒情報の管理・イベント登録</p>
                    </div>
                    <div className="flex gap-2 items-center overflow-x-auto pb-1 md:pb-0 hide-scrollbar max-w-full">
                        <label className="flex items-center space-x-2 mr-2 cursor-pointer group p-2 hover:bg-slate-50 rounded-full transition-colors border border-transparent hover:border-slate-200 flex-shrink-0">
                            <div className={`w-10 h-6 flex items-center bg-gray-300 rounded-full p-1 duration-300 ease-in-out ${showGraduated ? 'bg-indigo-600' : ''}`}>
                                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${showGraduated ? 'translate-x-4' : ''}`}></div>
                            </div>
                            <input
                                type="checkbox"
                                id="showGraduated"
                                checked={showGraduated}
                                onChange={(e) => setShowGraduated(e.target.checked)}
                                className="hidden"
                            />
                            <span className="text-xs font-bold text-slate-600 group-hover:text-slate-800 whitespace-nowrap select-none">
                                卒業生のみ
                            </span>
                        </label>
                        <Button onClick={() => setIsManualDialogOpen(true)} variant="outline" className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 rounded-full h-10 px-4 flex-shrink-0">
                            <Plus className="w-4 h-4 mr-2" /> 手動追加
                        </Button>
                        <Button onClick={handleImportClick} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 rounded-full h-10 px-4 flex-shrink-0">
                            <Upload className="w-4 h-4 mr-2" /> インポート
                        </Button>

                    </div>
                </div>

                {/* CSV Import Guide Card - Compact - Hidden on Mobile to save space? Keep it. */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-xl p-3 shadow-sm">
                    <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-slate-600 leading-relaxed">
                            <span className="font-medium text-amber-700">ヒント: </span>
                            下部の生徒一覧から生徒をタップし、「イベント追加」「連絡追加」を行ってください。登録内容はダッシュボードとLINE通知に即時反映されます。
                        </div>
                    </div>
                </div>

                {/* Weekly Bulletin Board - NEW */}
                {weeklyItems.length > 0 && (
                    <div className="bg-white rounded-xl border border-indigo-200 shadow-sm overflow-hidden">
                        <div className="px-4 py-3 border-b border-indigo-100 bg-indigo-50/50 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-indigo-500" />
                            <h3 className="font-bold text-indigo-900 text-sm">今週登録された内容</h3>
                            <Badge className="bg-white text-indigo-600 border border-indigo-100 text-xs shadow-sm">{weeklyItems.length}件</Badge>
                        </div>
                        <div className="p-2 space-y-1 max-h-56 overflow-y-auto custom-scrollbar">
                            {weeklyItems.map((item) => (
                                <div
                                    key={`weekly-${item.type}-${item.id}`}
                                    className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-lg hover:border-indigo-200 hover:shadow-sm cursor-pointer transition-all"
                                    onClick={() => {
                                        const student = students.find(s => s.id === item.studentId);
                                        if (student) handleStudentClick(student);
                                    }}
                                >
                                    <Badge variant="outline" className={
                                        item.type === 'event' ? 'bg-indigo-50 text-indigo-600 border-indigo-200 text-xs px-2 py-0.5 whitespace-nowrap' : 'bg-purple-50 text-purple-600 border-purple-200 text-xs px-2 py-0.5 whitespace-nowrap'
                                    }>
                                        {item.type === 'event' ? 'イベント' : '連絡事項'}
                                    </Badge>
                                    <span className="font-bold text-slate-700 text-sm truncate max-w-[120px] md:max-w-xs">{item.studentName}</span>
                                    <span className="text-xs text-slate-500 ml-auto truncate flex-1 text-right">{item.title}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Active Items Section - Grouped by Student (like Dashboard) */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in-up stagger-1">
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                        <Bell className="w-4 h-4 text-indigo-500" />
                        <h3 className="font-bold text-slate-700 text-sm">確認・通知が必要な生徒</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto custom-scrollbar">
                        {activeItems.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 text-sm">
                                現在確認が必要な生徒はいません
                            </div>
                        ) : (() => {
                            // Group items by student (like Dashboard)
                            const groupedByStudent = activeItems.reduce((acc, item) => {
                                const studentId = item.studentId ?? 0;
                                const studentName = item.studentName ?? '不明';
                                const key = `${studentId}-${studentName}`;
                                if (!acc[key]) {
                                    acc[key] = { studentId, studentName, items: [] as typeof activeItems };
                                }
                                acc[key].items.push(item);
                                return acc;
                            }, {} as Record<string, { studentId: number; studentName: string; items: typeof activeItems }>);
                            const studentGroups = Object.values(groupedByStudent);

                            return (
                                <div className="divide-y divide-slate-50">
                                    {studentGroups.map(group => (
                                        <div
                                            key={`student-${group.studentId}`}
                                            className="px-5 py-4 hover:bg-slate-50/80 transition-colors cursor-pointer group"
                                            onClick={() => {
                                                const student = students.find(s => s.id === group.studentId);
                                                if (student) handleStudentClick(student);
                                            }}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-indigo-100/50 text-indigo-600 flex items-center justify-center flex-shrink-0 font-bold text-base shadow-inner border border-indigo-200/50">
                                                    {group.studentName.charAt(0)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-bold text-slate-800 text-base group-hover:text-indigo-700 transition-colors">{group.studentName}</span>
                                                        <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">ID:{group.studentId}</span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {group.items.slice(0, 3).map(item => (
                                                            <Badge
                                                                key={`${item.type}-${item.id}`}
                                                                variant="outline"
                                                                className={`text-[11px] px-2 py-0.5 ${item.type === 'event' ? 'bg-indigo-50/50 text-indigo-700 border-indigo-200' : 'bg-purple-50/50 text-purple-700 border-purple-200'}`}
                                                            >
                                                                {item.title}
                                                            </Badge>
                                                        ))}
                                                        {group.items.length > 3 && (
                                                            <Badge variant="outline" className="text-[10px] text-slate-400 bg-slate-50">+{group.items.length - 3}</Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="bg-slate-100 rounded-full p-1 group-hover:bg-indigo-100 transition-colors">
                                                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}
                    </div>
                </div>

                {/* Search */}
                <div className="flex flex-col sm:flex-row gap-4 mt-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="名前、ふりがな、生徒IDで検索..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 rounded-full border-slate-200"
                        />
                    </div>
                    <div className="w-full sm:w-48">
                        <Select value={gradeFilter} onValueChange={setGradeFilter}>
                            <SelectTrigger className="rounded-full border-slate-200">
                                <SelectValue placeholder="学年で絞り込み" />
                            </SelectTrigger>
                            <SelectContent>
                                {GRADE_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-slate-500">
                    <span>全 {students.length} 名</span>
                    {searchQuery && <span>（{filteredStudents.length} 件ヒット）</span>}
                </div>

                {loading ? (
                    <div className="space-y-2">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-14 rounded-lg skeleton-shimmer" />
                        ))}
                    </div>
                ) : filteredStudents.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200 animate-fade-in">
                        <Users className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                        {students.length === 0 ? (
                            <>
                                <p className="text-slate-500 font-medium">生徒がまだ登録されていません</p>
                                <p className="text-xs text-slate-400 mt-1">上部の「CSVインポート」から塾マネのデータをアップロードしてください</p>
                            </>
                        ) : (
                            <>
                                <p className="text-slate-500 font-medium">検索条件に一致する生徒が見つかりませんでした</p>
                                <p className="text-xs text-slate-400 mt-1">検索条件を変更してください</p>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead className="w-[100px]">学年</TableHead>
                                    <TableHead>学校名</TableHead>
                                    <TableHead>氏名</TableHead>
                                    <TableHead>ふりがな</TableHead>
                                    <TableHead>会員番号</TableHead>
                                    <TableHead className="text-right">詳細</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredStudents.map((student, index) => (
                                    <TableRow
                                        key={student.id}
                                        className={`cursor-pointer transition-colors h-14 ${student.isActive ? 'hover:bg-indigo-50/50' : 'bg-slate-100/50 hover:bg-slate-100 text-slate-500'}`}
                                        onClick={() => handleStudentClick(student)}
                                    >
                                        <TableCell>
                                            <Badge variant="secondary" className={getGradeBadgeColor(student.grade)}>
                                                {student.grade}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-slate-600">
                                            {student.school?.name || '未設定'}
                                        </TableCell>
                                        <TableCell className="font-medium text-slate-900">
                                            <div className="flex items-center">
                                                {student.name}
                                                {student.isChurnRisk && (
                                                    <span className="ml-1" title="退塾懸念">⚠️</span>
                                                )}
                                                {student.isActive && student.isHighlighted && (!student.createdAt || new Date(student.createdAt) >= new Date(new Date().setMonth(new Date().getMonth() - 1))) && (
                                                    <Badge className="ml-2 text-[10px] bg-orange-100 text-orange-700 border-orange-200 border">新規入会</Badge>
                                                )}
                                                {!student.isActive && <Badge variant="outline" className="ml-2 text-[10px] text-slate-500 bg-slate-200 border-slate-300">卒業/退塾</Badge>}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-slate-500">
                                            {student.furigana}
                                        </TableCell>
                                        <TableCell className="font-mono text-sm text-slate-600">
                                            {student.studentId}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <ChevronRight className="w-4 h-4 text-slate-300 inline-block" />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}

                {/* Manual Add Button (Secondary) */}
                <div className="flex justify-center pt-4">
                    <button
                        onClick={() => setIsManualDialogOpen(true)}
                        className="text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2"
                    >
                        手動で生徒を追加する（非推奨）
                    </button>
                </div>

                {/* Student Detail Dialog */}
                <Dialog open={isStudentDetailOpen} onOpenChange={setIsStudentDetailOpen}>
                    <DialogContent className="max-w-[95vw] md:max-w-4xl max-h-[90dvh] overflow-y-auto rounded-xl">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-3">
                                <span className="text-xl">{selectedStudent?.name}</span>
                                <Badge variant="secondary" className={selectedStudent ? getGradeBadgeColor(selectedStudent.grade) : ''}>
                                    {selectedStudent?.grade}
                                </Badge>
                            </DialogTitle>
                            <DialogDescription>
                                {selectedStudent?.school?.name} / {selectedStudent?.studentId}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6 py-4">
                            {/* Churn Risk Toggle Bar */}
                            <div className={`rounded-xl p-4 border transition-colors duration-300 ${selectedStudent?.isChurnRisk ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <span className="text-base">{selectedStudent?.isChurnRisk ? '⚠️' : '🟢'}</span>
                                        <span className={`text-sm font-bold ${selectedStudent?.isChurnRisk ? 'text-red-600' : 'text-slate-700'}`}>
                                            退塾懸念
                                        </span>
                                    </div>
                                    <button
                                        onClick={handleChurnRiskToggle}
                                        disabled={churnRiskSaving}
                                        className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${selectedStudent?.isChurnRisk ? 'bg-red-500' : 'bg-slate-300'} ${churnRiskSaving ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                                    >
                                        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-300 ${selectedStudent?.isChurnRisk ? 'left-[22px]' : 'left-0.5'}`} />
                                    </button>
                                </div>
                                {selectedStudent?.isChurnRisk && (
                                    <div className="mt-3">
                                        <Input
                                            value={churnRiskReasonDraft}
                                            onChange={(e) => setChurnRiskReasonDraft(e.target.value)}
                                            onBlur={handleChurnRiskReasonSave}
                                            onKeyDown={(e) => { if (e.key === 'Enter') handleChurnRiskReasonSave(); }}
                                            placeholder="退塾懸念の理由を入力..."
                                            className="border-red-200 focus:border-red-400 bg-white text-sm"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Shared Note (Teacher's Memo) */}
                            <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-medium text-indigo-900 flex items-center gap-2 text-sm">
                                        <NotebookPen className="w-4 h-4 text-indigo-600" />
                                        指導共有事項・特記事項
                                    </h4>
                                    {!isEditingDescription ? (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setIsEditingDescription(true)}
                                            className="h-6 px-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-100"
                                        >
                                            <Edit3 className="w-3 h-3 mr-1" />
                                            編集
                                        </Button>
                                    ) : (
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setDescriptionDraft(selectedStudent?.description || '');
                                                    setIsEditingDescription(false);
                                                }}
                                                className="h-6 px-2 text-slate-500 hover:text-slate-700"
                                            >
                                                キャンセル
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={handleSaveDescription}
                                                className="h-6 px-3 bg-indigo-600 text-white hover:bg-indigo-700"
                                            >
                                                保存
                                            </Button>
                                        </div>
                                    )}
                                </div>
                                {isEditingDescription ? (
                                    <RichTextEditor
                                        value={descriptionDraft}
                                        onChange={(v) => setDescriptionDraft(v)}
                                        placeholder="指導に関する特記事項や共有事項を入力..."
                                        minHeight="100px"
                                    />
                                ) : (
                                    <div className="text-sm text-indigo-900/80 leading-relaxed pl-6 border-l-2 border-indigo-200 min-h-[20px]">
                                        {selectedStudent?.description ? (
                                            studentAnnouncements.some(a => !a.resolvedAt && a.detail && a.detail.replace(/\s+/g, '').includes(selectedStudent.description!.replace(/\s+/g, ''))) ? (
                                                <div className="flex items-center gap-2 text-slate-500 italic text-xs bg-slate-50/50 p-2 rounded border border-slate-100/50 mt-1">
                                                    <Megaphone className="w-3 h-3 text-slate-400" />
                                                    ※内容は下の「講師への共有事項」に反映されているため省略表示しています
                                                </div>
                                            ) : (
                                                <div dangerouslySetInnerHTML={{ __html: selectedStudent.description }} />
                                            )
                                        ) : (
                                            <span className="text-slate-400 italic">特記事項なし</span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <Button
                                    onClick={() => {
                                        setEditingEventId(null);
                                        setEventFormData({
                                            title: '',
                                            date: new Date().toISOString().split('T')[0],
                                            endDate: '',
                                            type: 'OTHER',
                                            description: '',
                                            notifyWeeksBefore: '1'
                                        });
                                        setIsEventDialogOpen(true);
                                    }}
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                                >
                                    <Calendar className="w-4 h-4 mr-2" />
                                    イベントを追加
                                </Button>
                                <Button
                                    onClick={() => {
                                        setEditingAnnouncementId(null);
                                        setAnnouncementFormData({
                                            title: '',
                                            detail: '',
                                            importance: 'MEDIUM',
                                            notifyStart: new Date().toISOString().split('T')[0],
                                            notifyEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                                        });
                                        setIsAnnouncementDialogOpen(true);
                                    }}
                                    className="flex-1"
                                    variant="outline"
                                >
                                    <Megaphone className="w-4 h-4 mr-2" />
                                    共有事項を追加
                                </Button>
                            </div>

                            {/* School Test Dates Section */}
                            {schoolTestDates.length > 0 && (
                                <div>
                                    <h4 className="font-medium text-slate-700 mb-3 flex items-center gap-2">
                                        <School className="w-4 h-4 text-orange-500" />
                                        学校のテスト予定
                                    </h4>
                                    <div className="space-y-2">
                                        {schoolTestDates.map((test: any, idx: number) => {
                                            const startDate = new Date(test.start);
                                            const endDate = new Date(test.end);
                                            const now = new Date();
                                            const isOngoing = now >= startDate && now <= endDate;
                                            const daysUntil = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                                            return (
                                                <div key={idx} className={`p-3 rounded-lg border ${isOngoing ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 border-slate-100'}`}>
                                                    <div className="flex justify-between items-start">
                                                        <span className="font-medium text-slate-700">{test.name || 'テスト'}</span>
                                                        {isOngoing ? (
                                                            <Badge className="bg-orange-500 text-white border-0 text-xs">開催中</Badge>
                                                        ) : daysUntil <= 7 ? (
                                                            <Badge className="bg-orange-100 text-orange-600 border-0 text-xs">{daysUntil}日後</Badge>
                                                        ) : (
                                                            <span className="text-xs text-slate-400">
                                                                {startDate.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-1">
                                                        {startDate.toLocaleDateString('ja-JP')} 〜 {endDate.toLocaleDateString('ja-JP')}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Events Section */}
                            <div>
                                <h4 className="font-medium text-slate-700 mb-3 flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-indigo-500" />
                                    この生徒のイベント
                                </h4>
                                {studentEvents.length === 0 ? (
                                    <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                        <p className="text-sm text-slate-400">個別イベントはまだ登録されていません</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {studentEvents.map((event) => {
                                            const typeConfig = {
                                                'EXAM': { label: '定期テスト/模試', color: 'bg-red-50 text-red-700 border-red-200' },
                                                'EIKEN': { label: '英検/検定', color: 'bg-blue-50 text-blue-700 border-blue-200' },
                                                'SEASONAL_COURSE': { label: '季節講習', color: 'bg-orange-50 text-orange-700 border-orange-200' },
                                                'OTHER': { label: 'その他', color: 'bg-slate-50 text-slate-700 border-slate-200' }
                                            }[event.type as string] || { label: 'イベント', color: 'bg-slate-50 text-slate-700 border-slate-200' };

                                            const isResolved = !!event.resolvedAt;

                                            return (
                                                <div key={event.id} className={`p-3 bg-white rounded-lg border shadow-sm hover:shadow-md transition-all group relative ${isResolved ? 'opacity-50 border-slate-100' : 'border-slate-200'}`}>
                                                    <div className="flex justify-between items-start pr-8">
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant="outline" className={`${typeConfig.color} border text-[10px] px-1.5 py-0`}>
                                                                    {typeConfig.label}
                                                                </Badge>
                                                                <span className={`font-bold text-sm ${isResolved ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{event.title}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                                                                <Calendar className="w-3 h-3 text-slate-400" />
                                                                <span className="font-medium">
                                                                    {new Date(event.date).toLocaleDateString('ja-JP')}
                                                                    {event.endDate && (
                                                                        <>
                                                                            <span className="mx-1 text-slate-300">〜</span>
                                                                            {new Date(event.endDate).toLocaleDateString('ja-JP')}
                                                                        </>
                                                                    )}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {event.description && (
                                                        <div className="mt-3 pt-2 border-t border-slate-100">
                                                            <div className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2 rounded-md" dangerouslySetInnerHTML={{ __html: event.description }} />
                                                        </div>
                                                    )}

                                                    <div className="absolute top-3 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                                    <MoreHorizontal className="h-4 w-4 text-slate-400" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setEditingEventId(event.id);
                                                                    setEventFormData({
                                                                        title: event.title,
                                                                        date: new Date(event.date).toISOString().split('T')[0],
                                                                        endDate: event.endDate ? new Date(event.endDate).toISOString().split('T')[0] : '',
                                                                        type: (event.type as any) || 'OTHER',
                                                                        description: event.description || '',
                                                                        notifyWeeksBefore: '1'
                                                                    });
                                                                    setIsEventDialogOpen(true);
                                                                }}>
                                                                    <Edit3 className="mr-2 h-4 w-4" />
                                                                    <span>編集</span>
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={async (e) => {
                                                                    e.stopPropagation();
                                                                    try {
                                                                        const res = await fetch(`/api/events/${event.id}`, {
                                                                            method: 'PATCH',
                                                                            headers: { 'Content-Type': 'application/json' },
                                                                            body: JSON.stringify({ resolved: !isResolved })
                                                                        });
                                                                        if (res.ok) {
                                                                            fetchStudentDetails(selectedStudent!);
                                                                        } else {
                                                                            alert('更新に失敗しました');
                                                                        }
                                                                    } catch (err) {
                                                                        alert('エラーが発生しました');
                                                                    }
                                                                }}>
                                                                    {isResolved ? <Circle className="mr-2 h-4 w-4" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                                                                    <span>{isResolved ? '未解決に戻す' : '解決済みにする'}</span>
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={async (e) => {
                                                                    e.stopPropagation();
                                                                    if (!window.confirm('このイベントを削除しますか？')) return;
                                                                    try {
                                                                        const res = await fetch(`/api/events/${event.id}`, { method: 'DELETE' });
                                                                        if (res.ok) {
                                                                            fetchStudentDetails(selectedStudent!);
                                                                        } else {
                                                                            alert('削除に失敗しました');
                                                                        }
                                                                    } catch (err) {
                                                                        alert('エラーが発生しました');
                                                                    }
                                                                }}>
                                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                                    <span>削除</span>
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Announcements Section */}
                            <div>
                                <h4 className="font-medium text-slate-700 mb-3 flex items-center gap-2">
                                    <Megaphone className="w-4 h-4 text-purple-500" />
                                    講師への共有事項
                                </h4>
                                {studentAnnouncements.length === 0 ? (
                                    <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                        <p className="text-sm text-slate-400">個別連絡はまだ登録されていません</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {studentAnnouncements.map((announcement) => {
                                            const isResolved = !!announcement.resolvedAt;
                                            return (
                                                <div key={announcement.id} className={`p-4 rounded-lg border group relative transition-all ${isResolved ? 'opacity-50 border-slate-100 bg-slate-50' : announcement.importance === 'HIGH'
                                                    ? 'bg-red-50 border-red-200 shadow-sm shadow-red-100'
                                                    : announcement.importance === 'LOW'
                                                        ? 'bg-slate-50 border-slate-100'
                                                        : 'bg-orange-50/50 border-orange-100'
                                                    }`}>
                                                    <div className="flex justify-between items-start pr-6 mb-2">
                                                        <div className="flex items-center gap-2 flex-grow pr-2">
                                                            {announcement.importance === 'HIGH' && (
                                                                <AlertCircle className="h-4 w-4 text-red-500 fill-white flex-shrink-0" />
                                                            )}
                                                            <span className={`font-bold break-all ${isResolved ? 'text-slate-400 line-through' : announcement.importance === 'HIGH' ? 'text-red-800' : 'text-slate-700'}`}>
                                                                {announcement.title}
                                                            </span>
                                                        </div>
                                                        <Badge className={
                                                            announcement.importance === 'HIGH' ? 'bg-red-500 hover:bg-red-600 text-white border-0' :
                                                                announcement.importance === 'LOW' ? 'bg-slate-200 hover:bg-slate-300 text-slate-600 border-0' :
                                                                    'bg-orange-100 text-orange-700 border-orange-200'
                                                        }>
                                                            {announcement.importance === 'HIGH' ? '重要' : announcement.importance === 'LOW' ? '軽微' : '通常'}
                                                        </Badge>
                                                    </div>
                                                    <div className={`text-sm leading-relaxed pl-6 mb-3 ${announcement.importance === 'HIGH' ? 'text-red-900/80' : 'text-slate-600'}`} dangerouslySetInnerHTML={{ __html: announcement.detail }} />
                                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                                    <MoreHorizontal className="h-4 w-4 text-slate-400" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setEditingAnnouncementId(announcement.id);
                                                                    setAnnouncementFormData({
                                                                        title: announcement.title,
                                                                        detail: announcement.detail,
                                                                        importance: announcement.importance as any,
                                                                        notifyStart: announcement.notifyStart ? new Date(announcement.notifyStart).toISOString().split('T')[0] : '',
                                                                        notifyEnd: announcement.notifyEnd ? new Date(announcement.notifyEnd).toISOString().split('T')[0] : ''
                                                                    });
                                                                    setIsAnnouncementDialogOpen(true);
                                                                }}>
                                                                    <Edit3 className="mr-2 h-4 w-4" />
                                                                    <span>編集</span>
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={async (e) => {
                                                                    e.stopPropagation();
                                                                    try {
                                                                        const res = await fetch(`/api/announcements/${announcement.id}`, {
                                                                            method: 'PATCH',
                                                                            headers: { 'Content-Type': 'application/json' },
                                                                            body: JSON.stringify({ resolved: !isResolved })
                                                                        });
                                                                        if (res.ok) {
                                                                            fetchStudentDetails(selectedStudent!);
                                                                        } else {
                                                                            alert('更新に失敗しました');
                                                                        }
                                                                    } catch (err) {
                                                                        alert('エラーが発生しました');
                                                                    }
                                                                }}>
                                                                    {isResolved ? <Circle className="mr-2 h-4 w-4" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                                                                    <span>{isResolved ? '未解決に戻す' : '解決済みにする'}</span>
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={async (e) => {
                                                                    e.stopPropagation();
                                                                    if (!window.confirm('この連絡事項を削除しますか？')) return;
                                                                    try {
                                                                        const res = await fetch(`/api/announcements/${announcement.id}`, { method: 'DELETE' });
                                                                        if (res.ok) {
                                                                            fetchStudentDetails(selectedStudent!);
                                                                        } else {
                                                                            alert('削除に失敗しました');
                                                                        }
                                                                    } catch (err) {
                                                                        alert('エラーが発生しました');
                                                                    }
                                                                }}>
                                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                                    <span>削除</span>
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsStudentDetailOpen(false)}>閉じる</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Create Event Dialog */}
                <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
                    <DialogContent className="max-h-[95dvh] overflow-y-auto w-[95%] md:max-w-4xl rounded-xl">
                        <DialogHeader>
                            <DialogTitle>{selectedStudent?.name} のイベントを{editingEventId ? '編集' : '追加'}</DialogTitle>
                            <DialogDescription>
                                この生徒専用のイベント（面談、模試など）を登録します。
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>タイトル <span className="text-red-500">*</span></Label>
                                <Input
                                    placeholder="例: 三者面談、〇〇模試"
                                    value={eventFormData.title}
                                    onChange={(e) => setEventFormData({ ...eventFormData, title: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>開始日 <span className="text-red-500">*</span></Label>
                                    <Input
                                        type="date"
                                        value={eventFormData.date}
                                        onChange={(e) => setEventFormData({ ...eventFormData, date: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>終了日（複数日の場合）</Label>
                                    <Input
                                        type="date"
                                        value={eventFormData.endDate}
                                        onChange={(e) => setEventFormData({ ...eventFormData, endDate: e.target.value })}
                                        min={eventFormData.date}
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>種類</Label>
                                <Select
                                    value={eventFormData.type}
                                    onValueChange={(val: 'EXAM' | 'EIKEN' | 'SEASONAL_COURSE' | 'OTHER') =>
                                        setEventFormData({ ...eventFormData, type: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="EXAM">入試</SelectItem>
                                        <SelectItem value="EIKEN">英検・検定</SelectItem>
                                        <SelectItem value="OTHER">その他</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>詳細（任意）</Label>
                                <RichTextEditor
                                    placeholder="講師への指示、注意事項など"
                                    value={eventFormData.description}
                                    onChange={(v) => setEventFormData({ ...eventFormData, description: v })}
                                    minHeight="160px"
                                />
                            </div>


                            {/* Sharing Period Settings */}
                            <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                    <Clock className="w-4 h-4" />
                                    共有期間
                                </div>
                                <div className="grid gap-2">
                                    <Label>何週間前から共有？</Label>
                                    <Select
                                        value={eventFormData.notifyWeeksBefore}
                                        onValueChange={(val) => setEventFormData({ ...eventFormData, notifyWeeksBefore: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">1週間前から</SelectItem>
                                            <SelectItem value="2">2週間前から</SelectItem>
                                            <SelectItem value="3">3週間前から</SelectItem>
                                            <SelectItem value="4">4週間前（1ヶ月前）から</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <p className="text-xs text-slate-500">
                                    イベント開始前から終了日まで、ダッシュボードに表示され、定期通知時にLINEグループにも送信されます。
                                </p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsEventDialogOpen(false)} disabled={isEventSubmitting}>キャンセル</Button>
                            <Button onClick={handleCreateEvent} disabled={isEventSubmitting}>
                                {isEventSubmitting ? (
                                    <>
                                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                        作成中...
                                    </>
                                ) : (editingEventId ? '更新' : '作成')}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Create Announcement Dialog */}
                <Dialog open={isAnnouncementDialogOpen} onOpenChange={setIsAnnouncementDialogOpen}>
                    <DialogContent className="max-h-[95dvh] overflow-y-auto w-[95%] md:max-w-4xl rounded-xl">
                        <DialogHeader>
                            <DialogTitle>{selectedStudent?.name} への共有事項を{editingAnnouncementId ? '編集' : '追加'}</DialogTitle>
                            <DialogDescription>
                                この生徒専用の連絡事項を登録します。
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>タイトル <span className="text-red-500">*</span></Label>
                                <Input
                                    placeholder="例: 宿題について、授業変更のお知らせ"
                                    value={announcementFormData.title}
                                    onChange={(e) => setAnnouncementFormData({ ...announcementFormData, title: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>重要度</Label>
                                <Select
                                    value={announcementFormData.importance}
                                    onValueChange={(val: 'HIGH' | 'MEDIUM' | 'LOW') =>
                                        setAnnouncementFormData({ ...announcementFormData, importance: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="HIGH">重要</SelectItem>
                                        <SelectItem value="MEDIUM">通常</SelectItem>
                                        <SelectItem value="LOW">軽微</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>内容 <span className="text-red-500">*</span></Label>
                                <RichTextEditor
                                    placeholder="講師に伝えたい内容"
                                    value={announcementFormData.detail}
                                    onChange={(v) => setAnnouncementFormData({ ...announcementFormData, detail: v })}
                                    minHeight="160px"
                                />
                            </div>
                            <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                    <Clock className="w-4 h-4" />
                                    共有期間
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>共有開始日</Label>
                                        <Input
                                            type="date"
                                            value={announcementFormData.notifyStart}
                                            onChange={(e) => setAnnouncementFormData({ ...announcementFormData, notifyStart: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>共有終了日</Label>
                                        <Input
                                            type="date"
                                            value={announcementFormData.notifyEnd}
                                            onChange={(e) => setAnnouncementFormData({ ...announcementFormData, notifyEnd: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAnnouncementDialogOpen(false)} disabled={isAnnouncementSubmitting}>キャンセル</Button>
                            <Button onClick={handleCreateAnnouncement} disabled={isAnnouncementSubmitting}>
                                {isAnnouncementSubmitting ? (
                                    <>
                                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                        作成中...
                                    </>
                                ) : (editingAnnouncementId ? '更新' : '作成')}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* CSV Import Dialog */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>CSVインポート</DialogTitle>
                            <DialogDescription>
                                塾マネ（Juku Mane）からエクスポートしたCSVファイルをアップロードして、生徒情報を一括登録・更新します。
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-6">
                            <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-indigo-300 transition-colors">
                                <FileText className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    id="csv-upload"
                                />
                                <label htmlFor="csv-upload" className="cursor-pointer">
                                    <p className="text-slate-600 font-medium mb-1">
                                        ここをクリックしてCSVファイルを選択
                                    </p>
                                    <p className="text-xs text-slate-400">または、ファイルをドラッグ＆ドロップ</p>
                                </label>
                                {uploading && (
                                    <div className="mt-4 flex items-center justify-center gap-2 text-indigo-600">
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        <span className="text-sm">アップロード中...</span>
                                    </div>
                                )}
                            </div>



                            <div className="mt-4 bg-slate-50 rounded-lg p-4 space-y-2">
                                <p className="text-sm font-medium text-slate-700">CSVファイルの形式について</p>
                                <ul className="text-xs text-slate-500 space-y-1 list-disc list-inside">
                                    <li>塾マネの「生徒一覧」からエクスポートしたCSVを使用してください</li>
                                    <li>必須項目：生徒ID、名前、ふりがな、学校名、学年</li>
                                    <li>文字コードはUTF-8またはShift-JISに対応しています</li>
                                </ul>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>閉じる</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Manual Add Dialog */}
                <Dialog open={isManualDialogOpen} onOpenChange={setIsManualDialogOpen}>
                    <DialogContent className="max-h-[85vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>手動で生徒を追加</DialogTitle>
                            <DialogDescription className="flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                                <span>
                                    この方法は非推奨です。通常は塾マネのCSVからインポートしてください。
                                    手動追加した生徒は、次回のCSVインポート時に重複する可能性があります。
                                </span>
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="studentId">生徒ID <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="studentId"
                                        placeholder="S001"
                                        value={formData.studentId || ''}
                                        onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="grade">学年 <span className="text-red-500">*</span></Label>
                                    <Select
                                        value={formData.grade}
                                        onValueChange={(val) => setFormData({ ...formData, grade: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="学年を選択" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="中1">中1</SelectItem>
                                            <SelectItem value="中2">中2</SelectItem>
                                            <SelectItem value="中3">中3</SelectItem>
                                            <SelectItem value="高1">高1</SelectItem>
                                            <SelectItem value="高2">高2</SelectItem>
                                            <SelectItem value="高3">高3</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">名前 <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="name"
                                        placeholder="山田 太郎"
                                        value={formData.name || ''}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="furigana">ふりがな <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="furigana"
                                        placeholder="やまだ たろう"
                                        value={formData.furigana || ''}
                                        onChange={(e) => setFormData({ ...formData, furigana: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="schoolId">学校 <span className="text-red-500">*</span></Label>
                                <Select
                                    value={formData.schoolId?.toString()}
                                    onValueChange={(val) => setFormData({ ...formData, schoolId: parseInt(val) as any })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="学校を選択" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {schools.map((school) => (
                                            <SelectItem key={school.id} value={school.id.toString()}>
                                                {school.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {schools.length === 0 && (
                                    <p className="text-xs text-amber-600">
                                        学校が登録されていません。まずCSVをインポートしてください。
                                    </p>
                                )}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description">備考（任意）</Label>
                                <Input
                                    id="description"
                                    placeholder="特記事項など"
                                    value={formData.description || ''}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsManualDialogOpen(false)} disabled={isStudentSubmitting}>キャンセル</Button>
                            <Button onClick={handleManualCreate} variant="secondary" disabled={isStudentSubmitting}>
                                {isStudentSubmitting ? (
                                    <>
                                        <div className="h-4 w-4 border-2 border-slate-600 border-t-transparent rounded-full animate-spin mr-2" />
                                        登録中...
                                    </>
                                ) : '登録（非推奨）'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                {/* Password Dialog */}
                <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                    <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Lock className="w-5 h-5 text-indigo-500" />
                                管理者認証
                            </DialogTitle>
                            <DialogDescription>
                                生徒情報をインポートするには管理者パスワードが必要です。
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                            {passwordError && (
                                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" />
                                    {passwordError}
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="importPassword">管理者パスワード</Label>
                                <Input
                                    id="importPassword"
                                    type="password"
                                    value={importPassword}
                                    onChange={(e) => setImportPassword(e.target.value)}
                                    placeholder="パスワードを入力"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handlePasswordSubmit();
                                        }
                                    }}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>キャンセル</Button>
                            <Button onClick={handlePasswordSubmit} className="bg-indigo-600 hover:bg-indigo-700">認証</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                {/* CSV Import Preview Dialog */}
                <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
                    <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto w-full md:w-[90vw]">
                        <DialogHeader>
                            <DialogTitle>初回登録：インポート確認と新規設定</DialogTitle>
                            <DialogDescription>
                                CSVファイルの内容を読み込みました。「新規入会」として座席表などで強調表示したい生徒にチェックを入れてください。
                            </DialogDescription>
                        </DialogHeader>
                        
                        <div className="py-4">
                            <div className="overflow-x-auto border border-slate-200 rounded-lg">
                                <table className="min-w-full divide-y divide-slate-200">
                                    <thead className="bg-slate-50 relative">
                                        <tr>
                                            <th className="sticky top-0 bg-slate-50 z-10 px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-20 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span>新規</span>
                                                    <span className="text-[10px] text-orange-500">ハイライト</span>
                                                </div>
                                            </th>
                                            <th className="sticky top-0 bg-slate-50 z-10 px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">会員番号</th>
                                            <th className="sticky top-0 bg-slate-50 z-10 px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">名前</th>
                                            <th className="sticky top-0 bg-slate-50 z-10 px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">学年</th>
                                            <th className="sticky top-0 bg-slate-50 z-10 px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">学校名</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-slate-200">
                                        {previewStudents.map((s, index) => (
                                            <tr key={index} className="hover:bg-slate-50">
                                                <td className="px-4 py-3 whitespace-nowrap text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={s.isHighlighted}
                                                        onChange={(e) => {
                                                            const newList = [...previewStudents];
                                                            newList[index].isHighlighted = e.target.checked;
                                                            setPreviewStudents(newList);
                                                        }}
                                                        className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-600 cursor-pointer"
                                                    />
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{s.studentId}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900">
                                                    <div>{s.name}</div>
                                                    <div className="text-xs text-slate-400 font-normal">{s.furigana}</div>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{s.grade}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{s.schoolName}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-4 flex justify-between items-center text-sm text-slate-500">
                                <span>合計: <span className="font-bold text-slate-900">{previewStudents.length}</span> 名</span>
                                <span>
                                    新規マーク: <span className="font-bold text-orange-600">{previewStudents.filter(s => s.isHighlighted).length}</span> 名
                                </span>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsPreviewDialogOpen(false)} disabled={uploading}>
                                キャンセル
                            </Button>
                            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleConfirmImport} disabled={uploading}>
                                {uploading ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                        登録中...
                                    </>
                                ) : (
                                    '登録を実行する'
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>


            </div>
        </Layout >
    );
}

export default function StudentsPage() {
    return (
        <Suspense fallback={
            <Layout>
                <div className="flex items-center justify-center h-64">
                    <div className="text-slate-400 text-lg">読み込み中...</div>
                </div>
            </Layout>
        }>
            <StudentsPageContent />
        </Suspense>
    );
}
