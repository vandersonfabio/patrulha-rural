import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Patrulha Rural Comunitária | 6º BPM',
  description: 'Aplicativo para policiamento e patrulha rural do 6º BPM, com cadastro de propriedades, moradores e integração em tempo real.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
