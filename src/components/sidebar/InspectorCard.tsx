import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface InspectorCardProps {
  className?: string;
  /** Start folded (useful for deep, rarely-used groups). */
  defaultCollapsed?: boolean;
  children: React.ReactNode;
}

/**
 * Inspector section card with a clickable header.
 *
 * The first child is treated as the section header (every inspector card starts
 * with one) and the remaining children are the collapsible body. Clicking the
 * header toggles the section; clicks on real controls inside the header are
 * ignored so buttons keep working.
 */
export const InspectorCard: React.FC<InspectorCardProps> = ({
  className = '',
  defaultCollapsed = false,
  children,
}) => {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [header, ...body] = React.Children.toArray(children);

  const handleHeaderClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement | null;
    if (target?.closest('button, input, select, textarea, a, label')) return;
    setCollapsed((c) => !c);
  };

  return (
    <div className={`inspector-card ${className}`} data-collapsed={collapsed ? 'true' : undefined}>
      <div
        onClick={handleHeaderClick}
        role="button"
        tabIndex={0}
        aria-expanded={!collapsed}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setCollapsed((c) => !c);
          }
        }}
        className="flex items-start gap-1.5 cursor-pointer rounded-[6px] outline-none focus-visible:ring-2 focus-visible:ring-[#b3a4f2] group/hdr"
        title={collapsed ? 'Expand section' : 'Collapse section'}
      >
        <div className="flex-1 min-w-0">{header}</div>
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          onClick={(e) => {
            e.stopPropagation();
            setCollapsed((c) => !c);
          }}
          className="flex-shrink-0 mt-0.5 p-0.5 rounded-[5px] text-[#8d99a5] hover:text-[#5c4bb8] hover:bg-[#f4f2ff] transition-colors cursor-pointer"
        >
          <ChevronDown
            size={13}
            className={`transition-transform duration-150 ${collapsed ? '-rotate-90' : ''}`}
          />
        </button>
      </div>

      {!collapsed && body}
    </div>
  );
};
