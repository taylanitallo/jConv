'use client';

import { useCallback, useEffect, useState } from 'react';
import { Archive, Building, CheckCircle, Plus, RefreshCw, XCircle } from 'lucide-react';
import { chamarSuperadmin, type ClienteMunicipio } from '@/lib/api/superadmin';
import { CartaoMunicipio } from './_componentes/cartao-municipio';
import { ModalGerenciar } from './_componentes/modal-gerenciar';
import { ModalNovoMunicipio } from './_componentes/modal-novo-municipio';
import { Indicador } from './_componentes/ui';

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
        <Indicador rotulo="Municípios" valor={municipios.length} cor="blue" Icone={Building} />
        <Indicador rotulo="Ativos" valor={ativos} cor="green" Icone={CheckCircle} />
        <Indicador rotulo="Inativos" valor={municipios.length - ativos} cor="red" Icone={XCircle} />
        <Indicador rotulo="Convênios" valor={totalConvenios} cor="purple" Icone={Archive} />
      </div>

      {erro && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{erro}</p>}
      {aviso && <p className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">{aviso}</p>}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Municípios Cadastrados</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            {municipios.length} município{municipios.length !== 1 ? 's' : ''} cadastrado
            {municipios.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={atualizarEstruturaDeTodos}
            className="flex items-center gap-1.5 rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50"
            title="Aplica em todos os municípios a estrutura que ainda faltar"
          >
            <RefreshCw className="h-4 w-4" /> Atualizar estrutura
          </button>
          <button
            type="button"
            onClick={() => setMostrarNovo(true)}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" /> Novo Município
          </button>
        </div>
      </div>

      {carregando ? (
        <div className="py-12 text-center text-gray-400">
          <RefreshCw className="mx-auto mb-3 h-8 w-8 animate-spin" />
          Carregando...
        </div>
      ) : municipios.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 py-16 text-center">
          <Building className="mx-auto mb-3 h-10 w-10 text-gray-300" />
          <p className="font-medium text-gray-500">Nenhum município cadastrado</p>
          <p className="mt-1 text-sm text-gray-400">Crie o primeiro para começar a locar o sistema.</p>
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
