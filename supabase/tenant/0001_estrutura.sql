-- ESTRUTURA DO SCHEMA DE UM MUNICÍPIO (gerado a partir do schema public em 2026-08-02)
--
-- Não qualifica schema de propósito: é aplicado com search_path apontando para o schema do
-- município, então o mesmo arquivo serve para todos. Idempotente (IF NOT EXISTS / DO block com
-- duplicate_object), para poder rodar de novo em schema já existente.
--
-- Gerado por introspecção (pg_get_constraintdef / pg_get_functiondef / pg_get_triggerdef) em vez
-- de reescrito à mão a partir das 27 migrations: elimina divergência entre o que existe hoje em
-- produção e o que um município novo recebe.

-- ──────────────────────────────────────────────────────────────────────
-- Tipos enumerados
-- ──────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE entidade_documento_anexo AS ENUM ('Convenio', 'Proposta', 'CessaoTerreno');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE esfera_convenio AS ENUM ('Estadual', 'Federal', 'CaixaEconomica', 'Municipal');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE modulo_sistema AS ENUM ('Dashboard', 'Convenios', 'Propostas', 'CessoesTerreno', 'LimitesCusteio', 'OrgaosConcedentes', 'EmpresasContratadas', 'ConfiguracoesGerais', 'ConfiguracoesMunicipio', 'ConfiguracoesSecretarias', 'ConfiguracoesLayout', 'Usuarios');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE nivel_permissao AS ENUM ('Nenhuma', 'Parcial', 'Total');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE status_alerta AS ENUM ('Pendente', 'Lido', 'Resolvido');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE status_cessao_terreno AS ENUM ('DocumentacaoEmAnalise', 'AguardandoTermo', 'Concluida');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE status_geral_convenio AS ENUM ('EmElaboracaoProjeto', 'EmLicitacao', 'ConvenioAssinado', 'ObraEmExecucao', 'ObraParada', 'ObraConcluida', 'EmPrestacaoContas', 'PcEnviada', 'PcAprovada', 'AguardandoRepasse', 'Suspensiva');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE status_medicao AS ENUM ('Paga', 'EmAnalise', 'Aguardando');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE status_proposta AS ENUM ('EmAnalise', 'AguardandoAprovacao', 'Aprovada', 'Indeferida');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE tipo_aditivo AS ENUM ('Prazo', 'Valor', 'Objeto');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE tipo_alerta AS ENUM ('VigenciaProximaDoFim', 'ContratoEmpresaVencendo', 'SuspensivaComPrazo', 'PcPendente', 'ObraParadaSemAtualizacao');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE tipo_documento_anexo AS ENUM ('Oficio', 'PlanoDeTrabalho', 'Termo', 'Medicao', 'NotaFiscal', 'AIO', 'Licitacao', 'Outro');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE tipo_instrumento AS ENUM ('Convenio', 'TermoDeCompromisso', 'EmendaParlamentar', 'TransferenciaEspecial', 'ContratoDeRepasse');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE tipo_limite_custeio AS ENUM ('PAP', 'MAC', 'Outro');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE tipo_repasse AS ENUM ('Parcela', 'Contrapartida');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ──────────────────────────────────────────────────────────────────────
-- Tabelas
-- ──────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS aditivos (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  convenio_id uuid NOT NULL,
  tipo tipo_aditivo NOT NULL,
  data date NOT NULL,
  descricao text NOT NULL,
  criado_em timestamp with time zone DEFAULT now() NOT NULL,
  atualizado_em timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS alertas (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  convenio_id uuid NOT NULL,
  tipo tipo_alerta NOT NULL,
  data_disparo timestamp with time zone DEFAULT now() NOT NULL,
  status status_alerta DEFAULT 'Pendente'::status_alerta NOT NULL,
  descricao text,
  criado_em timestamp with time zone DEFAULT now() NOT NULL,
  atualizado_em timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS cessoes_terreno (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  orgao_concedente_id uuid NOT NULL,
  esfera esfera_convenio,
  objeto text NOT NULL,
  numero_protocolo text,
  numero_nup text,
  responsavel_interno text,
  status status_cessao_terreno DEFAULT 'DocumentacaoEmAnalise'::status_cessao_terreno NOT NULL,
  observacoes text,
  criado_em timestamp with time zone DEFAULT now() NOT NULL,
  atualizado_em timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS configuracoes (
  id uuid DEFAULT '00000000-0000-0000-0000-000000000001'::uuid NOT NULL,
  municipio_nome text DEFAULT 'Irauçuba'::text NOT NULL,
  municipio_uf text DEFAULT 'CE'::text NOT NULL,
  municipio_cnpj text,
  municipio_endereco text,
  municipio_telefone text,
  prefeito_nome text,
  brasao_url text,
  dias_alerta_vigencia integer DEFAULT 90 NOT NULL,
  dias_alerta_contrato_empresa integer DEFAULT 60 NOT NULL,
  orgao_gestor text,
  email_contato text,
  orientacao_padrao_pdf text DEFAULT 'retrato'::text NOT NULL,
  mostrar_brasao_relatorio boolean DEFAULT true NOT NULL,
  rodape_relatorio text,
  criado_em timestamp with time zone DEFAULT now() NOT NULL,
  atualizado_em timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS convenios (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  numero_sequencial integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  orgao_concedente_id uuid NOT NULL,
  esfera esfera_convenio,
  tipo_instrumento tipo_instrumento NOT NULL,
  objeto text NOT NULL,
  valor_conveniado numeric(15,2),
  valor_concedido numeric(15,2),
  valor_contrapartida numeric(15,2),
  valor_licitado numeric(15,2),
  numero_convenio text,
  numero_mapp text,
  numero_sic text,
  numero_proposta text,
  numero_protocolo text,
  numero_nup text,
  numero_operacao_caixa text,
  conta_bancaria text,
  data_assinatura date,
  data_inicio_vigencia date,
  data_fim_vigencia date,
  empresa_contratada_id uuid,
  vigencia_contrato_empresa date,
  saldo_em_conta numeric(15,2),
  saldo_em_conta_referencia_em date,
  status_geral status_geral_convenio DEFAULT 'EmElaboracaoProjeto'::status_geral_convenio NOT NULL,
  percentual_executado_fisico numeric(5,2),
  percentual_executado_financeiro numeric(5,2),
  observacoes text,
  criado_em timestamp with time zone DEFAULT now() NOT NULL,
  atualizado_em timestamp with time zone DEFAULT now() NOT NULL,
  parlamentar_padrinho text
);

CREATE TABLE IF NOT EXISTS documentos_anexos (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  convenio_id uuid,
  proposta_id uuid,
  cessao_terreno_id uuid,
  tipo tipo_documento_anexo NOT NULL,
  nome_arquivo text NOT NULL,
  arquivo_caminho text NOT NULL,
  data_upload timestamp with time zone DEFAULT now() NOT NULL,
  extraido_por_ia boolean DEFAULT false NOT NULL,
  criado_em timestamp with time zone DEFAULT now() NOT NULL,
  atualizado_em timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS empresas_contratadas (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  nome text NOT NULL,
  responsavel_contato text,
  cnpj text,
  criado_em timestamp with time zone DEFAULT now() NOT NULL,
  atualizado_em timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS limites_custeio (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  orgao_concedente_id uuid NOT NULL,
  esfera esfera_convenio,
  tipo tipo_limite_custeio NOT NULL,
  portaria_referencia text,
  competencia_ano integer NOT NULL,
  valor_teto numeric(15,2) NOT NULL,
  valor_utilizado numeric(15,2) DEFAULT 0 NOT NULL,
  saldo numeric(15,2) GENERATED ALWAYS AS (valor_teto - valor_utilizado) STORED,
  observacoes text,
  criado_em timestamp with time zone DEFAULT now() NOT NULL,
  atualizado_em timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS medicoes (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  convenio_id uuid NOT NULL,
  numero_medicao integer NOT NULL,
  data date NOT NULL,
  percentual_acumulado numeric(5,2),
  valor_pago numeric(15,2),
  valor_a_pagar numeric(15,2),
  status status_medicao DEFAULT 'Aguardando'::status_medicao NOT NULL,
  observacoes text,
  criado_em timestamp with time zone DEFAULT now() NOT NULL,
  atualizado_em timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS observacoes_convenio (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  convenio_id uuid NOT NULL,
  texto text NOT NULL,
  autor_id uuid DEFAULT auth.uid(),
  autor_nome text,
  criado_em timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS orgaos_concedentes (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  nome text NOT NULL,
  esfera esfera_convenio NOT NULL,
  contato text,
  criado_em timestamp with time zone DEFAULT now() NOT NULL,
  atualizado_em timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS permissoes_usuario (
  usuario_id uuid NOT NULL,
  modulo modulo_sistema NOT NULL,
  nivel nivel_permissao DEFAULT 'Nenhuma'::nivel_permissao NOT NULL,
  criado_em timestamp with time zone DEFAULT now() NOT NULL,
  atualizado_em timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS propostas (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  orgao_concedente_id uuid NOT NULL,
  esfera esfera_convenio,
  objeto text NOT NULL,
  numero_protocolo text,
  numero_nup text,
  status status_proposta DEFAULT 'EmAnalise'::status_proposta NOT NULL,
  convenio_gerado_id uuid,
  observacoes text,
  criado_em timestamp with time zone DEFAULT now() NOT NULL,
  atualizado_em timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS repasses (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  convenio_id uuid NOT NULL,
  tipo tipo_repasse NOT NULL,
  data date NOT NULL,
  valor numeric(15,2) NOT NULL,
  observacoes text,
  criado_em timestamp with time zone DEFAULT now() NOT NULL,
  atualizado_em timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS secretarias (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  nome text NOT NULL,
  sigla text,
  secretario_responsavel text,
  contato text,
  ativo boolean DEFAULT true NOT NULL,
  criado_em timestamp with time zone DEFAULT now() NOT NULL,
  atualizado_em timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS secretarias_orgaos (
  secretaria_id uuid NOT NULL,
  orgao_concedente_id uuid NOT NULL,
  criado_em timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS usuarios (
  id uuid NOT NULL,
  nome text NOT NULL,
  email text NOT NULL,
  ativo boolean DEFAULT true NOT NULL,
  criado_em timestamp with time zone DEFAULT now() NOT NULL,
  atualizado_em timestamp with time zone DEFAULT now() NOT NULL,
  secretaria_id uuid
);

CREATE TABLE IF NOT EXISTS eventos (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  tabela text NOT NULL,
  registro_id uuid,
  usuario_id uuid,
  acao text NOT NULL,
  dados_antes jsonb,
  dados_depois jsonb,
  criado_em timestamp with time zone DEFAULT now() NOT NULL
);

-- ──────────────────────────────────────────────────────────────────────
-- Constraints
-- ──────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  ALTER TABLE aditivos ADD CONSTRAINT aditivos_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE alertas ADD CONSTRAINT alertas_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE cessoes_terreno ADD CONSTRAINT cessoes_terreno_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE configuracoes ADD CONSTRAINT configuracoes_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE convenios ADD CONSTRAINT convenios_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE documentos_anexos ADD CONSTRAINT documentos_anexos_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE empresas_contratadas ADD CONSTRAINT empresas_contratadas_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE eventos ADD CONSTRAINT eventos_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE limites_custeio ADD CONSTRAINT limites_custeio_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE medicoes ADD CONSTRAINT medicoes_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE observacoes_convenio ADD CONSTRAINT observacoes_convenio_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE orgaos_concedentes ADD CONSTRAINT orgaos_concedentes_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE permissoes_usuario ADD CONSTRAINT permissoes_usuario_pkey PRIMARY KEY (usuario_id, modulo);
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE propostas ADD CONSTRAINT propostas_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE repasses ADD CONSTRAINT repasses_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE secretarias ADD CONSTRAINT secretarias_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE secretarias_orgaos ADD CONSTRAINT secretarias_orgaos_pkey PRIMARY KEY (secretaria_id, orgao_concedente_id);
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE usuarios ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE alertas ADD CONSTRAINT uq_alertas_convenio_tipo UNIQUE (convenio_id, tipo);
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE medicoes ADD CONSTRAINT medicoes_convenio_id_numero_medicao_key UNIQUE (convenio_id, numero_medicao);
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE configuracoes ADD CONSTRAINT configuracoes_dias_alerta_vigencia_check CHECK (((dias_alerta_vigencia >= 1) AND (dias_alerta_vigencia <= 365)));
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE configuracoes ADD CONSTRAINT configuracoes_orientacao_padrao_pdf_check CHECK ((orientacao_padrao_pdf = ANY (ARRAY['retrato'::text, 'paisagem'::text])));
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE configuracoes ADD CONSTRAINT configuracoes_id_check CHECK ((id = '00000000-0000-0000-0000-000000000001'::uuid));
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE configuracoes ADD CONSTRAINT configuracoes_dias_alerta_contrato_empresa_check CHECK (((dias_alerta_contrato_empresa >= 1) AND (dias_alerta_contrato_empresa <= 365)));
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE convenios ADD CONSTRAINT chk_operacao_caixa_apenas_esfera_caixa CHECK (((numero_operacao_caixa IS NULL) OR (esfera = 'CaixaEconomica'::esfera_convenio)));
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE convenios ADD CONSTRAINT convenios_percentual_executado_fisico_check CHECK (((percentual_executado_fisico >= (0)::numeric) AND (percentual_executado_fisico <= (100)::numeric)));
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE convenios ADD CONSTRAINT convenios_percentual_executado_financeiro_check CHECK (((percentual_executado_financeiro >= (0)::numeric) AND (percentual_executado_financeiro <= (100)::numeric)));
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE documentos_anexos ADD CONSTRAINT chk_documento_um_unico_pai CHECK ((num_nonnulls(convenio_id, proposta_id, cessao_terreno_id) = 1));
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE eventos ADD CONSTRAINT eventos_acao_check CHECK ((acao = ANY (ARRAY['INSERT'::text, 'UPDATE'::text, 'DELETE'::text])));
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE medicoes ADD CONSTRAINT medicoes_percentual_acumulado_check CHECK (((percentual_acumulado >= (0)::numeric) AND (percentual_acumulado <= (100)::numeric)));
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE observacoes_convenio ADD CONSTRAINT observacoes_convenio_texto_check CHECK ((btrim(texto) <> ''::text));
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE propostas ADD CONSTRAINT chk_convenio_gerado_apenas_se_aprovada CHECK (((convenio_gerado_id IS NULL) OR (status = 'Aprovada'::status_proposta)));
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE aditivos ADD CONSTRAINT aditivos_convenio_id_fkey FOREIGN KEY (convenio_id) REFERENCES convenios(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE alertas ADD CONSTRAINT alertas_convenio_id_fkey FOREIGN KEY (convenio_id) REFERENCES convenios(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE cessoes_terreno ADD CONSTRAINT cessoes_terreno_orgao_concedente_id_fkey FOREIGN KEY (orgao_concedente_id) REFERENCES orgaos_concedentes(id);
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE convenios ADD CONSTRAINT convenios_empresa_contratada_id_fkey FOREIGN KEY (empresa_contratada_id) REFERENCES empresas_contratadas(id);
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE convenios ADD CONSTRAINT convenios_orgao_concedente_id_fkey FOREIGN KEY (orgao_concedente_id) REFERENCES orgaos_concedentes(id);
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE documentos_anexos ADD CONSTRAINT documentos_anexos_cessao_terreno_id_fkey FOREIGN KEY (cessao_terreno_id) REFERENCES cessoes_terreno(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE documentos_anexos ADD CONSTRAINT documentos_anexos_convenio_id_fkey FOREIGN KEY (convenio_id) REFERENCES convenios(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE documentos_anexos ADD CONSTRAINT documentos_anexos_proposta_id_fkey FOREIGN KEY (proposta_id) REFERENCES propostas(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE limites_custeio ADD CONSTRAINT limites_custeio_orgao_concedente_id_fkey FOREIGN KEY (orgao_concedente_id) REFERENCES orgaos_concedentes(id);
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE medicoes ADD CONSTRAINT medicoes_convenio_id_fkey FOREIGN KEY (convenio_id) REFERENCES convenios(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE observacoes_convenio ADD CONSTRAINT observacoes_convenio_autor_id_fkey FOREIGN KEY (autor_id) REFERENCES usuarios(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE observacoes_convenio ADD CONSTRAINT observacoes_convenio_convenio_id_fkey FOREIGN KEY (convenio_id) REFERENCES convenios(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE permissoes_usuario ADD CONSTRAINT permissoes_usuario_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE propostas ADD CONSTRAINT propostas_orgao_concedente_id_fkey FOREIGN KEY (orgao_concedente_id) REFERENCES orgaos_concedentes(id);
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE propostas ADD CONSTRAINT propostas_convenio_gerado_id_fkey FOREIGN KEY (convenio_gerado_id) REFERENCES convenios(id);
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE repasses ADD CONSTRAINT repasses_convenio_id_fkey FOREIGN KEY (convenio_id) REFERENCES convenios(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE secretarias_orgaos ADD CONSTRAINT secretarias_orgaos_secretaria_id_fkey FOREIGN KEY (secretaria_id) REFERENCES secretarias(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE secretarias_orgaos ADD CONSTRAINT secretarias_orgaos_orgao_concedente_id_fkey FOREIGN KEY (orgao_concedente_id) REFERENCES orgaos_concedentes(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE usuarios ADD CONSTRAINT usuarios_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE usuarios ADD CONSTRAINT usuarios_secretaria_id_fkey FOREIGN KEY (secretaria_id) REFERENCES secretarias(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;

-- ──────────────────────────────────────────────────────────────────────
-- Índices
-- ──────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_aditivos_convenio ON aditivos USING btree (convenio_id);

CREATE INDEX IF NOT EXISTS idx_alertas_convenio ON alertas USING btree (convenio_id);

CREATE INDEX IF NOT EXISTS idx_alertas_status ON alertas USING btree (status);

CREATE INDEX IF NOT EXISTS idx_alertas_tipo ON alertas USING btree (tipo);

CREATE INDEX IF NOT EXISTS idx_auditoria_eventos_criado_em ON eventos USING btree (criado_em);

CREATE INDEX IF NOT EXISTS idx_auditoria_eventos_registro ON eventos USING btree (registro_id);

CREATE INDEX IF NOT EXISTS idx_auditoria_eventos_tabela ON eventos USING btree (tabela);

CREATE INDEX IF NOT EXISTS idx_auditoria_eventos_usuario ON eventos USING btree (usuario_id);

CREATE INDEX IF NOT EXISTS idx_cessoes_terreno_esfera ON cessoes_terreno USING btree (esfera);

CREATE INDEX IF NOT EXISTS idx_cessoes_terreno_orgao_concedente ON cessoes_terreno USING btree (orgao_concedente_id);

CREATE INDEX IF NOT EXISTS idx_cessoes_terreno_status ON cessoes_terreno USING btree (status);

CREATE INDEX IF NOT EXISTS idx_convenios_data_fim_vigencia ON convenios USING btree (data_fim_vigencia);

CREATE INDEX IF NOT EXISTS idx_convenios_empresa_contratada ON convenios USING btree (empresa_contratada_id);

CREATE INDEX IF NOT EXISTS idx_convenios_esfera ON convenios USING btree (esfera);

CREATE INDEX IF NOT EXISTS idx_convenios_orgao_concedente ON convenios USING btree (orgao_concedente_id);

CREATE INDEX IF NOT EXISTS idx_convenios_status_geral ON convenios USING btree (status_geral);

CREATE INDEX IF NOT EXISTS idx_documentos_anexos_cessao_terreno ON documentos_anexos USING btree (cessao_terreno_id);

CREATE INDEX IF NOT EXISTS idx_documentos_anexos_convenio ON documentos_anexos USING btree (convenio_id);

CREATE INDEX IF NOT EXISTS idx_documentos_anexos_proposta ON documentos_anexos USING btree (proposta_id);

CREATE INDEX IF NOT EXISTS idx_limites_custeio_competencia_ano ON limites_custeio USING btree (competencia_ano);

CREATE INDEX IF NOT EXISTS idx_limites_custeio_esfera ON limites_custeio USING btree (esfera);

CREATE INDEX IF NOT EXISTS idx_limites_custeio_orgao_concedente ON limites_custeio USING btree (orgao_concedente_id);

CREATE INDEX IF NOT EXISTS idx_medicoes_convenio ON medicoes USING btree (convenio_id);

CREATE INDEX IF NOT EXISTS idx_observacoes_convenio_convenio ON observacoes_convenio USING btree (convenio_id, criado_em DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_orgaos_concedentes_nome ON orgaos_concedentes USING btree (lower(nome));

CREATE INDEX IF NOT EXISTS idx_permissoes_usuario_usuario ON permissoes_usuario USING btree (usuario_id);

CREATE INDEX IF NOT EXISTS idx_propostas_convenio_gerado ON propostas USING btree (convenio_gerado_id);

CREATE INDEX IF NOT EXISTS idx_propostas_esfera ON propostas USING btree (esfera);

CREATE INDEX IF NOT EXISTS idx_propostas_orgao_concedente ON propostas USING btree (orgao_concedente_id);

CREATE INDEX IF NOT EXISTS idx_propostas_status ON propostas USING btree (status);

CREATE INDEX IF NOT EXISTS idx_repasses_convenio ON repasses USING btree (convenio_id);

CREATE INDEX IF NOT EXISTS idx_repasses_data ON repasses USING btree (data);

CREATE UNIQUE INDEX IF NOT EXISTS idx_secretarias_nome ON secretarias USING btree (lower(nome));

CREATE INDEX IF NOT EXISTS idx_secretarias_orgaos_orgao ON secretarias_orgaos USING btree (orgao_concedente_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios USING btree (lower(email));

CREATE INDEX IF NOT EXISTS idx_usuarios_secretaria ON usuarios USING btree (secretaria_id);

-- ──────────────────────────────────────────────────────────────────────
-- Funções
-- ──────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION atualizar_atualizado_em()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.atualizado_em := NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION gravar_evento()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_acao TEXT;
    v_dados_antes JSONB;
    v_dados_depois JSONB;
BEGIN
    IF TG_OP = 'INSERT' THEN
        v_acao := 'INSERT';
        v_dados_antes := NULL;
        v_dados_depois := to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
        v_acao := 'UPDATE';
        v_dados_antes := to_jsonb(OLD);
        v_dados_depois := to_jsonb(NEW);
    ELSIF TG_OP = 'DELETE' THEN
        v_acao := 'DELETE';
        v_dados_antes := to_jsonb(OLD);
        v_dados_depois := NULL;
    END IF;

    INSERT INTO eventos (
        tabela, registro_id, usuario_id, acao, dados_antes, dados_depois
    ) VALUES (
        TG_TABLE_NAME,
        COALESCE((v_dados_depois->>'id')::UUID, (v_dados_antes->>'id')::UUID),
        auth.uid(),
        v_acao,
        v_dados_antes,
        v_dados_depois
    );

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION herdar_esfera_orgao()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    SELECT esfera INTO NEW.esfera
    FROM orgaos_concedentes
    WHERE id = NEW.orgao_concedente_id;

    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION impedir_alteracao_observacao_convenio()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Exceção: quando o convênio pai é excluído, o ON DELETE CASCADE precisa poder levar as
    -- filhas junto. Nesse ponto a linha do convênio já não existe mais.
    IF TG_OP = 'DELETE' AND NOT EXISTS (SELECT 1 FROM convenios WHERE id = OLD.convenio_id) THEN
        RETURN OLD;
    END IF;

    RAISE EXCEPTION 'O histórico de observações do convênio é imutável: não pode ser alterado nem excluído';
END;
$function$
;

CREATE OR REPLACE FUNCTION nivel_permissao_usuario(p_modulo modulo_sistema)
 RETURNS nivel_permissao
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
    SELECT COALESCE(
        (
            SELECT p.nivel
            FROM permissoes_usuario p
            JOIN usuarios u ON u.id = p.usuario_id
            WHERE p.usuario_id = auth.uid() AND p.modulo = p_modulo AND u.ativo = TRUE
        ),
        'Nenhuma'::nivel_permissao
    );
$function$
;

CREATE OR REPLACE FUNCTION pode_editar(p_modulo modulo_sistema)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
    SELECT nivel_permissao_usuario(p_modulo) = 'Total';
$function$
;

CREATE OR REPLACE FUNCTION pode_ver(p_modulo modulo_sistema)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
    SELECT nivel_permissao_usuario(p_modulo) IN ('Parcial', 'Total');
$function$
;

CREATE OR REPLACE FUNCTION promover_proposta_para_convenio(p_proposta_id uuid, p_tipo_instrumento tipo_instrumento, p_valor_conveniado numeric DEFAULT NULL::numeric, p_valor_concedido numeric DEFAULT NULL::numeric, p_valor_contrapartida numeric DEFAULT NULL::numeric, p_numero_convenio text DEFAULT NULL::text, p_numero_mapp text DEFAULT NULL::text, p_numero_sic text DEFAULT NULL::text, p_data_assinatura date DEFAULT NULL::date, p_data_inicio_vigencia date DEFAULT NULL::date, p_data_fim_vigencia date DEFAULT NULL::date)
 RETURNS uuid
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_proposta RECORD;
    v_convenio_id UUID;
BEGIN
    SELECT * INTO v_proposta FROM propostas WHERE id = p_proposta_id;

    IF v_proposta IS NULL THEN
        RAISE EXCEPTION 'Proposta não encontrada ou sem acesso';
    END IF;

    IF v_proposta.convenio_gerado_id IS NOT NULL THEN
        RAISE EXCEPTION 'Esta proposta já foi promovida a convênio';
    END IF;

    INSERT INTO convenios (
        orgao_concedente_id, tipo_instrumento, objeto, valor_conveniado, valor_concedido,
        valor_contrapartida, numero_convenio, numero_mapp, numero_sic, numero_protocolo,
        numero_nup, data_assinatura, data_inicio_vigencia, data_fim_vigencia, observacoes
    ) VALUES (
        v_proposta.orgao_concedente_id, p_tipo_instrumento, v_proposta.objeto, p_valor_conveniado,
        p_valor_concedido, p_valor_contrapartida, p_numero_convenio, p_numero_mapp, p_numero_sic,
        v_proposta.numero_protocolo, v_proposta.numero_nup, p_data_assinatura, p_data_inicio_vigencia,
        p_data_fim_vigencia, v_proposta.observacoes
    ) RETURNING id INTO v_convenio_id;

    UPDATE propostas SET status = 'Aprovada', convenio_gerado_id = v_convenio_id WHERE id = p_proposta_id;

    RETURN v_convenio_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION registrar_observacao_inicial_convenio()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    IF NEW.observacoes IS NOT NULL AND btrim(NEW.observacoes) <> '' THEN
        INSERT INTO observacoes_convenio (convenio_id, texto, criado_em)
        VALUES (NEW.id, NEW.observacoes, NEW.criado_em);
    END IF;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION sincronizar_ultima_observacao_convenio()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    UPDATE convenios
    SET observacoes = NEW.texto
    WHERE id = NEW.convenio_id AND observacoes IS DISTINCT FROM NEW.texto;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION usuario_tem_acesso_convenio(p_convenio_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
    SELECT usuario_tem_acesso_orgao(orgao_concedente_id)
    FROM convenios WHERE id = p_convenio_id;
$function$
;

CREATE OR REPLACE FUNCTION usuario_tem_acesso_documento(p_convenio_id uuid, p_proposta_id uuid, p_cessao_terreno_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
    SELECT CASE
        WHEN p_convenio_id IS NOT NULL THEN usuario_tem_acesso_convenio(p_convenio_id)
        WHEN p_proposta_id IS NOT NULL THEN (
            SELECT usuario_tem_acesso_orgao(orgao_concedente_id)
            FROM propostas WHERE id = p_proposta_id
        )
        WHEN p_cessao_terreno_id IS NOT NULL THEN (
            SELECT usuario_tem_acesso_orgao(orgao_concedente_id)
            FROM cessoes_terreno WHERE id = p_cessao_terreno_id
        )
        ELSE FALSE
    END;
$function$
;

CREATE OR REPLACE FUNCTION usuario_tem_acesso_orgao(p_orgao_concedente_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
    SELECT
        NOT EXISTS (
            SELECT 1 FROM usuarios
            WHERE id = auth.uid() AND ativo = TRUE AND secretaria_id IS NOT NULL
        )
        OR EXISTS (
            SELECT 1
            FROM usuarios u
            JOIN secretarias_orgaos so ON so.secretaria_id = u.secretaria_id
            WHERE u.id = auth.uid() AND u.ativo = TRUE AND so.orgao_concedente_id = p_orgao_concedente_id
        );
$function$
;

-- ──────────────────────────────────────────────────────────────────────
-- Triggers
-- ──────────────────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS trg_atualizado_em_aditivos ON aditivos;
CREATE TRIGGER trg_atualizado_em_aditivos BEFORE UPDATE ON aditivos FOR EACH ROW EXECUTE FUNCTION atualizar_atualizado_em();

DROP TRIGGER IF EXISTS trg_audit_aditivos ON aditivos;
CREATE TRIGGER trg_audit_aditivos AFTER INSERT OR DELETE OR UPDATE ON aditivos FOR EACH ROW EXECUTE FUNCTION gravar_evento();

DROP TRIGGER IF EXISTS trg_atualizado_em_alertas ON alertas;
CREATE TRIGGER trg_atualizado_em_alertas BEFORE UPDATE ON alertas FOR EACH ROW EXECUTE FUNCTION atualizar_atualizado_em();

DROP TRIGGER IF EXISTS trg_audit_alertas ON alertas;
CREATE TRIGGER trg_audit_alertas AFTER INSERT OR DELETE OR UPDATE ON alertas FOR EACH ROW EXECUTE FUNCTION gravar_evento();

DROP TRIGGER IF EXISTS trg_atualizado_em_cessoes_terreno ON cessoes_terreno;
CREATE TRIGGER trg_atualizado_em_cessoes_terreno BEFORE UPDATE ON cessoes_terreno FOR EACH ROW EXECUTE FUNCTION atualizar_atualizado_em();

DROP TRIGGER IF EXISTS trg_audit_cessoes_terreno ON cessoes_terreno;
CREATE TRIGGER trg_audit_cessoes_terreno AFTER INSERT OR DELETE OR UPDATE ON cessoes_terreno FOR EACH ROW EXECUTE FUNCTION gravar_evento();

DROP TRIGGER IF EXISTS trg_herdar_esfera_cessoes_terreno ON cessoes_terreno;
CREATE TRIGGER trg_herdar_esfera_cessoes_terreno BEFORE INSERT OR UPDATE OF orgao_concedente_id ON cessoes_terreno FOR EACH ROW EXECUTE FUNCTION herdar_esfera_orgao();

DROP TRIGGER IF EXISTS trg_atualizado_em_configuracoes ON configuracoes;
CREATE TRIGGER trg_atualizado_em_configuracoes BEFORE UPDATE ON configuracoes FOR EACH ROW EXECUTE FUNCTION atualizar_atualizado_em();

DROP TRIGGER IF EXISTS trg_audit_configuracoes ON configuracoes;
CREATE TRIGGER trg_audit_configuracoes AFTER INSERT OR DELETE OR UPDATE ON configuracoes FOR EACH ROW EXECUTE FUNCTION gravar_evento();

DROP TRIGGER IF EXISTS trg_atualizado_em_convenios ON convenios;
CREATE TRIGGER trg_atualizado_em_convenios BEFORE UPDATE ON convenios FOR EACH ROW EXECUTE FUNCTION atualizar_atualizado_em();

DROP TRIGGER IF EXISTS trg_audit_convenios ON convenios;
CREATE TRIGGER trg_audit_convenios AFTER INSERT OR DELETE OR UPDATE ON convenios FOR EACH ROW EXECUTE FUNCTION gravar_evento();

DROP TRIGGER IF EXISTS trg_herdar_esfera_convenios ON convenios;
CREATE TRIGGER trg_herdar_esfera_convenios BEFORE INSERT OR UPDATE OF orgao_concedente_id ON convenios FOR EACH ROW EXECUTE FUNCTION herdar_esfera_orgao();

DROP TRIGGER IF EXISTS trg_registrar_observacao_inicial ON convenios;
CREATE TRIGGER trg_registrar_observacao_inicial AFTER INSERT ON convenios FOR EACH ROW EXECUTE FUNCTION registrar_observacao_inicial_convenio();

DROP TRIGGER IF EXISTS trg_atualizado_em_documentos_anexos ON documentos_anexos;
CREATE TRIGGER trg_atualizado_em_documentos_anexos BEFORE UPDATE ON documentos_anexos FOR EACH ROW EXECUTE FUNCTION atualizar_atualizado_em();

DROP TRIGGER IF EXISTS trg_audit_documentos_anexos ON documentos_anexos;
CREATE TRIGGER trg_audit_documentos_anexos AFTER INSERT OR DELETE OR UPDATE ON documentos_anexos FOR EACH ROW EXECUTE FUNCTION gravar_evento();

DROP TRIGGER IF EXISTS trg_atualizado_em_empresas_contratadas ON empresas_contratadas;
CREATE TRIGGER trg_atualizado_em_empresas_contratadas BEFORE UPDATE ON empresas_contratadas FOR EACH ROW EXECUTE FUNCTION atualizar_atualizado_em();

DROP TRIGGER IF EXISTS trg_audit_empresas_contratadas ON empresas_contratadas;
CREATE TRIGGER trg_audit_empresas_contratadas AFTER INSERT OR DELETE OR UPDATE ON empresas_contratadas FOR EACH ROW EXECUTE FUNCTION gravar_evento();

DROP TRIGGER IF EXISTS trg_atualizado_em_limites_custeio ON limites_custeio;
CREATE TRIGGER trg_atualizado_em_limites_custeio BEFORE UPDATE ON limites_custeio FOR EACH ROW EXECUTE FUNCTION atualizar_atualizado_em();

DROP TRIGGER IF EXISTS trg_audit_limites_custeio ON limites_custeio;
CREATE TRIGGER trg_audit_limites_custeio AFTER INSERT OR DELETE OR UPDATE ON limites_custeio FOR EACH ROW EXECUTE FUNCTION gravar_evento();

DROP TRIGGER IF EXISTS trg_herdar_esfera_limites_custeio ON limites_custeio;
CREATE TRIGGER trg_herdar_esfera_limites_custeio BEFORE INSERT OR UPDATE OF orgao_concedente_id ON limites_custeio FOR EACH ROW EXECUTE FUNCTION herdar_esfera_orgao();

DROP TRIGGER IF EXISTS trg_atualizado_em_medicoes ON medicoes;
CREATE TRIGGER trg_atualizado_em_medicoes BEFORE UPDATE ON medicoes FOR EACH ROW EXECUTE FUNCTION atualizar_atualizado_em();

DROP TRIGGER IF EXISTS trg_audit_medicoes ON medicoes;
CREATE TRIGGER trg_audit_medicoes AFTER INSERT OR DELETE OR UPDATE ON medicoes FOR EACH ROW EXECUTE FUNCTION gravar_evento();

DROP TRIGGER IF EXISTS trg_audit_observacoes_convenio ON observacoes_convenio;
CREATE TRIGGER trg_audit_observacoes_convenio AFTER INSERT OR DELETE OR UPDATE ON observacoes_convenio FOR EACH ROW EXECUTE FUNCTION gravar_evento();

DROP TRIGGER IF EXISTS trg_observacoes_convenio_imutavel ON observacoes_convenio;
CREATE TRIGGER trg_observacoes_convenio_imutavel BEFORE DELETE OR UPDATE ON observacoes_convenio FOR EACH ROW EXECUTE FUNCTION impedir_alteracao_observacao_convenio();

DROP TRIGGER IF EXISTS trg_sincronizar_ultima_observacao ON observacoes_convenio;
CREATE TRIGGER trg_sincronizar_ultima_observacao AFTER INSERT ON observacoes_convenio FOR EACH ROW EXECUTE FUNCTION sincronizar_ultima_observacao_convenio();

DROP TRIGGER IF EXISTS trg_atualizado_em_orgaos_concedentes ON orgaos_concedentes;
CREATE TRIGGER trg_atualizado_em_orgaos_concedentes BEFORE UPDATE ON orgaos_concedentes FOR EACH ROW EXECUTE FUNCTION atualizar_atualizado_em();

DROP TRIGGER IF EXISTS trg_audit_orgaos_concedentes ON orgaos_concedentes;
CREATE TRIGGER trg_audit_orgaos_concedentes AFTER INSERT OR DELETE OR UPDATE ON orgaos_concedentes FOR EACH ROW EXECUTE FUNCTION gravar_evento();

DROP TRIGGER IF EXISTS trg_atualizado_em_permissoes_usuario ON permissoes_usuario;
CREATE TRIGGER trg_atualizado_em_permissoes_usuario BEFORE UPDATE ON permissoes_usuario FOR EACH ROW EXECUTE FUNCTION atualizar_atualizado_em();

DROP TRIGGER IF EXISTS trg_atualizado_em_propostas ON propostas;
CREATE TRIGGER trg_atualizado_em_propostas BEFORE UPDATE ON propostas FOR EACH ROW EXECUTE FUNCTION atualizar_atualizado_em();

DROP TRIGGER IF EXISTS trg_audit_propostas ON propostas;
CREATE TRIGGER trg_audit_propostas AFTER INSERT OR DELETE OR UPDATE ON propostas FOR EACH ROW EXECUTE FUNCTION gravar_evento();

DROP TRIGGER IF EXISTS trg_herdar_esfera_propostas ON propostas;
CREATE TRIGGER trg_herdar_esfera_propostas BEFORE INSERT OR UPDATE OF orgao_concedente_id ON propostas FOR EACH ROW EXECUTE FUNCTION herdar_esfera_orgao();

DROP TRIGGER IF EXISTS trg_atualizado_em_repasses ON repasses;
CREATE TRIGGER trg_atualizado_em_repasses BEFORE UPDATE ON repasses FOR EACH ROW EXECUTE FUNCTION atualizar_atualizado_em();

DROP TRIGGER IF EXISTS trg_audit_repasses ON repasses;
CREATE TRIGGER trg_audit_repasses AFTER INSERT OR DELETE OR UPDATE ON repasses FOR EACH ROW EXECUTE FUNCTION gravar_evento();

DROP TRIGGER IF EXISTS trg_atualizado_em_secretarias ON secretarias;
CREATE TRIGGER trg_atualizado_em_secretarias BEFORE UPDATE ON secretarias FOR EACH ROW EXECUTE FUNCTION atualizar_atualizado_em();

DROP TRIGGER IF EXISTS trg_audit_secretarias ON secretarias;
CREATE TRIGGER trg_audit_secretarias AFTER INSERT OR DELETE OR UPDATE ON secretarias FOR EACH ROW EXECUTE FUNCTION gravar_evento();

DROP TRIGGER IF EXISTS trg_atualizado_em_usuarios ON usuarios;
CREATE TRIGGER trg_atualizado_em_usuarios BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION atualizar_atualizado_em();

DROP TRIGGER IF EXISTS trg_audit_usuarios ON usuarios;
CREATE TRIGGER trg_audit_usuarios AFTER INSERT OR DELETE OR UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION gravar_evento();

-- ──────────────────────────────────────────────────────────────────────
-- Row Level Security
-- ──────────────────────────────────────────────────────────────────────

ALTER TABLE aditivos ENABLE ROW LEVEL SECURITY;

ALTER TABLE alertas ENABLE ROW LEVEL SECURITY;

ALTER TABLE cessoes_terreno ENABLE ROW LEVEL SECURITY;

ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;

ALTER TABLE convenios ENABLE ROW LEVEL SECURITY;

ALTER TABLE documentos_anexos ENABLE ROW LEVEL SECURITY;

ALTER TABLE empresas_contratadas ENABLE ROW LEVEL SECURITY;

ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;

ALTER TABLE limites_custeio ENABLE ROW LEVEL SECURITY;

ALTER TABLE medicoes ENABLE ROW LEVEL SECURITY;

ALTER TABLE observacoes_convenio ENABLE ROW LEVEL SECURITY;

ALTER TABLE orgaos_concedentes ENABLE ROW LEVEL SECURITY;

ALTER TABLE permissoes_usuario ENABLE ROW LEVEL SECURITY;

ALTER TABLE propostas ENABLE ROW LEVEL SECURITY;

ALTER TABLE repasses ENABLE ROW LEVEL SECURITY;

ALTER TABLE secretarias ENABLE ROW LEVEL SECURITY;

ALTER TABLE secretarias_orgaos ENABLE ROW LEVEL SECURITY;

ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS aditivos_delete ON aditivos;
CREATE POLICY aditivos_delete ON aditivos FOR DELETE
  USING ((pode_editar('Convenios'::modulo_sistema) AND usuario_tem_acesso_convenio(convenio_id)));

DROP POLICY IF EXISTS aditivos_insert ON aditivos;
CREATE POLICY aditivos_insert ON aditivos FOR INSERT
  WITH CHECK ((pode_editar('Convenios'::modulo_sistema) AND usuario_tem_acesso_convenio(convenio_id)));

DROP POLICY IF EXISTS aditivos_select ON aditivos;
CREATE POLICY aditivos_select ON aditivos FOR SELECT
  USING ((pode_ver('Convenios'::modulo_sistema) AND usuario_tem_acesso_convenio(convenio_id)));

DROP POLICY IF EXISTS aditivos_update ON aditivos;
CREATE POLICY aditivos_update ON aditivos FOR UPDATE
  USING ((pode_editar('Convenios'::modulo_sistema) AND usuario_tem_acesso_convenio(convenio_id)))
  WITH CHECK ((pode_editar('Convenios'::modulo_sistema) AND usuario_tem_acesso_convenio(convenio_id)));

DROP POLICY IF EXISTS alertas_select ON alertas;
CREATE POLICY alertas_select ON alertas FOR SELECT
  USING ((pode_ver('Convenios'::modulo_sistema) AND usuario_tem_acesso_convenio(convenio_id)));

DROP POLICY IF EXISTS alertas_update ON alertas;
CREATE POLICY alertas_update ON alertas FOR UPDATE
  USING ((pode_editar('Convenios'::modulo_sistema) AND usuario_tem_acesso_convenio(convenio_id)))
  WITH CHECK ((pode_editar('Convenios'::modulo_sistema) AND usuario_tem_acesso_convenio(convenio_id)));

DROP POLICY IF EXISTS cessoes_terreno_delete ON cessoes_terreno;
CREATE POLICY cessoes_terreno_delete ON cessoes_terreno FOR DELETE
  USING ((pode_editar('CessoesTerreno'::modulo_sistema) AND usuario_tem_acesso_orgao(orgao_concedente_id)));

DROP POLICY IF EXISTS cessoes_terreno_insert ON cessoes_terreno;
CREATE POLICY cessoes_terreno_insert ON cessoes_terreno FOR INSERT
  WITH CHECK ((pode_editar('CessoesTerreno'::modulo_sistema) AND usuario_tem_acesso_orgao(orgao_concedente_id)));

DROP POLICY IF EXISTS cessoes_terreno_select ON cessoes_terreno;
CREATE POLICY cessoes_terreno_select ON cessoes_terreno FOR SELECT
  USING ((pode_ver('CessoesTerreno'::modulo_sistema) AND usuario_tem_acesso_orgao(orgao_concedente_id)));

DROP POLICY IF EXISTS cessoes_terreno_update ON cessoes_terreno;
CREATE POLICY cessoes_terreno_update ON cessoes_terreno FOR UPDATE
  USING ((pode_editar('CessoesTerreno'::modulo_sistema) AND usuario_tem_acesso_orgao(orgao_concedente_id)))
  WITH CHECK ((pode_editar('CessoesTerreno'::modulo_sistema) AND usuario_tem_acesso_orgao(orgao_concedente_id)));

DROP POLICY IF EXISTS configuracoes_select ON configuracoes;
CREATE POLICY configuracoes_select ON configuracoes FOR SELECT
  USING ((pode_ver('ConfiguracoesGerais'::modulo_sistema) OR pode_ver('ConfiguracoesMunicipio'::modulo_sistema) OR pode_ver('ConfiguracoesLayout'::modulo_sistema)));

DROP POLICY IF EXISTS configuracoes_update ON configuracoes;
CREATE POLICY configuracoes_update ON configuracoes FOR UPDATE
  USING ((pode_editar('ConfiguracoesGerais'::modulo_sistema) OR pode_editar('ConfiguracoesMunicipio'::modulo_sistema) OR pode_editar('ConfiguracoesLayout'::modulo_sistema)))
  WITH CHECK ((pode_editar('ConfiguracoesGerais'::modulo_sistema) OR pode_editar('ConfiguracoesMunicipio'::modulo_sistema) OR pode_editar('ConfiguracoesLayout'::modulo_sistema)));

DROP POLICY IF EXISTS convenios_delete ON convenios;
CREATE POLICY convenios_delete ON convenios FOR DELETE
  USING ((pode_editar('Convenios'::modulo_sistema) AND usuario_tem_acesso_orgao(orgao_concedente_id)));

DROP POLICY IF EXISTS convenios_insert ON convenios;
CREATE POLICY convenios_insert ON convenios FOR INSERT
  WITH CHECK ((pode_editar('Convenios'::modulo_sistema) AND usuario_tem_acesso_orgao(orgao_concedente_id)));

DROP POLICY IF EXISTS convenios_select ON convenios;
CREATE POLICY convenios_select ON convenios FOR SELECT
  USING ((pode_ver('Convenios'::modulo_sistema) AND usuario_tem_acesso_orgao(orgao_concedente_id)));

DROP POLICY IF EXISTS convenios_update ON convenios;
CREATE POLICY convenios_update ON convenios FOR UPDATE
  USING ((pode_editar('Convenios'::modulo_sistema) AND usuario_tem_acesso_orgao(orgao_concedente_id)))
  WITH CHECK ((pode_editar('Convenios'::modulo_sistema) AND usuario_tem_acesso_orgao(orgao_concedente_id)));

DROP POLICY IF EXISTS documentos_anexos_delete ON documentos_anexos;
CREATE POLICY documentos_anexos_delete ON documentos_anexos FOR DELETE
  USING ((pode_editar('Convenios'::modulo_sistema) AND usuario_tem_acesso_convenio(convenio_id)));

DROP POLICY IF EXISTS documentos_anexos_insert ON documentos_anexos;
CREATE POLICY documentos_anexos_insert ON documentos_anexos FOR INSERT
  WITH CHECK ((pode_editar('Convenios'::modulo_sistema) AND usuario_tem_acesso_convenio(convenio_id)));

DROP POLICY IF EXISTS documentos_anexos_select ON documentos_anexos;
CREATE POLICY documentos_anexos_select ON documentos_anexos FOR SELECT
  USING ((pode_ver('Convenios'::modulo_sistema) AND usuario_tem_acesso_convenio(convenio_id)));

DROP POLICY IF EXISTS documentos_anexos_update ON documentos_anexos;
CREATE POLICY documentos_anexos_update ON documentos_anexos FOR UPDATE
  USING ((pode_editar('Convenios'::modulo_sistema) AND usuario_tem_acesso_convenio(convenio_id)))
  WITH CHECK ((pode_editar('Convenios'::modulo_sistema) AND usuario_tem_acesso_convenio(convenio_id)));

DROP POLICY IF EXISTS empresas_contratadas_delete ON empresas_contratadas;
CREATE POLICY empresas_contratadas_delete ON empresas_contratadas FOR DELETE
  USING (pode_editar('EmpresasContratadas'::modulo_sistema));

DROP POLICY IF EXISTS empresas_contratadas_insert ON empresas_contratadas;
CREATE POLICY empresas_contratadas_insert ON empresas_contratadas FOR INSERT
  WITH CHECK (pode_editar('EmpresasContratadas'::modulo_sistema));

DROP POLICY IF EXISTS empresas_contratadas_select ON empresas_contratadas;
CREATE POLICY empresas_contratadas_select ON empresas_contratadas FOR SELECT
  USING (pode_ver('EmpresasContratadas'::modulo_sistema));

DROP POLICY IF EXISTS empresas_contratadas_update ON empresas_contratadas;
CREATE POLICY empresas_contratadas_update ON empresas_contratadas FOR UPDATE
  USING (pode_editar('EmpresasContratadas'::modulo_sistema))
  WITH CHECK (pode_editar('EmpresasContratadas'::modulo_sistema));

DROP POLICY IF EXISTS eventos_select ON eventos;
CREATE POLICY eventos_select ON eventos FOR SELECT
  USING (pode_ver('Usuarios'::modulo_sistema));

DROP POLICY IF EXISTS limites_custeio_delete ON limites_custeio;
CREATE POLICY limites_custeio_delete ON limites_custeio FOR DELETE
  USING ((pode_editar('LimitesCusteio'::modulo_sistema) AND usuario_tem_acesso_orgao(orgao_concedente_id)));

DROP POLICY IF EXISTS limites_custeio_insert ON limites_custeio;
CREATE POLICY limites_custeio_insert ON limites_custeio FOR INSERT
  WITH CHECK ((pode_editar('LimitesCusteio'::modulo_sistema) AND usuario_tem_acesso_orgao(orgao_concedente_id)));

DROP POLICY IF EXISTS limites_custeio_select ON limites_custeio;
CREATE POLICY limites_custeio_select ON limites_custeio FOR SELECT
  USING ((pode_ver('LimitesCusteio'::modulo_sistema) AND usuario_tem_acesso_orgao(orgao_concedente_id)));

DROP POLICY IF EXISTS limites_custeio_update ON limites_custeio;
CREATE POLICY limites_custeio_update ON limites_custeio FOR UPDATE
  USING ((pode_editar('LimitesCusteio'::modulo_sistema) AND usuario_tem_acesso_orgao(orgao_concedente_id)))
  WITH CHECK ((pode_editar('LimitesCusteio'::modulo_sistema) AND usuario_tem_acesso_orgao(orgao_concedente_id)));

DROP POLICY IF EXISTS medicoes_delete ON medicoes;
CREATE POLICY medicoes_delete ON medicoes FOR DELETE
  USING ((pode_editar('Convenios'::modulo_sistema) AND usuario_tem_acesso_convenio(convenio_id)));

DROP POLICY IF EXISTS medicoes_insert ON medicoes;
CREATE POLICY medicoes_insert ON medicoes FOR INSERT
  WITH CHECK ((pode_editar('Convenios'::modulo_sistema) AND usuario_tem_acesso_convenio(convenio_id)));

DROP POLICY IF EXISTS medicoes_select ON medicoes;
CREATE POLICY medicoes_select ON medicoes FOR SELECT
  USING ((pode_ver('Convenios'::modulo_sistema) AND usuario_tem_acesso_convenio(convenio_id)));

DROP POLICY IF EXISTS medicoes_update ON medicoes;
CREATE POLICY medicoes_update ON medicoes FOR UPDATE
  USING ((pode_editar('Convenios'::modulo_sistema) AND usuario_tem_acesso_convenio(convenio_id)))
  WITH CHECK ((pode_editar('Convenios'::modulo_sistema) AND usuario_tem_acesso_convenio(convenio_id)));

DROP POLICY IF EXISTS observacoes_convenio_insert ON observacoes_convenio;
CREATE POLICY observacoes_convenio_insert ON observacoes_convenio FOR INSERT
  WITH CHECK ((pode_editar('Convenios'::modulo_sistema) AND usuario_tem_acesso_convenio(convenio_id)));

DROP POLICY IF EXISTS observacoes_convenio_select ON observacoes_convenio;
CREATE POLICY observacoes_convenio_select ON observacoes_convenio FOR SELECT
  USING ((pode_ver('Convenios'::modulo_sistema) AND usuario_tem_acesso_convenio(convenio_id)));

DROP POLICY IF EXISTS orgaos_concedentes_delete ON orgaos_concedentes;
CREATE POLICY orgaos_concedentes_delete ON orgaos_concedentes FOR DELETE
  USING (pode_editar('OrgaosConcedentes'::modulo_sistema));

DROP POLICY IF EXISTS orgaos_concedentes_insert ON orgaos_concedentes;
CREATE POLICY orgaos_concedentes_insert ON orgaos_concedentes FOR INSERT
  WITH CHECK (pode_editar('OrgaosConcedentes'::modulo_sistema));

DROP POLICY IF EXISTS orgaos_concedentes_select ON orgaos_concedentes;
CREATE POLICY orgaos_concedentes_select ON orgaos_concedentes FOR SELECT
  USING ((pode_ver('OrgaosConcedentes'::modulo_sistema) AND usuario_tem_acesso_orgao(id)));

DROP POLICY IF EXISTS orgaos_concedentes_update ON orgaos_concedentes;
CREATE POLICY orgaos_concedentes_update ON orgaos_concedentes FOR UPDATE
  USING (pode_editar('OrgaosConcedentes'::modulo_sistema))
  WITH CHECK (pode_editar('OrgaosConcedentes'::modulo_sistema));

DROP POLICY IF EXISTS permissoes_usuario_delete ON permissoes_usuario;
CREATE POLICY permissoes_usuario_delete ON permissoes_usuario FOR DELETE
  USING (pode_editar('Usuarios'::modulo_sistema));

DROP POLICY IF EXISTS permissoes_usuario_insert ON permissoes_usuario;
CREATE POLICY permissoes_usuario_insert ON permissoes_usuario FOR INSERT
  WITH CHECK (pode_editar('Usuarios'::modulo_sistema));

DROP POLICY IF EXISTS permissoes_usuario_select ON permissoes_usuario;
CREATE POLICY permissoes_usuario_select ON permissoes_usuario FOR SELECT
  USING (((usuario_id = auth.uid()) OR pode_ver('Usuarios'::modulo_sistema)));

DROP POLICY IF EXISTS permissoes_usuario_update ON permissoes_usuario;
CREATE POLICY permissoes_usuario_update ON permissoes_usuario FOR UPDATE
  USING (pode_editar('Usuarios'::modulo_sistema))
  WITH CHECK (pode_editar('Usuarios'::modulo_sistema));

DROP POLICY IF EXISTS propostas_delete ON propostas;
CREATE POLICY propostas_delete ON propostas FOR DELETE
  USING ((pode_editar('Propostas'::modulo_sistema) AND usuario_tem_acesso_orgao(orgao_concedente_id)));

DROP POLICY IF EXISTS propostas_insert ON propostas;
CREATE POLICY propostas_insert ON propostas FOR INSERT
  WITH CHECK ((pode_editar('Propostas'::modulo_sistema) AND usuario_tem_acesso_orgao(orgao_concedente_id)));

DROP POLICY IF EXISTS propostas_select ON propostas;
CREATE POLICY propostas_select ON propostas FOR SELECT
  USING ((pode_ver('Propostas'::modulo_sistema) AND usuario_tem_acesso_orgao(orgao_concedente_id)));

DROP POLICY IF EXISTS propostas_update ON propostas;
CREATE POLICY propostas_update ON propostas FOR UPDATE
  USING ((pode_editar('Propostas'::modulo_sistema) AND usuario_tem_acesso_orgao(orgao_concedente_id)))
  WITH CHECK ((pode_editar('Propostas'::modulo_sistema) AND usuario_tem_acesso_orgao(orgao_concedente_id)));

DROP POLICY IF EXISTS repasses_delete ON repasses;
CREATE POLICY repasses_delete ON repasses FOR DELETE
  USING ((pode_editar('Convenios'::modulo_sistema) AND usuario_tem_acesso_convenio(convenio_id)));

DROP POLICY IF EXISTS repasses_insert ON repasses;
CREATE POLICY repasses_insert ON repasses FOR INSERT
  WITH CHECK ((pode_editar('Convenios'::modulo_sistema) AND usuario_tem_acesso_convenio(convenio_id)));

DROP POLICY IF EXISTS repasses_select ON repasses;
CREATE POLICY repasses_select ON repasses FOR SELECT
  USING ((pode_ver('Convenios'::modulo_sistema) AND usuario_tem_acesso_convenio(convenio_id)));

DROP POLICY IF EXISTS repasses_update ON repasses;
CREATE POLICY repasses_update ON repasses FOR UPDATE
  USING ((pode_editar('Convenios'::modulo_sistema) AND usuario_tem_acesso_convenio(convenio_id)))
  WITH CHECK ((pode_editar('Convenios'::modulo_sistema) AND usuario_tem_acesso_convenio(convenio_id)));

DROP POLICY IF EXISTS secretarias_delete ON secretarias;
CREATE POLICY secretarias_delete ON secretarias FOR DELETE
  USING (pode_editar('ConfiguracoesSecretarias'::modulo_sistema));

DROP POLICY IF EXISTS secretarias_insert ON secretarias;
CREATE POLICY secretarias_insert ON secretarias FOR INSERT
  WITH CHECK (pode_editar('ConfiguracoesSecretarias'::modulo_sistema));

DROP POLICY IF EXISTS secretarias_select ON secretarias;
CREATE POLICY secretarias_select ON secretarias FOR SELECT
  USING ((pode_ver('ConfiguracoesSecretarias'::modulo_sistema) OR pode_ver('Usuarios'::modulo_sistema)));

DROP POLICY IF EXISTS secretarias_update ON secretarias;
CREATE POLICY secretarias_update ON secretarias FOR UPDATE
  USING (pode_editar('ConfiguracoesSecretarias'::modulo_sistema))
  WITH CHECK (pode_editar('ConfiguracoesSecretarias'::modulo_sistema));

DROP POLICY IF EXISTS secretarias_orgaos_delete ON secretarias_orgaos;
CREATE POLICY secretarias_orgaos_delete ON secretarias_orgaos FOR DELETE
  USING (pode_editar('ConfiguracoesSecretarias'::modulo_sistema));

DROP POLICY IF EXISTS secretarias_orgaos_insert ON secretarias_orgaos;
CREATE POLICY secretarias_orgaos_insert ON secretarias_orgaos FOR INSERT
  WITH CHECK (pode_editar('ConfiguracoesSecretarias'::modulo_sistema));

DROP POLICY IF EXISTS secretarias_orgaos_select ON secretarias_orgaos;
CREATE POLICY secretarias_orgaos_select ON secretarias_orgaos FOR SELECT
  USING (pode_ver('ConfiguracoesSecretarias'::modulo_sistema));

DROP POLICY IF EXISTS usuarios_insert ON usuarios;
CREATE POLICY usuarios_insert ON usuarios FOR INSERT
  WITH CHECK (pode_editar('Usuarios'::modulo_sistema));

DROP POLICY IF EXISTS usuarios_select ON usuarios;
CREATE POLICY usuarios_select ON usuarios FOR SELECT
  USING (((id = auth.uid()) OR pode_ver('Usuarios'::modulo_sistema)));

DROP POLICY IF EXISTS usuarios_update ON usuarios;
CREATE POLICY usuarios_update ON usuarios FOR UPDATE
  USING (pode_editar('Usuarios'::modulo_sistema))
  WITH CHECK (pode_editar('Usuarios'::modulo_sistema));
