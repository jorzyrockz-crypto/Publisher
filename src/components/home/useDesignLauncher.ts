import { useCallback } from 'react';
import { usePublisher } from '../../context/PublisherContext';
import {
  BlankDesignSpec,
  buildBlankProject,
  buildTarpapelProject,
  clampCustomSize,
  TARPAPEL_3X2,
} from '../../utils/blankDesign';
import { loadRecentDesign, recordRecentDesign } from '../../utils/recentDesigns';
import { loadProjectFromFile } from '../../utils/imageExport';

/**
 * Starting a document, from anywhere on Home.
 *
 * Every route into the editor goes through one of these functions: the Create popover, the
 * quick-start chips, a template card and a recent card all end up calling `createNewTab` +
 * `openEditor`, so "what a click does" is decided in one place instead of four.
 */
export function useDesignLauncher() {
  const {
    createNewTab,
    openEditor,
    workspaceTabs,
    switchWorkspaceTab,
    loadTemplate,
    printSettings,
    setPrintSettings,
    setTarpapelOverlayVisible,
  } = usePublisher();

  /** A tab that already holds this document is resumed instead of duplicated. */
  const openProject = useCallback(
    (project: import('../../types/publisher').DocumentProject) => {
      const existing = workspaceTabs.find((tab) => tab.project.id === project.id);
      if (existing) {
        switchWorkspaceTab(existing.id);
      } else {
        createNewTab(project);
      }
      openEditor();
    },
    [createNewTab, openEditor, switchWorkspaceTab, workspaceTabs]
  );

  const startBlank = useCallback(
    (spec: BlankDesignSpec) => {
      createNewTab(buildBlankProject(spec));
      openEditor();
    },
    [createNewTab, openEditor]
  );

  /**
   * A tarpapel is a *page plus a print setup*. Creating the canvas without the grid would leave the
   * user with a poster-shaped sheet that prints as ordinary pages, so the grid is set here: 3 × 2
   * on A4 landscape, with the tile guides on so the seams are visible while designing.
   */
  const startTarpapel = useCallback(() => {
    createNewTab(buildBlankProject(buildTarpapelProject(printSettings)));
    setPrintSettings((prev) => ({ ...prev, ...TARPAPEL_3X2.settings }));
    setTarpapelOverlayVisible(true);
    openEditor();
  }, [createNewTab, openEditor, printSettings, setPrintSettings, setTarpapelOverlayVisible]);

  const startCustom = useCallback(
    (width: number, height: number) => {
      const size = clampCustomSize(width, height);
      createNewTab(
        buildBlankProject({
          name: `Custom ${size.width} × ${size.height}`,
          width: size.width,
          height: size.height,
          pageSizeName: 'custom',
        })
      );
      openEditor();
    },
    [createNewTab, openEditor]
  );

  /**
   * Not `useTemplate`: a function whose name starts with "use" is a hook as far as the linter —
   * and every reader — is concerned, and this one is called from a click handler.
   */
  const applyTemplate = useCallback(
    (templateId: string) => {
      void loadTemplate(templateId);
    },
    [loadTemplate]
  );

  /** Returns false when the cached copy is gone, so the card can say so instead of doing nothing. */
  const openRecent = useCallback(
    async (id: string) => {
      const project = await loadRecentDesign(id);
      if (!project) return false;
      openProject(project);
      return true;
    },
    [openProject]
  );

  const openFile = useCallback(
    async (file: File) => {
      const project = await loadProjectFromFile(file);
      openProject(project);
      // Opening a file is worth remembering, but a failure to cache must not fail the open.
      void recordRecentDesign(project);
    },
    [openProject]
  );

  return { startBlank, startTarpapel, startCustom, applyTemplate, openRecent, openFile };
}
