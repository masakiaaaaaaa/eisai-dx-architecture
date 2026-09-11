import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const campusId = searchParams.get('campusId');

    if (!campusId) {
        return NextResponse.json({ error: 'Campus ID is required' }, { status: 400 });
    }

    try {
        // 1. Get all students
        const students = await prisma.student.findMany({
            where: { campusId: parseInt(campusId) },
            include: { school: true }
        });

        // 2. Get collected tests (TestMaster)
        // 仮のロジック：全生徒に2学期期末の数・英を要求
        const targetYear = 2024;
        const targetSemester = '2学期期末';
        const targetSubjects = ['数学', '英語'];

        const collectedTests = await prisma.testMaster.findMany({
            where: {
                campusId: parseInt(campusId),
                year: targetYear,
                semester: targetSemester,
                status: 'COLLECTED'
            }
        });

        const missions = [];

        for (const student of students) {
            for (const subject of targetSubjects) {
                const isCollected = collectedTests.some((t: any) =>
                    t.schoolId === student.schoolId &&
                    t.grade === student.grade &&
                    t.subject === subject &&
                    t.collectedFromId === student.id
                );

                if (!isCollected) {
                    missions.push({
                        id: Math.random(), // Temporary ID for frontend key
                        school: (student as any).school,
                        grade: student.grade,
                        subject: subject,
                        year: targetYear,
                        semester: targetSemester,
                        collectionType: 'BOTH',
                        student: student
                    });
                }
            }
        }

        return NextResponse.json(missions);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to fetch missions' }, { status: 500 });
    }
}
