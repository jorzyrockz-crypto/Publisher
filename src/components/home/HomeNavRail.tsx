import React from 'react';
import {
  FolderOpen,
  Home,
  Keyboard,
  LayoutTemplate,
  Moon,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
} from 'lucide-react';
import { usePublisher } from '../../context/PublisherContext';
import type { HomeSection } from '../../types/publisher';
import { StudioPressLogo } from '../common/StudioPressLogo';
import { openShortcutsModal } from '../../utils/uiEvents';
import { CreateDesignButton } from './CreateDesignButton';

const NAV_ITEMS: { id: HomeSection; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'templates', label: 'Templates', icon: LayoutTemplate },
  { id: 'projects', label: 'My Projects', icon: FolderOpen },
  { id: 'kits', label: 'Story Kits', icon: Package },
];

/**
 * The Home navigation rail.
 *
 * This replaces the indigo File-menu sidebar the gallery used to live in, where the destinations
 * were verbs about a document (New, Open, Save As, Print, Export) — half of which make no sense
 * before there is a document. Here the destinations are places: Home, Templates, My Projects, Story
 * Kits. Save As / Print / Export stayed behind in the editor's File menu, because they act on the
 * page you are looking at.
 *
 * 14rem on a desktop, an icon rail from `lg` down, and fully collapsible by hand. On a tablet the
 * rail auto-collapses so the gallery keeps its columns.
 */
export const HomeNavRail: React.FC<{ collapsed: boolean; onToggleCollapsed: () => void }> = ({
  collapsed,
  onToggleCollapsed,
}) => {
  const { homeSection, setHomeSection, theme, toggleTheme } = usePublisher();

  const itemClass = (isActive: boolean) =>
    `group flex w-full items-center gap-2.5 rounded-tile px-2.5 py-2 text-body transition-colors cursor-pointer ${
      isActive
        ? 'bg-accent-soft font-semibold text-accent-ink'
        : 'font-medium text-ink-body hover:bg-surface-sunken hover:text-ink'
    } ${collapsed ? 'justify-center px-0' : ''}`;

  return (
    <aside
      className={`home-glass home-glass-strong relative z-10 flex h-full flex-shrink-0 flex-col border-r transition-[width] duration-200 ${
        collapsed ? 'w-16' : 'w-56'
      }`}
      aria-label="StudioPress"
    >
      {/* Brand */}
      <div className={`flex items-center gap-2 px-3 pb-1 pt-3 ${collapsed ? 'justify-center' : ''}`}>
        <StudioPressLogo size={collapsed ? 26 : 28} />
        {!collapsed && (
          <div className="min-w-0">
            <div className="truncate text-lead font-bold leading-tight tracking-[-0.01em] text-ink">
              StudioPress
            </div>
            <div className="truncate text-2xs text-ink-muted">Freedom to Paint</div>
          </div>
        )}
      </div>

      {/* Primary action */}
      <div className={`px-2.5 pb-2 pt-3 ${collapsed ? 'px-2' : ''}`}>
        <CreateDesignButton compact={collapsed} />
      </div>

      {/* Destinations */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2.5 pt-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = homeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setHomeSection(item.id)}
              className={itemClass(isActive)}
              title={collapsed ? item.label : undefined}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={17} />
              {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Foot: theme, help, collapse */}
      <div className={`space-y-0.5 border-t border-line px-2.5 py-2 ${collapsed ? 'px-2' : ''}`}>
        <button
          type="button"
          onClick={toggleTheme}
          className={itemClass(false)}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          {!collapsed && (
            <span className="whitespace-nowrap">{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
          )}
        </button>
        <button
          type="button"
          onClick={openShortcutsModal}
          className={itemClass(false)}
          title="Keyboard shortcuts"
        >
          <Keyboard size={17} />
          {!collapsed && <span className="whitespace-nowrap">Shortcuts</span>}
        </button>
        <button
          type="button"
          onClick={onToggleCollapsed}
          className={itemClass(false)}
          title={collapsed ? 'Expand the rail' : 'Collapse the rail'}
        >
          {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
          {!collapsed && <span className="whitespace-nowrap">Collapse</span>}
        </button>
      </div>
    </aside>
  );
};
