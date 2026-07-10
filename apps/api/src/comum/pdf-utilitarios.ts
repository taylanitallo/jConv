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

export function criarDocumento(titulo: string, subtitulo?: string): PDFKit.PDFDocument {
  const doc = new PDFDocument({ size: 'A4', margin: 40, bufferPages: true });

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
  largura: number;
  alinhar?: 'left' | 'right' | 'center';
}

// Renderizador de tabela mínimo (pdfkit não tem tabela nativa) — reaproveitado por todos os
// relatórios: cabeçalho com fundo, linhas zebradas, quebra de página automática.
export function desenharTabela(
  doc: PDFKit.PDFDocument,
  colunas: ColunaTabela[],
  linhas: (string | number)[][],
) {
  const margemEsquerda = doc.page.margins.left;
  const larguraUtil = doc.page.width - margemEsquerda - doc.page.margins.right;
  const alturaLinha = 20;

  function desenharCabecalho() {
    const y = doc.y;
    doc.rect(margemEsquerda, y, larguraUtil, alturaLinha).fill(COR_PRIMARIA);
    doc.fillColor('#ffffff').fontSize(9);
    let x = margemEsquerda;
    for (const coluna of colunas) {
      doc.text(coluna.rotulo, x + 4, y + 6, { width: coluna.largura - 8, align: coluna.alinhar ?? 'left' });
      x += coluna.largura;
    }
    doc.fillColor('#000000');
    doc.y = y + alturaLinha;
  }

  desenharCabecalho();

  linhas.forEach((linha, indice) => {
    if (doc.y + alturaLinha > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      desenharCabecalho();
    }

    const y = doc.y;
    if (indice % 2 === 1) {
      doc.rect(margemEsquerda, y, larguraUtil, alturaLinha).fill('#f5f5f4');
      doc.fillColor('#000000');
    }

    let x = margemEsquerda;
    doc.fontSize(8.5);
    linha.forEach((valor, i) => {
      const coluna = colunas[i];
      doc.text(String(valor), x + 4, y + 5, { width: coluna.largura - 8, align: coluna.alinhar ?? 'left' });
      x += coluna.largura;
    });
    doc.y = y + alturaLinha;
  });

  doc.moveDown(1);
}
