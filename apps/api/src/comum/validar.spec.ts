import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import { validarComEsquema } from './validar';

const esquema = z.object({
  nome: z.string().trim().min(1, 'Informe o nome'),
  status: z.enum(['Ativo', 'Inativo']).default('Ativo'),
});

describe('validarComEsquema', () => {
  it('retorna os dados já parseados quando válidos', () => {
    expect(validarComEsquema(esquema, { nome: 'Teste' })).toEqual({ nome: 'Teste', status: 'Ativo' });
  });

  it('aplica valores default do schema quando o campo é omitido', () => {
    const resultado = validarComEsquema(esquema, { nome: 'Teste' });
    expect(resultado.status).toBe('Ativo');
  });

  it('lança BadRequestException com os erros detalhados quando inválido', () => {
    expect(() => validarComEsquema(esquema, { nome: '' })).toThrow(BadRequestException);
  });

  it('inclui os detalhes de campo (fieldErrors) no corpo da exceção', () => {
    try {
      validarComEsquema(esquema, { nome: '' });
      fail('deveria ter lançado');
    } catch (excecao) {
      expect(excecao).toBeInstanceOf(BadRequestException);
      const resposta = (excecao as BadRequestException).getResponse() as { fieldErrors: Record<string, unknown> };
      expect(resposta.fieldErrors).toHaveProperty('nome');
    }
  });
});
