import { esquemaAtualizarConvenio, esquemaCriarConvenio } from './convenio';

const BASE_VALIDA = {
  orgaoConcedenteId: '11111111-1111-1111-1111-111111111111',
  tipoInstrumento: 'Convenio',
  objeto: 'Pavimentação de vias públicas',
};

describe('esquemaCriarConvenio', () => {
  it('aceita o payload mínimo válido e aplica o default de statusGeral', () => {
    const resultado = esquemaCriarConvenio.parse(BASE_VALIDA);
    expect(resultado.statusGeral).toBe('EmElaboracaoProjeto');
  });

  it('rejeita orgaoConcedenteId que não seja um uuid', () => {
    const resultado = esquemaCriarConvenio.safeParse({ ...BASE_VALIDA, orgaoConcedenteId: 'não-é-uuid' });
    expect(resultado.success).toBe(false);
  });

  it('rejeita objeto vazio ou só com espaços', () => {
    expect(esquemaCriarConvenio.safeParse({ ...BASE_VALIDA, objeto: '   ' }).success).toBe(false);
  });

  it('rejeita valores monetários negativos', () => {
    expect(esquemaCriarConvenio.safeParse({ ...BASE_VALIDA, valorConveniado: -100 }).success).toBe(false);
  });

  it('aceita valorConveniado zero (nonnegative, não positive)', () => {
    expect(esquemaCriarConvenio.safeParse({ ...BASE_VALIDA, valorConveniado: 0 }).success).toBe(true);
  });

  it('rejeita percentuais fora do intervalo 0-100', () => {
    expect(esquemaCriarConvenio.safeParse({ ...BASE_VALIDA, percentualExecutadoFisico: 101 }).success).toBe(false);
    expect(esquemaCriarConvenio.safeParse({ ...BASE_VALIDA, percentualExecutadoFisico: -1 }).success).toBe(false);
  });

  it('rejeita tipoInstrumento fora do enum permitido', () => {
    expect(esquemaCriarConvenio.safeParse({ ...BASE_VALIDA, tipoInstrumento: 'Outro' }).success).toBe(false);
  });

  it('rejeita datas fora do formato ISO (YYYY-MM-DD)', () => {
    expect(esquemaCriarConvenio.safeParse({ ...BASE_VALIDA, dataAssinatura: '05/03/2026' }).success).toBe(false);
  });
});

describe('esquemaAtualizarConvenio', () => {
  it('aceita um objeto vazio (todos os campos são parciais em atualização)', () => {
    expect(esquemaAtualizarConvenio.safeParse({}).success).toBe(true);
  });

  it('ainda valida o formato dos campos informados', () => {
    expect(esquemaAtualizarConvenio.safeParse({ valorConcedido: -1 }).success).toBe(false);
  });
});
