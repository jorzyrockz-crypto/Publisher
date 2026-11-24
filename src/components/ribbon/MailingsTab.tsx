import React from 'react';
import { usePublisher } from '../../context/PublisherContext';
import { Mail, Users, FileSpreadsheet, Play, CheckCircle2 } from 'lucide-react';

export const MailingsTab: React.FC = () => {
  const { setIsMailMergeOpen, addTextBox } = usePublisher();

  return (
    <div className="flex items-center h-24 px-2 py-1 gap-2 text-xs text-slate-700 overflow-x-auto select-none">
      {/* 1. Start Mail Merge */}
      <div className="flex flex-col justify-between h-full px-2 border-r border-slate-300 flex-shrink-0">
        <div className="flex items-center gap-1.5 my-auto">
          <button
            onClick={() => setIsMailMergeOpen(true)}
            className="flex flex-col items-center p-1.5 hover:bg-slate-200 rounded transition group"
            title="Step-by-Step Mail Merge Wizard"
          >
            <div className="w-8 h-8 rounded bg-emerald-50 border border-[#0f6b4e] flex items-center justify-center group-hover:bg-[#0f6b4e] group-hover:text-white transition text-[#0f6b4e]">
              <Mail size={18} />
            </div>
            <span className="text-[10px] mt-0.5 font-medium">Mail Merge</span>
          </button>
        </div>
        <span className="text-[10px] text-slate-400 font-medium text-center">Start Mail Merge</span>
      </div>

      {/* 2. Insert Merge Fields */}
      <div className="flex flex-col justify-between h-full px-2 border-r border-slate-300 flex-shrink-0">
        <div className="space-y-1 my-auto">
          <div className="flex items-center gap-1">
            <button
              onClick={() =>
                addTextBox({
                  text: 'Dear {{FirstName}} {{LastName}},',
                  fontSize: 16,
                  fontWeight: 'bold',
                })
              }
              className="px-2 py-0.5 rounded border border-slate-300 hover:bg-slate-100 text-[11px]"
            >
              + {'{{Name}}'}
            </button>
            <button
              onClick={() =>
                addTextBox({
                  text: '{{Company}}\n{{Address}}',
                  fontSize: 14,
                })
              }
              className="px-2 py-0.5 rounded border border-slate-300 hover:bg-slate-100 text-[11px]"
            >
              + {'{{Company}}'}
            </button>
          </div>
          <button
            onClick={() => setIsMailMergeOpen(true)}
            className="w-full text-left px-2 py-0.5 rounded border border-slate-300 hover:bg-slate-100 text-[11px] text-emerald-800 font-medium"
          >
            Manage Recipients List...
          </button>
        </div>
        <span className="text-[10px] text-slate-400 font-medium text-center">Merge Fields</span>
      </div>

      {/* 3. Preview & Finish */}
      <div className="flex flex-col justify-between h-full px-2 flex-shrink-0">
        <div className="flex items-center gap-1.5 my-auto">
          <button
            onClick={() => setIsMailMergeOpen(true)}
            className="flex flex-col items-center p-1.5 hover:bg-slate-200 rounded transition group"
            title="Preview and Generate Merged Publication"
          >
            <div className="w-8 h-8 rounded bg-emerald-50 border border-[#0f6b4e] flex items-center justify-center group-hover:bg-[#0f6b4e] group-hover:text-white transition text-[#0f6b4e]">
              <Play size={18} />
            </div>
            <span className="text-[10px] mt-0.5 font-medium">Merge & Print</span>
          </button>
        </div>
        <span className="text-[10px] text-slate-400 font-medium text-center">Finish</span>
      </div>
    </div>
  );
};
