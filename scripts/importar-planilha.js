#!/usr/bin/env node
// Importação única (Fase 2) da planilha histórica de convênios para o jConv.
//
// Lê ESTADUAL/FEDERAL/CAIXA/MUNICIPAL, identifica os blocos dentro de cada aba (Relação de
// Convênios, Obras, Propostas, Cessão de Terreno, Transferências Especiais, DNOCS, Prestação de
// Contas, Limites de Custeio) e roteia cada linha para Convenio/Proposta/CessaoTerreno/
// LimiteCusteio, extraindo por regex os números de processo hoje concatenados em texto livre.
//
// Escopo assumido nesta rodada (documentado no resumo da Fase 2, não escondido):
// - Abas CONTR CAIXA, CONTR FEDERAL, CONTRAPARTIDA e EMENDAS SAUDE (extratos financeiros e
//   limites históricos superados) NÃO são importadas automaticamente: exigiriam casamento por
//   aproximação de texto com os convênios já importados, e um casamento errado corromperia
//   dado financeiro. Ficam disponíveis no arquivo original para lançamento manual via CRUD.
// - Nada é apagado/perdido: todo texto de origem que não vira campo estruturado é preservado
//   em `observacoes`, prefixado com o nome da coluna de origem.
//
// Uso: node scripts/importar-planilha.js "D:/Planilha Convênios 2026.xlsx" [--commit]
// Sem --commit roda em modo dry-run (só imprime o relatório, não grava nada no banco).

require('dotenv').config();
const XLSX = require('xlsx');
const { Client } = require('pg');

const CAMINHO_PLANILHA = process.argv[2] || 'D:/Planilha Convênios 2026.xlsx';
const MODO_COMMIT = process.argv.includes('--commit');

// ---------------------------------------------------------------------------
// Helpers de parsing de texto livre
// ---------------------------------------------------------------------------

function limpar(v) {
  if (v === undefined || v === null) return '';
  return String(v).replace(/\r\n/g, ' ').replace(/\s+/g, ' ').trim();
}

function vazio(v) {
  return v === undefined || v === null || (typeof v === 'string' && v.trim() === '');
}

function paraIso(data) {
  if (data instanceof Date && !isNaN(data.getTime())) {
    return data.toISOString().slice(0, 10);
  }
  return null;
}

