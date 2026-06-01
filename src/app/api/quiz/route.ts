import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// 기본 사용자 ID
const DEFAULT_USER_ID = 'default-user';

// GET: 퀴즈 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const topicId = searchParams.get('topicId');

    if (!topicId) {
      return NextResponse.json({ error: 'topicId is required' }, { status: 400 });
    }

    const quiz = await db.quiz.findUnique({
      where: { topicId },
    });

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    // 사용자의 이전 퀴즈 결과 조회
    const previousResult = await db.quizResult.findUnique({
      where: {
        userId_quizId: {
          userId: DEFAULT_USER_ID,
          quizId: quiz.id,
        },
      },
    });

    return NextResponse.json({
      quiz: {
        id: quiz.id,
        topicId: quiz.topicId,
        questions: JSON.parse(quiz.questions),
      },
      previousResult: previousResult
        ? {
            score: previousResult.score,
            totalQuestions: previousResult.totalQuestions,
          }
        : null,
    });
  } catch (error) {
    console.error('Quiz GET Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: 퀴즈 결과 저장
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { quizId, score, totalQuestions, answers } = body;

    if (!quizId || score === undefined || !totalQuestions) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 기존 결과가 있는지 확인
    const existingResult = await db.quizResult.findUnique({
      where: {
        userId_quizId: {
          userId: DEFAULT_USER_ID,
          quizId,
        },
      },
    });

    let result;
    if (existingResult) {
      // 더 나은 점수면 업데이트
      if (score > existingResult.score) {
        result = await db.quizResult.update({
          where: {
            userId_quizId: {
              userId: DEFAULT_USER_ID,
              quizId,
            },
          },
          data: {
            score,
            totalQuestions,
            answers: JSON.stringify(answers),
          },
        });
      } else {
        result = existingResult;
      }
    } else {
      result = await db.quizResult.create({
        data: {
          userId: DEFAULT_USER_ID,
          quizId,
          score,
          totalQuestions,
          answers: JSON.stringify(answers),
        },
      });
    }

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Quiz POST Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
