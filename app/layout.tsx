import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nadin Lencería - Revendedoras',
  description: 'App para revendedoras de Nadin Lencería',
  manifest: '/manifest.json',
  themeColor: '#ef88b7',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/logo.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
