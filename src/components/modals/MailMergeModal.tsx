import React, { useState } from 'react';
import { usePublisher } from '../../context/PublisherContext';
import { Page, TextElement } from '../../types/publisher';
import confetti from 'canvas-confetti';
import {
  X,
  Mail,
  UserPlus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Play,
  Users,
} from 'lucide-react';

interface Recipient {
  id: string;
  firstName: string;
  lastName: string;
  company: string;
  email: string;
  address: string;
}

export const MailMergeModal: React.FC = () => {
  const {
    project,
    activePage,
    isMailMergeOpen,
    setIsMailMergeOpen,
    setProject,
  } = usePublisher();

  const [recipients, setRecipients] = useState<Recipient[]>([
    {
      id: '1',
      firstName: 'Sophia',
      lastName: 'Chen',
      company: 'Quantum Dynamics',
      email: 's.chen@quantum.com',
      address: '742 Evergreen Terrace, Springfield',
    },
    {
      id: '2',
      firstName: 'Liam',
      lastName: 'O’Connor',
      company: 'Starlight Capital',
      email: 'liam@starlight.io',
      address: '100 Market St, San Francisco, CA',
    },
    {
      id: '3',
      firstName: 'Amara',
      lastName: 'Adeyemi',
      company: 'Horizon Health',
      email: 'amara@horizonhealth.org',
      address: '450 Innovation Way, Boston, MA',
    },
  ]);

  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newAddress, setNewAddress] = useState('');

  const [previewIndex, setPreviewIndex] = useState(0);

  if (!isMailMergeOpen) return null;

  const handleAddRecipient = () => {
    if (!newFirstName.trim()) return;
    const item: Recipient = {
      id: String(Date.now()),
      firstName: newFirstName.trim(),
      lastName: newLastName.trim(),
      company: newCompany.trim() || 'Enterprise Partner',
      email: `${newFirstName.toLowerCase()}@example.com`,
      address: newAddress.trim() || '123 Business Blvd',
    };
    setRecipients([...recipients, item]);
    setNewFirstName('');
    setNewLastName('');
    setNewCompany('');
    setNewAddress('');
  };

  const handleRemoveRecipient = (id: string) => {
    setRecipients(recipients.filter((r) => r.id !== id));
  };

  const replaceTokens = (text: string, recipient: Recipient) => {
    return text
      .replace(/{{FirstName}}/gi, recipient.firstName)
      .replace(/{{LastName}}/gi, recipient.lastName)
      .replace(/{{RecipientName}}/gi, `${recipient.firstName} ${recipient.lastName}`)
      .replace(/{{Name}}/gi, `${recipient.firstName} ${recipient.lastName}`)
      .replace(/{{Company}}/gi, recipient.company)
      .replace(/{{Email}}/gi, recipient.email)
      .replace(/{{Address}}/gi, recipient.address);
  };

  const handleExecuteMerge = () => {
    if (recipients.length === 0) return;

    const mergedPages: Page[] = recipients.map((rec, idx) => {
      const clonedPage: Page = JSON.parse(JSON.stringify(activePage));
      clonedPage.id = `page-merged-${Date.now()}-${idx}`;
      clonedPage.name = `${rec.firstName} ${rec.lastName}`;

      clonedPage.elements = clonedPage.elements.map((el) => {
        if (el.type === 'text') {
          return {
            ...el,
            text: replaceTokens((el as TextElement).text, rec),
          };
        }
        return el;
      });

      return clonedPage;
    });

    setProject({
      ...project,
      pages: mergedPages,
      activePageIndex: 0,
    });

    setIsMailMergeOpen(false);
    confetti({ particleCount: 75, spread: 80, origin: { y: 0.5 } });
  };

  const currentPreviewRecipient = recipients[previewIndex] || recipients[0];

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center select-none p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#064e3b] to-[#047857] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-sm">
            <Mail size={18} />
            <span>Mail Merge Studio</span>
          </div>
          <button
            onClick={() => setIsMailMergeOpen(false)}
            className="p-1 hover:bg-white/20 rounded-full transition text-white/80 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
          {/* Explanation Banner */}
          <div className="bg-indigo-50 border border-indigo-200/80 rounded-2xl p-4 text-indigo-950 leading-relaxed shadow-2xs">
            <span className="font-bold text-indigo-800">Mail Merge Workflow:</span> Place tokens like{' '}
            <code className="bg-white px-1.5 py-0.5 rounded-md border border-indigo-300 font-mono text-[11px] font-semibold text-indigo-900 shadow-2xs">
              {'{{FirstName}}'}
            </code>
            ,{' '}
            <code className="bg-white px-1.5 py-0.5 rounded-md border border-indigo-300 font-mono text-[11px] font-semibold text-indigo-900 shadow-2xs">
              {'{{Company}}'}
            </code>{' '}
            or{' '}
            <code className="bg-white px-1.5 py-0.5 rounded-md border border-indigo-300 font-mono text-[11px] font-semibold text-indigo-900 shadow-2xs">
              {'{{Address}}'}
            </code>{' '}
            into any text box. Running the merge will generate individual personalized pages for every
            recipient in your database.
          </div>

          {/* Recipients List Table */}
          <div>
            <div className="flex justify-between items-center mb-2.5 font-bold text-slate-800 text-sm">
              <span className="flex items-center gap-1.5">
                <Users size={15} className="text-indigo-700" />
                <span>Recipient Records ({recipients.length})</span>
              </span>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <tr>
                    <th className="p-2.5">First Name</th>
                    <th className="p-2.5">Last Name</th>
                    <th className="p-2.5">Company</th>
                    <th className="p-2.5">Address</th>
                    <th className="p-2.5 w-12 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {recipients.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-2.5 font-semibold text-slate-800">{rec.firstName}</td>
                      <td className="p-2.5">{rec.lastName}</td>
                      <td className="p-2.5 text-slate-600">{rec.company}</td>
                      <td className="p-2.5 truncate max-w-[160px] text-slate-400">{rec.address}</td>
                      <td className="p-2.5 text-center">
                        <button
                          onClick={() => handleRemoveRecipient(rec.id)}
                          className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition"
                          title="Remove recipient"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add Recipient Form */}
          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 space-y-2.5 shadow-2xs">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <UserPlus size={14} className="text-indigo-700" />
              <span>Add Recipient</span>
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <input
                type="text"
                placeholder="First Name"
                value={newFirstName}
                onChange={(e) => setNewFirstName(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium"
              />
              <input
                type="text"
                placeholder="Last Name"
                value={newLastName}
                onChange={(e) => setNewLastName(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium"
              />
              <input
                type="text"
                placeholder="Company"
                value={newCompany}
                onChange={(e) => setNewCompany(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium"
              />
              <input
                type="text"
                placeholder="Address"
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium"
              />
            </div>
            <button
              onClick={handleAddRecipient}
              className="mt-1 px-3.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-xl font-semibold text-xs transition shadow-2xs"
            >
              + Add to Database
            </button>
          </div>

          {/* Record Navigator */}
          {recipients.length > 0 && (
            <div className="flex items-center justify-between border-t border-slate-100 pt-3.5">
              <span className="text-slate-600 font-medium">
                Live Preview: <strong>{currentPreviewRecipient.firstName} {currentPreviewRecipient.lastName}</strong> ({currentPreviewRecipient.company})
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={previewIndex <= 0}
                  onClick={() => setPreviewIndex((i) => Math.max(0, i - 1))}
                  className="p-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 shadow-2xs"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="font-mono text-xs px-2 font-bold text-slate-700">
                  {previewIndex + 1} / {recipients.length}
                </span>
                <button
                  disabled={previewIndex >= recipients.length - 1}
                  onClick={() => setPreviewIndex((i) => Math.min(recipients.length - 1, i + 1))}
                  className="p-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 shadow-2xs"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-between items-center">
          <span className="text-xs text-slate-500 font-medium">
            Will generate {recipients.length} individual publication pages
          </span>
          <div className="flex gap-2.5">
            <button
              onClick={() => setIsMailMergeOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleExecuteMerge}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5"
            >
              <Play size={13} />
              <span>Execute Mail Merge</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
