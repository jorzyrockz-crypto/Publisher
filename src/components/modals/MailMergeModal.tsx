import React, { useState } from 'react';
import { usePublisher } from '../../context/PublisherContext';
import { Page, PublisherElement, TextElement } from '../../types/publisher';
import confetti from 'canvas-confetti';
import {
  X,
  Mail,
  UserPlus,
  Trash2,
  CheckCircle2,
  FileCheck,
  ChevronLeft,
  ChevronRight,
  Play,
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
    setActivePageIndex,
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

  // Replace tokens in elements
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

    // Create a personalized copy of the active page for each recipient
    const mergedPages: Page[] = recipients.map((rec, idx) => {
      const clonedPage: Page = JSON.parse(JSON.stringify(activePage));
      clonedPage.id = `page-merged-${Date.now()}-${idx}`;
      clonedPage.name = `${rec.firstName} ${rec.lastName}`;

      clonedPage.elements = clonedPage.elements.map((el) => {
        if (el.type === 'text') {
          return {
            ...el,
            text: replaceTokens(el.text, rec),
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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center select-none p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-300 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#0f6b4e] text-white px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-sm">
            <Mail size={18} />
            <span>Mail Merge Wizard</span>
          </div>
          <button
            onClick={() => setIsMailMergeOpen(false)}
            className="text-white/80 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-6 text-xs text-slate-700">
          {/* Explanation */}
          <div className="bg-emerald-50 border border-emerald-200 rounded p-3 text-emerald-900 leading-relaxed">
            <span className="font-bold">How Mail Merge works:</span> Insert placeholder tags like{' '}
            <code className="bg-white px-1 py-0.5 rounded border border-emerald-300 font-mono text-[11px]">
              {'{{FirstName}}'}
            </code>
            ,{' '}
            <code className="bg-white px-1 py-0.5 rounded border border-emerald-300 font-mono text-[11px]">
              {'{{LastName}}'}
            </code>
            ,{' '}
            <code className="bg-white px-1 py-0.5 rounded border border-emerald-300 font-mono text-[11px]">
              {'{{Company}}'}
            </code>
            , or{' '}
            <code className="bg-white px-1 py-0.5 rounded border border-emerald-300 font-mono text-[11px]">
              {'{{Address}}'}
            </code>{' '}
            into any text frame on your canvas. Clicking "Execute Mail Merge" will create a
            personalized copy of your publication for every recipient!
          </div>

          {/* Recipients List Table */}
          <div>
            <div className="flex justify-between items-center mb-2 font-semibold text-slate-800 text-sm">
              <span>Recipients Database ({recipients.length})</span>
            </div>

            <div className="border border-slate-300 rounded overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 border-b border-slate-300 text-slate-600 font-semibold">
                  <tr>
                    <th className="p-2">First Name</th>
                    <th className="p-2">Last Name</th>
                    <th className="p-2">Company</th>
                    <th className="p-2">Address</th>
                    <th className="p-2 w-10 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {recipients.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50">
                      <td className="p-2 font-medium">{rec.firstName}</td>
                      <td className="p-2">{rec.lastName}</td>
                      <td className="p-2">{rec.company}</td>
                      <td className="p-2 truncate max-w-[160px] text-slate-500">{rec.address}</td>
                      <td className="p-2 text-center">
                        <button
                          onClick={() => handleRemoveRecipient(rec.id)}
                          className="text-red-500 hover:text-red-700"
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

          {/* Add New Recipient Form */}
          <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-2">
            <span className="font-semibold text-slate-700 flex items-center gap-1">
              <UserPlus size={13} className="text-[#0f6b4e]" />
              Add Recipient
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <input
                type="text"
                placeholder="First Name"
                value={newFirstName}
                onChange={(e) => setNewFirstName(e.target.value)}
                className="bg-white border border-slate-300 rounded px-2 py-1 text-xs outline-none focus:border-[#0f6b4e]"
              />
              <input
                type="text"
                placeholder="Last Name"
                value={newLastName}
                onChange={(e) => setNewLastName(e.target.value)}
                className="bg-white border border-slate-300 rounded px-2 py-1 text-xs outline-none focus:border-[#0f6b4e]"
              />
              <input
                type="text"
                placeholder="Company"
                value={newCompany}
                onChange={(e) => setNewCompany(e.target.value)}
                className="bg-white border border-slate-300 rounded px-2 py-1 text-xs outline-none focus:border-[#0f6b4e]"
              />
              <input
                type="text"
                placeholder="Address"
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                className="bg-white border border-slate-300 rounded px-2 py-1 text-xs outline-none focus:border-[#0f6b4e]"
              />
            </div>
            <button
              onClick={handleAddRecipient}
              className="mt-1 px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded font-medium text-xs transition"
            >
              + Add to List
            </button>
          </div>

          {/* Preview Record Navigator */}
          {recipients.length > 0 && (
            <div className="flex items-center justify-between border-t border-slate-200 pt-3">
              <span className="text-slate-600">
                Previewing Record: <strong>{currentPreviewRecipient.firstName} {currentPreviewRecipient.lastName}</strong> ({currentPreviewRecipient.company})
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={previewIndex <= 0}
                  onClick={() => setPreviewIndex((i) => Math.max(0, i - 1))}
                  className="p-1 rounded border border-slate-300 disabled:opacity-40 hover:bg-slate-100"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="font-mono text-xs px-2">
                  {previewIndex + 1} / {recipients.length}
                </span>
                <button
                  disabled={previewIndex >= recipients.length - 1}
                  onClick={() => setPreviewIndex((i) => Math.min(recipients.length - 1, i + 1))}
                  className="p-1 rounded border border-slate-300 disabled:opacity-40 hover:bg-slate-100"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-5 py-3 border-t border-slate-200 flex justify-between items-center">
          <span className="text-xs text-slate-500">
            Will generate {recipients.length} personalized pages
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setIsMailMergeOpen(false)}
              className="px-4 py-1.5 rounded border border-slate-300 text-xs text-slate-700 hover:bg-slate-200 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleExecuteMerge}
              className="px-5 py-1.5 rounded bg-[#0f6b4e] hover:bg-[#0c533c] text-white text-xs font-semibold transition shadow-sm flex items-center gap-1.5"
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
