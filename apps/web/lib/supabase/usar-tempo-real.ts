'use client';

import { useEffect, useRef } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { criarClienteSupabaseNavegador } from './cliente-navegador';
import { chamarApi } from '../api/cliente';

// Assina mudanças em `convenios` e `alertas` via Supabase Realtime e chama aoMudar() sempre que
// algo muda — usado pelo Dashboard para se atualizar sem precisar recarregar a página. O
// access_token do cookie httpOnly é repassado só para autorizar este canal (Realtime já respeita
// a RLS do Postgres); consultas de dados continuam sempre passando pela API.
export function usarAtualizacaoTempoReal(aoMudar: () => void) {
  const aoMudarRef = useRef(aoMudar);
  aoMudarRef.current = aoMudar;

  useEffect(() => {
    let cancelado = false;
    const supabase = criarClienteSupabaseNavegador();
    let canal: RealtimeChannel | null = null;

    chamarApi<{ accessToken: string }>('/auth/token-realtime').then(({ accessToken }) => {
      if (cancelado || !accessToken) return;
      supabase.realtime.setAuth(accessToken);

      canal = supabase
        .channel('jconv-dashboard')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'convenios' }, () => aoMudarRef.current())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'alertas' }, () => aoMudarRef.current())
        .subscribe();
    });

    return () => {
      cancelado = true;
      if (canal) supabase.removeChannel(canal);
    };
  }, []);
}
