import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Clean Development Database (100% Mock Data)...');

  // 1. Clean existing records (in reverse relation order)
  await prisma.announcement.deleteMany();
  await prisma.event.deleteMany();
  await prisma.testMaster.deleteMany();
  await prisma.student.deleteMany();
  await prisma.school.deleteMany();
  await prisma.lineGroup.deleteMany();
  await prisma.campus.deleteMany();

  // 2. Create Campuses
  const shibuya = await prisma.campus.create({
    data: {
      name: '渋谷校',
      slug: 'shibuya',
      passcode: '0000',
      notifyFrequency: '3',
      notifyDayOfWeek: '1,3,5',
      notifyTime: '12:00,12:00,12:00',
      notifyTargets: 'EVENTS,TESTS,ANNOUNCEMENTS',
      lineChannelSecret: 'mock_shibuya_secret',
      lineAccessToken: 'mock_shibuya_token',
    },
  });

  const shinjuku = await prisma.campus.create({
    data: {
      name: '新宿校',
      slug: 'shinjuku',
      passcode: '0000',
      notifyFrequency: '2',
      notifyDayOfWeek: '2,4',
      notifyTime: '18:00,18:00',
      notifyTargets: 'TESTS,ANNOUNCEMENTS',
      lineChannelSecret: 'mock_shinjuku_secret',
      lineAccessToken: 'mock_shinjuku_token',
    },
  });

  console.log('✅ Created campuses:', shibuya.name, shinjuku.name);

  // 3. Create Mock Schools
  const school1 = await prisma.school.create({
    data: {
      campusId: shibuya.id,
      name: '渋谷第一中学校',
      testDates: JSON.stringify([
        { id: 't1', name: '1学期中間テスト', start: '2026-05-18', end: '2026-05-20' },
        { id: 't2', name: '1学期期末テスト', start: '2026-06-29', end: '2026-07-02' },
      ]),
    },
  });

  const school2 = await prisma.school.create({
    data: {
      campusId: shibuya.id,
      name: '青葉学園高校',
      testDates: JSON.stringify([
        { id: 't3', name: '前期中間考査', start: '2026-05-25', end: '2026-05-29' },
        { id: 't4', name: '前期期末考査', start: '2026-07-06', end: '2026-07-10' },
      ]),
    },
  });

  const school3 = await prisma.school.create({
    data: {
      campusId: shinjuku.id,
      name: '新宿西中学校',
      testDates: JSON.stringify([
        { id: 't5', name: '1学期中間テスト', start: '2026-05-21', end: '2026-05-22' },
      ]),
    },
  });

  console.log('✅ Created mock schools:', school1.name, school2.name, school3.name);

  // 4. Create Mock Students
  const mockStudents = [
    { name: '山田 太郎', furigana: 'ヤマダ タロウ', grade: '中3', studentId: 'S101', schoolId: school1.id, campusId: shibuya.id },
    { name: '佐藤 花子', furigana: 'サトウ ハナコ', grade: '中2', studentId: 'S102', schoolId: school1.id, campusId: shibuya.id },
    { name: '鈴木 一郎', furigana: 'スズキ イチロウ', grade: '高1', studentId: 'S103', schoolId: school2.id, campusId: shibuya.id },
    { name: '田中 結衣', furigana: 'タナカ ユイ', grade: '高2', studentId: 'S104', schoolId: school2.id, campusId: shibuya.id },
    { name: '高橋 陸', furigana: 'タカハシ リク', grade: '中1', studentId: 'S105', schoolId: school3.id, campusId: shinjuku.id },
    { name: '伊藤 咲良', furigana: 'イトウ サクラ', grade: '中3', studentId: 'S106', schoolId: school3.id, campusId: shinjuku.id },
  ];

  for (const s of mockStudents) {
    await prisma.student.create({
      data: {
        campusId: s.campusId,
        studentId: s.studentId,
        name: s.name,
        furigana: s.furigana,
        schoolId: s.schoolId,
        grade: s.grade,
        description: 'テスト対策重点フォロー対象（模擬データ）',
      },
    });
  }

  console.log(`✅ Created ${mockStudents.length} mock students.`);

  // 5. Create Announcements
  await prisma.announcement.create({
    data: {
      campusId: shibuya.id,
      title: '第1回 定期テスト対策勉強会の実施について',
      content: '来週土曜日13:00より、自習室にて定期テスト対策特別補習を実施します。過去問の回収と演習を行います。',
    },
  });

  await prisma.announcement.create({
    data: {
      campusId: shibuya.id,
      title: '講師シフト提出期限（20日締切）',
      content: '翌月分の担当希望シフトを専用フォームまたは拡張機能オーバーレイから提出してください。',
    },
  });

  // 6. Create Events
  await prisma.event.create({
    data: {
      campusId: shibuya.id,
      title: '中3 高校入試進路ガイダンス',
      eventDate: new Date('2026-06-15T14:00:00Z'),
      description: '都立・私立高校の推薦・一般入試対策概要説明',
    },
  });

  console.log('🎉 Seed completed! All mock data successfully populated.');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
