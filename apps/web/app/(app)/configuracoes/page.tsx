import { redirect } from 'next/navigation';

// /configuracoes sozinho não tem conteúdo: cai na primeira aba.
export default function PaginaConfiguracoes() {
  redirect('/configuracoes/gerais');
}
