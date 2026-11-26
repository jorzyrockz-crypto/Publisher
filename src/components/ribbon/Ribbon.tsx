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
    <div className="w-full bg-white border-b border-[#e5e9ee] flex flex-col select-none flex-shrink-0 z-30">
      {/* Topmost Titlebar & Search */}
      <QuickAccessToolbar />

      {/* Calm Tab Strip */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-white border-b border-[#e5e9ee]">
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
                className={`px-3 py-1 rounded-[8px] text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#e5f4f3] text-[#087477]'
                    : 'text-[#52606c] hover:text-[#202833] hover:bg-[#eef5f5]'
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
          className="p-1 text-[#778391] hover:text-[#087477] hover:bg-[#eef5f5] rounded-[6px] transition cursor-pointer"
          title={isCollapsed ? 'Expand Ribbon' : 'Collapse Ribbon'}
        >
          {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>
      </div>

      {/* Ribbon Command Strip Contents */}
      {!isCollapsed && (
        <div className="bg-white min-h-[84px] flex items-center px-2 overflow-x-auto transition-all animate-in slide-in-from-top-1 duration-150">
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
