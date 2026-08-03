import { criarClienteDados, sqlDe, type Consulta } from './cliente-dados';

// Captura o SQL montado sem tocar no banco.
function comCaptura() {
  const executadas: { sql: string; params: unknown[] }[] = [];
  let resposta: unknown[] = [];
  const cliente = criarClienteDados(async (sql, params) => {
    executadas.push({ sql, params });
    return { rows: resposta };
  });
  return {
    cliente,
    executadas,
    responder: (linhas: unknown[]) => {
      resposta = linhas;
    },
  };
}

describe('adaptador de dados — SQL montado', () => {
  it('select com colunas, filtro e ordenação', () => {
    const { cliente } = comCaptura();
    const { sql, params } = sqlDe(
      cliente.from('convenios').select('id, objeto').eq('esfera', 'Federal').order('criado_em', { ascending: false }) as Consulta,
    );
    expect(sql).toBe('SELECT "id", "objeto" FROM "convenios" WHERE "esfera" = $1 ORDER BY "criado_em" DESC');
    expect(params).toEqual(['Federal']);
  });

  it('select * quando não há colunas explícitas', () => {
    const { cliente } = comCaptura();
    expect(sqlDe(cliente.from('usuarios').select('*') as Consulta).sql).toBe('SELECT * FROM "usuarios"');
  });

  // Um parâmetro por valor, e não um array só. Um array viaja tipado como text[], e contra
  // coluna enum (permissoes_usuario.modulo) o Postgres recusa a comparação — a consulta falhava
  // e o guard de permissões lia o erro como "usuário sem acesso".
  it('in() gera um marcador por valor, para o tipo da coluna valer', () => {
    const { cliente } = comCaptura();
    const { sql, params } = sqlDe(cliente.from('repasses').select('*').in('convenio_id', ['a', 'b']) as Consulta);
    expect(sql).toBe('SELECT * FROM "repasses" WHERE "convenio_id" IN ($1, $2)');
    expect(params).toEqual(['a', 'b']);
  });

  it('in() com lista vazia não casa nada, em vez de gerar SQL inválido', () => {
    const { cliente } = comCaptura();
    const { sql, params } = sqlDe(cliente.from('repasses').select('*').in('convenio_id', []) as Consulta);
    expect(sql).toBe('SELECT * FROM "repasses" WHERE FALSE');
    expect(params).toEqual([]);
  });

  it('insert só devolve linhas quando .select() é encadeado depois', () => {
    const { cliente } = comCaptura();
    const semRetorno = sqlDe(cliente.from('secretarias').insert({ nome: 'X' }) as Consulta);
    expect(semRetorno.sql).toBe('INSERT INTO "secretarias" ("nome") VALUES ($1)');

    const comRetorno = sqlDe(cliente.from('secretarias').insert({ nome: 'X' }).select() as Consulta);
    expect(comRetorno.sql).toBe('INSERT INTO "secretarias" ("nome") VALUES ($1) RETURNING *');
  });

  it('insert em lote usa a união das colunas e DEFAULT no que faltar', () => {
    const { cliente } = comCaptura();
    const { sql, params } = sqlDe(
      cliente.from('permissoes_usuario').insert([{ modulo: 'A', nivel: 'Total' }, { modulo: 'B' }]) as Consulta,
    );
    expect(sql).toBe('INSERT INTO "permissoes_usuario" ("modulo", "nivel") VALUES ($1, $2), ($3, DEFAULT)');
    expect(params).toEqual(['A', 'Total', 'B']);
  });

  it('update aplica SET e WHERE na ordem certa dos parâmetros', () => {
    const { cliente } = comCaptura();
    const { sql, params } = sqlDe(
      cliente.from('convenios').update({ objeto: 'novo' }).eq('id', 'abc').select().single() as Consulta,
    );
    expect(sql).toBe('UPDATE "convenios" SET "objeto" = $1 WHERE "id" = $2 RETURNING *');
    expect(params).toEqual(['novo', 'abc']);
  });

  it('delete com filtro', () => {
    const { cliente } = comCaptura();
    const { sql, params } = sqlDe(cliente.from('aditivos').delete().eq('id', 'x') as Consulta);
    expect(sql).toBe('DELETE FROM "aditivos" WHERE "id" = $1');
    expect(params).toEqual(['x']);
  });

  it('upsert monta ON CONFLICT com a chave informada', () => {
    const { cliente } = comCaptura();
    const { sql } = sqlDe(
      cliente
        .from('alertas')
        .upsert({ convenio_id: 'c', tipo: 't', descricao: 'd' }, { onConflict: 'convenio_id,tipo' }) as Consulta,
    );
    expect(sql).toBe(
      'INSERT INTO "alertas" ("convenio_id", "tipo", "descricao") VALUES ($1, $2, $3) ' +
        'ON CONFLICT ("convenio_id", "tipo") DO UPDATE SET "descricao" = EXCLUDED."descricao"',
    );
  });

  it('recusa identificador fora do padrão em vez de interpolar', () => {
    const { cliente } = comCaptura();
    expect(() => sqlDe(cliente.from('convenios; DROP TABLE x').select('*') as Consulta)).toThrow(/identificador inválido/);
    expect(() => sqlDe(cliente.from('convenios').select('*').eq('a = 1 OR 1', 'x') as Consulta)).toThrow(
      /identificador inválido/,
    );
  });
});

describe('adaptador de dados — contrato de resultado', () => {
  it('single() com uma linha devolve o objeto', async () => {
    const { cliente, responder } = comCaptura();
    responder([{ id: 1 }]);
    const { data, error } = await cliente.from('convenios').select('*').single();
    expect(error).toBeNull();
    expect(data).toEqual({ id: 1 });
  });

  it('single() sem linha devolve PGRST116, que o desembrulhar traduz em 404', async () => {
    const { cliente, responder } = comCaptura();
    responder([]);
    const { data, error } = await cliente.from('convenios').select('*').single();
    expect(data).toBeNull();
    expect(error?.code).toBe('PGRST116');
  });

  it('maybeSingle() sem linha devolve null sem erro', async () => {
    const { cliente, responder } = comCaptura();
    responder([]);
    const { data, error } = await cliente.from('convenios').select('*').maybeSingle();
    expect(data).toBeNull();
    expect(error).toBeNull();
  });

  it('sem single(), devolve a lista', async () => {
    const { cliente, responder } = comCaptura();
    responder([{ id: 1 }, { id: 2 }]);
    const { data } = await cliente.from('convenios').select('*');
    expect(data).toHaveLength(2);
  });

  it('rpc passa os parâmetros nomeados', async () => {
    const { cliente, executadas, responder } = comCaptura();
    responder([{ resultado: 'ok' }]);
    const { data } = await cliente.rpc('promover_proposta_para_convenio', { p_proposta_id: 'x', p_valor: 10 });
    expect(executadas[0].sql).toBe(
      'SELECT "promover_proposta_para_convenio"("p_proposta_id" => $1, "p_valor" => $2) AS resultado',
    );
    expect(executadas[0].params).toEqual(['x', 10]);
    expect(data).toBe('ok');
  });

  it('erro do banco vira {error} em vez de exceção, como no supabase-js', async () => {
    const cliente = criarClienteDados(async () => {
      throw Object.assign(new Error('violates foreign key'), { code: '23503' });
    });
    const { data, error } = await cliente.from('convenios').select('*');
    expect(data).toBeNull();
    expect(error).toEqual({ code: '23503', message: 'violates foreign key' });
  });
});
