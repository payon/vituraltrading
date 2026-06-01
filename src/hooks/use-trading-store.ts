import { create } from 'zustand';
import { Stock, Holding, Order, Account, ChartDataPoint, AssetType } from '@/lib/trading';

interface TradingState {
  // 계좌
  account: Account | null;
  setAccount: (account: Account | null) => void;
  
  // 선택된 종목
  selectedStock: Stock | null;
  setSelectedStock: (stock: Stock | null) => void;
  
  // 자산 타입 (주식/코인)
  assetType: AssetType;
  setAssetType: (type: AssetType) => void;
  
  // 포트폴리오
  holdings: Holding[];
  setHoldings: (holdings: Holding[]) => void;
  
  // 주문 내역
  orders: Order[];
  setOrders: (orders: Order[]) => void;
  
  // 차트 데이터
  chartData: ChartDataPoint[];
  setChartData: (data: ChartDataPoint[]) => void;
  
  // 차트 인터벌
  chartInterval: string;
  setChartInterval: (interval: string) => void;
  
  // 로딩 상태
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  
  // 주문 모달
  isOrderModalOpen: boolean;
  setIsOrderModalOpen: (open: boolean) => void;
  
  // 주문 타입 (매수/매도)
  orderType: 'BUY' | 'SELL';
  setOrderType: (type: 'BUY' | 'SELL') => void;
  
  // 검색어
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const useTradingStore = create<TradingState>((set) => ({
  account: null,
  setAccount: (account) => set({ account }),
  
  selectedStock: null,
  setSelectedStock: (stock) => set({ selectedStock: stock }),
  
  assetType: 'STOCK',
  setAssetType: (type) => set({ assetType: type }),
  
  holdings: [],
  setHoldings: (holdings) => set({ holdings }),
  
  orders: [],
  setOrders: (orders) => set({ orders }),
  
  chartData: [],
  setChartData: (data) => set({ chartData: data }),
  
  chartInterval: '1d',
  setChartInterval: (interval) => set({ chartInterval: interval }),
  
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
  
  isOrderModalOpen: false,
  setIsOrderModalOpen: (open) => set({ isOrderModalOpen: open }),
  
  orderType: 'BUY',
  setOrderType: (type) => set({ orderType: type }),
  
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
}));
