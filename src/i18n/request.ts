import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  // Ensure valid locale
  if (!locale || !routing.locales.includes(locale as 'ko' | 'en' | 'ja' | 'zh')) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: {
      ...(await import(`../locales/${locale}/common.json`)).default,
      ...(await import(`../locales/${locale}/learning.json`)).default,
      ...(await import(`../locales/${locale}/trading.json`)).default,
      ...(await import(`../locales/${locale}/diary.json`)).default,
      ...(await import(`../locales/${locale}/analysis.json`)).default,
    }
  };
});
