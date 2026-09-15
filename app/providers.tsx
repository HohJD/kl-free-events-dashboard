'use client';

import { ThemeProvider } from 'next-themes';
import { ReactNode } from 'react';
import { MotionConfig } from 'framer-motion';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange={false}>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </ThemeProvider>
  );
}
