import { Inject, Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ADMIN_CLIENT } from '../../configuracao/supabase.provider';

interface ConvenioParaAlerta {
  id: string;
  status_geral: string;
  data_fim_vigencia: string | null;
  vigencia_contrato_empresa: string | null;
}

const DIAS_VIGENCIA_PROXIMA = 90;
const DIAS_CONTRATO_EMPRESA_PROXIMO = 60;

// Motor de alertas (Fase 4): roda periodicamente com a service role (ignora RLS de propósito —
// é uma rotina de sistema, não uma requisição de usuário) e faz upsert idempotente em
// public.alertas (unicidade por convenio_id+tipo, ver migration 0019).
@Injectable()
export class AlertasService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AlertasService.name);

  constructor(@Inject(SUPABASE_ADMIN_CLIENT) private readonly supabaseAdmin: SupabaseClient) {}

  // Roda uma vez ao subir a API, além do cron periódico — sem isso o primeiro cálculo só
  // aconteceria na próxima marca de 6h.
  onApplicationBootstrap() {
    this.recalcularAlertas();
  }

  @Cron(CronExpression.EVERY_6_HOURS)
  async recalcularAlertas() {
    this.logger.log('Recalculando alertas...');

    const { data: convenios, error } = await this.supabaseAdmin
      .from('convenios')
      .select('id, status_geral, data_fim_vigencia, vigencia_contrato_empresa');

    if (error) {
      this.logger.error(`Falha ao carregar convênios para alertas: ${error.message}`);
      return;
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const diasAte = (dataIso: string) => Math.ceil((new Date(dataIso).getTime() - hoje.getTime()) / 86400000);

    const alertas: { convenio_id: string; tipo: string; descricao: string }[] = [];

    for (const c of convenios as ConvenioParaAlerta[]) {
      if (c.data_fim_vigencia) {
        const dias = diasAte(c.data_fim_vigencia);
        if (dias >= 0 && dias <= DIAS_VIGENCIA_PROXIMA && !['ObraConcluida', 'PcAprovada'].includes(c.status_geral)) {
          alertas.push({
            convenio_id: c.id,
            tipo: 'VigenciaProximaDoFim',
            descricao: `Vigência termina em ${dias} dia(s) (${c.data_fim_vigencia})`,
          });
        }
      }

      if (c.vigencia_contrato_empresa) {
        const dias = diasAte(c.vigencia_contrato_empresa);
        if (dias >= 0 && dias <= DIAS_CONTRATO_EMPRESA_PROXIMO) {
          alertas.push({
            convenio_id: c.id,
            tipo: 'ContratoEmpresaVencendo',
            descricao: `Contrato da empresa vence em ${dias} dia(s) (${c.vigencia_contrato_empresa})`,
          });
        }
      }

      if (c.status_geral === 'ObraParada') {
        alertas.push({ convenio_id: c.id, tipo: 'ObraParadaSemAtualizacao', descricao: 'Obra marcada como parada' });
      }

      if (c.status_geral === 'Suspensiva') {
        alertas.push({ convenio_id: c.id, tipo: 'SuspensivaComPrazo', descricao: 'Convênio em suspensiva' });
      }

      if (['EmPrestacaoContas', 'PcEnviada'].includes(c.status_geral)) {
        alertas.push({ convenio_id: c.id, tipo: 'PcPendente', descricao: 'Prestação de contas pendente' });
      }
    }

    if (alertas.length === 0) return;

    const { error: erroUpsert } = await this.supabaseAdmin
      .from('alertas')
      .upsert(alertas, { onConflict: 'convenio_id,tipo', ignoreDuplicates: false });

    if (erroUpsert) {
      this.logger.error(`Falha ao gravar alertas: ${erroUpsert.message}`);
      return;
    }

    this.logger.log(`${alertas.length} alerta(s) recalculado(s).`);
  }
}
