import React from 'react';
import { usePublisher } from '../../context/PublisherContext';
import { CollageActionBar } from './CollageActionBar';
import { useCollageSelection } from '../../hooks/useCollageSelection';
import {
  AlignHorizontalJustifyStart,
  AlignHorizontalJustifyCenter,
  AlignHorizontalJustifyEnd,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  BringToFront,
  SendToBack,
  ChevronUp,
  ChevronDown,
  Copy,
  Lock,
  LockOpen,
  Group,
  Ungroup,
  Trash2,
} from 'lucide-react';

interface ToolButtonProps {
  label: string;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}

const ToolButton: React.FC<ToolButtonProps> = ({ label, onClick, active, danger, children }) => (
  <button
    type="button"
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    title={label}
    aria-label={label}
    className={`p-1.5 rounded-[7px] transition-colors cursor-pointer ${
      danger
        ? 'text-[#b4364a] hover:bg-[#fdeef0]'
        : active
          ? 'bg-[#efeafd] text-[#5c4bb8]'
          : 'text-[#4a5661] hover:bg-[#f4f2ff] hover:text-[#5c4bb8]'
    }`}
  >
    {children}
  </button>
);

const Divider: React.FC = () => <div className="w-[1px] h-4 bg-[#e5e9ee] mx-1" />;

/**
 * Contextual selection pill — sits at the bottom-centre of the canvas so the
 * most common object operations (align, z-order, duplicate, lock, delete) never
 * require a trip to the right-hand inspector.
 */
export const SelectionToolbar: React.FC = () => {
  const {
    selectedElementIds,
    activePage,
    alignSelected,
    distributeSelected,
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
    duplicateSelectedElements,
    deleteSelectedElements,
    groupSelected,
    ungroupSelected,
    setElementsLocked,
  } = usePublisher();

  const collageSelection = useCollageSelection();
  const count = selectedElementIds.length;
  if (count === 0) return null;

  // A selected collage gets its own bar: its controls are about the collage, and align /
  // group on something you framed as one object is noise.
  if (collageSelection) return <CollageActionBar />;

  const selected = activePage.elements.filter((el) => selectedElementIds.includes(el.id));
  const allLocked = selected.length > 0 && selected.every((el) => el.locked);
  const canGroup = count >= 2;
  const hasGrouped = selected.some((el) => Boolean(el.groupId));

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
      <div className="flex items-center gap-0.5 px-1.5 py-1 bg-white/95 backdrop-blur border border-[#e5e9ee] rounded-[12px] shadow-[0_8px_28px_rgba(22,26,34,0.14)]">
        <span className="px-2 text-[10px] font-semibold text-[#5b6673] tabular-nums whitespace-nowrap">
          {count === 1 ? '1 object' : `${count} objects`}
        </span>

        {canGroup && (
          <>
            <Divider />
            <ToolButton label="Align left" onClick={() => alignSelected('left')}>
              <AlignHorizontalJustifyStart size={14} />
            </ToolButton>
            <ToolButton label="Align centre" onClick={() => alignSelected('center')}>
              <AlignHorizontalJustifyCenter size={14} />
            </ToolButton>
            <ToolButton label="Align right" onClick={() => alignSelected('right')}>
              <AlignHorizontalJustifyEnd size={14} />
            </ToolButton>
            <ToolButton label="Align top" onClick={() => alignSelected('top')}>
              <AlignVerticalJustifyStart size={14} />
            </ToolButton>
            <ToolButton label="Align middle" onClick={() => alignSelected('middle')}>
              <AlignVerticalJustifyCenter size={14} />
            </ToolButton>
            <ToolButton label="Align bottom" onClick={() => alignSelected('bottom')}>
              <AlignVerticalJustifyEnd size={14} />
            </ToolButton>
            {count >= 3 && (
              <>
                <ToolButton
                  label="Distribute horizontally"
                  onClick={() => distributeSelected('horizontal')}
                >
                  <span className="block w-3.5 h-3.5 relative">
                    <span className="absolute left-0 top-0 bottom-0 w-[1.5px] bg-current rounded" />
                    <span className="absolute right-0 top-0 bottom-0 w-[1.5px] bg-current rounded" />
                    <span className="absolute left-1/2 top-0 bottom-0 w-[1.5px] bg-current rounded opacity-70" />
                  </span>
                </ToolButton>
                <ToolButton
                  label="Distribute vertically"
                  onClick={() => distributeSelected('vertical')}
                >
                  <span className="block w-3.5 h-3.5 relative">
                    <span className="absolute top-0 left-0 right-0 h-[1.5px] bg-current rounded" />
                    <span className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-current rounded" />
                    <span className="absolute top-1/2 left-0 right-0 h-[1.5px] bg-current rounded opacity-70" />
                  </span>
                </ToolButton>
              </>
            )}
          </>
        )}

        <Divider />

        <ToolButton label="Bring to front" onClick={bringToFront}>
          <BringToFront size={14} />
        </ToolButton>
        <ToolButton label="Bring forward" onClick={bringForward}>
          <ChevronUp size={14} />
        </ToolButton>
        <ToolButton label="Send backward" onClick={sendBackward}>
          <ChevronDown size={14} />
        </ToolButton>
        <ToolButton label="Send to back" onClick={sendToBack}>
          <SendToBack size={14} />
        </ToolButton>

        <Divider />

        {hasGrouped ? (
          <ToolButton label="Ungroup" onClick={ungroupSelected}>
            <Ungroup size={14} />
          </ToolButton>
        ) : canGroup ? (
          <ToolButton label="Group" onClick={groupSelected}>
            <Group size={14} />
          </ToolButton>
        ) : null}

        <ToolButton label="Duplicate (Ctrl+D)" onClick={duplicateSelectedElements}>
          <Copy size={14} />
        </ToolButton>
        <ToolButton
          label={allLocked ? 'Unlock' : 'Lock'}
          active={allLocked}
          onClick={() => setElementsLocked(selectedElementIds, !allLocked)}
        >
          {allLocked ? <Lock size={14} /> : <LockOpen size={14} />}
        </ToolButton>
        <ToolButton label="Delete (Del)" danger onClick={deleteSelectedElements}>
          <Trash2 size={14} />
        </ToolButton>
      </div>
    </div>
  );
};
