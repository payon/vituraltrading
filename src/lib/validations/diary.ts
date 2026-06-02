/**
 * 투자 일기 관련 입력 검증 스키마
 * - 일기 작성 검증
 * - 감정 분석 검증
 * - XSS 방지를 위한 문자열 정제
 */

import { z } from 'zod';

// 감정 유형
export const emotionTypeSchema = z.enum(['GREED', 'FEAR', 'HOPE', 'ANXIETY', 'CONFIDENCE'], {
  errorMap: () => ({ message: '유효하지 않은 감정 유형입니다.' }),
});

// 일기 내용 (정제 필요)
export const diaryContentSchema = z.string()
  .min(1, '내용을 입력해주세요.')
  .max(5000, '내용은 5,000자 이하여야 합니다.')
  .transform(val => val.trim());

// 매매 내역 요약 (정제 필요)
export const tradeSummarySchema = z.string()
  .max(1000, '매매 내역은 1,000자 이하여야 합니다.')
  .transform(val => val.trim())
  .optional();

// 감정 상태 (정제 필요)
export const emotionStateSchema = z.string()
  .max(500, '감정 상태는 500자 이하여야 합니다.')
  .transform(val => val.trim())
  .optional();

// 매매 이유 (정제 필요)
export const tradeReasonSchema = z.string()
  .max(1000, '매매 이유는 1,000자 이하여야 합니다.')
  .transform(val => val.trim())
  .optional();

// 감정 강도 (1-10)
export const emotionIntensitySchema = z.number({
  required_error: '감정 강도를 입력해주세요.',
  invalid_type_error: '감정 강도는 숫자여야 합니다.',
})
  .int('감정 강도는 정수여야 합니다.')
  .min(1, '감정 강도는 1 이상이어야 합니다.')
  .max(10, '감정 강도는 10 이하여야 합니다.');

// 일기 작성 스키마
export const createDiarySchema = z.object({
  date: z.string()
    .refine(val => !isNaN(Date.parse(val)), {
      message: '유효한 날짜를 입력해주세요.',
    })
    .transform(val => new Date(val)),
  tradeSummary: tradeSummarySchema,
  emotionState: emotionStateSchema,
  tradeReason: tradeReasonSchema,
});

// 일기 수정 스키마
export const updateDiarySchema = createDiarySchema.partial();

// 감정 분석 생성 스키마
export const createEmotionAnalysisSchema = z.object({
  diaryId: z.string()
    .min(1, '일기 ID가 필요합니다.')
    .max(50, '유효하지 않은 일기 ID입니다.'),
  emotionType: emotionTypeSchema,
  intensity: emotionIntensitySchema,
  aiComment: z.string()
    .max(1000, 'AI 코멘트는 1,000자 이하여야 합니다.')
    .optional(),
});

// 일기 조회 스키마
export const getDiarySchema = z.object({
  diaryId: z.string()
    .min(1, '일기 ID가 필요합니다.')
    .max(50, '유효하지 않은 일기 ID입니다.'),
});

// 일기 목록 조회 스키마
export const getDiaryListSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(10),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  emotionType: emotionTypeSchema.optional(),
}).refine(
  data => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) <= new Date(data.endDate);
    }
    return true;
  },
  {
    message: '시작일은 종료일보다 이전이어야 합니다.',
    path: ['startDate'],
  }
);

// AI 분석 요청 스키마
export const aiAnalysisRequestSchema = z.object({
  diaryId: z.string()
    .min(1, '일기 ID가 필요합니다.')
    .max(50, '유효하지 않은 일기 ID입니다.'),
  content: diaryContentSchema,
  tradeSummary: tradeSummarySchema,
  emotionState: emotionStateSchema,
});

// AI 분석 응답 스키마
export const aiAnalysisResponseSchema = z.object({
  analysis: z.string(),
  improvements: z.array(z.string()),
  emotionDetected: emotionTypeSchema.optional(),
  emotionIntensity: emotionIntensitySchema.optional(),
});

// 타입 내보내기
export type CreateDiaryInput = z.infer<typeof createDiarySchema>;
export type UpdateDiaryInput = z.infer<typeof updateDiarySchema>;
export type CreateEmotionAnalysisInput = z.infer<typeof createEmotionAnalysisSchema>;
export type GetDiaryInput = z.infer<typeof getDiarySchema>;
export type GetDiaryListInput = z.infer<typeof getDiaryListSchema>;
export type AiAnalysisRequestInput = z.infer<typeof aiAnalysisRequestSchema>;
export type AiAnalysisResponseInput = z.infer<typeof aiAnalysisResponseSchema>;
export type EmotionType = z.infer<typeof emotionTypeSchema>;
