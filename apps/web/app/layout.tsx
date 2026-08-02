import type { Metadata } from 'next';
import './globals.css';

// Metadata do documento raiz é gerada antes de existir sessão, e a leitura das Configurações
// exige usuário autenticado — por isso aqui o município vem de variável de ambiente, e não do
// banco. O valor "de verdade", usado nos relatórios e no assistente de IA, está em
// Configurações > Município.
const MUNICIPIO = process.env.NEXT_PUBLIC_MUNICIPIO ?? 'Irauçuba/CE';

export const metadata: Metadata = {
  title: 'jConv — Gestão de Convênios',
  description: `Sistema de gestão de convênios, propostas, emendas e obras da Prefeitura de ${MUNICIPIO}`,
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
