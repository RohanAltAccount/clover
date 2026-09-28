import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
}

/**
 * Frosted-glass panel (translucent gradient + blur), à la the native Display
 * maps UI. Reads well over a live camera/background on the additive display —
 * use it for info cards floating over a map or the real world.
 */
export function FrostedCard({ children, className = '' }: Props) {
  return (
    <div
      className={`relative overflow-hidden rounded-[1.5rem] border border-white/15 px-5 py-4 backdrop-blur-md ${className}`}
      style={{
        background:
          'linear-gradient(135deg, rgba(120,119,198,0.28), rgba(255,255,255,0.06) 45%, rgba(56,189,248,0.18))',
      }}
    >
      {children}
    </div>
  );
}
