import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BancoService } from '../../banco/banco.service';

interface ConvenioParaAlerta {
  id: string;
  status_geral: string;
  data_fim_vigencia: string | null;
  vigencia_contrato_empresa: string | null;
}

// Usados só se a leitura da configuração falhar — os alertas nunca devem parar de rodar por
// causa disso. Os valores em uso vêm da aba "Gerais" das Configurações (migration 0024).
const PADRAO_DIAS_VIGENCIA_PROXIMA = 90;
const PADRAO_DIAS_CONTRATO_EMPRESA_PROXIMO = 60;

/**
 * Motor de alertas: roda periodicamente e faz upsert idempotente em alertas (unicidade por
 * convenio_id+tipo, migration 0019).
 *
 * É uma rotina de sistema, não uma requisição de usuário: percorre TODOS os municípios ativos,
 * um schema por vez, e por isso passa por cima da RLS de propósito. Cada município é tratado
 * isoladamente — se um falhar, os outros seguem.
 */
@Injectable()
export class AlertasService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AlertasService.name);

  constructor(private readonly banco: BancoService) {}

  // Roda uma vez ao subir a API, além do cron periódico — sem isso o primeiro cálculo só
  // aconteceria na próxima marca de 6h.
  onApplicationBootstrap() {
    this.recalcularAlertas();
  }

  @Cron(CronExpression.EVERY_6_HOURS)
  async recalcularAlertas() {
    const municipios = await this.banco.consultarMestre<{ slug: string; schema_nome: string }>(
      'SELECT slug, schema_nome FROM public.clientes WHERE ativo = TRUE ORDER BY slug',
    );

    this.logger.log(`Recalculando alertas de ${municipios.length} município(s)...`);

    for (const municipio of municipios) {
      try {
        const total = await this.recalcularDoMunicipio(municipio.schema_nome);
        this.logger.log(`${municipio.slug}: ${total} alerta(s).`);
      } catch (erro) {
        this.logger.error(`${municipio.slug}: falha ao recalcular alertas — ${(erro as Error).message}`);
      }
    }
  }

  private async recalcularDoMunicipio(schemaNome: string): Promise<number> {
    return this.banco.executarComoDono(schemaNome, async (executar) => {
      const configuracao = (
        await executar('SELECT dias_alerta_vigencia, dias_alerta_contrato_empresa FROM configuracoes LIMIT 1')
      ).rows[0] as { dias_alerta_vigencia: number; dias_alerta_contrato_empresa: number } | undefined;

      const diasVigencia = configuracao?.dias_alerta_vigencia ?? PADRAO_DIAS_VIGENCIA_PROXIMA;
      const diasContratoEmpresa =
        configuracao?.dias_alerta_contrato_empresa ?? PADRAO_DIAS_CONTRATO_EMPRESA_PROXIMO;

      const convenios = (
        await executar('SELECT id, status_geral, data_fim_vigencia, vigencia_contrato_empresa FROM convenios')
      ).rows as ConvenioParaAlerta[];

      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const diasAte = (dataIso: string) => Math.ceil((new Date(dataIso).getTime() - hoje.getTime()) / 86400000);

      const alertas: { convenio_id: string; tipo: string; descricao: string }[] = [];

      for (const c of convenios) {
        if (c.data_fim_vigencia) {
          const dias = diasAte(c.data_fim_vigencia);
          if (dias >= 0 && dias <= diasVigencia && !['ObraConcluida', 'PcAprovada'].includes(c.status_geral)) {
            alertas.push({
              convenio_id: c.id,
              tipo: 'VigenciaProximaDoFim',
              descricao: `Vigência termina em ${dias} dia(s) (${c.data_fim_vigencia})`,
            });
          }
        }

        if (c.vigencia_contrato_empresa) {
          const dias = diasAte(c.vigencia_contrato_empresa);
          if (dias >= 0 && dias <= diasContratoEmpresa) {
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

      for (const alerta of alertas) {
        await executar(
          `INSERT INTO alertas (convenio_id, tipo, descricao)
           VALUES ($1, $2, $3)
           ON CONFLICT (convenio_id, tipo) DO UPDATE SET descricao = EXCLUDED.descricao`,
          [alerta.convenio_id, alerta.tipo, alerta.descricao],
        );
      }

      return alertas.length;
    });
  }
}
