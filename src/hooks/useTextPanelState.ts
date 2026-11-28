import { usePublisher } from '../context/PublisherContext';
import type { TextControlSection } from '../constants/textControls';

/**
 * The bar's chips and the panel have to agree about which section is open — the chip is the
 * button that opens it *and* the indicator that says it is open.
 */
export function useTextPanelState(section: TextControlSection) {
  const { textControlSection, openTextControl, closeTextControl } = usePublisher();
  const open = textControlSection === section;
  return {
    open,
    toggle: () => (open ? closeTextControl() : openTextControl(section)),
  };
}
