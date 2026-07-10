import { paraCamelCase } from './mapeadores';

describe('paraCamelCase', () => {
  it('converte chaves snake_case simples', () => {
    expect(paraCamelCase({ numero_sequencial: 1, objeto: 'Pavimentação' })).toEqual({
      numeroSequencial: 1,
      objeto: 'Pavimentação',
    });
  });

  it('converte chaves aninhadas em objetos', () => {
    expect(paraCamelCase({ orgao_concedente: { parlamentar_padrinho: 'X' } })).toEqual({
      orgaoConcedente: { parlamentarPadrinho: 'X' },
    });
  });

  it('converte cada item de um array', () => {
    expect(paraCamelCase([{ data_assinatura: '2026-01-01' }, { data_assinatura: '2026-02-01' }])).toEqual([
      { dataAssinatura: '2026-01-01' },
      { dataAssinatura: '2026-02-01' },
    ]);
  });

  it('preserva valores nulos, primitivos e instâncias de Date sem alterar', () => {
    const data = new Date('2026-01-01T00:00:00.000Z');
    expect(paraCamelCase(null)).toBeNull();
    expect(paraCamelCase(42)).toBe(42);
    expect(paraCamelCase('texto')).toBe('texto');
    expect(paraCamelCase(data)).toBe(data);
  });

  it('lida com chaves que já têm múltiplos underscores seguidos de dígitos', () => {
    expect(paraCamelCase({ numero_nup_2026: 'ABC' })).toEqual({ numeroNup2026: 'ABC' });
  });
});
