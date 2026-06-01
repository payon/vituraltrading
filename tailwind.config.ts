import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
    darkMode: "class",
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
        extend: {
                colors: {
                        background: 'hsl(var(--background))',
                        foreground: 'hsl(var(--foreground))',
                        card: {
                                DEFAULT: 'hsl(var(--card))',
                                foreground: 'hsl(var(--card-foreground))'
                        },
                        popover: {
                                DEFAULT: 'hsl(var(--popover))',
                                foreground: 'hsl(var(--popover-foreground))'
                        },
                        primary: {
                                DEFAULT: 'hsl(var(--primary))',
                                foreground: 'hsl(var(--primary-foreground))'
                        },
                        secondary: {
                                DEFAULT: 'hsl(var(--secondary))',
                                foreground: 'hsl(var(--secondary-foreground))'
                        },
                        muted: {
                                DEFAULT: 'hsl(var(--muted))',
                                foreground: 'hsl(var(--muted-foreground))'
                        },
                        accent: {
                                DEFAULT: 'hsl(var(--accent))',
                                foreground: 'hsl(var(--accent-foreground))'
                        },
                        destructive: {
                                DEFAULT: 'hsl(var(--destructive))',
                                foreground: 'hsl(var(--destructive-foreground))'
                        },
                        border: 'hsl(var(--border))',
                        input: 'hsl(var(--input))',
                        ring: 'hsl(var(--ring))',
                        chart: {
                                '1': 'hsl(var(--chart-1))',
                                '2': 'hsl(var(--chart-2))',
                                '3': 'hsl(var(--chart-3))',
                                '4': 'hsl(var(--chart-4))',
                                '5': 'hsl(var(--chart-5))'
                        },
                        // 주식/코인 색상 시스템 (RGB)
                        stock: {
                                up: 'rgb(255, 82, 82)',
                                down: 'rgb(39, 125, 255)',
                        },
                        coin: {
                                up: 'rgb(255, 193, 7)',
                                down: 'rgb(156, 39, 176)',
                        },
                        // 커스텀 프라이머리/세컨더리
                        custom: {
                                primary: 'rgb(76, 175, 80)',
                                secondary: 'rgb(158, 158, 158)',
                                background: 'rgb(250, 250, 250)',
                        },
                        // 시맨틱 색상
                        success: 'rgb(76, 175, 80)',
                        warning: 'rgb(255, 193, 7)',
                        danger: 'rgb(255, 82, 82)',
                        info: 'rgb(39, 125, 255)',
                },
                borderRadius: {
                        lg: 'var(--radius)',
                        md: 'calc(var(--radius) - 2px)',
                        sm: 'calc(var(--radius) - 4px)'
                },
                screens: {
                        'mobile': {'max': '767px'},
                        'tablet': '768px',
                        'desktop': '1024px',
                },
                spacing: {
                        'safe-top': 'env(safe-area-inset-top)',
                        'safe-bottom': 'env(safe-area-inset-bottom)',
                        'safe-left': 'env(safe-area-inset-left)',
                        'safe-right': 'env(safe-area-inset-right)',
                },
        }
  },
  plugins: [tailwindcssAnimate],
};
export default config;
