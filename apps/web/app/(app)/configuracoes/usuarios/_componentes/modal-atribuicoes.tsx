'use client';

import { useEffect, useState } from 'react';
import {
  DESCRICOES_NIVEL_PERMISSAO,
  GRUPOS_MODULO,
  MODULOS_SISTEMA,
  NIVEIS_PERMISSAO,
  ROTULOS_MODULO_SISTEMA,
  ROTULOS_NIVEL_PERMISSAO,
  type MapaPermissoes,
  type ModuloSistema,
  type NivelPermissao,
} from '@jconv/compartilhado';
import { BotaoFecharJanela } from '@jconv/compartilhado/componentes';

export interface ModalAtribuicoesProps {
  nomeUsuario: string;
  /** Níveis atuais; módulos ausentes valem 'Nenhuma'. */
  valor: MapaPermissoes;
  aoConfirmar: (permissoes: MapaPermissoes) => void;
  aoFechar: () => void;
}

const CORES_NIVEL: Record<NivelPermissao, string> = {
  Nenhuma: 'border-neutral-300 text-neutral-600 dark:border-neutral-700 dark:text-neutral-300',
  Parcial: 'border-amber-400 bg-amber-50 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200',
  Total: 'border-green-500 bg-green-50 text-green-900 dark:bg-green-950/50 dark:text-green-200',
};

export function ModalAtribuicoes({ nomeUsuario, valor, aoConfirmar, aoFechar }: ModalAtribuicoesProps) {
  const [niveis, setNiveis] = useState<MapaPermissoes>(valor);

  useEffect(() => {
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === 'Escape') aoFechar();
    }
    document.addEventListener('keydown', aoTeclar);
    return () => document.removeEventListener('keydown', aoTeclar);
  }, [aoFechar]);

  function definir(modulo: ModuloSistema, nivel: NivelPermissao) {
    setNiveis((atual) => ({ ...atual, [modulo]: nivel }));
  }

  function aplicarEmTodos(nivel: NivelPermissao) {
    setNiveis(Object.fromEntries(MODULOS_SISTEMA.map((m) => [m, nivel])) as MapaPermissoes);
  }

  const totalComAcesso = MODULOS_SISTEMA.filter((m) => (niveis[m] ?? 'Nenhuma') !== 'Nenhuma').length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-atribuicoes-titulo"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div className="flex max-h-[88vh] w-full max-w-3xl flex-col rounded-lg bg-white shadow-xl dark:bg-neutral-900">
        <div className="flex items-start justify-between gap-3 border-b border-neutral-200 p-5 dark:border-neutral-800">
          <div>
            <h2 id="modal-atribuicoes-titulo" className="text-lg font-semibold">
              Atribuições {nomeUsuario && `— ${nomeUsuario}`}
            </h2>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              Defina o que o usuário pode fazer em cada tela do sistema.
            </p>
          </div>
          <BotaoFecharJanela aoFechar={aoFechar} />
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200 px-5 py-3 text-sm dark:border-neutral-800">
          <span className="text-neutral-500 dark:text-neutral-400">Aplicar a todas:</span>
          {NIVEIS_PERMISSAO.map((nivel) => (
            <button
              key={nivel}
              type="button"
              onClick={() => aplicarEmTodos(nivel)}
              className="rounded-md border border-neutral-300 px-2.5 py-1 text-xs font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
            >
              {ROTULOS_NIVEL_PERMISSAO[nivel]}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-auto p-5">
          {/* Legenda: sem ela, "Parcial" e "Total" não dizem nada a quem não conhece o sistema. */}
          <ul className="mb-4 space-y-0.5 text-xs text-neutral-500 dark:text-neutral-400">
            {NIVEIS_PERMISSAO.map((nivel) => (
              <li key={nivel}>
                <span className="font-medium text-neutral-700 dark:text-neutral-300">
                  {ROTULOS_NIVEL_PERMISSAO[nivel]}
                </span>{' '}
                — {DESCRICOES_NIVEL_PERMISSAO[nivel]}
              </li>
            ))}
          </ul>

          {GRUPOS_MODULO.map((grupo) => (
            <section key={grupo.titulo} className="mb-5">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">{grupo.titulo}</h3>
              <div className="space-y-1.5">
                {grupo.modulos.map((modulo) => {
                  const atual = niveis[modulo] ?? 'Nenhuma';
                  return (
                    <div
                      key={modulo}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-neutral-200 px-3 py-2 dark:border-neutral-800"
                    >
                      <span className="text-sm">{ROTULOS_MODULO_SISTEMA[modulo]}</span>
                      <div className="flex gap-1" role="group" aria-label={`Nível em ${ROTULOS_MODULO_SISTEMA[modulo]}`}>
                        {NIVEIS_PERMISSAO.map((nivel) => (
                          <button
                            key={nivel}
                            type="button"
                            aria-pressed={atual === nivel}
                            onClick={() => definir(modulo, nivel)}
                            className={`rounded-md border px-2.5 py-1 text-xs font-medium transition ${
                              atual === nivel
                                ? CORES_NIVEL[nivel]
                                : 'border-transparent text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                            }`}
                          >
                            {ROTULOS_NIVEL_PERMISSAO[nivel]}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-neutral-200 p-4 dark:border-neutral-800">
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            {totalComAcesso} de {MODULOS_SISTEMA.length} telas liberadas
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={aoFechar}
              className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => aoConfirmar(niveis)}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Aplicar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
