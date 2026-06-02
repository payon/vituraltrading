import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createOrderSchema } from '@/lib/validations/trading';
import { checkRateLimit, createRateLimitResponse } from '@/lib/security/rate-limit';
import { sanitizeText } from '@/lib/security/sanitize';
import { logger, formatValidationErrors } from '@/lib/utils/security';

// 주문 생성 (Rate Limiting + 입력 검증)
export async function POST(request: Request) {
  try {
    // Rate Limiting 체크
    const rateLimitResult = checkRateLimit(request);
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }

    // 요청 본문 파싱
    const body = await request.json();
    
    // 입력 검증
    const validationResult = createOrderSchema.safeParse(body);
    if (!validationResult.success) {
      const errorMessage = formatValidationErrors(
        validationResult.error.errors.map(e => ({
          path: e.path,
          message: e.message,
        }))
      );
      
      logger.warn('주문 입력 검증 실패', { errors: errorMessage });
      
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 400 }
      );
    }

    const { symbol, name, type, orderType, priceType, price, quantity } = validationResult.data;
    
    // 문자열 정제
    const sanitizedSymbol = symbol;
    const sanitizedName = name;
    
    logger.info('주문 요청', {
      symbol: sanitizedSymbol,
      orderType,
      priceType,
      quantity,
    });
    
    // 기본 사용자 조회
    let user = await db.user.findFirst();
    
    if (!user) {
      user = await db.user.create({
        data: {
          email: 'demo@invest.app',
          name: '데모 사용자',
          initialBalance: 10000000,
          currentBalance: 10000000,
        }
      });
    }

    const totalAmount = price * quantity;
    const fee = type === 'STOCK' ? totalAmount * 0.00015 : totalAmount * 0.0005; // 수수료
    const totalWithFee = orderType === 'BUY' ? totalAmount + fee : totalAmount - fee;

    if (orderType === 'BUY') {
      // 매수 - 잔고 확인
      if (user.currentBalance < totalWithFee) {
        return NextResponse.json(
          { success: false, error: '잔고가 부족합니다.' },
          { status: 400 }
        );
      }

      // 포트폴리오 확인 (기존 보유 종목)
      const existingPortfolio = await db.portfolio.findFirst({
        where: { userId: user.id, symbol }
      });

      if (existingPortfolio) {
        // 기존 종목 추가 매수 - 평균 단가 재계산
        const newQuantity = existingPortfolio.quantity + quantity;
        const newTotalCost = existingPortfolio.totalCost + totalAmount;
        const newAvgPrice = newTotalCost / newQuantity;
        
        await db.portfolio.update({
          where: { id: existingPortfolio.id },
          data: {
            quantity: newQuantity,
            buyPrice: newAvgPrice,
            totalCost: newTotalCost,
          }
        });
      } else {
        // 신규 종목 매수
        await db.portfolio.create({
          data: {
            userId: user.id,
            symbol,
            name,
            assetType: type,
            quantity,
            buyPrice: price,
            totalCost: totalAmount,
          }
        });
      }

      // 잔고 차감
      await db.user.update({
        where: { id: user.id },
        data: {
          currentBalance: user.currentBalance - totalWithFee
        }
      });
    } else {
      // 매도
      const portfolio = await db.portfolio.findFirst({
        where: { userId: user.id, symbol }
      });

      if (!portfolio) {
        return NextResponse.json(
          { success: false, error: '보유하지 않은 종목입니다.' },
          { status: 400 }
        );
      }

      if (portfolio.quantity < quantity) {
        return NextResponse.json(
          { success: false, error: '보유 수량보다 많은 수량을 요청했습니다.' },
          { status: 400 }
        );
      }

      const totalRevenue = price * quantity - fee;
      
      // 잔고 증가
      await db.user.update({
        where: { id: user.id },
        data: {
          currentBalance: user.currentBalance + totalRevenue
        }
      });
      
      // 보유 수량 차감
      const newQuantity = portfolio.quantity - quantity;
      if (newQuantity <= 0) {
        await db.portfolio.delete({
          where: { id: portfolio.id }
        });
      } else {
        await db.portfolio.update({
          where: { id: portfolio.id },
          data: { quantity: newQuantity }
        });
      }
    }

    // 거래 내역 기록
    await db.transaction.create({
      data: {
        userId: user.id,
        symbol,
        name,
        assetType: type,
        transactionType: orderType,
        orderType: priceType,
        price,
        quantity,
        totalAmount,
        fee,
        status: 'COMPLETED'
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        orderId: `order-${Date.now()}`,
        message: orderType === 'BUY' ? '매수 주문이 완료되었습니다.' : '매도 주문이 완료되었습니다.'
      }
    });
  } catch (error) {
    console.error('Order error:', error);
    return NextResponse.json(
      { success: false, error: '주문 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
