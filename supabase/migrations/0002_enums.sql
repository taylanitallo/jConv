-- Migration 0002: Enums do domínio jConv

CREATE TYPE public.esfera_convenio AS ENUM ('Estadual', 'Federal', 'CaixaEconomica');

CREATE TYPE public.papel_usuario AS ENUM ('Administrador', 'GestorConvenios', 'Financeiro', 'LeituraSecretario');

CREATE TYPE public.tipo_instrumento AS ENUM (
    'Convenio', 'TermoDeCompromisso', 'EmendaParlamentar', 'TransferenciaEspecial', 'ContratoDeRepasse'
);

CREATE TYPE public.status_geral_convenio AS ENUM (
    'EmElaboracaoProjeto', 'EmLicitacao', 'ConvenioAssinado', 'ObraEmExecucao', 'ObraParada',
    'ObraConcluida', 'EmPrestacaoContas', 'PcEnviada', 'PcAprovada', 'AguardandoRepasse', 'Suspensiva'
);

CREATE TYPE public.status_proposta AS ENUM ('EmAnalise', 'AguardandoAprovacao', 'Aprovada', 'Indeferida');

CREATE TYPE public.status_cessao_terreno AS ENUM ('DocumentacaoEmAnalise', 'AguardandoTermo', 'Concluida');

CREATE TYPE public.tipo_limite_custeio AS ENUM ('PAP', 'MAC', 'Outro');

CREATE TYPE public.tipo_aditivo AS ENUM ('Prazo', 'Valor', 'Objeto');

CREATE TYPE public.status_medicao AS ENUM ('Paga', 'EmAnalise', 'Aguardando');

CREATE TYPE public.tipo_repasse AS ENUM ('Parcela', 'Contrapartida');

CREATE TYPE public.tipo_documento_anexo AS ENUM (
    'Oficio', 'PlanoDeTrabalho', 'Termo', 'Medicao', 'NotaFiscal', 'AIO', 'Licitacao', 'Outro'
);

CREATE TYPE public.entidade_documento_anexo AS ENUM ('Convenio', 'Proposta', 'CessaoTerreno');

CREATE TYPE public.tipo_alerta AS ENUM (
    'VigenciaProximaDoFim', 'ContratoEmpresaVencendo', 'SuspensivaComPrazo', 'PcPendente', 'ObraParadaSemAtualizacao'
);

CREATE TYPE public.status_alerta AS ENUM ('Pendente', 'Lido', 'Resolvido');
