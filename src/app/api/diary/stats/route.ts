import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// 감정 유형 한글 매핑
const emotionTypeMap: Record<string, string> = {
  GREED: '욕심',
  FEAR: '공포',
  HOPE: '희망',
  ANXIETY: '불안',
  CONFIDENCE: '자신감',
};

// 일기 통계
export async function GET() {
  try {
    // 전체 일기 수
    const totalDiaries = await db.investmentDiary.count();

    // 이번 달 일기 수
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyDiaries = await db.investmentDiary.count({
      where: {
        date: {
          gte: firstDayOfMonth,
        },
      },
    });

    // 연속 작성 일수 계산
    const diaries = await db.investmentDiary.findMany({
      orderBy: { date: 'desc' },
      select: { date: true },
    });

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    if (diaries.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // 연속 작성 일수 계산
      let checkDate = new Date(today);
      for (const diary of diaries) {
        const diaryDate = new Date(diary.date);
        diaryDate.setHours(0, 0, 0, 0);

        if (diaryDate.getTime() === checkDate.getTime()) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else if (diaryDate.getTime() === checkDate.getTime() - 86400000) {
          // 하루 건너뛴 경우
          break;
        }
      }

      // 최장 연속 기록 계산
      const sortedDates = diaries
        .map((d) => {
          const date = new Date(d.date);
          date.setHours(0, 0, 0, 0);
          return date.getTime();
        })
        .sort((a, b) => a - b);

      for (let i = 0; i < sortedDates.length; i++) {
        if (i === 0) {
          tempStreak = 1;
        } else if (sortedDates[i] - sortedDates[i - 1] === 86400000) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
        longestStreak = Math.max(longestStreak, tempStreak);
      }
    }

    // 감정 분석 통계
    const emotionAnalyses = await db.emotionAnalysis.findMany();
    const emotionStats: Record<string, { count: number; avgIntensity: number; totalIntensity: number }> = {};

    for (const analysis of emotionAnalyses) {
      const type = analysis.emotionType;
      if (!emotionStats[type]) {
        emotionStats[type] = { count: 0, avgIntensity: 0, totalIntensity: 0 };
      }
      emotionStats[type].count++;
      emotionStats[type].totalIntensity += analysis.intensity;
    }

    for (const type in emotionStats) {
      emotionStats[type].avgIntensity = emotionStats[type].totalIntensity / emotionStats[type].count;
    }

    // 가장 많이 느낀 감정
    const dominantEmotion = Object.entries(emotionStats).sort(
      (a, b) => b[1].count - a[1].count
    )[0];

    // 투자 성향 분포
    const diariesWithStyle = await db.investmentDiary.findMany({
      where: { investmentStyle: { not: null } },
      select: { investmentStyle: true },
    });

    const styleDistribution: Record<string, number> = {};
    for (const diary of diariesWithStyle) {
      if (diary.investmentStyle) {
        styleDistribution[diary.investmentStyle] = (styleDistribution[diary.investmentStyle] || 0) + 1;
      }
    }

    // 자가평가 평균
    const diariesWithRating = await db.investmentDiary.findMany({
      where: { selfRating: { not: null } },
      select: { selfRating: true },
    });

    const avgSelfRating = diariesWithRating.length > 0
      ? diariesWithRating.reduce((sum, d) => sum + (d.selfRating || 0), 0) / diariesWithRating.length
      : 0;

    // 최근 7일 일기 작성 현황
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const count = await db.investmentDiary.count({
        where: {
          date: {
            gte: date,
            lt: nextDay,
          },
        },
      });

      last7Days.push({
        date: date.toISOString().split('T')[0],
        count,
      });
    }

    // 감정 타입별 색상
    const emotionColors: Record<string, string> = {
      GREED: 'rgb(255, 152, 0)',      // 욕심 - 주황
      FEAR: 'rgb(156, 39, 176)',       // 공포 - 보라
      HOPE: 'rgb(76, 175, 80)',        // 희망 - 녹색
      ANXIETY: 'rgb(255, 82, 82)',     // 불안 - 빨강
      CONFIDENCE: 'rgb(33, 150, 243)', // 자신감 - 파랑
    };

    return NextResponse.json({
      success: true,
      stats: {
        totalDiaries,
        monthlyDiaries,
        currentStreak,
        longestStreak,
        emotionStats,
        dominantEmotion: dominantEmotion
          ? {
              type: dominantEmotion[0],
              label: emotionTypeMap[dominantEmotion[0]] || dominantEmotion[0],
              count: dominantEmotion[1].count,
              avgIntensity: dominantEmotion[1].avgIntensity,
              color: emotionColors[dominantEmotion[0]],
            }
          : null,
        styleDistribution,
        avgSelfRating,
        last7Days,
        emotionTypeMap,
        emotionColors,
      },
    });
  } catch (error) {
    console.error('Stats fetch error:', error);
    return NextResponse.json(
      { success: false, error: '통계를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
