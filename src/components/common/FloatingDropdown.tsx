import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface FloatingDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
  className?: string;
}

export const FloatingDropdown: React.FC<FloatingDropdownProps> = ({
  isOpen,
  onClose,
  anchorRef,
  children,
  className = '',
}) => {
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !anchorRef.current) return;

    const updatePosition = () => {
      if (!anchorRef.current) return;
      const rect = anchorRef.current.getBoundingClientRect();
      const left = Math.min(rect.left, window.innerWidth - 260);
      setCoords({
        top: rect.bottom + 6,
        left: Math.max(8, left),
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        anchorRef.current &&
        !anchorRef.current.contains(target)
      ) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, anchorRef, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        zIndex: 9999,
      }}
      className={`bg-white border border-[#e5e9ee] shadow-[0_8px_28px_rgba(28,44,58,0.12)] rounded-[12px] animate-in fade-in zoom-in-95 duration-100 ${className}`}
    >
      {children}
    </div>,
    document.body
  );
};
