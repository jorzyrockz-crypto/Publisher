/**
 * Which text controls the canvas bar routes through the edit panel.
 *
 * The bar keeps the controls that are one click and one outcome (bold, italic, the size
 * steppers, the alignment cycle). Anything that needs a value *picked* — the font, the colour
 * — opens here instead of cramming a picker into the pill.
 */
export const TEXT_PANEL_SECTIONS_ENABLED = true;

export type TextControlSection = 'type' | 'colour';

export const TEXT_CONTROL_TITLES: Record<TextControlSection, string> = {
  type: 'Fonts',
  colour: 'Text color',
};
