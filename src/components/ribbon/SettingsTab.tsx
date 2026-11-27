import React, { useState } from 'react';
import { usePublisher } from '../../context/PublisherContext';
import {
  getSavedClipartFreeKey,
  saveClipartFreeKey,
} from '../../utils/clipartSearch';
import {
  getPollinationsKey,
  savePollinationsKey,
} from '../../utils/apiEndpoints';
import { clearWorkspaceStorage } from '../../utils/workspaceStorage';
import {
  Sun,
  Moon,
  Grid,
  Magnet,
  Ruler,
  KeyRound,
  RotateCcw,
  Sparkles,
  Check,
  Trash2,
} from 'lucide-react';

export const SettingsTab: React.FC = () => {
  const {
    theme,
    setTheme,
    rulerVisible,
    setRulerVisible,
    guidesVisible,
    setGuidesVisible,
    gridVisible,
    setGridVisible,
    snapToGuides,
    setSnapToGuides,
    snapToGrid,
    setSnapToGrid,
    setIsLeftPanelOpen,
    setIsRightPanelOpen,
  } = usePublisher();

  const [cfKey, setCfKey] = useState(() => getSavedClipartFreeKey());
  const [geminiKey, setGeminiKey] = useState(() => {
    try {
      return localStorage.getItem('studiopress_gemini_api_key') || '';
    } catch {
      return '';
    }
  });
  const [pollinationsKey, setPollinationsKey] = useState(() => getPollinationsKey());
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const flashNotice = (msg: string) => {
    setSavedNotice(msg);
    window.setTimeout(() => setSavedNotice(null), 2000);
  };

  const handleSaveKeys = () => {
    saveClipartFreeKey(cfKey);
    savePollinationsKey(pollinationsKey);
    try {
      if (geminiKey.trim()) {
        localStorage.setItem('studiopress_gemini_api_key', geminiKey.trim());
      } else {
        localStorage.removeItem('studiopress_gemini_api_key');
      }
    } catch {
      // ignore storage errors
    }
    flashNotice('API keys saved locally');
  };

  const handleResetLayout = () => {
    try {
      localStorage.removeItem('studiopress_left_panel_width');
      localStorage.removeItem('studiopress_right_panel_width');
      localStorage.removeItem('studiopress_stock_panel_width');
    } catch {
      // ignore
    }
    setIsLeftPanelOpen(true);
    setIsRightPanelOpen(true);
    window.dispatchEvent(new Event('resize'));
    flashNotice('Panel layout reset');
  };

  const handleReplaySplash = () => {
    try {
      sessionStorage.removeItem('studiopress_splash_seen');
    } catch {
      // ignore
    }
    window.location.reload();
  };

  return (
    <div className="flex items-center h-[84px] px-2 py-1.5 gap-2 text-xs text-[#161a22] overflow-x-auto select-none">
      {/* 1. Appearance (Light / Dark) */}
      <div className="flex flex-col justify-between h-full py-0.5 pr-2.5 border-r border-[#e5e9ee] flex-shrink-0">
        <div className="flex items-center bg-[#f3f5f7] p-0.5 rounded-[8px] border border-[#e5e9ee] my-auto">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-[6px] text-[11px] font-semibold transition cursor-pointer ${
              theme === 'light'
                ? 'bg-[#efeafd] text-[#5c4bb8]'
                : 'text-[#4a5661] hover:text-[#161a22]'
            }`}
          >
            <Sun size={12} />
            <span>Light</span>
          </button>
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-[6px] text-[11px] font-semibold transition cursor-pointer ${
              theme === 'dark'
                ? 'bg-[#efeafd] text-[#5c4bb8]'
                : 'text-[#4a5661] hover:text-[#161a22]'
            }`}
          >
            <Moon size={12} />
            <span>Dark</span>
          </button>
        </div>
        <span className="text-[10px] text-[#6a7682] font-bold uppercase tracking-[0.09em] text-center">
          Appearance
        </span>
      </div>

      {/* 2. Canvas Defaults & Snapping */}
      <div className="flex flex-col justify-between h-full py-0.5 px-2.5 border-r border-[#e5e9ee] flex-shrink-0">
        <div className="flex items-center gap-1.5 my-auto">
          <button
            type="button"
            onClick={() => setRulerVisible(!rulerVisible)}
            className={`flex items-center gap-1 px-2 py-1 rounded-[8px] border text-[11px] font-medium transition cursor-pointer ${
              rulerVisible
                ? 'bg-[#efeafd] border-[#d3c9f9] text-[#5c4bb8]'
                : 'bg-[#f8fafb] border-[#e5e9ee] text-[#4a5661] hover:bg-[#f4f2ff]'
            }`}
            title="Toggle Canvas Rulers"
          >
            <Ruler size={12} />
            <span>Rulers</span>
          </button>
          <button
            type="button"
            onClick={() => setGuidesVisible(!guidesVisible)}
            className={`flex items-center gap-1 px-2 py-1 rounded-[8px] border text-[11px] font-medium transition cursor-pointer ${
              guidesVisible
                ? 'bg-[#efeafd] border-[#d3c9f9] text-[#5c4bb8]'
                : 'bg-[#f8fafb] border-[#e5e9ee] text-[#4a5661] hover:bg-[#f4f2ff]'
            }`}
            title="Toggle Alignment & Margin Guides"
          >
            <span>Guides</span>
          </button>
          <button
            type="button"
            onClick={() => setGridVisible(!gridVisible)}
            className={`flex items-center gap-1 px-2 py-1 rounded-[8px] border text-[11px] font-medium transition cursor-pointer ${
              gridVisible
                ? 'bg-[#efeafd] border-[#d3c9f9] text-[#5c4bb8]'
                : 'bg-[#f8fafb] border-[#e5e9ee] text-[#4a5661] hover:bg-[#f4f2ff]'
            }`}
            title="Toggle Background Grid"
          >
            <Grid size={12} />
            <span>Grid</span>
          </button>
          <button
            type="button"
            onClick={() => {
              const next = !(snapToGuides || snapToGrid);
              setSnapToGuides(next);
              setSnapToGrid(next);
            }}
            className={`flex items-center gap-1 px-2 py-1 rounded-[8px] border text-[11px] font-medium transition cursor-pointer ${
              snapToGuides || snapToGrid
                ? 'bg-[#efeafd] border-[#d3c9f9] text-[#5c4bb8]'
                : 'bg-[#f8fafb] border-[#e5e9ee] text-[#4a5661] hover:bg-[#f4f2ff]'
            }`}
            title="Toggle Smart Snap to Guides & Grid"
          >
            <Magnet size={12} />
            <span>Snap</span>
          </button>
        </div>
        <span className="text-[10px] text-[#6a7682] font-bold uppercase tracking-[0.09em] text-center">
          Canvas Defaults
        </span>
      </div>

      {/* 3. Cloud & AI API Keys */}
      <div className="flex flex-col justify-between h-full py-0.5 px-2.5 border-r border-[#e5e9ee] flex-shrink-0">
        <div className="flex items-center gap-1.5 my-auto">
          <div className="flex items-center gap-1 bg-[#f8fafb] border border-[#e5e9ee] rounded-[8px] px-2 py-1">
            <KeyRound size={11} className="text-[#6e56cf]" />
            <input
              type="password"
              value={cfKey}
              onChange={(e) => setCfKey(e.target.value)}
              placeholder="Clipart.Free (cf_...)"
              className="w-28 bg-transparent text-[11px] outline-none text-[#161a22] placeholder-[#8b94a0]"
              title="Clipart.Free API Key"
            />
          </div>
          <div className="flex items-center gap-1 bg-[#f8fafb] border border-[#e5e9ee] rounded-[8px] px-2 py-1">
            <input
              type="password"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="Gemini Key"
              className="w-24 bg-transparent text-[11px] outline-none text-[#161a22] placeholder-[#8b94a0]"
              title="Google AI Studio Gemini Key"
            />
          </div>
          <div className="flex items-center gap-1 bg-[#f8fafb] border border-[#e5e9ee] rounded-[8px] px-2 py-1">
            <input
              type="password"
              value={pollinationsKey}
              onChange={(e) => setPollinationsKey(e.target.value)}
              placeholder="Pollinations Key"
              className="w-24 bg-transparent text-[11px] outline-none text-[#161a22] placeholder-[#8b94a0]"
              title="Optional Pollinations API Key"
            />
          </div>
          <button
            type="button"
            onClick={handleSaveKeys}
            className="px-2.5 py-1 rounded-[8px] bg-[#6e56cf] hover:bg-[#5c4bb8] text-white text-[11px] font-semibold transition cursor-pointer"
          >
            Save
          </button>
        </div>
        <span className="text-[10px] text-[#6a7682] font-bold uppercase tracking-[0.09em] text-center">
          API Keys (Local)
        </span>
      </div>

      {/* 4. Workspace Actions */}
      <div className="flex flex-col justify-between h-full py-0.5 px-2 flex-shrink-0">
        <div className="flex items-center gap-1.5 my-auto">
          <button
            type="button"
            onClick={handleResetLayout}
            className="flex items-center gap-1 px-2.5 py-1 rounded-[8px] border border-[#e5e9ee] bg-[#f8fafb] hover:bg-[#f4f2ff] hover:text-[#5c4bb8] text-[11px] font-medium transition cursor-pointer"
            title="Reset left/right sidebar widths and open panels"
          >
            <RotateCcw size={12} />
            <span>Reset Panels</span>
          </button>
          <button
            type="button"
            onClick={handleReplaySplash}
            className="flex items-center gap-1 px-2.5 py-1 rounded-[8px] border border-[#e5e9ee] bg-[#f8fafb] hover:bg-[#f4f2ff] hover:text-[#5c4bb8] text-[11px] font-medium transition cursor-pointer"
            title="Replay cinematic startup splash screen"
          >
            <Sparkles size={12} className="text-[#6e56cf]" />
            <span>Replay Intro</span>
          </button>
          <button
            type="button"
            onClick={async () => {
              if (
                !window.confirm(
                  'Reset StudioPress workspace and clear cached browser storage? Unsaved documents in this browser will be removed.'
                )
              ) {
                return;
              }
              await clearWorkspaceStorage({ resetCaches: true });
              window.location.reload();
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-[8px] border border-[#f2cfd3] bg-[#fff5f6] hover:bg-[#ffe4e7] text-[#b42318] text-[11px] font-medium transition cursor-pointer"
            title="Clear saved browser documents & PWA cache and start fresh"
          >
            <Trash2 size={12} />
            <span>Reset App</span>
          </button>
          {savedNotice && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-[8px] bg-[#efeafd] text-[#5c4bb8] text-[10.5px] font-semibold">
              <Check size={11} />
              {savedNotice}
            </span>
          )}
        </div>
        <span className="text-[10px] text-[#6a7682] font-bold uppercase tracking-[0.09em] text-center">
          Workspace
        </span>
      </div>
    </div>
  );
};
