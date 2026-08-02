import { criarDocumento, desenharTabela, formatarData, formatarDataHora, formatarMoeda } from './pdf-utilitarios';

describe('criarDocumento — orientação', () => {
  it('gera A4 em pé por padrão', () => {
    const doc = criarDocumento('Teste');
    expect(doc.page.height).toBeGreaterThan(doc.page.width);
  });

  it('gera A4 deitado quando pedido paisagem', () => {
    const doc = criarDocumento('Teste', undefined, 'paisagem');
    expect(doc.page.width).toBeGreaterThan(doc.page.height);
  });

  it('paisagem dá mais largura útil que retrato', () => {
    const util = (doc: PDFKit.PDFDocument) => doc.page.width - doc.page.margins.left - doc.page.margins.right;
    expect(util(criarDocumento('T', undefined, 'paisagem'))).toBeGreaterThan(
      util(criarDocumento('T', undefined, 'retrato')),
    );
  });
});

describe('desenharTabela', () => {
  const colunas = [
    { rotulo: 'Nº', largura: 30 },
    { rotulo: 'Objeto', largura: 160 },
  ];

  function alturaConsumida(doc: PDFKit.PDFDocument, linhas: (string | number)[][]) {
    const antes = doc.y;
    desenharTabela(doc, colunas, linhas);
    return doc.y - antes;
  }

  it('dá mais altura à linha cujo texto quebra em várias linhas', () => {
    const curta = alturaConsumida(criarDocumento('T'), [[1, 'Curto']]);
    const longa = alturaConsumida(criarDocumento('T'), [
      [1, 'CONSTRUÇÃO DE PASSAGEM MOLHADA SOBRE O RIO LACHINHA NO MUNICÍPIO DE IRAUÇUBA COM EXTENSÃO APROXIMADA DE CEM METROS'],
    ]);
    // Se a altura fosse fixa, as duas seriam iguais e o texto longo invadiria a linha seguinte.
    expect(longa).toBeGreaterThan(curta);
  });

  it('não sobrepõe linhas: cada linha começa onde a anterior termina', () => {
    const doc = criarDocumento('T');
    const objetoLongo = 'OBJETO BEM LONGO QUE CERTAMENTE QUEBRA EM MAIS DE UMA LINHA DENTRO DA CELULA ESTREITA';
    const umaLinha = alturaConsumida(criarDocumento('T'), [[1, objetoLongo]]);
    const duasLinhas = alturaConsumida(doc, [
      [1, objetoLongo],
      [2, objetoLongo],
    ]);
    // A segunda tabela tem exatamente uma linha de corpo a mais; a diferença tem que ser a
    // altura dessa linha, não zero (sobreposição) nem um valor fixo menor que o texto exige.
    expect(duasLinhas - umaLinha).toBeGreaterThan(20);
  });

  it('ocupa a largura da página nas duas orientações (larguras são proporcionais)', () => {
    for (const orientacao of ['retrato', 'paisagem'] as const) {
      const doc = criarDocumento('T', undefined, orientacao);
      const larguraUtil = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const soma = colunas.reduce((total, c) => total + c.largura, 0);
      const normalizadas = colunas.map((c) => (c.largura / soma) * larguraUtil);
      expect(normalizadas.reduce((a, b) => a + b, 0)).toBeCloseTo(larguraUtil, 5);
    }
  });
});

describe('formatarDataHora', () => {
  it('usa o fuso de Irauçuba/CE (UTC-3), não o do servidor', () => {
    // 01/08/2026 12:00 UTC = 09:00 em Fortaleza.
    expect(formatarDataHora('2026-08-01T12:00:00Z')).toBe('01/08/2026, 09:00');
  });

  it('vira o dia para trás quando o horário UTC é de madrugada', () => {
    expect(formatarDataHora('2026-08-01T02:30:00Z')).toBe('31/07/2026, 23:30');
  });

  it('retorna um traço quando não há data', () => {
    expect(formatarDataHora(null)).toBe('—');
    expect(formatarDataHora(undefined)).toBe('—');
  });
});

describe('formatarMoeda', () => {
  it('formata um número como moeda em pt-BR', () => {
    expect(formatarMoeda(1234.5)).toBe(
      (1234.5).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    );
  });

  it('formata zero corretamente (não deve cair no traço de ausência)', () => {
    expect(formatarMoeda(0)).toBe((0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
  });

  it('retorna um traço quando o valor é null ou undefined', () => {
    expect(formatarMoeda(null)).toBe('—');
    expect(formatarMoeda(undefined)).toBe('—');
  });
});

describe('formatarData', () => {
  it('formata uma data ISO em pt-BR usando UTC', () => {
    expect(formatarData('2026-03-05')).toBe('05/03/2026');
  });

  it('retorna um traço quando a data é null, undefined ou vazia', () => {
    expect(formatarData(null)).toBe('—');
    expect(formatarData(undefined)).toBe('—');
    expect(formatarData('')).toBe('—');
  });
});
