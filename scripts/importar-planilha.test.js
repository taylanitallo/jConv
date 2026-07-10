// Testes das funções puras de parsing do importador da planilha histórica (Fase 2).
// Rodar com: node --test scripts/importar-planilha.test.js
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const {
  limpar,
  extrairDataTexto,
  extrairValorTexto,
  extrairPrimeiroPercentual,
  extrairNumerosProcesso,
  extrairEmpresa,
  interpretarOrgao,
  inferirStatusGeralConvenio,
} = require('./importar-planilha');

describe('limpar', () => {
  test('colapsa quebras de linha e espaços múltiplos, e retira as bordas', () => {
    assert.equal(limpar('  Texto\r\ncom   espaços  '), 'Texto com espaços');
  });

  test('retorna string vazia para undefined/null', () => {
    assert.equal(limpar(undefined), '');
    assert.equal(limpar(null), '');
  });

  test('converte números para string', () => {
    assert.equal(limpar(42), '42');
  });
});

describe('extrairDataTexto', () => {
  test('extrai uma data DD/MM/AAAA no meio de um texto solto', () => {
    assert.equal(extrairDataTexto('Assinado em 05/03/2026 conforme processo'), '2026-03-05');
  });

  test('retorna null quando não há data reconhecível', () => {
    assert.equal(extrairDataTexto('sem data nenhuma aqui'), null);
  });
});

describe('extrairValorTexto', () => {
  test('extrai um valor monetário no formato brasileiro (milhar com ponto, decimal com vírgula)', () => {
    assert.equal(extrairValorTexto('Valor desembolsado: R$ 1.234.567,89'), 1234567.89);
  });

  test('retorna null quando não há valor monetário reconhecível', () => {
    assert.equal(extrairValorTexto('nenhum valor aqui'), null);
  });
});

describe('extrairPrimeiroPercentual', () => {
  test('extrai um percentual com vírgula decimal', () => {
    assert.equal(extrairPrimeiroPercentual('Executado 45,5% da obra'), 45.5);
  });

  test('rejeita percentuais impossíveis acima de 100', () => {
    assert.equal(extrairPrimeiroPercentual('200% concluído'), null);
  });

  test('retorna null quando não há percentual', () => {
    assert.equal(extrairPrimeiroPercentual('sem percentual'), null);
  });
});

describe('extrairNumerosProcesso', () => {
  test('extrai MAPP, SIC, protocolo e NUP de um texto concatenado típico da planilha', () => {
    const texto = 'MAPP: 123.456 SIC: 987/2025 PROTOCOLO nº 555-A NUP: 00001.000123/2026-11';
    const r = extrairNumerosProcesso(texto);
    assert.equal(r.numeroMapp, '123.456');
    assert.equal(r.numeroSic, '987/2025');
    assert.equal(r.numeroProtocolo, '555-A');
    assert.equal(r.numeroNup, '00001.000123/2026-11');
  });

  test('não deixa a conta bancária vazar para o próximo rótulo (regressão: lookahead de corte)', () => {
    const texto = 'CAIXA: Ag 1234 CC 56789-0 MAPP: 999.888';
    const r = extrairNumerosProcesso(texto);
    assert.equal(r.contaBancaria, 'Ag 1234 CC 56789-0');
    assert.equal(r.numeroMapp, '999.888');
  });

  test('retorna null nos campos ausentes em vez de lançar erro', () => {
    const r = extrairNumerosProcesso('texto qualquer sem nenhum rótulo conhecido');
    assert.equal(r.numeroMapp, null);
    assert.equal(r.numeroSic, null);
    assert.equal(r.numeroConvenio, null);
  });
});

describe('extrairEmpresa', () => {
  test('separa nome da empresa e contato entre parênteses', () => {
    const r = extrairEmpresa('ITAPAJÉ CONSTRUÇÕES (Elhu Lira)');
    assert.equal(r.nome, 'ITAPAJÉ CONSTRUÇÕES');
    assert.equal(r.contato, 'Elhu Lira');
  });

  test('não deixa o comentário financeiro vazar para o nome quando vem antes do parêntese (regressão)', () => {
    const r = extrairEmpresa('CONSTRUTORA XYZ Valor desembolsado: R$ 100.000,00 (João Silva)');
    assert.equal(r.nome, 'CONSTRUTORA XYZ');
    assert.equal(r.contato, 'João Silva');
  });

  test('retorna null para texto vazio', () => {
    assert.equal(extrairEmpresa(''), null);
    assert.equal(extrairEmpresa(null), null);
  });
});

describe('interpretarOrgao', () => {
  test('reconhece um parlamentar conhecido e separa do nome do órgão', () => {
    const r = interpretarOrgao('EMENDA Danilo Forte - Secretaria da Saúde');
    assert.equal(r.parlamentar, 'Danilo Forte');
    assert.equal(r.nomeOrgao, '- Secretaria da Saúde');
  });

  test('usa "Não informado" quando o texto fica vazio e não há parlamentar', () => {
    assert.equal(interpretarOrgao('').nomeOrgao, 'Não informado');
  });

  test('usa o rótulo de emenda parlamentar quando só sobra o nome do parlamentar', () => {
    const r = interpretarOrgao('EMENDA Cid Gomes');
    assert.equal(r.nomeOrgao, 'Emenda Parlamentar (Cid Gomes)');
  });
});

describe('inferirStatusGeralConvenio', () => {
  test('reconhece obra parada', () => {
    assert.equal(inferirStatusGeralConvenio('OBRA PARADA por falta de material', 'obras'), 'ObraParada');
  });

  test('reconhece obra concluída', () => {
    assert.equal(inferirStatusGeralConvenio('OBRA CONCLUÍDA', 'obras'), 'ObraConcluida');
  });

  test('bloco "pc" com PC enviada tem prioridade sobre o default de prestação de contas', () => {
    assert.equal(inferirStatusGeralConvenio('PC ENVIADA ao órgão', 'pc'), 'PcEnviada');
  });

  test('bloco "pc" sem palavra-chave específica cai no default EmPrestacaoContas', () => {
    assert.equal(inferirStatusGeralConvenio('aguardando análise', 'pc'), 'EmPrestacaoContas');
  });

  test('texto sem nenhuma palavra-chave reconhecida cai no default EmElaboracaoProjeto', () => {
    assert.equal(inferirStatusGeralConvenio('', 'convenios'), 'EmElaboracaoProjeto');
  });
});
