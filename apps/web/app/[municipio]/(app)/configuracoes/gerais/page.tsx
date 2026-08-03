'use client';

import { useEffect, useState } from 'react';
import { BarraSalvar } from '../_componentes/barra-salvar';
import { CLASSE_CAMPO, CLASSE_ROTULO, usarConfiguracao } from '../_componentes/usar-configuracao';

export default function AbaGerais() {
  const { configuracao, salvar, salvando, erro, salvoAgora } = usarConfiguracao();

  const [orgaoGestor, setOrgaoGestor] = useState('');
  const [emailContato, setEmailContato] = useState('');
  const [diasVigencia, setDiasVigencia] = useState('90');
  const [diasContrato, setDiasContrato] = useState('60');

  useEffect(() => {
    if (!configuracao) return;
    setOrgaoGestor(configuracao.orgaoGestor ?? '');
    setEmailContato(configuracao.emailContato ?? '');
    setDiasVigencia(String(configuracao.diasAlertaVigencia));
    setDiasContrato(String(configuracao.diasAlertaContratoEmpresa));
  }, [configuracao]);

  if (!configuracao) return <p className="text-sm text-neutral-500">Carregando…</p>;

  return (
    <div className="max-w-xl">
      <section className="space-y-4">
        <div>
          <label className={CLASSE_ROTULO}>Órgão gestor</label>
          <input value={orgaoGestor} onChange={(e) => setOrgaoGestor(e.target.value)} className={CLASSE_CAMPO} />
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            Setor responsável pela gestão dos convênios no município.
          </p>
        </div>

        <div>
          <label className={CLASSE_ROTULO}>E-mail de contato</label>
          <input
            type="email"
            value={emailContato}
            onChange={(e) => setEmailContato(e.target.value)}
            className={CLASSE_CAMPO}
          />
        </div>
      </section>

      <section className="mt-8 space-y-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Alertas</h2>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            Com quanta antecedência o sistema deve avisar. Os alertas são recalculados a cada 6 horas e ao subir a
            aplicação.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={CLASSE_ROTULO}>Vigência do convênio (dias)</label>
            <input
              type="number"
              min={1}
              max={365}
              value={diasVigencia}
              onChange={(e) => setDiasVigencia(e.target.value)}
              className={CLASSE_CAMPO}
            />
          </div>
          <div>
            <label className={CLASSE_ROTULO}>Contrato da empresa (dias)</label>
            <input
              type="number"
              min={1}
              max={365}
              value={diasContrato}
              onChange={(e) => setDiasContrato(e.target.value)}
              className={CLASSE_CAMPO}
            />
          </div>
        </div>
      </section>

      <BarraSalvar
        salvando={salvando}
        erro={erro}
        salvoAgora={salvoAgora}
        aoSalvar={() =>
          salvar({
            orgaoGestor: orgaoGestor || null,
            emailContato: emailContato || null,
            diasAlertaVigencia: Number(diasVigencia),
            diasAlertaContratoEmpresa: Number(diasContrato),
          })
        }
      />
    </div>
  );
}
