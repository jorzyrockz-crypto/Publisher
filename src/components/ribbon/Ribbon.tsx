import React, { useEffect, useState } from 'react';
import { usePublisher } from '../../context/PublisherContext';
import { QuickAccessToolbar } from './QuickAccessToolbar';
import { HomeTab } from './HomeTab';
import { InsertTab } from './InsertTab';
import { PageDesignTab } from './PageDesignTab';
import { MailingsTab } from './MailingsTab';
import { ViewTab } from './ViewTab';
import { SettingsTab } from './SettingsTab';
import { ChevronUp, ChevronDown } from 'lucide-react';

export const Ribbon: React.FC = () => {
  const { activeTab, setActiveTab } = usePublisher();
  // Compact laptops (< 820px tall) start with the ribbon folded so the artboard
  // keeps its full height; Ctrl+F1 or the chevron toggles it back.
  const [isCollapsed, setIsCollapsed] = useState(() =>
    typeof window !== 'undefined' ? window.innerHeight < 820 : false
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'F1') {
        e.preventDefault();
        setIsCollapsed((v) => !v);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const tabs = [
    { id: 'home', label: 'Home' },
    { id: 'insert', label: 'Insert' },
    { id: 'page-design', label: 'Page Design' },
    { id: 'mailings', label: 'Mailings' },
    { id: 'view', label: 'View' },
    { id: 'settings', label: 'Settings' },
  ] as const;

  return (
    <div className="w-full bg-white border-b border-[#e5e9ee] flex flex-col select-none flex-shrink-0 z-30">
      {/* Topmost Titlebar & Search */}
      <QuickAccessToolbar />

      {/* Calm Tab Strip */}
      <div
        className="flex items-center justify-between px-3 py-1 bg-white border-b border-[#e5e9ee]"
        data-ribbon-tabs="true"
      >
        <div className="flex items-center gap-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (isActive) {
                    // Clicking the active tab folds/unfolds the ribbon (Office behaviour)
                    setIsCollapsed((v) => !v);
                    return;
                  }
                  setActiveTab(tab.id);
                  if (isCollapsed) setIsCollapsed(false);
                }}
                onDoubleClick={() => setIsCollapsed((v) => !v)}
                title={`${tab.label} — click again or Ctrl+F1 to fold the ribbon`}
                className={`px-3 py-1 rounded-[8px] text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#efeafd] text-[#5c4bb8]'
                    : 'text-[#4a5661] hover:text-[#161a22] hover:bg-[#f4f2ff]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Ribbon Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`flex items-center gap-1 rounded-[6px] transition cursor-pointer text-[#5b6673] hover:text-[#5c4bb8] hover:bg-[#f4f2ff] ${
            isCollapsed ? 'px-2 py-1 border border-[#e5e9ee] bg-[#f8fafb]' : 'p-1'
          }`}
          title={`${isCollapsed ? 'Expand' : 'Collapse'} ribbon (Ctrl+F1)`}
        >
          {isCollapsed && (
            <span className="text-[10px] font-semibold whitespace-nowrap">Show tools</span>
          )}
          {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>
      </div>

      {/* Ribbon Command Strip Contents */}
      {!isCollapsed && (
        <div className="bg-white min-h-[80px] flex items-center px-2 overflow-x-auto transition-all animate-in slide-in-from-top-1 duration-150">
          {activeTab === 'home' && <HomeTab />}
          {activeTab === 'insert' && <InsertTab />}
          {activeTab === 'page-design' && <PageDesignTab />}
          {activeTab === 'mailings' && <MailingsTab />}
          {activeTab === 'view' && <ViewTab />}
          {activeTab === 'settings' && <SettingsTab />}
        </div>
      )}
    </div>
  );
};
