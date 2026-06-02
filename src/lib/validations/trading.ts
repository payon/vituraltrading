/**
 * 거래 관련 입력 검증 스키마
 * - 주문 요청 검증
 * - 수량/금액 범위 검증
 * - XSS 방지를 위한 문자열 정제
 */

import { z } from 'zod';

// 종목 타입
export const assetTypeSchema = z.enum(['STOCK', 'COIN'], {
  errorMap: () => ({ message: '종목 타입은 STOCK 또는 COIN이어야 합니다.' }),
});

// 주문 타입
export const orderTypeSchema = z.enum(['BUY', 'SELL'], {
  errorMap: () => ({ message: '주문 타입은 BUY 또는 SELL이어야 합니다.' }),
});

// 가격 타입
export const priceTypeSchema = z.enum(['MARKET', 'LIMIT'], {
  errorMap: () => ({ message: '가격 타입은 MARKET 또는 LIMIT이어야 합니다.' }),
});

// 종목 심볼 (정제 필요)
export const symbolSchema = z.string()
  .min(1, '종목 코드를 입력해주세요.')
  .max(20, '종목 코드는 20자 이하여야 합니다.')
  .regex(/^[A-Z0-9]+$/, '종목 코드는 대문자 영문과 숫자만 입력 가능합니다.')
  .transform(val => val.trim().toUpperCase());

// 종목명 (정제 필요)
export const stockNameSchema = z.string()
  .min(1, '종목명을 입력해주세요.')
  .max(50, '종목명은 50자 이하여야 합니다.')
  .transform(val => val.trim());

// 수량 검증 (양수)
export const quantitySchema = z.number({
  required_error: '수량을 입력해주세요.',
  invalid_type_error: '수량은 숫자여야 합니다.',
})
  .positive('수량은 0보다 커야 합니다.')
  .max(1000000, '최대 수량은 1,000,000입니다.')
  .refine(
    val => Number.isFinite(val) && val > 0,
    '유효한 수량을 입력해주세요.'
  );

// 가격 검증 (양수)
export const priceSchema = z.number({
  required_error: '가격을 입력해주세요.',
  invalid_type_error: '가격은 숫자여야 합니다.',
})
  .positive('가격은 0보다 커야 합니다.')
  .max(100000000000, '최대 가격은 1,000억입니다.')
  .refine(
    val => Number.isFinite(val) && val > 0,
    '유효한 가격을 입력해주세요.'
  );

// 주문 생성 요청 스키마
export const createOrderSchema = z.object({
  symbol: symbolSchema,
  name: stockNameSchema,
  type: assetTypeSchema,
  orderType: orderTypeSchema,
  priceType: priceTypeSchema,
  price: priceSchema.optional(),
  quantity: quantitySchema,
}).refine(
  // 지정가 주문일 경우 가격 필수
  data => data.priceType !== 'LIMIT' || (data.price !== undefined && data.price > 0),
  {
    message: '지정가 주문의 경우 가격을 입력해야 합니다.',
    path: ['price'],
  }
);

// 주문 취소 요청 스키마
export const cancelOrderSchema = z.object({
  orderId: z.string()
    .min(1, '주문 ID가 필요합니다.')
    .max(50, '유효하지 않은 주문 ID입니다.'),
});

// 계좌 ID 검증
export const accountIdSchema = z.string()
  .min(1, '계좌 ID가 필요합니다.')
  .max(50, '유효하지 않은 계좌 ID입니다.');

// 페이지네이션 스키마
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

// 날짜 범위 스키마
export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
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

// 거래 내역 조회 스키마
export const getTransactionHistorySchema = paginationSchema.merge(dateRangeSchema).extend({
  symbol: symbolSchema.optional(),
  type: assetTypeSchema.optional(),
  orderType: orderTypeSchema.optional(),
});

// 차트 데이터 조회 스키마
export const chartIntervalSchema = z.enum(['1m', '5m', '15m', '1h', '4h', '1d', '1w'], {
  errorMap: () => ({ message: '유효하지 않은 차트 간격입니다.' }),
});

export const getChartDataSchema = z.object({
  symbol: symbolSchema,
  interval: chartIntervalSchema.default('1d'),
  limit: z.number().int().min(1).max(500).default(100),
});

// 타입 내보내기
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;
export type GetTransactionHistoryInput = z.infer<typeof getTransactionHistorySchema>;
export type GetChartDataInput = z.infer<typeof getChartDataSchema>;
export type AssetType = z.infer<typeof assetTypeSchema>;
export type OrderType = z.infer<typeof orderTypeSchema>;
export type PriceType = z.infer<typeof priceTypeSchema>;
