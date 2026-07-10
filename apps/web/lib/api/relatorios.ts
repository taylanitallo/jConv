const URL_BASE_API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

// Os relatórios abrem numa aba nova por navegação direta (não fetch): o cookie httpOnly da API
// já vai junto automaticamente (mesmo domínio da API, SameSite=None em produção), e o navegador
// trata a resposta application/pdf nativamente — sem precisar lidar com blob manualmente.
export function abrirRelatorioConvenio(convenioId: string) {
  window.open(`${URL_BASE_API}/relatorios/convenio/${convenioId}`, '_blank');
}

export function abrirRelatorioConsolidado(filtros: Record<string, string | undefined>) {
  const params = new URLSearchParams(
    Object.fromEntries(Object.entries(filtros).filter(([, v]) => !!v)) as Record<string, string>,
  );
  window.open(`${URL_BASE_API}/relatorios/consolidado?${params.toString()}`, '_blank');
}

export function abrirRelatorioDashboard(filtros: Record<string, string | undefined>) {
  const params = new URLSearchParams(
    Object.fromEntries(Object.entries(filtros).filter(([, v]) => !!v)) as Record<string, string>,
  );
  window.open(`${URL_BASE_API}/relatorios/dashboard?${params.toString()}`, '_blank');
}
