import React from 'react';
import { usePublisher } from '../../context/PublisherContext';
import { Mail, Play, Plus } from 'lucide-react';

export const MailingsTab: React.FC = () => {
  const { setIsMailMergeOpen, addTextBox } = usePublisher();

  return (
    <div className="flex items-center h-20 px-3 py-1 gap-3 text-xs text-[#202833] overflow-x-auto select-none">
      {/* 1. Start Mail Merge */}
      <div className="flex flex-col justify-between h-full py-1 pr-3 border-r border-[#e5e9ee] flex-shrink-0">
        <div className="flex items-center gap-1 my-auto">
          <button
            onClick={() => setIsMailMergeOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-[#eef5f5] hover:text-[#087477] active:scale-95 rounded-[8px] transition-all text-xs font-medium text-[#202833] cursor-pointer"
            title="Step-by-Step Mail Merge Wizard"
          >
            <Mail size={15} className="text-[#087f83]" />
            <span>Mail Merge</span>
          </button>
        </div>
        <span className="text-[10px] text-[#9aa4ae] font-bold uppercase tracking-[0.09em] text-center">Setup</span>
      </div>

      {/* 2. Insert Merge Fields */}
      <div className="flex flex-col justify-between h-full py-1 px-3 border-r border-[#e5e9ee] flex-shrink-0">
        <div className="space-y-1.5 my-auto">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() =>
                addTextBox({
                  text: 'Dear {{FirstName}} {{LastName}},',
                  fontSize: 16,
                  fontWeight: 'bold',
                })
              }
              className="flex items-center gap-1 px-2.5 py-1 rounded-[8px] border border-[#e5e9ee] bg-[#f8fafb] hover:bg-[#eef5f5] hover:text-[#087477] hover:border-[#b7dddd] text-[11px] font-medium transition cursor-pointer"
            >
              <Plus size={11} className="text-[#087f83]" />
              <span>{'{{Name}}'}</span>
            </button>
            <button
              onClick={() =>
                addTextBox({
                  text: '{{Company}}\n{{Address}}',
                  fontSize: 14,
                })
              }
              className="flex items-center gap-1 px-2.5 py-1 rounded-[8px] border border-[#e5e9ee] bg-[#f8fafb] hover:bg-[#eef5f5] hover:text-[#087477] hover:border-[#b7dddd] text-[11px] font-medium transition cursor-pointer"
            >
              <Plus size={11} className="text-[#087f83]" />
              <span>{'{{Company}}'}</span>
            </button>
          </div>
          <button
            onClick={() => setIsMailMergeOpen(true)}
            className="w-full text-center px-2 py-0.5 rounded-[6px] border border-[#b7dddd] bg-[#e5f4f3] hover:bg-[#d5ecea] text-[11px] text-[#087477] font-semibold transition cursor-pointer"
          >
            Manage Recipients...
          </button>
        </div>
        <span className="text-[10px] text-[#9aa4ae] font-bold uppercase tracking-[0.09em] text-center">Tokens</span>
      </div>

      {/* 3. Preview & Finish */}
      <div className="flex flex-col justify-between h-full py-1 px-3 flex-shrink-0">
        <div className="flex items-center gap-1 my-auto">
          <button
            onClick={() => setIsMailMergeOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#087f83] hover:bg-[#06696c] active:scale-95 text-white rounded-[8px] font-semibold text-xs transition cursor-pointer"
            title="Preview and Generate Merged Publication"
          >
            <Play size={14} />
            <span>Run Merge</span>
          </button>
        </div>
        <span className="text-[10px] text-[#9aa4ae] font-bold uppercase tracking-[0.09em] text-center">Execute</span>
      </div>
    </div>
  );
};
