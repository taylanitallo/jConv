import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'jConv — Gestão de Convênios',
  description: 'Sistema de gestão de convênios, propostas, emendas e obras da Prefeitura de Irauçuba/CE',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-neutral-50 text-neutral-900 antialiased dark:bg-neutral-950 dark:text-neutral-100">
        {children}
      </body>
    </html>
  );
}
