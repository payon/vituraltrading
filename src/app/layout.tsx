import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ef4444' },
    { media: '(prefers-color-scheme: dark)', color: '#1f2937' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: {
    default: "투자학습 모의투자 - 주식·코인 투자 학습 플랫폼",
    template: "%s | 투자학습 모의투자",
  },
  description: "주식·코인 투자 학습 & 모의투자 플랫폼. 배우고, 연습하고, 성장하세요. 실제 자금 없이 투자를 연습할 수 있습니다.",
  keywords: ["투자", "학습", "모의투자", "주식", "코인", "investment", "trading", "모의투자", "주식학습", "코인학습"],
  authors: [{ name: "투자학습 모의투자 팀" }],
  applicationName: "투자학습 모의투자",
  icons: {
    icon: [
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/manifest.json',
  openGraph: {
    title: "투자학습 모의투자",
    description: "주식·코인 투자 학습 & 모의투자 플랫폼",
    type: "website",
    locale: 'ko_KR',
    images: [
      {
        url: '/icon-512x512.png',
        width: 512,
        height: 512,
        alt: '투자학습 모의투자',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '투자학습 모의투자',
    description: '주식·코인 투자 학습 & 모의투자 플랫폼',
    images: ['/icon-512x512.png'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '투자학습',
    startupImage: [
      {
        url: '/apple-touch-icon.png',
        media: '(device-width: 375px)',
      },
    ],
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#ef4444" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
      </body>
    </html>
  );
}
