import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import koCommon from './locales/ko/common.json';
import koAuth from './locales/ko/auth.json';
import koCommunity from './locales/ko/community.json';
import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
import enCommunity from './locales/en/community.json';
import thCommon from './locales/th/common.json';
import thAuth from './locales/th/auth.json';
import thCommunity from './locales/th/community.json';
import zhCommon from './locales/zh/common.json';
import zhAuth from './locales/zh/auth.json';
import zhCommunity from './locales/zh/community.json';
import jaCommon from './locales/ja/common.json';
import jaAuth from './locales/ja/auth.json';
import jaCommunity from './locales/ja/community.json';

export const SUPPORTED_LANGUAGES = ['ko', 'en', 'th', 'zh', 'ja'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const resources = {
  ko: { common: koCommon, auth: koAuth, community: koCommunity },
  en: { common: enCommon, auth: enAuth, community: enCommunity },
  th: { common: thCommon, auth: thAuth, community: thCommunity },
  zh: { common: zhCommon, auth: zhAuth, community: zhCommunity },
  ja: { common: jaCommon, auth: jaAuth, community: jaCommunity },
};

export function initI18n(languageCode?: string) {
  if (!i18n.isInitialized) {
    i18n.use(initReactI18next).init({
      resources,
      lng: languageCode ?? 'en',
      fallbackLng: 'en',
      ns: ['common', 'auth', 'community'],
      defaultNS: 'common',
      interpolation: { escapeValue: false },
    });
  }
  return i18n;
}

export { useTranslation } from 'react-i18next';
export default i18n;
