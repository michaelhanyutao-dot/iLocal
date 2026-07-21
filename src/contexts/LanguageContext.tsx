import React, { createContext, useContext, useState } from 'react';

type Language = 'zh' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const translations = {
  zh: {
    'app.title': 'iLocal',
    'app.subtitle': '发现身边精彩活动',
    'header.currentLocation': '当前位置',
    'header.locating': '定位中...',
    'header.relocate': '重新定位',
    'header.profile': '我',
    'header.loginRegister': '登录 / 注册',
    'category.coffee': '咖啡',
    'category.music': '音乐',
    'category.market': '市集',
    'category.party': '派对',
    'category.exhibition': '展览',
    'category.bar': '酒吧',
    'category.sports': '运动',
    'view.map': '地图',
    'view.list': '列表',
    'events.found': '发现 {count} 个活动',
    'events.noResults': '暂无符合条件的活动',
    'events.tryAdjust': '尝试调整搜索条件或筛选器',
    'login.required': '请先登录查看活动详情',
    'login.button': '立即登录',
    'event.attendees': '人参加',
    'back': '返回'
  },
  en: {
    'app.title': 'iLocal',
    'app.subtitle': 'Discover exciting events nearby',
    'header.currentLocation': 'Current Location',
    'header.locating': 'Locating...',
    'header.relocate': 'Relocate',
    'header.profile': 'Me',
    'header.loginRegister': 'Login / Register',
    'category.coffee': 'Coffee',
    'category.music': 'Music',
    'category.market': 'Market',
    'category.party': 'Party',
    'category.exhibition': 'Exhibition',
    'category.bar': 'Bar',
    'category.sports': 'Sports',
    'view.map': 'Map',
    'view.list': 'List',
    'events.found': 'Found {count} events',
    'events.noResults': 'No events match your criteria',
    'events.tryAdjust': 'Try adjusting your search or filters',
    'login.required': 'Please login to view event details',
    'login.button': 'Login Now',
    'event.attendees': 'attending',
    'back': 'Back'
  }
};

const LanguageContext = createContext<LanguageContextType>({} as LanguageContextType);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('zh');

  const t = (key: string, params?: Record<string, string | number>) => {
    let text = translations[language][key as keyof typeof translations['zh']] || key;
    
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        text = text.replace(`{${param}}`, String(value));
      });
    }
    
    return text;
  };

  const value = {
    language,
    setLanguage,
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
