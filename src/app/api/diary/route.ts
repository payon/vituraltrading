import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// 일기 목록 조회
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const id = searchParams.get('id');
    const date = searchParams.get('date');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // 특정 일기 조회
    if (action === 'get' && id) {
      const diary = await db.investmentDiary.findUnique({
        where: { id },
        include: {
          emotionAnalyses: true,
        },
      });

      if (!diary) {
        return NextResponse.json(
          { success: false, error: '일기를 찾을 수 없습니다.' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, diary });
    }

    // 오늘 날짜의 일기 조회
    if (action === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const diary = await db.investmentDiary.findFirst({
        where: {
          date: {
            gte: today,
            lt: tomorrow,
          },
        },
        include: {
          emotionAnalyses: true,
        },
      });

      return NextResponse.json({ success: true, diary });
    }

    // 특정 날짜의 일기 조회
    if (date) {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);

      const diary = await db.investmentDiary.findFirst({
        where: {
          date: {
            gte: targetDate,
            lt: nextDay,
          },
        },
        include: {
          emotionAnalyses: true,
        },
      });

      return NextResponse.json({ success: true, diary });
    }

    // 일기 목록 조회
    const diaries = await db.investmentDiary.findMany({
      take: limit,
      skip: offset,
      orderBy: {
        date: 'desc',
      },
      include: {
        emotionAnalyses: true,
      },
    });

    // 전체 개수
    const total = await db.investmentDiary.count();

    return NextResponse.json({
      success: true,
      diaries,
      total,
      hasMore: offset + limit < total,
    });
  } catch (error) {
    console.error('Diary fetch error:', error);
    return NextResponse.json(
      { success: false, error: '일기를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

// 일기 작성
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      date,
      content,
      tradeSummary,
      tradeReason,
      emotionState,
      emotionScore,
      emotions,
      selfRating,
    } = body;

    // 필수 필드 확인
    if (!date) {
      return NextResponse.json(
        { success: false, error: '날짜를 선택해주세요.' },
        { status: 400 }
      );
    }

    // 사용자 조회 또는 생성 (데모용)
    let user = await db.user.findFirst();
    if (!user) {
      user = await db.user.create({
        data: {
          email: 'demo@example.com',
          name: '데모 사용자',
        },
      });
    }

    // 같은 날짜에 이미 일기가 있는지 확인
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const existingDiary = await db.investmentDiary.findFirst({
      where: {
        userId: user.id,
        date: {
          gte: targetDate,
          lt: nextDay,
        },
      },
    });

    if (existingDiary) {
      // 기존 일기 업데이트
      const updatedDiary = await db.investmentDiary.update({
        where: { id: existingDiary.id },
        data: {
          content,
          tradeSummary,
          tradeReason,
          emotionState,
          emotionScore,
          emotions: emotions ? JSON.stringify(emotions) : null,
          selfRating,
        },
      });

      return NextResponse.json({
        success: true,
        diary: updatedDiary,
        message: '일기가 업데이트되었습니다.',
      });
    }

    // 새 일기 생성
    const diary = await db.investmentDiary.create({
      data: {
        userId: user.id,
        date: new Date(date),
        content,
        tradeSummary,
        tradeReason,
        emotionState,
        emotionScore,
        emotions: emotions ? JSON.stringify(emotions) : null,
        selfRating,
      },
    });

    // 감정 분석 데이터 생성 (emotions가 있는 경우)
    if (emotions && Array.isArray(emotions)) {
      for (const emotion of emotions) {
        if (emotion.type && emotion.intensity) {
          await db.emotionAnalysis.create({
            data: {
              diaryId: diary.id,
              emotionType: emotion.type,
              intensity: emotion.intensity,
            },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      diary,
      message: '일기가 저장되었습니다.',
    });
  } catch (error) {
    console.error('Diary create error:', error);
    return NextResponse.json(
      { success: false, error: '일기 저장에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// 일기 수정
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: '일기 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // emotions가 있는 경우 JSON 문자열로 변환
    if (updateData.emotions) {
      updateData.emotions = JSON.stringify(updateData.emotions);
    }

    const diary = await db.investmentDiary.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      diary,
      message: '일기가 수정되었습니다.',
    });
  } catch (error) {
    console.error('Diary update error:', error);
    return NextResponse.json(
      { success: false, error: '일기 수정에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// 일기 삭제
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: '일기 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    await db.investmentDiary.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: '일기가 삭제되었습니다.',
    });
  } catch (error) {
    console.error('Diary delete error:', error);
    return NextResponse.json(
      { success: false, error: '일기 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
}
