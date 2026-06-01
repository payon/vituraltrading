import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';

// 감정 유형 한글 매핑
const emotionTypeMap: Record<string, string> = {
  GREED: '욕심',
  FEAR: '공포',
  HOPE: '희망',
  ANXIETY: '불안',
  CONFIDENCE: '자신감',
};

// 시스템 프롬프트 (투자 일기 분석가)
const SYSTEM_PROMPT = `당신은 전문 투자 일기 분석가입니다. 사용자의 투자 일기를 분석하여 다음과 같은 인사이트를 제공합니다:

1. **매매 패턴 분석**: 사용자의 매매 스타일과 패턴을 파악
2. **감정 상태 분석**: 투자 결정에 감정이 미친 영향 분석
3. **투자 성향 진단**: 보수적/중립적/공격적 투자 성향 파악
4. **개선점 제안**: 구체적이고 실행 가능한 개선 방안
5. **칭찬할 점**: 긍정적인 투자 행동이나 결정
6. **주의할 점**: 주의가 필요한 패턴이나 행동

분석 결과는 다음 JSON 형식으로 응답해주세요:
{
  "tradePatternAnalysis": "매매 패턴 분석 내용",
  "emotionImpact": "감정이 투자에 미친 영향",
  "investmentStyle": "투자 성향 (CONSERVATIVE/MODERATE/AGGRESSIVE)",
  "investmentStyleLabel": "투자 성향 한글명",
  "improvements": ["개선점 1", "개선점 2", "개선점 3"],
  "praises": ["칭찬할 점 1", "칭찬할 점 2"],
  "warnings": ["주의할 점 1", "주의할 점 2"],
  "overallComment": "종합 코멘트",
  "emotionInsight": "감정 상태에 대한 인사이트"
}

분석은 객관적이고 건설적인 톤으로 작성해주세요. 사용자가 성장할 수 있도록 구체적인 피드백을 제공하세요.`;

// AI 분석 수행
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { diaryId, content, tradeSummary, tradeReason, emotions, selfRating } = body;

    // 일기 ID가 있으면 기존 분석 결과 확인
    if (diaryId) {
      const existingDiary = await db.investmentDiary.findUnique({
        where: { id: diaryId },
      });

      if (existingDiary?.aiAnalysis) {
        return NextResponse.json({
          success: true,
          analysis: JSON.parse(existingDiary.aiAnalysis),
          cached: true,
        });
      }
    }

    // 분석할 데이터 구성
    const analysisInput = {
      일기내용: content || '없음',
      매매내역: tradeSummary || '없음',
      매매이유: tradeReason || '없음',
      감정상태: emotions || [],
      자가평가: selfRating || '없음',
    };

    // z-ai-web-dev-sdk를 사용하여 AI 분석
    const zai = await ZAI.create();

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: `다음 투자 일기를 분석해주세요:

**일기 내용**: ${analysisInput.일기내용}
**매매 내역**: ${analysisInput.매매내역}
**매매 이유**: ${analysisInput.매매이유}
**감정 상태**: ${JSON.stringify(analysisInput.감정상태)}
**자가 평가**: ${analysisInput.자가평가}점

이 데이터를 바탕으로 투자 패턴, 감정 영향, 개선점 등을 분석해주세요.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const aiResponse = completion.choices[0]?.message?.content || '';

    // AI 응답에서 JSON 추출
    let analysis;
    try {
      // JSON 형식 추출 시도
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        // JSON이 없으면 기본 형식 생성
        analysis = {
          tradePatternAnalysis: aiResponse,
          emotionImpact: '분석 데이터가 부족합니다.',
          investmentStyle: 'MODERATE',
          investmentStyleLabel: '중립적',
          improvements: [],
          praises: [],
          warnings: [],
          overallComment: aiResponse,
          emotionInsight: '',
        };
      }
    } catch {
      analysis = {
        tradePatternAnalysis: aiResponse,
        emotionImpact: '분석 데이터가 부족합니다.',
        investmentStyle: 'MODERATE',
        investmentStyleLabel: '중립적',
        improvements: [],
        praises: [],
        warnings: [],
        overallComment: aiResponse,
        emotionInsight: '',
      };
    }

    // 분석 결과 저장 (일기 ID가 있는 경우)
    if (diaryId) {
      await db.investmentDiary.update({
        where: { id: diaryId },
        data: {
          aiAnalysis: JSON.stringify(analysis),
          investmentStyle: analysis.investmentStyle,
        },
      });
    }

    return NextResponse.json({
      success: true,
      analysis,
      cached: false,
    });
  } catch (error) {
    console.error('AI analysis error:', error);
    return NextResponse.json(
      { success: false, error: 'AI 분석에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// 누적 분석
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'cumulative') {
      // 모든 일기 가져오기
      const diaries = await db.investmentDiary.findMany({
        orderBy: { date: 'desc' },
        include: {
          emotionAnalyses: true,
        },
      });

      if (diaries.length === 0) {
        return NextResponse.json({
          success: true,
          analysis: null,
          message: '분석할 일기가 없습니다.',
        });
      }

      // 누적 분석 데이터 구성
      const allEmotions: { type: string; intensity: number; date: Date }[] = [];
      const allSelfRatings: number[] = [];
      const investmentStyles: string[] = [];

      for (const diary of diaries) {
        if (diary.emotions) {
          try {
            const emotions = JSON.parse(diary.emotions);
            emotions.forEach((e: { type: string; intensity: number }) => {
              allEmotions.push({
                type: e.type,
                intensity: e.intensity,
                date: diary.date,
              });
            });
          } catch {
            // JSON 파싱 실패 시 무시
          }
        }
        if (diary.selfRating) {
          allSelfRatings.push(diary.selfRating);
        }
        if (diary.investmentStyle) {
          investmentStyles.push(diary.investmentStyle);
        }
      }

      // 감정 통계 계산
      const emotionStats: Record<string, { count: number; avgIntensity: number }> = {};
      for (const emotion of allEmotions) {
        if (!emotionStats[emotion.type]) {
          emotionStats[emotion.type] = { count: 0, avgIntensity: 0 };
        }
        emotionStats[emotion.type].count++;
        emotionStats[emotion.type].avgIntensity += emotion.intensity;
      }
      for (const type in emotionStats) {
        emotionStats[type].avgIntensity /= emotionStats[type].count;
      }

      // 평균 자가평가
      const avgSelfRating = allSelfRatings.length > 0
        ? allSelfRatings.reduce((a, b) => a + b, 0) / allSelfRatings.length
        : 0;

      // 가장 많은 투자 성향
      const styleCounts: Record<string, number> = {};
      for (const style of investmentStyles) {
        styleCounts[style] = (styleCounts[style] || 0) + 1;
      }
      const dominantStyle = Object.entries(styleCounts).sort((a, b) => b[1] - a[1])[0];

      // z-ai-web-dev-sdk를 사용한 누적 분석
      const zai = await ZAI.create();

      const cumulativePrompt = `다음은 사용자의 누적 투자 일기 데이터입니다:

