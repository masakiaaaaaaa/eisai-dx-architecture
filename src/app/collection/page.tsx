"use client";

import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Clock, FileText, Calendar, Info, Check, AlertTriangle, Users, ChevronDown, ChevronUp, Settings, ClipboardList, Sparkles } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useCampus } from "@/hooks/use-campus";

type SubjectCollection = {
    name: string;
    collected: boolean;
    problemOnly: boolean;
    answerOnly: boolean;
    collectedBy?: string;
    collectedAt?: string;
};

type CollectionItem = {
    id: string;
    schoolName: string;
    testName: string;
    testType: 'midterm' | 'final';
    startDate: string;
    endDate: string;
    targetGrade: string;
    subjects: SubjectCollection[];
    availableStudents?: string[];
};

// 中間テスト: 5教科
const MIDTERM_SUBJECTS = ['国語', '数学', '英語', '理科', '社会'];

// 期末テスト: 9教科
const FINAL_SUBJECTS = ['国語', '数学', '英語', '理科', '社会', '音楽', '美術', '保健体育', '技術', '家庭'];

export default function CollectionPage() {
    const { campus } = useCampus();
    const [collections, setCollections] = useState<CollectionItem[]>([]);
    const [expiredCollections, setExpiredCollections] = useState<CollectionItem[]>([]);
    const [scheduledCollections, setScheduledCollections] = useState<CollectionItem[]>([]); // New state: Implementation planned
    const [loading, setLoading] = useState(true);
    const [showExpired, setShowExpired] = useState(false);
    const [showScheduled, setShowScheduled] = useState(false); // New state toggle
    const [showHelp, setShowHelp] = useState(false);
    const [expandedItems, setExpandedItems] = useState<string[]>([]);
    const [expandedSubjects, setExpandedSubjects] = useState<string[]>([]); // NEW: For collapsible subject buttons
    const [instructorName, setInstructorName] = useState('');

    useEffect(() => {
        if (campus) {
            fetchCollections();
        }
        const savedName = localStorage.getItem('instructorName') || '';
        setInstructorName(savedName);
    }, [campus]);

    const saveInstructorName = (name: string) => {
        setInstructorName(name);
        localStorage.setItem('instructorName', name);
    };

    const fetchCollections = async () => {
        if (!campus) return;
        try {
            const res = await fetch(`/api/test-schedule?campusId=${campus.id}`);
            if (res.ok) {
                const schools = await res.json();
                const items: CollectionItem[] = [];
                const expiredItems: CollectionItem[] = [];
                const scheduledItems: CollectionItem[] = []; // New list for future tests

                const studentsRes = await fetch(`/api/students?campusId=${campus.id}`);
                const students = studentsRes.ok ? await studentsRes.json() : [];

                // Fetch existing collection records
                const collectionsRes = await fetch(`/api/test-masters?campusId=${campus.id}`);
                const existingCollections = collectionsRes.ok ? await collectionsRes.json() : [];

                schools.forEach((school: any) => {
                    try {
                        const testDates = JSON.parse(school.testDates || '[]');
                        testDates.forEach((test: any) => {
                            if (test.collectEnabled !== false) {
                                const isFinal = test.name?.includes('期末') || test.name?.includes('学年末');
                                const subjectNames = isFinal ? FINAL_SUBJECTS : MIDTERM_SUBJECTS;
                                const targetGrades = test.collectGrades || ['中1', '中2', '中3'];
                                const testYear = new Date(test.start).getFullYear();

                                targetGrades.forEach((grade: string) => {
                                    const availableStudents = students
                                        .filter((s: any) => s.schoolId === school.id && s.grade === grade && s.isActive !== false)
                                        .map((s: any) => s.name);

                                    // Check existing collections for this school/grade/semester
                                    const item: CollectionItem = {
                                        id: `${school.id}-${test.id}-${grade}`,
                                        schoolName: school.name,
                                        testName: test.name,
                                        testType: isFinal ? 'final' : 'midterm',
                                        startDate: test.start,
                                        endDate: test.end,
                                        targetGrade: grade,
                                        subjects: subjectNames.map(subjectName => {
                                            // Find if this subject was already collected
                                            const existing = existingCollections.find((c: any) =>
                                                c.schoolId === school.id &&
                                                c.grade === grade &&
                                                c.semester === test.name &&
                                                c.subject === subjectName &&
                                                c.year === testYear
                                            );

                                            if (existing) {
                                                return {
                                                    name: subjectName,
                                                    collected: existing.collectionType === 'BOTH',
                                                    problemOnly: existing.collectionType === 'PROBLEM',
                                                    answerOnly: existing.collectionType === 'ANSWER',
                                                    collectedBy: existing.collectedByName,
                                                    collectedAt: existing.collectedAt,
                                                };
                                            }

                                            return {
                                                name: subjectName,
                                                collected: false,
                                                problemOnly: false,
                                                answerOnly: false,
                                            };
                                        }),
                                        availableStudents,
                                    };

                                    // Check if all subjects are collected
                                    const allCollected = item.subjects.every(s => s.collected);

                                    // Check if test period has ended (Yesterday was the last day)
                                    const today = new Date();
                                    const endDate = new Date(test.end);
                                    endDate.setHours(23, 59, 59, 999);
                                    const isPeriodEnded = today > endDate;

                                    if (allCollected) {
                                        // Moved to expired/completed section
                                        expiredItems.push(item);
                                    } else if (isPastDeadline(test.end)) {
                                        // Deadline passed -> Expired list
                                        expiredItems.push(item);
                                    } else if (isPeriodEnded) {
                                        // Period ended but not completed -> Active Collection
                                        items.push(item);
                                    } else {
                                        // Period not ended yet -> Scheduled (Implementation Planned)
                                        scheduledItems.push(item);
                                    }
                                });
                            }
                        });
                    } catch (e) {
                        // ignore
                    }
                });

                setCollections(items);
                setExpiredCollections(expiredItems);
                setScheduledCollections(scheduledItems);
            }
        } catch (error) {
            console.error('Failed to fetch collections', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCollectBoth = async (collectionId: string, subjectName: string) => {
        // Search in all collections (active, expired, scheduled)
        const item = collections.find(c => c.id === collectionId)
            || expiredCollections.find(c => c.id === collectionId)
            || scheduledCollections.find(c => c.id === collectionId);
        if (!item) return;

        const subject = item.subjects.find(s => s.name === subjectName);
        if (!subject) return;

        const name = instructorName || '講師';
        const newCollected = !subject.collected;

        // Optimistic update
        const updateCollection = (items: CollectionItem[]) => items.map(itm => {
            if (itm.id === collectionId) {
                return {
                    ...itm,
                    subjects: itm.subjects.map(sub => {
                        if (sub.name === subjectName) {
                            return {
                                ...sub,
                                collected: newCollected,
                                problemOnly: false,
                                answerOnly: false,
                                collectedBy: newCollected ? name : undefined,
                                collectedAt: newCollected ? new Date().toISOString() : undefined,
                            };
                        }
                        return sub;
                    }),
                };
            }
            return itm;
        });

        setCollections(prev => updateCollection(prev));
        setExpiredCollections(prev => updateCollection(prev));
        setScheduledCollections(prev => updateCollection(prev));

        // Server update
        try {
            // Parse ID: schoolId-testId-grade
            const [schoolId, testId, grade] = collectionId.split('-');

            await fetch('/api/test-masters', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    campusId: campus?.id, // Default campus
                    schoolId: parseInt(schoolId),
                    grade: grade,
                    year: new Date().getFullYear(), // Assuming current year
                    semester: item.testName, // Using test name as semester identifier
                    subject: subjectName,
                    collectionType: newCollected ? 'BOTH' : 'NONE',
                    collectedByName: newCollected ? name : null,
                }),
            });
        } catch (error) {
            console.error('Failed to save collection', error);
            // Revert on error would be ideal here
        }
    };

    const handleCollectPartial = async (collectionId: string, subjectName: string, type: 'problem' | 'answer') => {
        // Search in all collections (active, expired, scheduled)
        const item = collections.find(c => c.id === collectionId)
            || expiredCollections.find(c => c.id === collectionId)
            || scheduledCollections.find(c => c.id === collectionId);
        if (!item) return;

        const subject = item.subjects.find(s => s.name === subjectName);
        if (!subject) return;

        const name = instructorName || '講師';
        let newProblemOnly = subject.problemOnly;
        let newAnswerOnly = subject.answerOnly;

        if (type === 'problem') {
            newProblemOnly = !subject.problemOnly;
        } else {
            newAnswerOnly = !subject.answerOnly;
        }

        const newCollected = newProblemOnly && newAnswerOnly;
        if (newCollected) {
            newProblemOnly = false;
            newAnswerOnly = false;
        }

        // Optimistic update
        const updateCollection = (items: CollectionItem[]) => items.map(itm => {
            if (itm.id === collectionId) {
                return {
                    ...itm,
                    subjects: itm.subjects.map(sub => {
                        if (sub.name === subjectName) {
                            return {
                                ...sub,
                                collected: newCollected || sub.collected,
                                problemOnly: newCollected ? false : newProblemOnly,
                                answerOnly: newCollected ? false : newAnswerOnly,
                                collectedBy: (newCollected || newProblemOnly || newAnswerOnly) ? name : sub.collectedBy,
                                collectedAt: (newCollected || newProblemOnly || newAnswerOnly) ? new Date().toISOString() : sub.collectedAt,
                            };
                        }
                        return sub;
                    }),
                };
            }
            return itm;
        });

        setCollections(prev => updateCollection(prev));
        setExpiredCollections(prev => updateCollection(prev));
        setScheduledCollections(prev => updateCollection(prev));

        // Server update
        try {
            const [schoolId, testId, grade] = collectionId.split('-');
            let collectionType = 'NONE';
            if (newCollected) collectionType = 'BOTH';
            else if (newProblemOnly) collectionType = 'PROBLEM';
            else if (newAnswerOnly) collectionType = 'ANSWER';

            if (collectionType !== 'NONE') {
                await fetch('/api/test-masters', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        campusId: campus?.id,
                        schoolId: parseInt(schoolId),
                        grade: grade,
                        year: new Date().getFullYear(),
                        semester: item.testName,
                        subject: subjectName,
                        collectionType: collectionType,
                        collectedByName: name,
                    }),
                });
            }
        } catch (error) {
            console.error('Failed to save collection', error);
        }
    };

    const toggleExpanded = (id: string) => {
        setExpandedItems(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const toggleSubjectsExpanded = (id: string) => {
        setExpandedSubjects(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const getCollectionProgress = (item: CollectionItem) => {
        let collected = 0;
        item.subjects.forEach(s => {
            if (s.collected) collected += 2;
            else {
                if (s.problemOnly) collected++;
                if (s.answerOnly) collected++;
            }
        });
        return { collected, total: item.subjects.length * 2 };
    };

    const isPastDeadline = (endDate: string) => {
        const end = new Date(endDate);
        const deadline = new Date(end);
        deadline.setMonth(deadline.getMonth() + 1);
        return deadline < new Date();
    };

    const isNearDeadline = (endDate: string) => {
        const end = new Date(endDate);
        const deadline = new Date(end);
        deadline.setMonth(deadline.getMonth() + 1);
        const now = new Date();
        const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays <= 7 && diffDays >= 0;
    };

    const isInScoreEntryPeriod = (endDate: string) => {
        const end = new Date(endDate);
        const now = new Date();
        const deadline = new Date(end);
        deadline.setMonth(deadline.getMonth() + 1);
        return now > end && now <= deadline;
    };

    const getDeadlineText = (endDate: string) => {
        const end = new Date(endDate);
        const deadline = new Date(end);
        deadline.setMonth(deadline.getMonth() + 1);
        return deadline.toLocaleDateString('ja-JP');
    };

    const formatDateRange = (start: string, end: string) => {
        const startObj = new Date(start);
        const endObj = new Date(end);
        const startDate = startObj.toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' });
        const endDate = endObj.toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' });
        
        if (start === end) return startDate;
        
        if (startObj.getFullYear() === endObj.getFullYear()) {
            const endDateShort = endObj.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
            return `${startDate} 〜 ${endDateShort}`;
        }
        
        return `${startDate} 〜 ${endDate}`;
    };

    const getSubjectStatus = (sub: SubjectCollection) => {
        if (sub.collected) return 'complete';
        if (sub.problemOnly && sub.answerOnly) return 'complete';
        if (sub.problemOnly || sub.answerOnly) return 'partial';
        return 'none';
    };

    const totalRemaining = collections.filter(item => {
        const progress = getCollectionProgress(item);
        return progress.collected < progress.total;
    }).length;

    const renderCollectionCard = (item: CollectionItem, isExpired: boolean = false, index: number = 0) => {
        const progress = getCollectionProgress(item);
        const isComplete = progress.collected === progress.total;
        const nearDeadline = !isExpired && isNearDeadline(item.endDate);
        const isExpanded = expandedSubjects.includes(item.id);
        const isDetailExpanded = expandedItems.includes(item.id);
        const staggerClass = index < 8 ? `stagger-${index + 1}` : '';

        return (
            <div
                key={item.id}
                className={`bg-white border rounded-xl shadow-sm cursor-pointer card-hover animate-fade-in-up ${staggerClass} ${isComplete ? 'border-green-200 bg-green-50/30' :
                    isExpired ? 'border-slate-300 bg-slate-50/50 opacity-80' :
                        nearDeadline ? 'border-orange-200 bg-orange-50/30' : 'border-slate-200'
                    }`}
            >
                {/* Header - Clickable to expand */}
                <div
                    className="p-3 flex items-center gap-3"
                    onClick={() => toggleSubjectsExpanded(item.id)}
                >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isComplete ? 'bg-green-100' : isExpired ? 'bg-slate-200' : 'bg-indigo-100'
                        }`}>
                        {isComplete ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                        ) : (
                            <FileText className="w-4 h-4 text-indigo-500" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-800 text-sm">{item.schoolName}</span>
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">{item.targetGrade}</Badge>
                            {(nearDeadline || isExpired) && !isComplete && (
                                <AlertTriangle className={`w-3.5 h-3.5 ${isExpired ? 'text-red-500' : 'text-orange-500'}`} />
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span>{item.testName}</span>
                            <span className="text-slate-300">|</span>
                            <span>{formatDateRange(item.startDate, item.endDate)}</span>
                        </div>
                        {/* Available students preview - visible without expanding */}
                        {item.availableStudents && item.availableStudents.length > 0 && !isComplete && (
                            <div className="flex items-center gap-1 text-xs text-blue-600 mt-0.5">
                                <Users className="w-3 h-3" />
                                <span>
                                    {item.availableStudents.slice(0, 3).join('、')}
                                    {item.availableStudents.length > 3 && ` 他${item.availableStudents.length - 3}名`}
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <Badge className={`text-xs ${isComplete ? 'bg-green-500 text-white' :
                            isExpired ? 'bg-red-100 text-red-600' :
                                nearDeadline ? 'bg-orange-100 text-orange-600' : 'bg-indigo-100 text-indigo-600'
                            }`}>
                            {progress.collected}/{progress.total}
                        </Badge>
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                </div>

                {/* Expandable Subject Buttons */}
                {isExpanded && (
                    <div className="px-3 pb-3 space-y-2">
                        {/* Quick collect buttons - More appealing */}
                        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-3 border border-indigo-100">
                            <p className="text-xs text-indigo-600 font-medium mb-2 flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                タップで問題・解説を同時に回収
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {item.subjects.map((subject) => {
                                    const status = getSubjectStatus(subject);
                                    return (
                                        <button
                                            key={subject.name}
                                            onClick={(e) => { e.stopPropagation(); handleCollectBoth(item.id, subject.name); }}
                                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 shadow-sm ${status === 'complete'
                                                ? 'bg-green-500 text-white hover:bg-green-600 shadow-green-200'
                                                : status === 'partial'
                                                    ? 'bg-yellow-400 text-yellow-900 hover:bg-yellow-500 shadow-yellow-200'
                                                    : 'bg-white text-slate-700 hover:bg-indigo-500 hover:text-white border border-slate-200 hover:border-indigo-500'
                                                }`}
                                        >
                                            {status === 'complete' && <Check className="w-3 h-3" />}
                                            {subject.name}
                                            {status === 'partial' && (
                                                <span className="text-[10px]">({subject.problemOnly ? '問' : ''}{subject.answerOnly ? '解' : ''})</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Individual collection toggle */}
                        <button
                            onClick={(e) => { e.stopPropagation(); toggleExpanded(item.id); }}
                            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <Settings className="w-3 h-3" />
                            問題・解説を個別に回収
                            {isDetailExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>

                        {isDetailExpanded && (
                            <div className="bg-slate-50 rounded-lg p-2 space-y-1">
                                <div className="flex items-center gap-3 text-[10px] text-slate-400 border-b border-slate-200 pb-1">
                                    <span className="w-16">教科</span>
                                    <span className="flex-1 text-center">問題</span>
                                    <span className="flex-1 text-center">解説</span>
                                </div>
                                {item.subjects.map((subject) => (
                                    <div key={subject.name} className="flex items-center gap-3">
                                        <span className="w-16 text-xs font-medium text-slate-700">{subject.name}</span>
                                        <div className="flex-1 flex justify-center">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleCollectPartial(item.id, subject.name, 'problem'); }}
                                                className={`px-2 py-1 rounded text-[10px] font-medium transition-all flex items-center gap-0.5 ${subject.collected || subject.problemOnly
                                                    ? 'bg-green-500 text-white'
                                                    : 'bg-white border border-slate-200 text-slate-600 hover:border-green-400'
                                                    }`}
                                            >
                                                {(subject.collected || subject.problemOnly) && <Check className="w-2.5 h-2.5" />}
                                                問
                                            </button>
                                        </div>
                                        <div className="flex-1 flex justify-center">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleCollectPartial(item.id, subject.name, 'answer'); }}
                                                className={`px-2 py-1 rounded text-[10px] font-medium transition-all flex items-center gap-0.5 ${subject.collected || subject.answerOnly
                                                    ? 'bg-green-500 text-white'
                                                    : 'bg-white border border-slate-200 text-slate-600 hover:border-green-400'
                                                    }`}
                                            >
                                                {(subject.collected || subject.answerOnly) && <Check className="w-2.5 h-2.5" />}
                                                解
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Available Students - In expanded area */}
                        {item.availableStudents && item.availableStudents.length > 0 && !isComplete && (
                            <div className="bg-blue-50 rounded-lg p-2 border border-blue-100">
                                <div className="flex items-center gap-1 text-xs text-blue-700 mb-1">
                                    <Users className="w-3 h-3" />
                                    <span className="font-medium">回収可能な生徒 ({item.availableStudents.length}名)</span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {item.availableStudents.slice(0, 6).map((name, i) => (
                                        <Badge key={i} variant="secondary" className="bg-white text-blue-600 text-[10px] px-1.5 py-0">{name}</Badge>
                                    ))}
                                    {item.availableStudents.length > 6 && (
                                        <Badge variant="secondary" className="bg-white text-slate-400 text-[10px] px-1.5 py-0">+{item.availableStudents.length - 6}</Badge>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}


            </div>
        );
    };

    return (
        <Layout>
            <div className="flex flex-col space-y-6 max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex flex-col space-y-1">
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900">テスト回収</h2>
                        <p className="text-sm text-slate-500">生徒からテスト問題・解説を回収して教材データベースを構築</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <div className="text-xs text-slate-400">担当者名</div>
                            <Input
                                value={instructorName}
                                onChange={(e) => saveInstructorName(e.target.value)}
                                placeholder="名前を入力..."
                                className="w-32 h-8 text-sm"
                            />
                        </div>
                        <div className="text-center px-4 py-2 bg-slate-100 rounded-xl">
                            <div className="text-2xl font-bold text-slate-700">{totalRemaining}</div>
                            <div className="text-xs text-slate-500">残り件数</div>
                        </div>
                    </div>
                </div>

                {/* Help Card - 機能説明（アコーディオン） */}
                <button
                    onClick={() => setShowHelp(!showHelp)}
                    className="w-full"
                >
                    <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-100 hover:border-green-200 transition-colors">
                        <CardContent className="pt-4 pb-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Info className="w-5 h-5 text-green-500 flex-shrink-0" />
                                    <span className="font-medium text-green-700">テスト回収とは？</span>
                                </div>
                                {showHelp ? (
                                    <ChevronUp className="w-5 h-5 text-green-400" />
                                ) : (
                                    <ChevronDown className="w-5 h-5 text-green-400" />
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </button>

                {showHelp && (
                    <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-100 -mt-4">
                        <CardContent className="pt-4">
                            <div className="text-sm text-slate-600 space-y-3">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="bg-white/60 rounded-lg p-3">
                                        <p className="font-medium text-slate-700 mb-1">🎯 目的</p>
                                        <p className="text-xs text-slate-500">
                                            生徒が受けたテストの問題用紙と解説を回収し、教室の教材データベースを構築します。
                                            過去問として活用でき、次年度以降の指導に役立ちます。
                                        </p>
                                    </div>
                                    <div className="bg-white/60 rounded-lg p-3">
                                        <p className="font-medium text-slate-700 mb-1">📋 使い方</p>
                                        <ul className="text-xs text-slate-500 space-y-1">
                                            <li>• 教科ボタンをクリック → 問題・解説を同時回収</li>
                                            <li>• 「個別に回収」→ 片方だけ回収した場合</li>
                                            <li>• 全教科回収完了で「完了」マーク</li>
                                        </ul>
                                    </div>
                                    <div className="bg-white/60 rounded-lg p-3">
                                        <p className="font-medium text-slate-700 mb-1">⏰ 期限</p>
                                        <p className="text-xs text-slate-500">
                                            テスト終了日から1ヶ月以内に回収してください。
                                            期限が近づくとオレンジ色で警告表示されます。
                                        </p>
                                    </div>
                                    <div className="bg-white/60 rounded-lg p-3">
                                        <p className="font-medium text-slate-700 mb-1">✍️ 点数記入</p>
                                        <p className="text-xs text-slate-500">
                                            テスト終了後は引き継ぎ書への点数記入も忘れずに！
                                            生徒の成績推移を記録することで、指導に活かせます。
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-24 rounded-xl skeleton-shimmer" />
                        ))}
                    </div>
                ) : collections.length === 0 && expiredCollections.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200 animate-fade-in">
                        <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                        <p className="text-slate-500 font-medium">回収対象のテストがありません</p>
                        <p className="text-xs text-slate-400 mt-1">「テスト日程」から回収対象を設定してください</p>
                    </div>
                ) : totalRemaining === 0 && collections.length > 0 ? (
                    /* All Complete */
                    <Card className="bg-gradient-to-r from-green-100 to-emerald-100 border-green-200 animate-scale-in">
                        <CardContent className="py-12 text-center">
                            <div className="w-20 h-20 bg-green-200 rounded-full flex items-center justify-center mx-auto mb-4 animate-celebrate">
                                <Sparkles className="w-10 h-10 text-green-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-green-700 mb-2">全ての回収が完了しました！</h3>
                            <p className="text-green-600">お疲れ様でした 🎉</p>
                            <p className="text-sm text-green-500 mt-4">
                                引き継ぎ書への点数記入もお忘れなく！
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {/* Active Collections */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-orange-500" />
                                回収中
                                <Badge variant="outline">{collections.length}件</Badge>
                            </h3>
                            {collections.length === 0 ? (
                                <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                    <CheckCircle2 className="w-10 h-10 mx-auto text-green-400 mb-2" />
                                    <p className="text-slate-500">現在回収中のテストはありません</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {collections.map((item, i) => renderCollectionCard(item, false, i))}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* Completed/Expired Collections */}
                {expiredCollections.length > 0 && (
                    <div className="space-y-4">
                        <button
                            onClick={() => setShowExpired(!showExpired)}
                            className="w-full flex items-center justify-between p-4 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                        >
                            <h3 className="text-lg font-bold text-slate-600 flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                                回収済み・期限切れ
                                <Badge variant="secondary">{expiredCollections.length}件</Badge>
                            </h3>
                            {showExpired ? (
                                <ChevronUp className="w-5 h-5 text-slate-400" />
                            ) : (
                                <ChevronDown className="w-5 h-5 text-slate-400" />
                            )}
                        </button>

                        {showExpired && (
                            <div className="space-y-4 opacity-90">
                                <p className="text-sm text-slate-500 px-2">
                                    全科目回収済み、または期限が過ぎたテストです。
                                </p>
                                {expiredCollections.map((item) => renderCollectionCard(item, true))}
                            </div>
                        )}
                    </div>
                )}

                {/* Scheduled Collections (Implementation Planned) */}
                {scheduledCollections.length > 0 && (
                    <div className="space-y-4">
                        <button
                            onClick={() => setShowScheduled(!showScheduled)}
                            className="w-full flex items-center justify-between p-4 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                        >
                            <h3 className="text-lg font-bold text-slate-600 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-blue-500" />
                                実施予定
                                <Badge variant="secondary">{scheduledCollections.length}件</Badge>
                            </h3>
                            {showScheduled ? (
                                <ChevronUp className="w-5 h-5 text-slate-400" />
                            ) : (
                                <ChevronDown className="w-5 h-5 text-slate-400" />
                            )}
                        </button>

                        {showScheduled && (
                            <div className="space-y-4 opacity-75">
                                <p className="text-sm text-slate-500 px-2">
                                    まだテスト期間中、または実施前のテストです。終了後「回収中」に移動します。
                                </p>
                                {scheduledCollections.map((item) => renderCollectionCard(item))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Layout>
    );
}
