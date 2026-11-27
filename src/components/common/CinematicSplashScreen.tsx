import React, { useEffect, useState } from 'react';
import { StudioPressLogo } from './StudioPressLogo';

/**
 * Cinematic startup splash screen featuring the StudioPress "Freedom to Paint"
 * dove, palette, and fountain pen emblem. Plays once per browser session and
 * can be dismissed immediately with a click or Escape key.
 */
export const CinematicSplashScreen: React.FC = () => {
  const [visible, setVisible] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('studiopress_splash_seen') !== '1';
    } catch {
      return true;
    }
  });
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (!visible) return;

    const dismiss = () => {
      setExiting(true);
      try {
        sessionStorage.setItem('studiopress_splash_seen', '1');
      } catch {
        // ignore storage errors
      }
      window.setTimeout(() => setVisible(false), 480);
    };

    const timer = window.setTimeout(dismiss, 1650);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        dismiss();
      }
    };
    window.addEventListener('keydown', onKey);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
    };
  }, [visible]);

  if (!visible) return null;

  const handleSkip = () => {
    setExiting(true);
    try {
      sessionStorage.setItem('studiopress_splash_seen', '1');
    } catch {
      // ignore
    }
    window.setTimeout(() => setVisible(false), 450);
  };

  return (
    <div
      onClick={handleSkip}
      role="status"
      aria-label="Loading StudioPress"
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#f4f2ff] dark:bg-[#131720] select-none cursor-pointer overflow-hidden transition-all duration-500 ease-out ${
        exiting ? 'opacity-0 scale-[1.03] pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Ambient cinematic aurora glows */}
      <div
        className="absolute w-[520px] h-[520px] rounded-full blur-[90px] opacity-35 pointer-events-none sp-splash-orb"
        style={{
          background: 'radial-gradient(circle, #8a6ff0 0%, rgba(138,111,240,0) 70%)',
          top: '18%',
          left: '26%',
        }}
      />
      <div
        className="absolute w-[420px] h-[420px] rounded-full blur-[90px] opacity-25 pointer-events-none sp-splash-orb-delayed"
        style={{
          background: 'radial-gradient(circle, #2dd4bf 0%, rgba(45,212,191,0) 70%)',
          bottom: '16%',
          right: '24%',
        }}
      />

      {/* Center Stage */}
      <div className="relative flex flex-col items-center text-center px-6">
        {/* Floating Halo + Option 2 Logo */}
        <div className="relative mb-5 sp-splash-logo">
          <div className="absolute -inset-4 rounded-[28px] bg-[#8a6ff0]/20 blur-xl animate-pulse" />
          <div className="relative rounded-[22px] shadow-[0_20px_50px_rgba(90,68,201,0.22)]">
            <StudioPressLogo size={88} />
          </div>
        </div>

        {/* Brand Wordmark */}
        <h1 className="text-3xl sm:text-4xl font-bold tracking-[-0.03em] text-[#161a22] sp-splash-title">
          Studio<span className="text-[#6e56cf]">Press</span>
        </h1>

        {/* Tagline */}
        <p className="mt-1.5 text-xs sm:text-sm font-medium tracking-[0.04em] text-[#5b6673] sp-splash-sub">
          Freedom to Paint &bull; Desktop Publishing Studio
        </p>

        {/* Sleek Shimmer Progress Bar */}
        <div className="mt-7 w-48 h-[3px] rounded-full bg-[#e2dcf8] overflow-hidden">
          <div
            className="h-full rounded-full sp-splash-bar"
            style={{
              background: 'linear-gradient(90deg, #8a6ff0 0%, #5a44c9 60%, #2dd4bf 100%)',
            }}
          />
        </div>

        <span className="mt-4 text-[10px] font-medium text-[#8b94a0] tracking-wider uppercase sp-splash-sub">
          Click anywhere to enter
        </span>
      </div>
    </div>
  );
};
