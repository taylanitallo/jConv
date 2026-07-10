import { esquemaCriarProposta, esquemaPromoverPropostaParaConvenio } from './proposta';

describe('esquemaCriarProposta', () => {
  const base = {
    orgaoConcedenteId: '11111111-1111-1111-1111-111111111111',
    objeto: 'Construção de posto de saúde',
  };

  it('aplica o default de status EmAnalise quando omitido', () => {
    expect(esquemaCriarProposta.parse(base).status).toBe('EmAnalise');
  });

  it('rejeita objeto vazio', () => {
    expect(esquemaCriarProposta.safeParse({ ...base, objeto: '' }).success).toBe(false);
  });
});

describe('esquemaPromoverPropostaParaConvenio', () => {
  it('aceita o payload mínimo com apenas o tipoInstrumento', () => {
    expect(esquemaPromoverPropostaParaConvenio.safeParse({ tipoInstrumento: 'Convenio' }).success).toBe(true);
  });

  it('rejeita tipoInstrumento fora da lista de instrumentos válidos', () => {
    expect(esquemaPromoverPropostaParaConvenio.safeParse({ tipoInstrumento: 'Doacao' }).success).toBe(false);
  });

  it('rejeita valores negativos nos campos monetários', () => {
    expect(
      esquemaPromoverPropostaParaConvenio.safeParse({ tipoInstrumento: 'Convenio', valorConveniado: -1 }).success,
    ).toBe(false);
  });

  it('aceita todos os tipos de instrumento previstos na regra de negócio', () => {
    const tipos = ['Convenio', 'TermoDeCompromisso', 'EmendaParlamentar', 'TransferenciaEspecial', 'ContratoDeRepasse'];
    for (const tipoInstrumento of tipos) {
      expect(esquemaPromoverPropostaParaConvenio.safeParse({ tipoInstrumento }).success).toBe(true);
    }
  });
});
