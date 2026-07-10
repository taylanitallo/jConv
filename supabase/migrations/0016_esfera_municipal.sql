-- Migration 0016: adiciona 'Municipal' ao enum de esfera
-- A planilha real (Fase 2) tem uma aba MUNICIPAL (ex.: convênios com SISAR/consórcios
-- intermunicipais) além de ESTADUAL/FEDERAL/CAIXA previstas no modelo original.

ALTER TYPE public.esfera_convenio ADD VALUE IF NOT EXISTS 'Municipal';
