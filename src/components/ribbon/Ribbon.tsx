import React from 'react';
import { usePublisher } from '../../context/PublisherContext';
import { QuickAccessToolbar } from './QuickAccessToolbar';
import { HomeTab } from './HomeTab';
import { InsertTab } from './InsertTab';
import { PageDesignTab } from './PageDesignTab';
import { MailingsTab } from './MailingsTab';
import { ViewTab } from './ViewTab';

export const Ribbon: React.FC = () => {
  const { activeTab, setActiveTab } = usePublisher();

  const tabs = [
    { id: 'home', label: 'HOME' },
    { id: 'insert', label: 'INSERT' },
    { id: 'page-design', label: 'PAGE DESIGN' },
    { id: 'mailings', label: 'MAILINGS' },
    { id: 'view', label: 'VIEW' },
  ] as const;

  return (
    <div className="w-full bg-[#f3f4f6] border-b border-slate-300 flex flex-col select-none flex-shrink-0 z-30 shadow-sm">
      {/* Topmost Titlebar & Quick Access Toolbar */}
      <QuickAccessToolbar />

      {/* Ribbon Tab Headers Strip */}
      <div className="flex items-center px-2 bg-[#f3f4f6] border-b border-slate-200">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold tracking-wide transition relative ${
                isActive
                  ? 'text-[#0f6b4e] bg-white border-t-2 border-[#0f6b4e]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              {tab.label}
              {isActive && (
                <div className="absolute -bottom-[1px] left-0 right-0 h-[1px] bg-white z-10" />
              )}
            </button>
          );
        })}
      </div>

      {/* Ribbon Command Strip Contents */}
      <div className="bg-white min-h-[96px] flex items-center">
        {activeTab === 'home' && <HomeTab />}
        {activeTab === 'insert' && <InsertTab />}
        {activeTab === 'page-design' && <PageDesignTab />}
        {activeTab === 'mailings' && <MailingsTab />}
        {activeTab === 'view' && <ViewTab />}
      </div>
    </div>
  );
};
