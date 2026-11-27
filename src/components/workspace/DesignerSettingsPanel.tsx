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

export const DesignerSettingsPanel: React.FC = () => {
  const {
    workspaceMode,
    setWorkspaceMode,
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
    window.setTimeout(() => setSavedNotice(null), 2200);
  };

  const handleSaveKeys = () => {
    saveClipartFreeKey(cfKey.trim());
    savePollinationsKey(pollinationsKey.trim());
    try {
      if (geminiKey.trim()) {
        localStorage.setItem('studiopress_gemini_api_key', geminiKey.trim());
      } else {
        localStorage.removeItem('studiopress_gemini_api_key');
      }
    } catch {
      // ignore
    }
    flashNotice('API keys saved locally');
  };

  const handleResetLayout = () => {
    try {
      localStorage.removeItem('studiopress_panel_width_left');
      localStorage.removeItem('studiopress_panel_width_right');
    } catch {
      // ignore
    }
    setIsLeftPanelOpen(true);
    setIsRightPanelOpen(false);
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

  const toggleBtn = (active: boolean) =>
    `min-h-[38px] flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-[10px] border text-xs font-medium transition cursor-pointer touch-manipulation active:scale-95 ${
      active
        ? 'bg-[#efeafd] border-[#d3c9f9] text-[#5c4bb8]'
        : 'bg-[#f8fafb] border-[#e5e9ee] text-[#4a5661] hover:bg-[#f4f2ff]'
    }`;

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-4 touch-manipulation">
      {savedNotice && (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] bg-[#efeafd] text-[#5c4bb8] text-[11px] font-semibold">
          <Check size={12} />
          <span>{savedNotice}</span>
        </div>
      )}

      {/* 1. Appearance & Workspace Mode */}
      <div className="space-y-2">
        <p className="text-[11px] font-semibold text-[#4a5661]">Appearance &amp; Mode</p>
        <div className="grid grid-cols-2 gap-1.5 bg-[#f3f5f7] p-1 rounded-[9px] border border-[#e5e9ee]">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`flex items-center justify-center gap-1 py-1.5 rounded-[7px] text-[11px] font-semibold transition cursor-pointer ${
              theme === 'light'
                ? 'bg-white text-[#5c4bb8] shadow-2xs'
                : 'text-[#4a5661] hover:text-[#161a22]'
            }`}
          >
            <Sun size={12} />
            <span>Light</span>
          </button>
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`flex items-center justify-center gap-1 py-1.5 rounded-[7px] text-[11px] font-semibold transition cursor-pointer ${
              theme === 'dark'
                ? 'bg-white text-[#5c4bb8] shadow-2xs'
                : 'text-[#4a5661] hover:text-[#161a22]'
            }`}
          >
            <Moon size={12} />
            <span>Dark</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-1.5 bg-[#f3f5f7] p-1 rounded-[9px] border border-[#e5e9ee]">
          <button
            type="button"
            onClick={() => setWorkspaceMode('publisher')}
            className={`py-1.5 rounded-[7px] text-[11px] font-semibold transition cursor-pointer ${
              workspaceMode === 'publisher'
                ? 'bg-white text-[#5c4bb8] shadow-2xs'
                : 'text-[#4a5661] hover:text-[#161a22]'
            }`}
          >
            Publisher
          </button>
          <button
            type="button"
            onClick={() => setWorkspaceMode('designer')}
            className={`py-1.5 rounded-[7px] text-[11px] font-semibold transition cursor-pointer ${
              workspaceMode === 'designer'
                ? 'bg-white text-[#5c4bb8] shadow-2xs'
                : 'text-[#4a5661] hover:text-[#161a22]'
            }`}
          >
            Designer
          </button>
        </div>
      </div>

      {/* 2. Canvas Defaults */}
      <div className="space-y-2">
        <p className="text-[11px] font-semibold text-[#4a5661]">Canvas Defaults</p>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => setRulerVisible(!rulerVisible)}
            className={toggleBtn(rulerVisible)}
          >
            <Ruler size={12} />
            <span>Rulers</span>
          </button>
          <button
            type="button"
            onClick={() => setGuidesVisible(!guidesVisible)}
            className={toggleBtn(guidesVisible)}
          >
            <span>Guides</span>
          </button>
          <button
            type="button"
            onClick={() => setGridVisible(!gridVisible)}
            className={toggleBtn(gridVisible)}
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
            className={toggleBtn(snapToGuides || snapToGrid)}
          >
            <Magnet size={12} />
            <span>Snap</span>
          </button>
        </div>
      </div>

      {/* 3. Local API Keys */}
      <div className="space-y-2">
        <p className="text-[11px] font-semibold text-[#4a5661] flex items-center gap-1">
          <KeyRound size={12} className="text-[#6e56cf]" />
          <span>API Keys (Local)</span>
        </p>
        <div className="space-y-1.5">
          <input
            type="password"
            value={cfKey}
            onChange={(e) => setCfKey(e.target.value)}
            placeholder="Clipart.Free Key (cf_...)"
            className="w-full h-7 px-2.5 rounded-[8px] border border-[#e5e9ee] bg-[#f8fafb] text-[11px] text-[#161a22] outline-none focus:border-[#6e56cf]"
          />
          <input
            type="password"
            value={geminiKey}
            onChange={(e) => setGeminiKey(e.target.value)}
            placeholder="Gemini API Key"
            className="w-full h-7 px-2.5 rounded-[8px] border border-[#e5e9ee] bg-[#f8fafb] text-[11px] text-[#161a22] outline-none focus:border-[#6e56cf]"
          />
          <input
            type="password"
            value={pollinationsKey}
            onChange={(e) => setPollinationsKey(e.target.value)}
            placeholder="Pollinations API Key"
            className="w-full h-7 px-2.5 rounded-[8px] border border-[#e5e9ee] bg-[#f8fafb] text-[11px] text-[#161a22] outline-none focus:border-[#6e56cf]"
          />
          <button
            type="button"
            onClick={handleSaveKeys}
            className="w-full py-1.5 rounded-[8px] bg-[#6e56cf] hover:bg-[#5c4bb8] text-white text-[11px] font-semibold transition cursor-pointer"
          >
            Save API Keys
          </button>
        </div>
      </div>

      {/* 4. Workspace Actions */}
      <div className="space-y-1.5 pt-2 border-t border-[#e5e9ee]">
        <p className="text-[11px] font-semibold text-[#4a5661]">Workspace</p>
        <button
          type="button"
          onClick={handleResetLayout}
          className="w-full flex items-center gap-2 px-3 py-1.5 rounded-[8px] border border-[#e5e9ee] bg-[#f8fafb] hover:bg-[#f4f2ff] hover:text-[#5c4bb8] text-[11px] font-medium transition cursor-pointer"
        >
          <RotateCcw size={12} />
          <span>Reset Panels</span>
        </button>
        <button
          type="button"
          onClick={handleReplaySplash}
          className="w-full flex items-center gap-2 px-3 py-1.5 rounded-[8px] border border-[#e5e9ee] bg-[#f8fafb] hover:bg-[#f4f2ff] hover:text-[#5c4bb8] text-[11px] font-medium transition cursor-pointer"
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
          className="w-full flex items-center gap-2 px-3 py-1.5 rounded-[8px] border border-[#f2cfd3] bg-[#fff5f6] hover:bg-[#ffe4e7] text-[#b42318] text-[11px] font-medium transition cursor-pointer"
        >
          <Trash2 size={12} />
          <span>Reset App</span>
        </button>
      </div>
    </div>
  );
};
