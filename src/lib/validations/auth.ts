/**
 * 인증 관련 입력 검증 스키마
 * - 로그인/회원가입 검증
 * - 비밀번호 정책 검증
 * - XSS 방지를 위한 문자열 정제
 */

import { z } from 'zod';

// 이메일 검증
export const emailSchema = z.string()
  .min(1, '이메일을 입력해주세요.')
  .max(100, '이메일은 100자 이하여야 합니다.')
  .email('유효한 이메일 형식이 아닙니다.')
  .transform(val => val.toLowerCase().trim());

// 사용자명 검증
export const usernameSchema = z.string()
  .min(2, '사용자명은 2자 이상이어야 합니다.')
  .max(30, '사용자명은 30자 이하여야 합니다.')
  .regex(/^[가-힣a-zA-Z0-9_]+$/, '사용자명은 한글, 영문, 숫자, 언더스코어만 사용 가능합니다.')
  .transform(val => val.trim());

// 비밀번호 검증 (강력한 정책)
export const passwordSchema = z.string()
  .min(8, '비밀번호는 8자 이상이어야 합니다.')
  .max(100, '비밀번호는 100자 이하여야 합니다.')
  .regex(/[a-z]/, '비밀번호에 소문자를 포함해야 합니다.')
  .regex(/[A-Z]/, '비밀번호에 대문자를 포함해야 합니다.')
  .regex(/[0-9]/, '비밀번호에 숫자를 포함해야 합니다.')
  .regex(/[!@#$%^&*(),.?":{}|<>]/, '비밀번호에 특수문자를 포함해야 합니다.');

// 비밀번호 확인 검증
export const confirmPasswordSchema = z.string()
  .min(1, '비밀번호 확인을 입력해주세요.');

// 투자 성향
export const investmentStyleSchema = z.enum(['conservative', 'moderate', 'aggressive'], {
  errorMap: () => ({ message: '유효한 투자 성향을 선택해주세요.' }),
});

// 언어 설정
export const languageSchema = z.enum(['ko', 'en', 'ja', 'zh'], {
  errorMap: () => ({ message: '유효한 언어를 선택해주세요.' }),
});

// 테마 설정
export const themeSchema = z.enum(['light', 'dark', 'system'], {
  errorMap: () => ({ message: '유효한 테마를 선택해주세요.' }),
});

// 회원가입 스키마
export const signUpSchema = z.object({
  email: emailSchema,
  name: usernameSchema,
  password: passwordSchema,
  confirmPassword: confirmPasswordSchema,
  investmentStyle: investmentStyleSchema.optional(),
  language: languageSchema.default('ko'),
}).refine(
  data => data.password === data.confirmPassword,
  {
    message: '비밀번호가 일치하지 않습니다.',
    path: ['confirmPassword'],
  }
);

// 로그인 스키마
export const signInSchema = z.object({
  email: emailSchema,
  password: z.string()
    .min(1, '비밀번호를 입력해주세요.')
    .max(100, '비밀번호는 100자 이하여야 합니다.'),
});

// 비밀번호 변경 스키마
export const changePasswordSchema = z.object({
  currentPassword: z.string()
    .min(1, '현재 비밀번호를 입력해주세요.'),
  newPassword: passwordSchema,
  confirmNewPassword: confirmPasswordSchema,
}).refine(
  data => data.newPassword === data.confirmNewPassword,
  {
    message: '새 비밀번호가 일치하지 않습니다.',
    path: ['confirmNewPassword'],
  }
);

// 프로필 수정 스키마
export const updateProfileSchema = z.object({
  name: usernameSchema.optional(),
  investmentStyle: investmentStyleSchema.optional(),
  language: languageSchema.optional(),
  theme: themeSchema.optional(),
});

// 사용자 ID 검증
export const userIdSchema = z.string()
  .min(1, '사용자 ID가 필요합니다.')
  .max(50, '유효하지 않은 사용자 ID입니다.');

// 세션 토큰 검증
export const sessionTokenSchema = z.string()
  .min(1, '세션 토큰이 필요합니다.')
  .max(500, '유효하지 않은 세션 토큰입니다.');

// 비밀번호 재설정 요청 스키마
export const resetPasswordRequestSchema = z.object({
  email: emailSchema,
});

// 비밀번호 재설정 스키마
export const resetPasswordSchema = z.object({
  token: z.string()
    .min(1, '토큰이 필요합니다.')
    .max(500, '유효하지 않은 토큰입니다.'),
  newPassword: passwordSchema,
  confirmNewPassword: confirmPasswordSchema,
}).refine(
  data => data.newPassword === data.confirmNewPassword,
  {
    message: '새 비밀번호가 일치하지 않습니다.',
    path: ['confirmNewPassword'],
  }
);

// 이메일 인증 스키마
export const verifyEmailSchema = z.object({
  token: z.string()
    .min(1, '인증 토큰이 필요합니다.')
    .max(500, '유효하지 않은 인증 토큰입니다.'),
});

// 타입 내보내기
export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ResetPasswordRequestInput = z.infer<typeof resetPasswordRequestSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type InvestmentStyle = z.infer<typeof investmentStyleSchema>;
export type Language = z.infer<typeof languageSchema>;
export type Theme = z.infer<typeof themeSchema>;
