"use client";

import { Globe, Loader2 } from 'lucide-react';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'ja', label: '日本語 (Japanese)' },
];

export default function LanguageSelector({ currentLang, onLanguageChange, isTranslating, bannerUrl }) {
  return (
    <div className="relative inline-flex items-center">
      <div className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs md:text-sm font-bold border transition-all ${
        bannerUrl
          ? 'bg-white/20 dark:bg-slate-900/40 border-white/30 text-white backdrop-blur-md'
          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
      }`}>
        {isTranslating ? (
          <Loader2 size={16} className="animate-spin text-current" />
        ) : (
          <Globe size={16} className="text-current" />
        )}
        <select
          value={currentLang || 'en'}
          onChange={(e) => onLanguageChange(e.target.value)}
          disabled={isTranslating}
          className="bg-transparent outline-none cursor-pointer pr-1 font-bold text-xs md:text-sm text-current [&>option]:text-slate-900 [&>option]:bg-white dark:[&>option]:bg-slate-900 dark:[&>option]:text-slate-100"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
