/**
 * 회원가입 API
 */

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { signUpSchema } from '@/lib/validations/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 입력 검증
    const validationResult = signUpSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: '입력값이 올바르지 않습니다.', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { email, name, password, investmentStyle, language } = validationResult.data;

    // 이메일 중복 확인
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: '이미 등록된 이메일입니다.' },
        { status: 400 }
      );
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 12);

    // 사용자 생성
    const user = await db.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        investmentStyle,
        language,
        initialBalance: 10000000, // 1000만원
        currentBalance: 10000000,
      },
    });

    // 사용자 설정 생성
    await db.settings.create({
      data: {
        userId: user.id,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: '회원가입이 완료되었습니다.',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: '회원가입 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
