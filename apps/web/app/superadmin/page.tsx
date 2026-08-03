'use client';

import { useCallback, useEffect, useState } from 'react';
import { Archive, Building, CheckCircle, Plus, RefreshCw, XCircle } from 'lucide-react';
import { chamarSuperadmin, type ClienteMunicipio } from '@/lib/api/superadmin';
import { CartaoMunicipio } from './_componentes/cartao-municipio';
import { ModalGerenciar } from './_componentes/modal-gerenciar';
import { ModalNovoMunicipio } from './_componentes/modal-novo-municipio';
import { BOTAO_PRIMARIO, BOTAO_SECUNDARIO, Indicador } from './_componentes/ui';

export default function PainelSuperadmin() {
  const [municipios, setMunicipios] = useState<ClienteMunicipio[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [mostrarNovo, setMostrarNovo] = useState(false);
  const [gerenciando, setGerenciando] = useState<{ municipio: ClienteMunicipio; aba: string } | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro('');
    try {
      setMunicipios(await chamarSuperadmin<ClienteMunicipio[]>('/clientes'));
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function alternarAtivo(municipio: ClienteMunicipio) {
    setErro('');
    try {
      await chamarSuperadmin(`/clientes/${municipio.slug}/ativo`, {
        method: 'PATCH',
        body: JSON.stringify({ ativo: !municipio.ativo }),
      });
      await carregar();
    } catch (e) {
      setErro((e as Error).message);
    }
  }

  async function atualizarEstruturaDeTodos() {
    setErro('');
    setAviso('');
    try {
      const r = await chamarSuperadmin<{ slug: string; aplicadas: number }[]>('/clientes/migrar', { method: 'POST' });
      const total = r.reduce((soma, item) => soma + item.aplicadas, 0);
      setAviso(total ? `${total} migration(s) aplicada(s).` : 'Todos os municípios já estavam atualizados.');
      await carregar();
    } catch (e) {
      setErro((e as Error).message);
    }
  }

  const ativos = municipios.filter((m) => m.ativo).length;
  const totalConvenios = municipios.reduce((s, m) => s + m.convenios, 0);

  return (
    <>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Indicador rotulo="Municípios" valor={municipios.length} Icone={Building} />
        <Indicador rotulo="Ativos" valor={ativos} Icone={CheckCircle} />
        <Indicador rotulo="Inativos" valor={municipios.length - ativos} Icone={XCircle} />
        <Indicador rotulo="Convênios" valor={totalConvenios} Icone={Archive} />
      </div>

      {erro && <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">{erro}</p>}
      {aviso && <p className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300">{aviso}</p>}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Municípios cadastrados</h2>
          <p className="mt-0.5 text-xs text-neutral-500">
            {municipios.length} município{municipios.length !== 1 ? 's' : ''} cadastrado
            {municipios.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={atualizarEstruturaDeTodos}
            className={`${BOTAO_SECUNDARIO} flex items-center gap-1.5`}
            title="Aplica em todos os municípios a estrutura que ainda faltar"
          >
            <RefreshCw className="h-4 w-4" /> Atualizar estrutura
          </button>
          <button
            type="button"
            onClick={() => setMostrarNovo(true)}
            className={`${BOTAO_PRIMARIO} flex items-center gap-2`}
          >
            <Plus className="h-4 w-4" /> Novo Município
          </button>
        </div>
      </div>

      {carregando ? (
        <div className="py-12 text-center text-neutral-400">
          <RefreshCw className="mx-auto mb-3 h-8 w-8 animate-spin" />
          Carregando...
        </div>
      ) : municipios.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 py-16 text-center dark:border-neutral-700">
          <Building className="mx-auto mb-3 h-10 w-10 text-neutral-300 dark:text-neutral-600" />
          <p className="font-medium text-neutral-500">Nenhum município cadastrado</p>
          <p className="mt-1 text-sm text-neutral-400">Crie o primeiro para começar a locar o sistema.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {municipios.map((municipio) => (
            <CartaoMunicipio
              key={municipio.id}
              municipio={municipio}
              aoGerenciar={(aba) => setGerenciando({ municipio, aba: aba ?? 'info' })}
              aoAlternarAtivo={() => alternarAtivo(municipio)}
            />
          ))}
        </div>
      )}

      {mostrarNovo && (
        <ModalNovoMunicipio
          aoFechar={() => setMostrarNovo(false)}
          aoCriar={(mensagem) => {
            setAviso(mensagem);
            carregar();
          }}
        />
      )}

      {gerenciando && (
        <ModalGerenciar
          municipio={gerenciando.municipio}
          abaInicial={gerenciando.aba}
          aoFechar={() => setGerenciando(null)}
          aoAtualizar={carregar}
        />
      )}
    </>
  );
}
