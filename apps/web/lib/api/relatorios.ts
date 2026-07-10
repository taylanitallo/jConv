// Os relatórios abrem numa aba nova por navegação direta (não fetch). Passa por /api/... (mesmo
// domínio do site, ver rewrite em next.config.js) em vez do domínio da API direto, senão o
// cookie httpOnly não vai junto (web e api ficam em domínios diferentes em produção).
export function abrirRelatorioConvenio(convenioId: string) {
  window.open(`/api/relatorios/convenio/${convenioId}`, '_blank');
}

export function abrirRelatorioConsolidado(filtros: Record<string, string | undefined>) {
  const params = new URLSearchParams(
    Object.fromEntries(Object.entries(filtros).filter(([, v]) => !!v)) as Record<string, string>,
  );
  window.open(`/api/relatorios/consolidado?${params.toString()}`, '_blank');
}

export function abrirRelatorioDashboard(filtros: Record<string, string | undefined>) {
  const params = new URLSearchParams(
    Object.fromEntries(Object.entries(filtros).filter(([, v]) => !!v)) as Record<string, string>,
  );
  window.open(`/api/relatorios/dashboard?${params.toString()}`, '_blank');
}
