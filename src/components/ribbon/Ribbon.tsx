import React, { useState } from 'react';
import { usePublisher } from '../../context/PublisherContext';
import { QuickAccessToolbar } from './QuickAccessToolbar';
import { HomeTab } from './HomeTab';
import { InsertTab } from './InsertTab';
import { PageDesignTab } from './PageDesignTab';
import { MailingsTab } from './MailingsTab';
import { ViewTab } from './ViewTab';
import { ChevronUp, ChevronDown } from 'lucide-react';

export const Ribbon: React.FC = () => {
  const { activeTab, setActiveTab } = usePublisher();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const tabs = [
    { id: 'home', label: 'Home' },
    { id: 'insert', label: 'Insert' },
    { id: 'page-design', label: 'Page Design' },
    { id: 'mailings', label: 'Mailings' },
    { id: 'view', label: 'View' },
  ] as const;

  return (
    <div className="w-full bg-white border-b border-slate-200/90 flex flex-col select-none flex-shrink-0 z-30 shadow-xs">
      {/* Topmost Titlebar & Search */}
      <QuickAccessToolbar />

      {/* Modern Segmented Navigation Bar */}
      <div className="flex items-center justify-between px-3 py-1 bg-slate-50/90 border-b border-slate-200/70">
        <div className="flex items-center gap-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (isCollapsed) setIsCollapsed(false);
                }}
                className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
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
          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-md transition"
          title={isCollapsed ? 'Expand Ribbon' : 'Collapse Ribbon'}
        >
          {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>
      </div>

      {/* Ribbon Command Strip Contents */}
      {!isCollapsed && (
        <div className="bg-white min-h-[96px] flex items-center px-1 overflow-x-auto transition-all animate-in slide-in-from-top-1 duration-150">
          {activeTab === 'home' && <HomeTab />}
          {activeTab === 'insert' && <InsertTab />}
          {activeTab === 'page-design' && <PageDesignTab />}
          {activeTab === 'mailings' && <MailingsTab />}
          {activeTab === 'view' && <ViewTab />}
        </div>
      )}
    </div>
  );
};
