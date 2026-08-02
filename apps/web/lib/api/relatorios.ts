// Os relatórios abrem numa aba nova por navegação direta (não fetch). Passa por /api/... (mesmo
// domínio do site, ver rewrite em next.config.js) em vez do domínio da API direto, senão o
// cookie httpOnly não vai junto (web e api ficam em domínios diferentes em produção).

export type OrientacaoPdf = 'retrato' | 'paisagem';

function montarQuery(filtros: Record<string, string | undefined>, orientacao?: OrientacaoPdf) {
  const params = new URLSearchParams(
    Object.fromEntries(Object.entries(filtros).filter(([, v]) => !!v)) as Record<string, string>,
  );
  if (orientacao) params.set('orientacao', orientacao);
  return params.toString();
}

export function abrirRelatorioConvenio(convenioId: string, orientacao?: OrientacaoPdf) {
  window.open(`/api/relatorios/convenio/${convenioId}?${montarQuery({}, orientacao)}`, '_blank');
}

export function abrirRelatorioHistoricoConvenio(convenioId: string, orientacao?: OrientacaoPdf) {
  window.open(`/api/relatorios/convenio/${convenioId}/historico?${montarQuery({}, orientacao)}`, '_blank');
}

export function abrirRelatorioConsolidado(
  filtros: Record<string, string | undefined>,
  orientacao?: OrientacaoPdf,
) {
  window.open(`/api/relatorios/consolidado?${montarQuery(filtros, orientacao)}`, '_blank');
}

export function abrirRelatorioDashboard(
  filtros: Record<string, string | undefined>,
  orientacao?: OrientacaoPdf,
) {
  window.open(`/api/relatorios/dashboard?${montarQuery(filtros, orientacao)}`, '_blank');
}
