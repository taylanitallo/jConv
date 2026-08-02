'use client';

import { useEffect, useState } from 'react';
import { BarraSalvar } from '../_componentes/barra-salvar';
import { CLASSE_CAMPO, CLASSE_ROTULO, usarConfiguracao } from '../_componentes/usar-configuracao';

export default function AbaMunicipio() {
  const { configuracao, salvar, salvando, erro, salvoAgora } = usarConfiguracao();

  const [nome, setNome] = useState('');
  const [uf, setUf] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [endereco, setEndereco] = useState('');
  const [telefone, setTelefone] = useState('');
  const [prefeito, setPrefeito] = useState('');
  const [brasaoUrl, setBrasaoUrl] = useState('');

  useEffect(() => {
    if (!configuracao) return;
    setNome(configuracao.municipioNome);
    setUf(configuracao.municipioUf);
    setCnpj(configuracao.municipioCnpj ?? '');
    setEndereco(configuracao.municipioEndereco ?? '');
    setTelefone(configuracao.municipioTelefone ?? '');
    setPrefeito(configuracao.prefeitoNome ?? '');
    setBrasaoUrl(configuracao.brasaoUrl ?? '');
  }, [configuracao]);

  if (!configuracao) return <p className="text-sm text-neutral-500">Carregando…</p>;

  return (
    <div className="max-w-xl">
      <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
        Estes dados aparecem no cabeçalho dos relatórios em PDF e identificam o município no sistema.
      </p>

      <div className="space-y-4">
        <div className="grid grid-cols-[1fr_100px] gap-4">
          <div>
            <label className={CLASSE_ROTULO}>Município</label>
            <input value={nome} onChange={(e) => setNome(e.target.value)} className={CLASSE_CAMPO} />
          </div>
          <div>
            <label className={CLASSE_ROTULO}>UF</label>
            <input
              value={uf}
              maxLength={2}
              onChange={(e) => setUf(e.target.value.toUpperCase())}
              className={CLASSE_CAMPO}
            />
          </div>
        </div>

        <div>
          <label className={CLASSE_ROTULO}>CNPJ</label>
          <input value={cnpj} onChange={(e) => setCnpj(e.target.value)} className={CLASSE_CAMPO} />
        </div>

        <div>
          <label className={CLASSE_ROTULO}>Endereço</label>
          <input value={endereco} onChange={(e) => setEndereco(e.target.value)} className={CLASSE_CAMPO} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={CLASSE_ROTULO}>Telefone</label>
            <input value={telefone} onChange={(e) => setTelefone(e.target.value)} className={CLASSE_CAMPO} />
          </div>
          <div>
            <label className={CLASSE_ROTULO}>Prefeito(a)</label>
            <input value={prefeito} onChange={(e) => setPrefeito(e.target.value)} className={CLASSE_CAMPO} />
          </div>
        </div>

        <div>
          <label className={CLASSE_ROTULO}>URL do brasão</label>
          <input
            value={brasaoUrl}
            onChange={(e) => setBrasaoUrl(e.target.value)}
            placeholder="https://…"
            className={CLASSE_CAMPO}
          />
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            Endereço de uma imagem já hospedada. Se a exibição estiver ligada na aba Layout, ela sai no topo dos
            relatórios.
          </p>
        </div>
      </div>

      <BarraSalvar
        salvando={salvando}
        erro={erro}
        salvoAgora={salvoAgora}
        desabilitado={!nome.trim() || uf.trim().length !== 2}
        aoSalvar={() =>
          salvar({
            municipioNome: nome,
            municipioUf: uf,
            municipioCnpj: cnpj || null,
            municipioEndereco: endereco || null,
            municipioTelefone: telefone || null,
            prefeitoNome: prefeito || null,
            brasaoUrl: brasaoUrl || null,
          })
        }
      />
    </div>
  );
}
