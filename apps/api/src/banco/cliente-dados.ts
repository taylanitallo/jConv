import { PoolClient } from 'pg';

// Adaptador que fala a mesma linguagem do supabase-js — .from().select().eq() — mas executa SQL
// direto no Postgres, dentro do schema do município.
//
// Por que um adaptador e não reescrever os services: o código usa uma fatia pequena e regular do
// supabase-js (select/insert/update/upsert/delete, eq/in/gte/lte, order, single/maybeSingle,
// rpc). Traduzir isso num ponto só é bem menos arriscado do que reescrever 100 chamadas
// espalhadas por 22 arquivos, e deixa o comportamento — inclusive o PGRST116 que o desembrulhar
// traduz em 404 — definido em um lugar auditável.

export interface ErroDados {
  code?: string;
  message: string;
}

// O genérico cai para `any` quando não informado, igual ao supabase-js sem tipos gerados: o
// banco devolve linha solta e é o service que diz o formato. Trocar por `unknown` obrigaria a
// anotar as ~100 chamadas existentes sem ganhar segurança real — o tipo continuaria sendo uma
// afirmação nossa, não uma verificação.
/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Resultado<T = any> {
  data: T | null;
  error: ErroDados | null;
}

/** Nome de tabela/coluna nunca vem do usuário, mas interpolar identificador em SQL sem conferir
 *  é o tipo de atalho que vira injeção quando alguém reaproveitar isto num filtro dinâmico. */
function identificador(nome: string): string {
  if (!/^[a-z_][a-z0-9_]*$/i.test(nome)) throw new Error(`identificador inválido: ${nome}`);
  return `"${nome}"`;
}

function listaDeColunas(colunas: string): string {
  const limpo = colunas.trim();
  if (limpo === '' || limpo === '*') return '*';
  return limpo
    .split(',')
    .map((c) => identificador(c.trim()))
    .join(', ');
}

type Modo = 'select' | 'insert' | 'update' | 'upsert' | 'delete';

type Condicao =
  | { fragmento: string; valor: unknown }
  | { tipo: 'in'; coluna: string; valores: unknown[] };

export class Consulta<T = any> implements PromiseLike<Resultado<T>> {
  private modo: Modo = 'select';
  private colunas = '*';
  private valores: Record<string, unknown>[] = [];
  private condicoes: Condicao[] = [];
  private ordenacoes: string[] = [];
  private limite?: number;
  private unico: 'nao' | 'single' | 'maybeSingle' = 'nao';
  /** insert/update só devolvem linhas se .select() for chamado depois, como no supabase-js. */
  private comRetorno = false;
  private conflito?: string;

  constructor(
    private readonly executar: (sql: string, params: unknown[]) => Promise<{ rows: unknown[] }>,
    private readonly tabela: string,
  ) {}

  select(colunas = '*'): this {
    this.colunas = colunas;
    if (this.modo !== 'select') this.comRetorno = true;
    return this;
  }

  insert(valores: Record<string, unknown> | Record<string, unknown>[]): this {
    this.modo = 'insert';
    this.valores = Array.isArray(valores) ? valores : [valores];
    return this;
  }

  upsert(valores: Record<string, unknown> | Record<string, unknown>[], opcoes?: { onConflict?: string }): this {
    this.modo = 'upsert';
    this.valores = Array.isArray(valores) ? valores : [valores];
    this.conflito = opcoes?.onConflict;
    return this;
  }

  update(valores: Record<string, unknown>): this {
    this.modo = 'update';
    this.valores = [valores];
    return this;
  }

  delete(): this {
    this.modo = 'delete';
    return this;
  }

  eq(coluna: string, valor: unknown): this {
    this.condicoes.push({ fragmento: `${identificador(coluna)} = `, valor });
    return this;
  }

  neq(coluna: string, valor: unknown): this {
    this.condicoes.push({ fragmento: `${identificador(coluna)} <> `, valor });
    return this;
  }

  gte(coluna: string, valor: unknown): this {
    this.condicoes.push({ fragmento: `${identificador(coluna)} >= `, valor });
    return this;
  }

  lte(coluna: string, valor: unknown): this {
    this.condicoes.push({ fragmento: `${identificador(coluna)} <= `, valor });
    return this;
  }

  in(coluna: string, valores: unknown[]): this {
    // Um placeholder por valor, e não `= ANY($1)` com um array: o array viaja tipado como
    // text[], e contra coluna enum o Postgres recusa a comparação. Com placeholders soltos cada
    // valor chega sem tipo e é convertido para o tipo da coluna — igual ao que eq() já faz.
    this.condicoes.push({ tipo: 'in', coluna, valores });
    return this;
  }

  order(coluna: string, opcoes?: { ascending?: boolean }): this {
    const direcao = opcoes?.ascending === false ? 'DESC' : 'ASC';
    this.ordenacoes.push(`${identificador(coluna)} ${direcao}`);
    return this;
  }

  limit(quantidade: number): this {
    this.limite = quantidade;
    return this;
  }

  single(): this {
    this.unico = 'single';
    return this;
  }

  maybeSingle(): this {
    this.unico = 'maybeSingle';
    return this;
  }

