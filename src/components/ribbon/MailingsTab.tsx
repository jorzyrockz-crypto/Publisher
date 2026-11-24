import React from 'react';
import { usePublisher } from '../../context/PublisherContext';
import { Mail, Play, Plus } from 'lucide-react';

export const MailingsTab: React.FC = () => {
  const { setIsMailMergeOpen, addTextBox } = usePublisher();

  return (
    <div className="flex items-center h-24 px-3 py-1 gap-3 text-xs text-slate-700 overflow-x-auto select-none">
      {/* 1. Start Mail Merge */}
      <div className="flex flex-col justify-between h-full py-1 pr-3 border-r border-slate-200 flex-shrink-0">
        <div className="flex items-center gap-1.5 my-auto">
          <button
            onClick={() => setIsMailMergeOpen(true)}
            className="flex flex-col items-center p-1.5 hover:bg-slate-100 active:scale-95 rounded-xl transition-all group"
            title="Step-by-Step Mail Merge Wizard"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-xs">
              <Mail size={16} />
            </div>
            <span className="text-[10px] font-medium mt-1 text-slate-600">Mail Merge</span>
          </button>
        </div>
        <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider text-center">Setup</span>
      </div>

      {/* 2. Insert Merge Fields */}
      <div className="flex flex-col justify-between h-full py-1 px-3 border-r border-slate-200 flex-shrink-0">
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
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-medium transition shadow-2xs"
            >
              <Plus size={11} className="text-emerald-700" />
              <span>{'{{Name}}'}</span>
            </button>
            <button
              onClick={() =>
                addTextBox({
                  text: '{{Company}}\n{{Address}}',
                  fontSize: 14,
                })
              }
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-medium transition shadow-2xs"
            >
              <Plus size={11} className="text-emerald-700" />
              <span>{'{{Company}}'}</span>
            </button>
          </div>
          <button
            onClick={() => setIsMailMergeOpen(true)}
            className="w-full text-center px-2 py-0.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-[11px] text-emerald-800 font-semibold transition"
          >
            Manage Recipients...
          </button>
        </div>
        <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider text-center">Tokens</span>
      </div>

      {/* 3. Preview & Finish */}
      <div className="flex flex-col justify-between h-full py-1 px-3 flex-shrink-0">
        <div className="flex items-center gap-1.5 my-auto">
          <button
            onClick={() => setIsMailMergeOpen(true)}
            className="flex flex-col items-center p-1.5 hover:bg-slate-100 active:scale-95 rounded-xl transition-all group"
            title="Preview and Generate Merged Publication"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-xs">
              <Play size={16} />
            </div>
            <span className="text-[10px] font-medium mt-1 text-slate-600">Run Merge</span>
          </button>
        </div>
        <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider text-center">Execute</span>
      </div>
    </div>
  );
};
