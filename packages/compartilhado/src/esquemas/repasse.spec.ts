import { esquemaCriarRepasse } from './repasse';

const base = {
  convenioId: '11111111-1111-1111-1111-111111111111',
  tipo: 'Parcela',
  data: '2026-01-15',
  valor: 1000,
};

describe('esquemaCriarRepasse', () => {
  it('aceita um repasse válido', () => {
    expect(esquemaCriarRepasse.safeParse(base).success).toBe(true);
  });

  it('rejeita valor zero (repasse exige positive, não nonnegative)', () => {
    expect(esquemaCriarRepasse.safeParse({ ...base, valor: 0 }).success).toBe(false);
  });

  it('rejeita valor negativo', () => {
    expect(esquemaCriarRepasse.safeParse({ ...base, valor: -50 }).success).toBe(false);
  });

  it('rejeita tipo fora do enum de TIPOS_REPASSE', () => {
    expect(esquemaCriarRepasse.safeParse({ ...base, tipo: 'Inexistente' }).success).toBe(false);
  });
});
