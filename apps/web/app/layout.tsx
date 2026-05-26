import type { ReactNode } from 'react';

export const metadata = {
  title: 'AURA Note v1',
  description: 'AURA Note v1 CP-0 scaffold'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