  private montar(): { sql: string; params: unknown[] } {
    const params: unknown[] = [];
    const alvo = identificador(this.tabela);
    const onde = () => {
      if (!this.condicoes.length) return '';
      const partes = this.condicoes.map((c) => {
        if ('tipo' in c) {
          // Lista vazia: nenhuma linha casa. Sem isso viraria `IN ()`, que é erro de sintaxe.
          if (!c.valores.length) return 'FALSE';
          const marcadores = c.valores.map((valor) => {
            params.push(valor);
            return `$${params.length}`;
          });
          return `${identificador(c.coluna)} IN (${marcadores.join(', ')})`;
        }
        params.push(c.valor);
        return `${c.fragmento}$${params.length}`;
      });
      return ` WHERE ${partes.join(' AND ')}`;
    };
    const retorno = () => (this.comRetorno ? ` RETURNING ${listaDeColunas(this.colunas)}` : '');

    if (this.modo === 'select') {
      let sql = `SELECT ${listaDeColunas(this.colunas)} FROM ${alvo}${onde()}`;
      if (this.ordenacoes.length) sql += ` ORDER BY ${this.ordenacoes.join(', ')}`;
      if (this.limite != null) sql += ` LIMIT ${Number(this.limite)}`;
      return { sql, params };
    }

    if (this.modo === 'delete') {
      return { sql: `DELETE FROM ${alvo}${onde()}${retorno()}`, params };
    }

    if (this.modo === 'update') {
      const atribuicoes = Object.entries(this.valores[0]).map(([coluna, valor]) => {
        params.push(valor);
        return `${identificador(coluna)} = $${params.length}`;
      });
      if (!atribuicoes.length) throw new Error('update sem colunas');
      return { sql: `UPDATE ${alvo} SET ${atribuicoes.join(', ')}${onde()}${retorno()}`, params };
    }

    // insert / upsert: as linhas podem ter chaves diferentes entre si, então a lista de colunas
    // é a união de todas e o que faltar entra como DEFAULT.
    const colunas = [...new Set(this.valores.flatMap((v) => Object.keys(v)))];
    if (!colunas.length) throw new Error('insert sem colunas');
    const linhas = this.valores.map((linha) => {
      const celulas = colunas.map((coluna) => {
        if (!(coluna in linha)) return 'DEFAULT';
        params.push(linha[coluna]);
        return `$${params.length}`;
      });
      return `(${celulas.join(', ')})`;
    });
    let sql = `INSERT INTO ${alvo} (${colunas.map(identificador).join(', ')}) VALUES ${linhas.join(', ')}`;
    if (this.modo === 'upsert') {
      const chave = (this.conflito ?? 'id').split(',').map((c) => identificador(c.trim())).join(', ');
      const atualiza = colunas
        .filter((c) => !(this.conflito ?? 'id').split(',').map((x) => x.trim()).includes(c))
        .map((c) => `${identificador(c)} = EXCLUDED.${identificador(c)}`);
      sql += atualiza.length
        ? ` ON CONFLICT (${chave}) DO UPDATE SET ${atualiza.join(', ')}`
        : ` ON CONFLICT (${chave}) DO NOTHING`;
    }
    return { sql: sql + retorno(), params };
  }

  async then<R1 = Resultado<T>, R2 = never>(
    aoResolver?: ((valor: Resultado<T>) => R1 | PromiseLike<R1>) | null,
    aoRejeitar?: ((motivo: unknown) => R2 | PromiseLike<R2>) | null,
  ): Promise<R1 | R2> {
    try {
      const { sql, params } = this.montar();
      const { rows } = await this.executar(sql, params);

      if (this.unico === 'nao') {
        return Promise.resolve(aoResolver!({ data: rows as T, error: null }));
      }
      if (rows.length === 1) {
        return Promise.resolve(aoResolver!({ data: rows[0] as T, error: null }));
      }
      if (rows.length === 0 && this.unico === 'maybeSingle') {
        return Promise.resolve(aoResolver!({ data: null, error: null }));
      }
      // PGRST116 é o código que o desembrulhar() traduz em 404 — manter o mesmo contrato evita
      // mexer no tratamento de erro de todos os services.
      return Promise.resolve(
        aoResolver!({
          data: null,
          error: { code: 'PGRST116', message: `esperada 1 linha, vieram ${rows.length}` },
        }),
      );
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : String(erro);
      const codigo = (erro as { code?: string })?.code;
      return Promise.resolve(aoResolver!({ data: null, error: { code: codigo, message: mensagem } }));
    }
  }
}

export interface ClienteDados {
  from<T = any>(tabela: string): Consulta<T>;
  rpc<T = any>(funcao: string, parametros?: Record<string, unknown>): Promise<Resultado<T>>;
}

export function criarClienteDados(
  executar: (sql: string, params: unknown[]) => Promise<{ rows: unknown[] }>,
): ClienteDados {
  return {
    from: <T>(tabela: string) => new Consulta<T>(executar, tabela),
    rpc: async <T>(funcao: string, parametros: Record<string, unknown> = {}) => {
      try {
        const nomes = Object.keys(parametros);
        const argumentos = nomes.map((nome, i) => `${identificador(nome)} => $${i + 1}`).join(', ');
        const { rows } = await executar(
          `SELECT ${identificador(funcao)}(${argumentos}) AS resultado`,
          nomes.map((n) => parametros[n]),
        );
        const primeira = rows[0] as { resultado: T } | undefined;
        return { data: (primeira?.resultado ?? null) as T, error: null };
      } catch (erro) {
        const mensagem = erro instanceof Error ? erro.message : String(erro);
        return { data: null, error: { code: (erro as { code?: string })?.code, message: mensagem } };
      }
    },
  };
}

/** Usado só nos testes do adaptador: expõe o SQL montado sem tocar no banco. */
export function sqlDe<T>(consulta: Consulta<T>): { sql: string; params: unknown[] } {
  return (consulta as unknown as { montar(): { sql: string; params: unknown[] } }).montar();
}
