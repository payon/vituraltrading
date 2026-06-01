import { NextRequest, NextResponse } from 'next/server';
import { learningTopics, learningCategories, getTotalTopicCount } from '@/data/learning-content';

// 메모리 기반 진도 저장소 (실제로는 DB 사용)
const progressStore: Map<string, boolean> = new Map();
const streakData = {
  currentStreak: 0,
  longestStreak: 0,
  lastLearnDate: null as Date | null,
};

// GET: 학습 진도 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // 전체 진도 통계 조회
    if (action === 'stats') {
      const completedTopics = Array.from(progressStore.values()).filter(Boolean).length;
      const totalTopics = getTotalTopicCount();

      return NextResponse.json({
        completedTopics,
        totalTopics,
        currentStreak: streakData.currentStreak,
        longestStreak: streakData.longestStreak,
        lastLearnDate: streakData.lastLearnDate,
        totalQuizScore: 0,
        totalQuizTaken: 0,
      });
    }

    // 카테고리별 진도 조회
    if (action === 'category-progress') {
      const categoryProgress = learningCategories.map(category => {
        const categoryTopics = learningTopics.filter(t => t.categorySlug === category.slug);
        return {
          categorySlug: category.slug,
          topics: categoryTopics.map(topic => ({
            topicSlug: topic.slug,
            completed: progressStore.get(topic.id) || false,
          })),
        };
      });

      return NextResponse.json(categoryProgress);
    }

    // 토픽 상세 진도 조회
    const topicSlug = searchParams.get('topic');
    if (topicSlug) {
      const topic = learningTopics.find(t => t.slug === topicSlug);
      const category = topic ? learningCategories.find(c => c.slug === topic.categorySlug) : null;

      if (!topic || !category) {
        return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
      }

      return NextResponse.json({
        topic: {
          id: topic.id,
          title: topic.title,
          slug: topic.slug,
          content: topic.content,
          category: {
            id: category.id,
            name: category.name,
            slug: category.slug,
          },
          quiz: topic.quiz || null,
        },
        completed: progressStore.get(topic.id) || false,
      });
    }

    // 전체 토픽 목록 조회
    const topics = learningTopics.map(t => {
      const category = learningCategories.find(c => c.slug === t.categorySlug)!;
      return {
        id: t.id,
        title: t.title,
        slug: t.slug,
        category: {
          id: category.id,
          name: category.name,
          slug: category.slug,
        },
        completed: progressStore.get(t.id) || false,
      };
    });

    return NextResponse.json({ topics });
  } catch (error) {
    console.error('Learning API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: 학습 완료 표시
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topicId, completed = true } = body;

    const topic = learningTopics.find(t => t.id === topicId);
    if (!topic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    // 진도 업데이트
    progressStore.set(topicId, completed);

    // 연속 학습 일수 업데이트
    if (completed) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (streakData.lastLearnDate) {
        const lastDate = new Date(streakData.lastLearnDate);
        lastDate.setHours(0, 0, 0, 0);
        const diffDays = Math.floor(
          (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diffDays === 1) {
          streakData.currentStreak++;
          streakData.longestStreak = Math.max(
            streakData.longestStreak,
            streakData.currentStreak
          );
        } else if (diffDays > 1) {
          streakData.currentStreak = 1;
        }
      } else {
        streakData.currentStreak = 1;
        streakData.longestStreak = 1;
      }
      streakData.lastLearnDate = today;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Learning POST Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
