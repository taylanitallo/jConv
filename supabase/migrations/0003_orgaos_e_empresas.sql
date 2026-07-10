-- Migration 0003: Entidades base OrgaoConcedente e EmpresaContratada

CREATE TABLE public.orgaos_concedentes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    esfera public.esfera_convenio NOT NULL,
    parlamentar_padrinho TEXT,
    contato TEXT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.orgaos_concedentes IS 'OrgaoConcedente — órgão/ministério/Caixa concedente do convênio; fonte da esfera herdada pelas demais entidades';

CREATE UNIQUE INDEX idx_orgaos_concedentes_nome ON public.orgaos_concedentes (LOWER(nome));

CREATE TRIGGER trg_atualizado_em_orgaos_concedentes
    BEFORE UPDATE ON public.orgaos_concedentes
    FOR EACH ROW EXECUTE FUNCTION public.atualizar_atualizado_em();

CREATE TABLE public.empresas_contratadas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    responsavel_contato TEXT,
    cnpj TEXT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.empresas_contratadas IS 'EmpresaContratada — empresa executora de obras/serviços vinculada a convênios';

CREATE TRIGGER trg_atualizado_em_empresas_contratadas
    BEFORE UPDATE ON public.empresas_contratadas
    FOR EACH ROW EXECUTE FUNCTION public.atualizar_atualizado_em();

CREATE TRIGGER trg_audit_orgaos_concedentes
    AFTER INSERT OR UPDATE OR DELETE ON public.orgaos_concedentes
    FOR EACH ROW EXECUTE FUNCTION auditoria.gravar_evento();

CREATE TRIGGER trg_audit_empresas_contratadas
    AFTER INSERT OR UPDATE OR DELETE ON public.empresas_contratadas
    FOR EACH ROW EXECUTE FUNCTION auditoria.gravar_evento();
