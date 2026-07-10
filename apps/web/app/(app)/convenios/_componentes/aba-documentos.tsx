'use client';

import { useEffect, useRef, useState } from 'react';
import { ModalConfirmacaoExclusao } from '@jconv/compartilhado/componentes';
import { TIPOS_DOCUMENTO_ANEXO, ROTULOS_TIPO_DOCUMENTO_ANEXO, type DocumentoAnexo } from '@jconv/compartilhado';
import { documentosAnexosApi, iaApi } from '../../../../lib/api/recursos';
import { ErroApi } from '../../../../lib/api/cliente';
import { criarClienteSupabaseNavegador } from '../../../../lib/supabase/cliente-navegador';

export function AbaDocumentos({ convenioId }: { convenioId: string }) {
  const [itens, setItens] = useState<DocumentoAnexo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [tipo, setTipo] = useState(TIPOS_DOCUMENTO_ANEXO[0]);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [paraExcluir, setParaExcluir] = useState<DocumentoAnexo | null>(null);
  const [extraindoId, setExtraindoId] = useState<string | null>(null);
  const [sugestao, setSugestao] = useState<{ documentoId: string; dados: Record<string, unknown> } | null>(null);
  const inputArquivoRef = useRef<HTMLInputElement>(null);

  async function carregar() {
    setCarregando(true);
    setItens(await documentosAnexosApi.listar({ convenioId }));
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [convenioId]);

  async function aoEscolherArquivo(evento: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    if (!arquivo) return;

    setErro(null);
    setEnviando(true);
    try {
      const { caminho, token } = await documentosAnexosApi.criarUploadAssinado(arquivo.name);
      const supabase = criarClienteSupabaseNavegador();
      const { error } = await supabase.storage.from('documentos-anexos').uploadToSignedUrl(caminho, token, arquivo);
      if (error) throw error;

      await documentosAnexosApi.registrar({ convenioId, tipo, nomeArquivo: arquivo.name, arquivoCaminho: caminho });
      await carregar();
    } catch (excecao) {
      setErro(excecao instanceof Error ? excecao.message : 'Erro ao enviar arquivo');
    } finally {
      setEnviando(false);
      if (inputArquivoRef.current) inputArquivoRef.current.value = '';
    }
  }

  async function baixar(documento: DocumentoAnexo) {
    const { url } = await documentosAnexosApi.obterUrlDownload(documento.id);
    window.open(url, '_blank');
  }

  async function sugerirExtracao(documento: DocumentoAnexo) {
    setErro(null);
    setExtraindoId(documento.id);
    setSugestao(null);
    try {
      const dados = await iaApi.extrairDocumento(documento.id);
      setSugestao({ documentoId: documento.id, dados });
    } catch (excecao) {
      if (excecao instanceof ErroApi && excecao.status === 503) {
        setErro('Assistente de IA ainda não configurado neste ambiente.');
      } else {
        setErro(excecao instanceof Error ? excecao.message : 'Erro ao extrair dados do documento');
      }
    } finally {
      setExtraindoId(null);
    }
  }

  async function excluir() {
    if (!paraExcluir) return;
    await documentosAnexosApi.excluir(paraExcluir.id);
    setParaExcluir(null);
    await carregar();
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value as typeof tipo)}
          className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-800"
        >
          {TIPOS_DOCUMENTO_ANEXO.map((v) => (
            <option key={v} value={v}>
              {ROTULOS_TIPO_DOCUMENTO_ANEXO[v]}
            </option>
          ))}
        </select>
        <input ref={inputArquivoRef} type="file" onChange={aoEscolherArquivo} disabled={enviando} className="text-sm" />
        {enviando && <span className="text-sm text-neutral-500">Enviando…</span>}
      </div>

      {erro && <p className="mb-3 text-sm text-red-600">{erro}</p>}

      {sugestao && (
        <div className="mb-3 rounded-md border border-blue-200 bg-blue-50 p-3 text-xs dark:border-blue-900 dark:bg-blue-950">
          <p className="mb-1 font-medium text-blue-900 dark:text-blue-200">
            Sugestão de dados extraídos pela IA (confira antes de lançar manualmente em Medições/Repasses):
          </p>
          <pre className="whitespace-pre-wrap text-blue-800 dark:text-blue-300">
            {JSON.stringify(sugestao.dados, null, 2)}
          </pre>
        </div>
      )}

      {carregando ? (
        <p className="text-sm text-neutral-500">Carregando…</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 dark:bg-neutral-900">
            <tr>
              <th className="px-3 py-2 font-medium">Arquivo</th>
              <th className="px-3 py-2 font-medium">Tipo</th>
              <th className="px-3 py-2 font-medium">Enviado em</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {itens.map((d) => (
              <tr key={d.id} className="border-t border-neutral-200 dark:border-neutral-800">
                <td className="px-3 py-2">{d.nomeArquivo}</td>
                <td className="px-3 py-2">{ROTULOS_TIPO_DOCUMENTO_ANEXO[d.tipo]}</td>
                <td className="px-3 py-2">{new Date(d.dataUpload).toLocaleDateString('pt-BR')}</td>
                <td className="px-3 py-2 text-right">
                  <button
                    onClick={() => sugerirExtracao(d)}
                    disabled={extraindoId === d.id}
                    className="mr-3 text-blue-600 hover:underline disabled:opacity-50"
                  >
                    {extraindoId === d.id ? 'Extraindo…' : 'Sugerir extração (IA)'}
                  </button>
                  <button onClick={() => baixar(d)} className="mr-3 text-blue-600 hover:underline">
                    Baixar
                  </button>
                  <button onClick={() => setParaExcluir(d)} className="text-red-600 hover:underline">
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
            {itens.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-4 text-center text-neutral-500">
                  Nenhum documento anexado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {paraExcluir && (
        <ModalConfirmacaoExclusao
          nomeRegistro={paraExcluir.nomeArquivo}
          aoConfirmar={excluir}
          aoCancelar={() => setParaExcluir(null)}
        />
      )}
    </div>
  );
}
