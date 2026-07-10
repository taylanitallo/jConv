'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BarraAcoesFormulario } from '@jconv/compartilhado/componentes';
import {
  TIPOS_INSTRUMENTO,
  ROTULOS_TIPO_INSTRUMENTO,
  STATUS_GERAL_CONVENIO,
  ROTULOS_STATUS_GERAL_CONVENIO,
  type Convenio,
  type OrgaoConcedente,
  type EmpresaContratada,
} from '@jconv/compartilhado';
import { convenioApi, empresasContratadasApi, orgaosConcedentesApi } from '../../../../lib/api/recursos';

export interface FormularioConvenioProps {
  convenio?: Convenio;
}

function campoTexto(valor: string | null | undefined) {
  return valor ?? '';
}

export function FormularioConvenio({ convenio }: FormularioConvenioProps) {
  const roteador = useRouter();
  const [orgaos, setOrgaos] = useState<OrgaoConcedente[]>([]);
  const [empresas, setEmpresas] = useState<EmpresaContratada[]>([]);

  const [orgaoConcedenteId, setOrgaoConcedenteId] = useState(convenio?.orgaoConcedenteId ?? '');
  const [tipoInstrumento, setTipoInstrumento] = useState(convenio?.tipoInstrumento ?? TIPOS_INSTRUMENTO[0]);
  const [objeto, setObjeto] = useState(convenio?.objeto ?? '');
  const [statusGeral, setStatusGeral] = useState(convenio?.statusGeral ?? STATUS_GERAL_CONVENIO[0]);

  const [valorConveniado, setValorConveniado] = useState(campoTexto(convenio?.valorConveniado?.toString()));
  const [valorConcedido, setValorConcedido] = useState(campoTexto(convenio?.valorConcedido?.toString()));
  const [valorContrapartida, setValorContrapartida] = useState(campoTexto(convenio?.valorContrapartida?.toString()));
  const [valorLicitado, setValorLicitado] = useState(campoTexto(convenio?.valorLicitado?.toString()));

  const [numeroConvenio, setNumeroConvenio] = useState(campoTexto(convenio?.numeroConvenio));
  const [numeroMapp, setNumeroMapp] = useState(campoTexto(convenio?.numeroMapp));
  const [numeroSic, setNumeroSic] = useState(campoTexto(convenio?.numeroSic));
  const [numeroProtocolo, setNumeroProtocolo] = useState(campoTexto(convenio?.numeroProtocolo));
  const [numeroNup, setNumeroNup] = useState(campoTexto(convenio?.numeroNup));
  const [numeroOperacaoCaixa, setNumeroOperacaoCaixa] = useState(campoTexto(convenio?.numeroOperacaoCaixa));
  const [contaBancaria, setContaBancaria] = useState(campoTexto(convenio?.contaBancaria));

  const [dataAssinatura, setDataAssinatura] = useState(campoTexto(convenio?.dataAssinatura));
  const [dataInicioVigencia, setDataInicioVigencia] = useState(campoTexto(convenio?.dataInicioVigencia));
  const [dataFimVigencia, setDataFimVigencia] = useState(campoTexto(convenio?.dataFimVigencia));
  const [vigenciaContratoEmpresa, setVigenciaContratoEmpresa] = useState(campoTexto(convenio?.vigenciaContratoEmpresa));

  const [empresaContratadaId, setEmpresaContratadaId] = useState(campoTexto(convenio?.empresaContratadaId));
  const [saldoEmConta, setSaldoEmConta] = useState(campoTexto(convenio?.saldoEmConta?.toString()));
  const [percentualExecutadoFisico, setPercentualExecutadoFisico] = useState(
    campoTexto(convenio?.percentualExecutadoFisico?.toString()),
  );
  const [percentualExecutadoFinanceiro, setPercentualExecutadoFinanceiro] = useState(
    campoTexto(convenio?.percentualExecutadoFinanceiro?.toString()),
  );
  const [observacoes, setObservacoes] = useState(campoTexto(convenio?.observacoes));

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    orgaosConcedentesApi.listar().then(setOrgaos);
    empresasContratadasApi.listar().then(setEmpresas);
  }, []);

  function numeroOuNulo(valor: string) {
    return valor.trim() === '' ? null : Number(valor);
  }

  async function aoSalvar() {
    setErro(null);
    setSalvando(true);
    try {
      const dados = {
        orgaoConcedenteId,
        tipoInstrumento,
        objeto,
        statusGeral,
        valorConveniado: numeroOuNulo(valorConveniado),
        valorConcedido: numeroOuNulo(valorConcedido),
        valorContrapartida: numeroOuNulo(valorContrapartida),
        valorLicitado: numeroOuNulo(valorLicitado),
        numeroConvenio: numeroConvenio || null,
        numeroMapp: numeroMapp || null,
        numeroSic: numeroSic || null,
        numeroProtocolo: numeroProtocolo || null,
        numeroNup: numeroNup || null,
        numeroOperacaoCaixa: numeroOperacaoCaixa || null,
        contaBancaria: contaBancaria || null,
        dataAssinatura: dataAssinatura || null,
        dataInicioVigencia: dataInicioVigencia || null,
        dataFimVigencia: dataFimVigencia || null,
        vigenciaContratoEmpresa: vigenciaContratoEmpresa || null,
        empresaContratadaId: empresaContratadaId || null,
        saldoEmConta: numeroOuNulo(saldoEmConta),
        percentualExecutadoFisico: numeroOuNulo(percentualExecutadoFisico),
        percentualExecutadoFinanceiro: numeroOuNulo(percentualExecutadoFinanceiro),
        observacoes: observacoes || null,
      };

      if (convenio) {
        await convenioApi.atualizar(convenio.id, dados);
        roteador.refresh();
      } else {
        const criado = await convenioApi.criar(dados);
        roteador.push(`/convenios/${criado.id}`);
      }
    } catch (excecao) {
      setErro(excecao instanceof Error ? excecao.message : 'Erro ao salvar');
    } finally {
      setSalvando(false);
    }
  }

  const campo = 'mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800';
  const rotulo = 'block text-sm font-medium';

  return (
    <div className="max-w-3xl space-y-6">
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Identificação</h2>
        <div>
          <label className={rotulo}>Órgão concedente</label>
          <select value={orgaoConcedenteId} onChange={(e) => setOrgaoConcedenteId(e.target.value)} className={campo}>
            <option value="">Selecione…</option>
            {orgaos.map((o) => (
              <option key={o.id} value={o.id}>
                {o.nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={rotulo}>Objeto</label>
          <textarea value={objeto} onChange={(e) => setObjeto(e.target.value)} rows={3} className={campo} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={rotulo}>Tipo de instrumento</label>
            <select value={tipoInstrumento} onChange={(e) => setTipoInstrumento(e.target.value as typeof tipoInstrumento)} className={campo}>
              {TIPOS_INSTRUMENTO.map((v) => (
                <option key={v} value={v}>
                  {ROTULOS_TIPO_INSTRUMENTO[v]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={rotulo}>Status geral</label>
            <select value={statusGeral} onChange={(e) => setStatusGeral(e.target.value as typeof statusGeral)} className={campo}>
              {STATUS_GERAL_CONVENIO.map((v) => (
                <option key={v} value={v}>
                  {ROTULOS_STATUS_GERAL_CONVENIO[v]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Valores</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={rotulo}>Valor conveniado</label>
            <input type="number" step="0.01" value={valorConveniado} onChange={(e) => setValorConveniado(e.target.value)} className={campo} />
          </div>
          <div>
            <label className={rotulo}>Valor concedido</label>
            <input type="number" step="0.01" value={valorConcedido} onChange={(e) => setValorConcedido(e.target.value)} className={campo} />
          </div>
          <div>
            <label className={rotulo}>Valor contrapartida</label>
            <input type="number" step="0.01" value={valorContrapartida} onChange={(e) => setValorContrapartida(e.target.value)} className={campo} />
          </div>
          <div>
            <label className={rotulo}>Valor licitado</label>
            <input type="number" step="0.01" value={valorLicitado} onChange={(e) => setValorLicitado(e.target.value)} className={campo} />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Números de processo</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={rotulo}>Nº Convênio</label>
            <input value={numeroConvenio} onChange={(e) => setNumeroConvenio(e.target.value)} className={campo} />
          </div>
          <div>
            <label className={rotulo}>Nº MAPP</label>
            <input value={numeroMapp} onChange={(e) => setNumeroMapp(e.target.value)} className={campo} />
          </div>
          <div>
            <label className={rotulo}>Nº SIC</label>
            <input value={numeroSic} onChange={(e) => setNumeroSic(e.target.value)} className={campo} />
          </div>
          <div>
            <label className={rotulo}>Nº Protocolo</label>
            <input value={numeroProtocolo} onChange={(e) => setNumeroProtocolo(e.target.value)} className={campo} />
          </div>
          <div>
            <label className={rotulo}>NUP</label>
            <input value={numeroNup} onChange={(e) => setNumeroNup(e.target.value)} className={campo} />
          </div>
          <div>
            <label className={rotulo}>Operação Caixa</label>
            <input value={numeroOperacaoCaixa} onChange={(e) => setNumeroOperacaoCaixa(e.target.value)} className={campo} />
          </div>
        </div>
        <div>
          <label className={rotulo}>Conta bancária</label>
          <input value={contaBancaria} onChange={(e) => setContaBancaria(e.target.value)} className={campo} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Datas e vigência</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={rotulo}>Data de assinatura</label>
            <input type="date" value={dataAssinatura} onChange={(e) => setDataAssinatura(e.target.value)} className={campo} />
          </div>
          <div>
            <label className={rotulo}>Início de vigência</label>
            <input type="date" value={dataInicioVigencia} onChange={(e) => setDataInicioVigencia(e.target.value)} className={campo} />
          </div>
          <div>
            <label className={rotulo}>Fim de vigência</label>
            <input type="date" value={dataFimVigencia} onChange={(e) => setDataFimVigencia(e.target.value)} className={campo} />
          </div>
          <div>
            <label className={rotulo}>Vigência contrato empresa</label>
            <input type="date" value={vigenciaContratoEmpresa} onChange={(e) => setVigenciaContratoEmpresa(e.target.value)} className={campo} />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Execução</h2>
        <div>
          <label className={rotulo}>Empresa contratada</label>
          <select value={empresaContratadaId} onChange={(e) => setEmpresaContratadaId(e.target.value)} className={campo}>
            <option value="">Nenhuma</option>
            {empresas.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={rotulo}>Saldo em conta</label>
            <input type="number" step="0.01" value={saldoEmConta} onChange={(e) => setSaldoEmConta(e.target.value)} className={campo} />
          </div>
          <div>
            <label className={rotulo}>% executado físico</label>
            <input type="number" step="0.01" value={percentualExecutadoFisico} onChange={(e) => setPercentualExecutadoFisico(e.target.value)} className={campo} />
          </div>
          <div>
            <label className={rotulo}>% executado financeiro</label>
            <input type="number" step="0.01" value={percentualExecutadoFinanceiro} onChange={(e) => setPercentualExecutadoFinanceiro(e.target.value)} className={campo} />
          </div>
        </div>
        <div>
          <label className={rotulo}>Observações</label>
          <textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={4} className={campo} />
        </div>
      </section>

      {erro && <p className="text-sm text-red-600">{erro}</p>}

      <BarraAcoesFormulario
        aoVoltar={() => roteador.push('/convenios')}
        aoCancelar={() => roteador.push('/convenios')}
        aoSalvar={aoSalvar}
        salvando={salvando}
        formularioSujo={objeto !== (convenio?.objeto ?? '')}
        desabilitarSalvar={!orgaoConcedenteId || !objeto}
      />
    </div>
  );
}