// Extrai a primeira data DD/MM/AAAA encontrada num texto solto
function extrairDataTexto(texto) {
  const m = limpar(texto).match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!m) return null;
  const [, d, mes, a] = m;
  const iso = `${a}-${String(mes).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  return isNaN(new Date(iso).getTime()) ? null : iso;
}

// Extrai o primeiro valor monetário R$ 0.000,00 encontrado num texto solto
function extrairValorTexto(texto) {
  const m = limpar(texto).match(/(-?\d{1,3}(?:\.\d{3})*,\d{2})/);
  if (!m) return null;
  const numero = Number(m[1].replace(/\./g, '').replace(',', '.'));
  return isNaN(numero) ? null : numero;
}

function extrairPrimeiroPercentual(texto) {
  const m = limpar(texto).match(/(\d{1,3}(?:,\d{1,2})?)\s*%/);
  if (!m) return null;
  const numero = Number(m[1].replace(',', '.'));
  return isNaN(numero) || numero > 100 ? null : numero;
}

// Extrai números de processo/instrumento do texto concatenado da coluna
// "PROTOCOLO/PROCESSO/CONVÊNIO", que mistura livremente MAPP, SIC, CV/Convênio, SICONV,
// NUP, Protocolo, Operação (Caixa) e conta bancária.
function extrairNumerosProcesso(textoOriginal) {
  const texto = limpar(textoOriginal);
  const pegar = (regex) => {
    const m = texto.match(regex);
    return m ? limpar(m[1]) : null;
  };

  return {
    numeroMapp: pegar(/MAPP\s*:?\s*([\w./-]+)/i),
    numeroSic: pegar(/SIC\s*:?\s*([\w./-]+)/i),
    numeroConvenio: pegar(/(?:CV|CONV(?:ÊNIO)?|TC)\s*:?\s*n?º?\s*([\w./-]+)/i),
    numeroProtocolo: pegar(/PROTOCOLO\s*:?\s*n?º?\s*([\w./-]+)/i),
    numeroNup: pegar(/NUP\s*:?\s*n?º?\s*([\w./-]+)/i),
    numeroOperacaoCaixa: pegar(/(?:OP|OPERA[ÇC][ÃA]O)\s*:?\s*n?º?\s*([\w./-]+)/i),
    contaBancaria: pegar(
      /(?:CAIXA|CONTA|CX|BB|AG)\s*:?\s*([\w. /-]+?)(?=\s*(?:MAPP|CV\b|CONV|SIC\b|NUP\b|PROTOCOLO|OP\b|OPERA[ÇC][ÃA]O|LIC\b|LICIT|TC\b|$))/i,
    ),
  };
}

// Extrai nome + contato entre parênteses da coluna EMPRESA CONTRATADA, ex.:
// "ITAPAJÉ CONSTRUÇÕES (Elhu Lira)" -> { nome: "ITAPAJÉ CONSTRUÇÕES", contato: "Elhu Lira" }
function extrairEmpresa(textoOriginal) {
  const texto = limpar(textoOriginal);
  if (!texto) return null;

  // O contato entre parênteses pode vir antes OU depois do trecho "Valor desembolsado ...";
  // busca em qualquer posição, mas o nome da empresa é sempre o que vem antes do que vier
  // primeiro entre os dois (parênteses ou o comentário financeiro).
  const contatoMatch = texto.match(/\(([^)]+)\)/);
  const contato = contatoMatch ? limpar(contatoMatch[1]) : null;

  const corteValor = texto.search(/Valor (desembolsado|liberado|a desembolsar)/i);
  const corteParen = texto.indexOf('(');
  const cortes = [corteValor, corteParen].filter((i) => i >= 0);
  const corte = cortes.length ? Math.min(...cortes) : texto.length;

  const nome = limpar(texto.slice(0, corte));
  return nome ? { nome, contato } : null;
}

const PARLAMENTARES_CONHECIDOS = [
  'Danilo Forte',
  'Eduardo Girão',
  'André Figueiredo',
  'Cid Gomes',
  'Tasso Jereissati',
  'Luiziane Lins',
  'Heitor Freire',
];

// Separa nome do órgão concedente do nome do parlamentar/padrinho da emenda, quando presente.
function interpretarOrgao(textoOriginal) {
  let texto = limpar(textoOriginal);
  let parlamentar = null;

  for (const nome of PARLAMENTARES_CONHECIDOS) {
    const regex = new RegExp(nome.replace(/[a-zà-ú]/gi, (c) => c), 'i');
    if (regex.test(texto)) {
      parlamentar = nome;
      texto = limpar(texto.replace(new RegExp(nome, 'i'), ''));
      break;
    }
  }

  texto = texto.replace(/^EMENDA\s*/i, '').trim();
  if (!texto) texto = parlamentar ? `Emenda Parlamentar (${parlamentar})` : 'Não informado';

  return { nomeOrgao: texto, parlamentar };
}

function inferirStatusGeralConvenio(textoSituacao, bloco) {
  const s = limpar(textoSituacao).toUpperCase();
  if (bloco === 'pc') {
    if (s.includes('PC ENVIAD') || s.includes('PRESTA') && s.includes('ENVIAD')) return 'PcEnviada';
    if (s.includes('PC APROVAD') || s.includes('APROVAD')) return 'PcAprovada';
    return 'EmPrestacaoContas';
  }
  if (s.includes('OBRA PARADA')) return 'ObraParada';
  if (s.includes('OBRA CONCLU') || s.includes('OBRA FINALIZADA') || s.includes('PROJETO CONCLU')) return 'ObraConcluida';
  if (s.includes('EM EXECU') || s.includes('OBRA EM ANDAMENTO') || s.includes('PAGAMENTOS EM EXECU')) return 'ObraEmExecucao';
  if (s.includes('EM LICITA')) return 'EmLicitacao';
  if (s.includes('SUSPENSIVA')) return 'Suspensiva';
  if (s.includes('AGUARDANDO REPASSE') || s.includes('AGUARDANDO PAGAMENTO') || s.includes('AGUARDANDO PROCESSO DE PAGAMENTO')) return 'AguardandoRepasse';
  if (s.includes('CONVENIO ASSINADO') || s.includes('CONVÊNIO ASSINADO') || s.includes('CONVENIO FORMALIZADO') || s.includes('CONTRATO ASSINADO')) return 'ConvenioAssinado';
  if (s.includes('EM PRESTA')) return 'EmPrestacaoContas';
  return 'EmElaboracaoProjeto';
}

// ---------------------------------------------------------------------------
// Configuração de colunas por aba (índices 0-based)
// ---------------------------------------------------------------------------

const LAYOUT_PADRAO = {
  numero: 0, orgao: 1, valorConveniado: 2, valorConcedido: 3, valorContrapartida: 4, valorLicitado: 5,
  objeto: 6, protocolo: 7, data8Campo: 'assinatura', data8: 8, vigenciaSaldo: 9, vigenciaContratoEmpresa: 10,
  situacao: 11, exec: 12, obs: 13, empresa: 14,
};

const LAYOUTS_POR_ABA = {
  ESTADUAL: LAYOUT_PADRAO,
  CAIXA: {
    ...LAYOUT_PADRAO, prazoPainel180: 11, situacao: 12, exec: 13, obs: 14, empresa: 15,
  },
  FEDERAL: {
    ...LAYOUT_PADRAO, data8Campo: 'inicioVigencia', prazoPainel180: 11, situacao: 12, exec: 13, obs: 14, empresa: 15,
  },
  MUNICIPAL: {
    numero: 0, orgao: 1, valorConveniado: 2, valorConcedido: 3, valorContrapartida: 4, valorLicitado: 5,
    objeto: 6, protocolo: 7, data8Campo: 'assinatura', data8: 8, vigenciaSaldo: 9, vigenciaContratoEmpresa: null,
    situacao: 10, exec: 11, obs: null, empresa: 12,
  },
};

const ESFERA_POR_ABA = { ESTADUAL: 'Estadual', FEDERAL: 'Federal', CAIXA: 'CaixaEconomica', MUNICIPAL: 'Municipal' };

// Palavras-chave que identificam uma linha de "cabeçalho de bloco" (não é dado, é um rótulo)
const MARCADORES_BLOCO = [
  { re: /RELA[ÇC][ÃA]O DE PLEITOS E CONV[ÊE]NIOS/i, bloco: 'convenios' },
  { re: /OBRAS ESTADUAIS/i, bloco: 'obras' },
  { re: /RELA[ÇC][ÃA]O DE PROPOSTAS/i, bloco: 'propostas' },
  { re: /PROCESSO DE CESS[ÃA]O/i, bloco: 'cessao' },
  { re: /PRESTA[ÇC][ÃA]O DE CONTAS/i, bloco: 'pc' },
  { re: /TRANSFER[ÊE]NCIAS ESPECIAIS/i, bloco: 'transferencia_especial' },
  { re: /EXECU[ÇC][ÃA]O DNOCS/i, bloco: 'dnocs' },
  { re: /LIMITES.*CUSTEIO/i, bloco: 'limite_custeio' },
];

// ---------------------------------------------------------------------------
// Parsing de uma linha de dados dentro de um bloco "tipo convênio"
// ---------------------------------------------------------------------------

function parsearLinhaConvenio(linha, layout, bloco, nomeAba) {
  const objeto = limpar(linha[layout.objeto]);
  if (!objeto) return null;

  const { nomeOrgao, parlamentar } = interpretarOrgao(linha[layout.orgao]);
  const numeros = extrairNumerosProcesso(linha[layout.protocolo]);
  const empresa = layout.empresa != null ? extrairEmpresa(linha[layout.empresa]) : null;

  const data8 = linha[layout.data8] instanceof Date ? paraIso(linha[layout.data8]) : extrairDataTexto(linha[layout.data8]);
  const vigenciaSaldoTexto = limpar(linha[layout.vigenciaSaldo]);
  const dataFimVigencia = extrairDataTexto(vigenciaSaldoTexto);
  const saldoEmConta = extrairValorTexto(vigenciaSaldoTexto);

  let vigenciaContratoEmpresa = null;
  const obsExtras = [];

  // Rede de segurança: guarda o texto bruto de origem, mesmo quando a extração por regex
  // acima já pegou os números — evita perder informação se algum padrão não bateu.
  const protocoloOriginal = limpar(linha[layout.protocolo]);
  if (protocoloOriginal) obsExtras.push(`Protocolo/Processo/Convênio (original): ${protocoloOriginal}`);

  if (layout.vigenciaContratoEmpresa != null) {
    const bruto = linha[layout.vigenciaContratoEmpresa];
    if (bruto instanceof Date) {
      vigenciaContratoEmpresa = paraIso(bruto);
    } else if (!vazio(bruto)) {
      const dataAchada = extrairDataTexto(bruto);
      if (dataAchada) vigenciaContratoEmpresa = dataAchada;
      else obsExtras.push(`Vigência contrato empresa (não estruturado): ${limpar(bruto)}`);
    }
  }

  if (layout.prazoPainel180 != null && !vazio(linha[layout.prazoPainel180])) {
    obsExtras.push(`Prazo painel 180: ${limpar(linha[layout.prazoPainel180])}`);
  }

  const situacaoTexto = limpar(linha[layout.situacao]);
  if (situacaoTexto) obsExtras.push(`Situação (original): ${situacaoTexto}`);

  const execTexto = limpar(linha[layout.exec]);
  const percentualExecFinanceiro = extrairPrimeiroPercentual(execTexto);
  if (execTexto) obsExtras.push(`Executado: ${execTexto}`);

  if (layout.obs != null) {
    const obsTexto = limpar(linha[layout.obs]);
    if (obsTexto) obsExtras.push(`Observações (original): ${obsTexto}`);
  }

  if (empresa?.contato) obsExtras.push(`Contato empresa: ${empresa.contato}`);
  if (parlamentar) obsExtras.push(`Parlamentar/padrinho: ${parlamentar}`);
  obsExtras.push(`Órgão (texto original): ${limpar(linha[layout.orgao])}`);
  obsExtras.push(`Fonte: aba ${nomeAba}, bloco "${bloco}"`);

  let tipoInstrumento = 'Convenio';
  if (bloco === 'transferencia_especial') tipoInstrumento = 'TransferenciaEspecial';
  else if (nomeAba === 'CAIXA') tipoInstrumento = 'ContratoDeRepasse';

  let statusGeral = inferirStatusGeralConvenio(situacaoTexto, bloco);
  if (bloco === 'obras' || bloco === 'dnocs') statusGeral = vazio(linha[layout.valorConveniado]) ? 'EmElaboracaoProjeto' : statusGeral;

  return {
    tipo: 'convenio',
    nomeOrgao,
    dados: {
      tipoInstrumento,
      objeto,
      valorConveniado: typeof linha[layout.valorConveniado] === 'number' ? linha[layout.valorConveniado] : null,
      valorConcedido: typeof linha[layout.valorConcedido] === 'number' ? linha[layout.valorConcedido] : null,
      valorContrapartida: typeof linha[layout.valorContrapartida] === 'number' ? linha[layout.valorContrapartida] : null,
      valorLicitado: typeof linha[layout.valorLicitado] === 'number' ? linha[layout.valorLicitado] : null,
      numeroConvenio: numeros.numeroConvenio,
      numeroMapp: numeros.numeroMapp,
      numeroSic: numeros.numeroSic,
      numeroProtocolo: numeros.numeroProtocolo,
      numeroNup: numeros.numeroNup,
      numeroOperacaoCaixa: nomeAba === 'CAIXA' ? numeros.numeroOperacaoCaixa : null,
      contaBancaria: numeros.contaBancaria,
      dataAssinatura: layout.data8Campo === 'assinatura' ? data8 : null,
      dataInicioVigencia: layout.data8Campo === 'inicioVigencia' ? data8 : null,
      dataFimVigencia,
      saldoEmConta,
      saldoEmContaReferenciaEm: saldoEmConta != null ? new Date().toISOString().slice(0, 10) : null,
      vigenciaContratoEmpresa,
      statusGeral,
      percentualExecutadoFinanceiro: percentualExecFinanceiro,
      observacoes: obsExtras.join(' | '),
      empresaNome: empresa?.nome ?? null,
    },
  };
}

function parsearLinhaProposta(linha, layout, nomeAba) {
  const objeto = limpar(linha[layout.objeto]);
  if (!objeto) return null;
  const { nomeOrgao } = interpretarOrgao(linha[layout.orgao]);
  const numeros = extrairNumerosProcesso(linha[layout.protocolo]);
  const situacaoTexto = limpar(linha[layout.situacao]);

  return {
    tipo: 'proposta',
    nomeOrgao,
    dados: {
      objeto,
      numeroProtocolo: numeros.numeroProtocolo,
      numeroNup: numeros.numeroNup,
      status: /indeferid/i.test(situacaoTexto) ? 'Indeferida' : 'EmAnalise',
      observacoes: [
        `Protocolo/Processo (original): ${limpar(linha[layout.protocolo])}`,
        situacaoTexto && `Situação (original): ${situacaoTexto}`,
        `Órgão (texto original): ${limpar(linha[layout.orgao])}`,
        `Fonte: aba ${nomeAba}, bloco "propostas"`,
      ].filter(Boolean).join(' | '),
    },
  };
}

function parsearLinhaCessao(linha, layout, nomeAba) {
  const objeto = limpar(linha[layout.objeto]);
  if (!objeto) return null;
  const { nomeOrgao } = interpretarOrgao(linha[layout.orgao]);
  const numeros = extrairNumerosProcesso(linha[layout.protocolo]);
  const situacaoTexto = limpar(linha[layout.situacao]);
  const responsavelMatch = limpar(linha[layout.orgao]).match(/\(([^)]+)\)/);

  return {
    tipo: 'cessao',
    nomeOrgao,
    dados: {
      objeto,
      numeroProtocolo: numeros.numeroProtocolo,
      numeroNup: numeros.numeroNup,
      responsavelInterno: responsavelMatch ? limpar(responsavelMatch[1]) : null,
      status: /aguardando termo/i.test(situacaoTexto) ? 'AguardandoTermo' : 'DocumentacaoEmAnalise',
      observacoes: [
        `Protocolo/Processo (original): ${limpar(linha[layout.protocolo])}`,
        situacaoTexto && `Situação (original): ${situacaoTexto}`,
        `Órgão (texto original): ${limpar(linha[layout.orgao])}`,
        `Fonte: aba ${nomeAba}, bloco "cessão"`,
      ].filter(Boolean).join(' | '),
    },
  };
}

// ---------------------------------------------------------------------------
// Percorre uma aba, mantendo o bloco atual, e devolve a lista de registros propostos
// ---------------------------------------------------------------------------

function detectarMarcadorBloco(linha) {
  const primeira = limpar(linha[0]);
  if (!primeira) return null;
  const restoVazio = linha.slice(1).every((c) => vazio(c)) || linha.slice(1, 7).every((c) => vazio(c));
  if (!restoVazio) return null;
  for (const { re, bloco } of MARCADORES_BLOCO) {
    if (re.test(primeira)) return bloco;
  }
  return null;
}

function processarAba(nomeAba, dados) {
  const layout = LAYOUTS_POR_ABA[nomeAba];
  const esfera = ESFERA_POR_ABA[nomeAba];
  const registros = [];
  let blocoAtual = 'convenios';

  for (const linha of dados) {
    if (!linha || linha.length === 0) continue;
    if (limpar(linha[0]).toUpperCase() === 'Nº') continue; // linha de cabeçalho de colunas

    const marcador = detectarMarcadorBloco(linha);
    if (marcador) {
      blocoAtual = marcador;
      continue;
    }

    if (blocoAtual === 'limite_custeio') continue; // tratado à parte (extração dedicada abaixo)

    let r = null;
    if (blocoAtual === 'propostas') {
      r = parsearLinhaProposta(linha, layout, nomeAba);
    } else if (blocoAtual === 'cessao') {
      r = parsearLinhaCessao(linha, layout, nomeAba);
    } else {
      r = parsearLinhaConvenio(linha, layout, blocoAtual, nomeAba);
    }
    if (r) {
      r.esfera = esfera;
      registros.push(r);
    }
  }

  return registros;
}

// Extração dedicada do bloco "LIMITES ... CUSTEIO PAP e MAC" da aba FEDERAL
function extrairLimitesCusteioFederal(dados) {
  let dentroDoBloco = false;
  let tetoPap = null;
  let tetoMac = null;
  let portaria = null;

  for (const linha of dados) {
    const primeira = limpar(linha[0]);
    if (/LIMITES.*CUSTEIO/i.test(primeira)) {
      dentroDoBloco = true;
      const m = primeira.match(/\((.*)\)/);
      portaria = m ? m[1] : null;
      continue;
    }
    if (!dentroDoBloco) continue;
    if (/PRESTA[ÇC][ÃA]O DE CONTAS/i.test(primeira)) break;

    if (/^TETO\b/i.test(primeira) && tetoPap == null) {
      tetoPap = extrairValorTexto(primeira) ?? extrairValorTexto(primeira.replace(/[^\d,.]/g, ''));
    }
    const colH = limpar(linha[7]);
    if (/^TETO MAC/i.test(colH) && tetoMac == null) {
      tetoMac = extrairValorTexto(colH);
    }
  }

  const registros = [];
  if (tetoPap != null) {
    registros.push({
      tipo: 'limite_custeio',
      esfera: 'Federal',
      nomeOrgao: 'Fundo Nacional de Saúde (FNS)',
      dados: {
        tipo: 'PAP', portariaReferencia: portaria, competenciaAno: 2026,
        valorTeto: tetoPap, valorUtilizado: 0,
        observacoes: 'Importado da aba FEDERAL, bloco "Limites de Custeio". Detalhamento por item permanece na planilha original.',
      },
    });
  }
  if (tetoMac != null) {
    registros.push({
      tipo: 'limite_custeio',
      esfera: 'Federal',
      nomeOrgao: 'Fundo Nacional de Saúde (FNS)',
      dados: {
        tipo: 'MAC', portariaReferencia: portaria, competenciaAno: 2026,
        valorTeto: tetoMac, valorUtilizado: 0,
        observacoes: 'Importado da aba FEDERAL, bloco "Limites de Custeio". Detalhamento por item permanece na planilha original.',
      },
    });
  }
  return registros;
}

// ---------------------------------------------------------------------------
// Execução principal
// ---------------------------------------------------------------------------

async function main() {
  const wb = XLSX.readFile(CAMINHO_PLANILHA, { cellDates: true });

  let todosRegistros = [];
  for (const nomeAba of Object.keys(LAYOUTS_POR_ABA)) {
    const ws = wb.Sheets[nomeAba];
    if (!ws) continue;
    const dados = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: '' });
    todosRegistros = todosRegistros.concat(processarAba(nomeAba, dados));
    if (nomeAba === 'FEDERAL') {
      todosRegistros = todosRegistros.concat(extrairLimitesCusteioFederal(dados));
    }
  }

  const porTipo = { convenio: 0, proposta: 0, cessao: 0, limite_custeio: 0 };
  for (const r of todosRegistros) porTipo[r.tipo]++;

  console.log(`Total de linhas interpretadas: ${todosRegistros.length}`);
  console.log(`  Convenio: ${porTipo.convenio}`);
  console.log(`  Proposta: ${porTipo.proposta}`);
  console.log(`  CessaoTerreno: ${porTipo.cessao}`);
  console.log(`  LimiteCusteio: ${porTipo.limite_custeio}`);

  if (!MODO_COMMIT) {
    console.log('\nModo dry-run (sem --commit): nada foi gravado no banco.');
    for (const tipo of ['convenio', 'proposta', 'cessao', 'limite_custeio']) {
      console.log(`\nAmostra de "${tipo}":`);
      console.log(JSON.stringify(todosRegistros.filter((r) => r.tipo === tipo).slice(0, 2), null, 2));
    }
    const convenioFederal = todosRegistros.find((r) => r.tipo === 'convenio' && r.esfera === 'Federal');
    console.log('\nAmostra de convênio FEDERAL (data_inicio_vigencia em vez de assinatura):');
    console.log(JSON.stringify(convenioFederal, null, 2));
    return;
  }

  const client = new Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();

  const orgaoIdPorNome = new Map();
  async function obterOrgaoId(nome, esfera) {
    const chave = nome.toLowerCase();
    if (orgaoIdPorNome.has(chave)) return orgaoIdPorNome.get(chave);
    const existente = await client.query('SELECT id FROM public.orgaos_concedentes WHERE LOWER(nome) = LOWER($1)', [nome]);
    let id;
    if (existente.rows.length > 0) {
      id = existente.rows[0].id;
    } else {
      const inserido = await client.query(
        'INSERT INTO public.orgaos_concedentes (nome, esfera) VALUES ($1, $2) RETURNING id',
        [nome, esfera],
      );
      id = inserido.rows[0].id;
    }
    orgaoIdPorNome.set(chave, id);
    return id;
  }

  const empresaIdPorNome = new Map();
  async function obterEmpresaId(nome) {
    if (!nome) return null;
    const chave = nome.toLowerCase();
    if (empresaIdPorNome.has(chave)) return empresaIdPorNome.get(chave);
    const existente = await client.query('SELECT id FROM public.empresas_contratadas WHERE LOWER(nome) = LOWER($1)', [nome]);
    let id;
    if (existente.rows.length > 0) {
      id = existente.rows[0].id;
    } else {
      const inserido = await client.query('INSERT INTO public.empresas_contratadas (nome) VALUES ($1) RETURNING id', [nome]);
      id = inserido.rows[0].id;
    }
    empresaIdPorNome.set(chave, id);
    return id;
  }

  let gravados = { convenio: 0, proposta: 0, cessao: 0, limite_custeio: 0 };

  for (const registro of todosRegistros) {
    const esferaAba = registro.esfera || 'Estadual';
    const orgaoId = await obterOrgaoId(registro.nomeOrgao, esferaAba);

    if (registro.tipo === 'convenio') {
      const d = registro.dados;
      const empresaId = await obterEmpresaId(d.empresaNome);
      await client.query(
        `INSERT INTO public.convenios (
          orgao_concedente_id, tipo_instrumento, objeto, valor_conveniado, valor_concedido,
          valor_contrapartida, valor_licitado, numero_convenio, numero_mapp, numero_sic,
          numero_protocolo, numero_nup, numero_operacao_caixa, conta_bancaria, data_assinatura,
          data_inicio_vigencia, data_fim_vigencia, empresa_contratada_id, vigencia_contrato_empresa,
          saldo_em_conta, saldo_em_conta_referencia_em, status_geral, percentual_executado_financeiro,
          observacoes
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24)`,
        [
          orgaoId, d.tipoInstrumento, d.objeto, d.valorConveniado, d.valorConcedido,
          d.valorContrapartida, d.valorLicitado, d.numeroConvenio, d.numeroMapp, d.numeroSic,
          d.numeroProtocolo, d.numeroNup, d.numeroOperacaoCaixa, d.contaBancaria, d.dataAssinatura,
          d.dataInicioVigencia, d.dataFimVigencia, empresaId, d.vigenciaContratoEmpresa,
          d.saldoEmConta, d.saldoEmContaReferenciaEm, d.statusGeral, d.percentualExecutadoFinanceiro,
          d.observacoes,
        ],
      );
      gravados.convenio++;
    } else if (registro.tipo === 'proposta') {
      const d = registro.dados;
      await client.query(
        `INSERT INTO public.propostas (orgao_concedente_id, objeto, numero_protocolo, numero_nup, status, observacoes)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [orgaoId, d.objeto, d.numeroProtocolo, d.numeroNup, d.status, d.observacoes],
      );
      gravados.proposta++;
    } else if (registro.tipo === 'cessao') {
      const d = registro.dados;
      await client.query(
        `INSERT INTO public.cessoes_terreno (orgao_concedente_id, objeto, numero_protocolo, numero_nup, responsavel_interno, status, observacoes)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [orgaoId, d.objeto, d.numeroProtocolo, d.numeroNup, d.responsavelInterno, d.status, d.observacoes],
      );
      gravados.cessao++;
    } else if (registro.tipo === 'limite_custeio') {
      const d = registro.dados;
      await client.query(
        `INSERT INTO public.limites_custeio (orgao_concedente_id, tipo, portaria_referencia, competencia_ano, valor_teto, valor_utilizado, observacoes)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [orgaoId, d.tipo, d.portariaReferencia, d.competenciaAno, d.valorTeto, d.valorUtilizado, d.observacoes],
      );
      gravados.limite_custeio++;
    }
  }

  await client.end();
  console.log('\nGravado no banco:', gravados);
}

main().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
