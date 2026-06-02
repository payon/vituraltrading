'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Order, Transaction, formatPrice, COLORS, OrderStatus } from '@/lib/trading';
import { History, Clock, CheckCircle, XCircle } from 'lucide-react';

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING: { label: '대기', color: 'bg-yellow-500', icon: <Clock className="w-3 h-3" /> },
  FILLED: { label: '완료', color: 'bg-green-500', icon: <CheckCircle className="w-3 h-3" /> },
  CANCELLED: { label: '취소', color: 'bg-gray-500', icon: <XCircle className="w-3 h-3" /> },
};

export function HistoryPanel() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const [ordersRes, txRes] = await Promise.all([
        fetch('/api/trading/history?type=orders'),
        fetch('/api/trading/history?type=transactions'),
      ]);
      
      const ordersResult = await ordersRes.json();
      const txResult = await txRes.json();
      
      if (ordersResult.success) {
        setOrders(ordersResult.data.orders || []);
      }
      if (txResult.success) {
        setTransactions(txResult.data.transactions || []);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-[200px] text-muted-foreground">
          로딩 중...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <History className="w-5 h-5" />
          거래 내역
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="transactions">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-4">
            <TabsTrigger 
              value="transactions" 
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >
              체결 내역
            </TabsTrigger>
            <TabsTrigger 
              value="orders"
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >
              주문 내역
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="mt-0">
            <ScrollArea className="h-[300px]">
              {transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                  <History className="w-12 h-12 mb-2 opacity-50" />
                  <p>거래 내역이 없습니다</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>일시</TableHead>
                      <TableHead>종목</TableHead>
                      <TableHead>구분</TableHead>
                      <TableHead className="text-right">가격</TableHead>
                      <TableHead className="text-right">수량</TableHead>
                      <TableHead className="text-right">금액</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(tx.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{tx.name}</div>
                          <div className="text-xs text-muted-foreground">{tx.symbol}</div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline"
                            style={{ 
                              color: tx.transactionType === 'BUY' ? COLORS.RISE : COLORS.FALL,
                              borderColor: tx.transactionType === 'BUY' ? COLORS.RISE : COLORS.FALL,
                            }}
                          >
                            {tx.transactionType === 'BUY' ? '매수' : '매도'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatPrice(tx.price)}</TableCell>
                        <TableCell className="text-right">{tx.quantity.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-medium">{formatPrice(tx.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="orders" className="mt-0">
            <ScrollArea className="h-[300px]">
              {orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                  <Clock className="w-12 h-12 mb-2 opacity-50" />
                  <p>주문 내역이 없습니다</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>일시</TableHead>
                      <TableHead>종목</TableHead>
                      <TableHead>구분</TableHead>
                      <TableHead className="text-right">주문가</TableHead>
                      <TableHead className="text-right">수량</TableHead>
                      <TableHead>상태</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(order.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{order.name}</div>
                          <div className="text-xs text-muted-foreground">{order.symbol}</div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline"
                            style={{ 
                              color: order.orderType === 'BUY' ? COLORS.RISE : COLORS.FALL,
                              borderColor: order.orderType === 'BUY' ? COLORS.RISE : COLORS.FALL,
                            }}
                          >
                            {order.orderType === 'BUY' ? '매수' : '매도'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatPrice(order.price)}
                          <div className="text-xs text-muted-foreground">
                            {order.priceType === 'MARKET' ? '시장가' : '지정가'}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {order.quantity.toLocaleString()}
                          {order.filledQuantity && order.filledQuantity !== order.quantity && (
                            <div className="text-xs text-muted-foreground">
                              체결: {order.filledQuantity.toLocaleString()}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${statusConfig[order.status].color} text-white`}>
                            <span className="flex items-center gap-1">
                              {statusConfig[order.status].icon}
                              {statusConfig[order.status].label}
                            </span>
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
