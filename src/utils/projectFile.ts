/**
 * The extension of a saved StudioPress document.
 *
 * It used to be `.pub`, which is Microsoft Publisher's extension: on Windows a `.pub` file is
 * associated with Publisher, so a double-click handed our JSON to an app that cannot read it (or
 * replaced ours). `.spress` is ours alone. Documents saved before the change still open — every
 * reader strips either extension, and both pickers accept both — so the rename costs nobody a file.
 */
export const PROJECT_EXTENSION = '.spress';

/** What the file pickers offer: what we write now, what we used to write, and plain JSON. */
export const PROJECT_FILE_ACCEPT = '.spress,.pub,.json';

const PROJECT_SUFFIX = /\.(spress|pub|json)$/i;

/** `"Honor Roll.pub"` → `"Honor Roll"`. A document whose name never carried one is left alone. */
export const projectBaseName = (name: string): string => name.replace(PROJECT_SUFFIX, '').trim();

/**
 * The name a save writes. Replacing rather than appending matters: template projects ship with a
 * `.pub` name, and appending would hand the user `Honor Roll.pub.spress`.
 */
export const projectFileName = (name: string): string =>
  `${projectBaseName(name) || 'publication'}${PROJECT_EXTENSION}`;
