import PDFDocument from 'pdfkit';

export const COR_PRIMARIA = '#1d4ed8';
export const COR_TEXTO_SECUNDARIO = '#52514e';
export const COR_GRADE = '#e1e0d9';

export function formatarMoeda(valor: number | null | undefined) {
  if (valor == null) return '—';
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatarData(data: string | null | undefined) {
  if (!data) return '—';
  return new Date(data).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

// Para colunas TIMESTAMPTZ (ex.: histórico de observações). Fixa o fuso de Irauçuba/CE em vez
// de usar o do servidor, senão o mesmo registro sai com hora diferente em produção (UTC) e no
// ambiente local.
export function formatarDataHora(dataHora: string | null | undefined) {
  if (!dataHora) return '—';
  return new Date(dataHora).toLocaleString('pt-BR', {
    timeZone: 'America/Fortaleza',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const ORIENTACOES_PDF = ['retrato', 'paisagem'] as const;
export type OrientacaoPdf = (typeof ORIENTACOES_PDF)[number];

export function criarDocumento(
  titulo: string,
  subtitulo?: string,
  orientacao: OrientacaoPdf = 'retrato',
): PDFKit.PDFDocument {
  const doc = new PDFDocument({
    size: 'A4',
    layout: orientacao === 'paisagem' ? 'landscape' : 'portrait',
    margin: 40,
    bufferPages: true,
  });

  doc.fillColor(COR_PRIMARIA).fontSize(18).text('jConv', { continued: false });
  doc.fillColor('#000000').fontSize(14).text(titulo, { paragraphGap: 2 });
  if (subtitulo) {
    doc.fillColor(COR_TEXTO_SECUNDARIO).fontSize(9).text(subtitulo);
  }
  doc
    .fillColor(COR_TEXTO_SECUNDARIO)
    .fontSize(8)
    .text(`Gerado em ${new Date().toLocaleString('pt-BR')}`, { align: 'right' });
  doc.moveDown(1);
  doc.fillColor('#000000');

  return doc;
}

export interface ColunaTabela {
  rotulo: string;
  /** Peso relativo da coluna, não medida absoluta: as larguras são normalizadas para preencher
   *  a página, então a mesma definição serve em retrato e em paisagem. */
  largura: number;
  alinhar?: 'left' | 'right' | 'center';
}

const RECUO_CELULA_X = 4;
const RECUO_CELULA_Y = 5;
const ALTURA_MINIMA_LINHA = 20;
const FONTE_CABECALHO = 9;
const FONTE_CORPO = 8.5;

// Renderizador de tabela mínimo (pdfkit não tem tabela nativa) — reaproveitado por todos os
// relatórios: cabeçalho com fundo, linhas zebradas, quebra de página automática.
export function desenharTabela(
  doc: PDFKit.PDFDocument,
  colunas: ColunaTabela[],
  linhas: (string | number)[][],
) {
  const margemEsquerda = doc.page.margins.left;
  const larguraUtil = doc.page.width - margemEsquerda - doc.page.margins.right;

  // Normaliza as larguras declaradas para a largura real da página. Sem isso, a tabela ficaria
  // com um vão à direita em paisagem (as larguras foram escritas pensando no A4 em pé).
  const somaDeclarada = colunas.reduce((total, coluna) => total + coluna.largura, 0);
  const larguras = colunas.map((coluna) => (coluna.largura / somaDeclarada) * larguraUtil);

  // Altura calculada a partir do texto que de fato vai ser desenhado. Com altura fixa, uma
  // célula longa (ex.: "Objeto") quebrava em várias linhas e invadia a linha seguinte.
  function alturaNecessaria(valores: (string | number)[], tamanhoFonte: number) {
    doc.fontSize(tamanhoFonte);
    const maiorAltura = valores.reduce<number>((maior, valor, i) => {
      const altura = doc.heightOfString(String(valor), { width: larguras[i] - RECUO_CELULA_X * 2 });
      return Math.max(maior, altura);
    }, 0);
    return Math.max(ALTURA_MINIMA_LINHA, maiorAltura + RECUO_CELULA_Y * 2);
  }

  function desenharLinha(valores: (string | number)[], y: number, altura: number, tamanhoFonte: number) {
    doc.fontSize(tamanhoFonte);
    let x = margemEsquerda;
    valores.forEach((valor, i) => {
      doc.text(String(valor), x + RECUO_CELULA_X, y + RECUO_CELULA_Y, {
        width: larguras[i] - RECUO_CELULA_X * 2,
        align: colunas[i].alinhar ?? 'left',
      });
      x += larguras[i];
    });
  }

  function desenharCabecalho() {
    const rotulos = colunas.map((coluna) => coluna.rotulo);
    const altura = alturaNecessaria(rotulos, FONTE_CABECALHO);
    const y = doc.y;
    doc.rect(margemEsquerda, y, larguraUtil, altura).fill(COR_PRIMARIA);
    doc.fillColor('#ffffff');
    desenharLinha(rotulos, y, altura, FONTE_CABECALHO);
    doc.fillColor('#000000');
    doc.y = y + altura;
  }

  desenharCabecalho();

  linhas.forEach((linha, indice) => {
    const altura = alturaNecessaria(linha, FONTE_CORPO);

    if (doc.y + altura > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      desenharCabecalho();
    }

    const y = doc.y;
    if (indice % 2 === 1) {
      doc.rect(margemEsquerda, y, larguraUtil, altura).fill('#f5f5f4');
      doc.fillColor('#000000');
    }

    desenharLinha(linha, y, altura, FONTE_CORPO);
    doc.y = y + altura;
  });

  doc.moveDown(1);
}
