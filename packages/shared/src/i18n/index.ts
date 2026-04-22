import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import koCommon from './locales/ko/common.json';
import koAuth from './locales/ko/auth.json';
import koCommunity from './locales/ko/community.json';
import koHighlight from './locales/ko/highlight.json';
import koNotification from './locales/ko/notification.json';
import koNotice from './locales/ko/notice.json';
import koTranslation from './locales/ko/translation.json';
import koHome from './locales/ko/home.json';
import koReport from './locales/ko/report.json';
import koMore from './locales/ko/more.json';
import koSettings from './locales/ko/settings.json';
import koShop from './locales/ko/shop.json';
import koDm from './locales/ko/dm.json';
import koAccount from './locales/ko/account.json';
import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
import enCommunity from './locales/en/community.json';
import enHighlight from './locales/en/highlight.json';
import enNotification from './locales/en/notification.json';
import enNotice from './locales/en/notice.json';
import enTranslation from './locales/en/translation.json';
import enHome from './locales/en/home.json';
import enReport from './locales/en/report.json';
import enMore from './locales/en/more.json';
import enSettings from './locales/en/settings.json';
import enShop from './locales/en/shop.json';
import enDm from './locales/en/dm.json';
import enAccount from './locales/en/account.json';
import thCommon from './locales/th/common.json';
import thAuth from './locales/th/auth.json';
import thCommunity from './locales/th/community.json';
import thHighlight from './locales/th/highlight.json';
import thNotification from './locales/th/notification.json';
import thNotice from './locales/th/notice.json';
import thTranslation from './locales/th/translation.json';
import thHome from './locales/th/home.json';
import thReport from './locales/th/report.json';
import thMore from './locales/th/more.json';
import thSettings from './locales/th/settings.json';
import zhCommon from './locales/zh/common.json';
import zhAuth from './locales/zh/auth.json';
import zhCommunity from './locales/zh/community.json';
import zhHighlight from './locales/zh/highlight.json';
import zhNotification from './locales/zh/notification.json';
import zhNotice from './locales/zh/notice.json';
import zhTranslation from './locales/zh/translation.json';
import zhHome from './locales/zh/home.json';
import zhReport from './locales/zh/report.json';
import zhMore from './locales/zh/more.json';
import zhSettings from './locales/zh/settings.json';
import jaCommon from './locales/ja/common.json';
import jaAuth from './locales/ja/auth.json';
import jaCommunity from './locales/ja/community.json';
import jaHighlight from './locales/ja/highlight.json';
import jaNotification from './locales/ja/notification.json';
import jaNotice from './locales/ja/notice.json';
import jaTranslation from './locales/ja/translation.json';
import jaHome from './locales/ja/home.json';
import jaReport from './locales/ja/report.json';
import jaMore from './locales/ja/more.json';
import jaSettings from './locales/ja/settings.json';

export const SUPPORTED_LANGUAGES = ['ko', 'en', 'th', 'zh', 'ja'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

// Phase 7 / 07-02: shop / dm / account namespaces. ko + en are authored;
// th / zh / ja fall back to the ko bundle (same strategy used in 07-01 for new
// surfaces — translations follow in v1.0.1 patch). EN is the i18next fallbackLng,
// so missing keys still render in English at runtime.
const resources = {
  ko: {
    common: koCommon,
    auth: koAuth,
    community: koCommunity,
    highlight: koHighlight,
    notification: koNotification,
    notice: koNotice,
    translation: koTranslation,
    home: koHome,
    report: koReport,
    more: koMore,
    settings: koSettings,
    shop: koShop,
    dm: koDm,
    account: koAccount,
  },
  en: {
    common: enCommon,
    auth: enAuth,
    community: enCommunity,
    highlight: enHighlight,
    notification: enNotification,
    notice: enNotice,
    translation: enTranslation,
    home: enHome,
    report: enReport,
    more: enMore,
    settings: enSettings,
    shop: enShop,
    dm: enDm,
    account: enAccount,
  },
  th: {
    common: thCommon,
    auth: thAuth,
    community: thCommunity,
    highlight: thHighlight,
    notification: thNotification,
    notice: thNotice,
    translation: thTranslation,
    home: thHome,
    report: thReport,
    more: thMore,
    settings: thSettings,
    shop: koShop,
    dm: koDm,
    account: koAccount,
  },
  zh: {
    common: zhCommon,
    auth: zhAuth,
    community: zhCommunity,
    highlight: zhHighlight,
    notification: zhNotification,
    notice: zhNotice,
    translation: zhTranslation,
    home: zhHome,
    report: zhReport,
    more: zhMore,
    settings: zhSettings,
    shop: koShop,
    dm: koDm,
    account: koAccount,
  },
  ja: {
    common: jaCommon,
    auth: jaAuth,
    community: jaCommunity,
    highlight: jaHighlight,
    notification: jaNotification,
    notice: jaNotice,
    translation: jaTranslation,
    home: jaHome,
    report: jaReport,
    more: jaMore,
    settings: jaSettings,
    shop: koShop,
    dm: koDm,
    account: koAccount,
  },
};

export function initI18n(languageCode?: string) {
  if (!i18n.isInitialized) {
    i18n.use(initReactI18next).init({
      resources,
      lng: languageCode ?? 'en',
      fallbackLng: 'en',
      ns: [
        'common',
        'auth',
        'community',
        'highlight',
        'notification',
        'notice',
        'translation',
        'home',
        'report',
        'more',
        'settings',
        'shop',
        'dm',
        'account',
      ],
      defaultNS: 'common',
      interpolation: { escapeValue: false },
    });
  }
  return i18n;
}

export { useTranslation } from 'react-i18next';
export default i18n;
