import { formatarData, formatarMoeda } from './pdf-utilitarios';

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
