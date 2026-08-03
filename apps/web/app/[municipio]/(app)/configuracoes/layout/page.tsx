'use client';

import { useEffect, useState } from 'react';
import { ORIENTACOES_PDF, ROTULOS_ORIENTACAO_PDF, type OrientacaoPdf } from '@jconv/compartilhado';
import { BarraSalvar } from '../_componentes/barra-salvar';
import { CLASSE_CAMPO, CLASSE_ROTULO, usarConfiguracao } from '../_componentes/usar-configuracao';

export default function AbaLayout() {
  const { configuracao, salvar, salvando, erro, salvoAgora } = usarConfiguracao();

  const [orientacao, setOrientacao] = useState<OrientacaoPdf>('retrato');
  const [mostrarBrasao, setMostrarBrasao] = useState(true);
  const [rodape, setRodape] = useState('');

  useEffect(() => {
    if (!configuracao) return;
    setOrientacao(configuracao.orientacaoPadraoPdf);
    setMostrarBrasao(configuracao.mostrarBrasaoRelatorio);
    setRodape(configuracao.rodapeRelatorio ?? '');
  }, [configuracao]);

  if (!configuracao) return <p className="text-sm text-neutral-500">Carregando…</p>;

  return (
    <div className="max-w-xl">
      <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
        Aparência dos relatórios em PDF gerados pelo sistema.
      </p>

      <div className="space-y-5">
        <div>
          <label className={CLASSE_ROTULO}>Orientação padrão</label>
          <select
            value={orientacao}
            onChange={(e) => setOrientacao(e.target.value as OrientacaoPdf)}
            className={CLASSE_CAMPO}
          >
            {ORIENTACOES_PDF.map((valor) => (
              <option key={valor} value={valor}>
                {ROTULOS_ORIENTACAO_PDF[valor]}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            Opção que já vem marcada ao exportar. Continua sendo possível trocar na hora de gerar cada relatório.
          </p>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={mostrarBrasao} onChange={(e) => setMostrarBrasao(e.target.checked)} />
            Mostrar brasão do município no cabeçalho
          </label>
          {mostrarBrasao && !configuracao.brasaoUrl && (
            <p className="mt-1 text-xs text-amber-700 dark:text-amber-500">
              Nenhum brasão cadastrado ainda — informe a URL na aba Município para que ele apareça.
            </p>
          )}
        </div>

        <div>
          <label className={CLASSE_ROTULO}>Rodapé dos relatórios</label>
          <textarea value={rodape} onChange={(e) => setRodape(e.target.value)} rows={2} className={CLASSE_CAMPO} />
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            Texto livre impresso no fim de cada relatório. Deixe em branco para não imprimir nada.
          </p>
        </div>
      </div>

      <BarraSalvar
        salvando={salvando}
        erro={erro}
        salvoAgora={salvoAgora}
        aoSalvar={() =>
          salvar({
            orientacaoPadraoPdf: orientacao,
            mostrarBrasaoRelatorio: mostrarBrasao,
            rodapeRelatorio: rodape || null,
          })
        }
      />
    </div>
  );
}
