-- Migration 0019: unicidade de Alerta por convênio+tipo
-- Permite que o motor de alertas (Fase 4) faça upsert idempotente em vez de duplicar alertas
-- a cada execução do job.

ALTER TABLE public.alertas ADD CONSTRAINT uq_alertas_convenio_tipo UNIQUE (convenio_id, tipo);