- 총 일기 수: ${diaries.length}개
- 평균 자가평가: ${avgSelfRating.toFixed(1)}점
- 주요 감정 패턴: ${JSON.stringify(emotionStats)}
- 주요 투자 성향: ${dominantStyle ? dominantStyle[0] : '없음'}

이 데이터를 바탕으로:
1. 투자 성향 변화 추이
2. 감정 패턴의 특징
3. 개선이 필요한 영역
4. 성장한 영역
을 분석해주세요.

다음 JSON 형식으로 응답해주세요:
{
  "trendAnalysis": "투자 성향 변화 추이 분석",
  "emotionPatternSummary": "감정 패턴 요약",
  "improvementAreas": ["개선이 필요한 영역 1", "개선이 필요한 영역 2"],
  "growthAreas": ["성장한 영역 1", "성장한 영역 2"],
  "overallProgress": "전반적인 성장 진행 상황",
  "recommendations": ["향후 추천 1", "향후 추천 2"]
}`;

      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: '당신은 투자 심리 분석 전문가입니다. 사용자의 누적 데이터를 분석하여 성장 방향을 제시합니다.',
          },
          {
            role: 'user',
            content: cumulativePrompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      });

      const aiResponse = completion.choices[0]?.message?.content || '';
      let cumulativeAnalysis;
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          cumulativeAnalysis = JSON.parse(jsonMatch[0]);
        } else {
          cumulativeAnalysis = { summary: aiResponse };
        }
      } catch {
        cumulativeAnalysis = { summary: aiResponse };
      }

      return NextResponse.json({
        success: true,
        analysis: {
          totalDiaries: diaries.length,
          avgSelfRating,
          emotionStats,
          dominantStyle: dominantStyle ? dominantStyle[0] : null,
          emotionTypeMap,
          cumulativeAnalysis,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: '잘못된 요청입니다.' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Cumulative analysis error:', error);
    return NextResponse.json(
      { success: false, error: '누적 분석에 실패했습니다.' },
      { status: 500 }
    );
  }
}
