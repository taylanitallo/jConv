import { Injectable, Logger, NotFoundException, OnModuleDestroy } from '@nestjs/common';
import { Pool, PoolClient, types } from 'pg';
import { ConfiguracaoService } from '../configuracao/configuracao.service';
import { ClienteDados, criarClienteDados } from './cliente-dados';

// O supabase-js entregava JSON: número era número e data era texto ISO. O driver pg tem outros
// padrões — numeric/int8 vêm como string (para não perder precisão) e date/timestamp viram
// objeto Date. Sem alinhar isso, um `valorA + valorB` que somava passa a concatenar texto, e as
// comparações de vigência, que são feitas com strings 'AAAA-MM-DD', param de casar.
//
// Fica junto do pool porque vale para o processo inteiro: são parsers globais do driver.
const OID_INT8 = 20;
const OID_NUMERIC = 1700;
const OID_DATE = 1082;
const OID_TIMESTAMP = 1114;
const OID_TIMESTAMPTZ = 1184;

types.setTypeParser(OID_INT8, (valor) => Number(valor));
types.setTypeParser(OID_NUMERIC, (valor) => Number(valor));
// Data pura fica como veio ('2026-01-15'): é assim que o resto do código a compara e formata.
types.setTypeParser(OID_DATE, (valor) => valor);
types.setTypeParser(OID_TIMESTAMP, (valor) => new Date(valor + 'Z').toISOString());
types.setTypeParser(OID_TIMESTAMPTZ, (valor) => new Date(valor).toISOString());

export interface ClienteMunicipio {
  id: string;
  slug: string;
  nomeMunicipio: string;
  uf: string;
  schemaNome: string;
  ativo: boolean;
}

/** Conexão já preparada para um município e um usuário: tudo que rodar nela passa pela RLS. */
export interface SessaoTenant {
  cliente: ClienteDados;
  /** Chamado pelo AutenticacaoGuard depois de validar o cookie: é o que faz auth.uid() responder
   *  dentro das policies. Antes disso a conexão já opera como 'authenticated' sem usuário, ou
   *  seja, negando tudo — o padrão seguro. */
  autenticarComo(usuarioId: string): Promise<void>;
  encerrar(sucesso: boolean): Promise<void>;
}

@Injectable()
export class BancoService implements OnModuleDestroy {
  private readonly logger = new Logger(BancoService.name);
  private readonly pool: Pool;
  /** slug -> cliente. O cadastro muda raramente e é consultado a cada requisição. */
  private readonly cache = new Map<string, ClienteMunicipio>();

  constructor(configuracao: ConfiguracaoService) {
    this.pool = new Pool({
      connectionString: configuracao.urlBancoDados,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });
    this.pool.on('error', (erro) => this.logger.error(`erro no pool: ${erro.message}`));
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  /** Consulta no schema mestre (cadastro de clientes). Não passa por RLS de município. */
  async consultarMestre<T = unknown>(sql: string, params: unknown[] = []): Promise<T[]> {
    const { rows } = await this.pool.query(sql, params);
    return rows as T[];
  }

  async obterClientePorSlug(slug: string): Promise<ClienteMunicipio> {
    const emCache = this.cache.get(slug);
    if (emCache) return emCache;

    const linhas = await this.consultarMestre<{
      id: string; slug: string; nome_municipio: string; uf: string; schema_nome: string; ativo: boolean;
    }>('SELECT id, slug, nome_municipio, uf, schema_nome, ativo FROM public.clientes WHERE slug = $1', [slug]);

    const linha = linhas[0];
    if (!linha) throw new NotFoundException(`Município "${slug}" não encontrado`);
    if (!linha.ativo) throw new NotFoundException(`Município "${slug}" está inativo`);

    const cliente: ClienteMunicipio = {
      id: linha.id,
      slug: linha.slug,
      nomeMunicipio: linha.nome_municipio,
      uf: linha.uf,
      schemaNome: linha.schema_nome,
      ativo: linha.ativo,
    };
    this.cache.set(slug, cliente);
    return cliente;
  }

  invalidarCache(slug?: string) {
    if (slug) this.cache.delete(slug);
    else this.cache.clear();
  }

  // Abre uma transação por requisição. É o equivalente do que o supabase-js fazia por baixo:
  // atuar como o usuário autenticado, com a RLS decidindo o que ele enxerga. A diferença é que
  // aqui o schema do município entra explicitamente no search_path.
  async abrirSessao(schemaNome: string): Promise<SessaoTenant> {
    const conexao: PoolClient = await this.pool.connect();
    try {
      await conexao.query('BEGIN');

      // Troca de papel logo na abertura: a conexão nunca roda consulta de negócio com
      // privilégio de dono, nem por engano numa rota que esqueça o guard. Sem claims,
      // auth.uid() é nulo e a RLS nega tudo — quem libera é o autenticarComo() adiante.
      await conexao.query('SET LOCAL ROLE authenticated');

      // "public" fica de fora de propósito: com ele no caminho, uma tabela ausente no schema do
      // município resolveria para a homônima do mestre — vazamento silencioso entre clientes,
      // em vez de erro. "extensions" entra porque é onde vivem uuid_generate_v4 e afins.
      await conexao.query(`SET LOCAL search_path = "${this.validarSchema(schemaNome)}", extensions`);
    } catch (erro) {
      conexao.release();
      throw erro;
    }

    const cliente = criarClienteDados(async (sql, params) => conexao.query(sql, params));

    return {
      cliente,
      autenticarComo: async (usuarioId: string) => {
        await conexao.query(`SELECT set_config('request.jwt.claims', $1, true)`, [
          JSON.stringify({ sub: usuarioId, role: 'authenticated' }),
        ]);
      },
      encerrar: async (sucesso: boolean) => {
        try {
          await conexao.query(sucesso ? 'COMMIT' : 'ROLLBACK');
        } finally {
          // RESET antes de devolver ao pool: sem isso a próxima requisição herdaria o papel e o
          // schema desta, e passaria a ler o município errado.
          await conexao.query('RESET ROLE').catch(() => undefined);
          conexao.release();
        }
      },
    };
  }

  /**
   * Roda no schema de um município SEM trocar de papel — ou seja, por cima da RLS.
   *
   * É o que o superadmin precisa (listar usuários de qualquer prefeitura, tirar backup,
   * restaurar) e é exatamente o que nenhuma rota de município pode alcançar. Só o
   * SuperadminGuard abre esta porta; tudo mais passa por abrirSessao().
   */
  async executarComoDono<T>(
    schemaNome: string,
    tarefa: (executar: (sql: string, params?: unknown[]) => Promise<{ rows: unknown[] }>) => Promise<T>,
  ): Promise<T> {
    const conexao = await this.pool.connect();
    try {
      await conexao.query('BEGIN');
      await conexao.query(`SET LOCAL search_path = "${this.validarSchema(schemaNome)}", extensions`);
      const resultado = await tarefa((sql, params) => conexao.query(sql, params));
      await conexao.query('COMMIT');
      return resultado;
    } catch (erro) {
      await conexao.query('ROLLBACK').catch(() => undefined);
      throw erro;
    } finally {
      conexao.release();
    }
  }

  /** O nome vem do cadastro, não do usuário, mas é interpolado em SQL — confere assim mesmo. */
  private validarSchema(schema: string): string {
    if (!/^mun_[a-z0-9_]{1,50}$/.test(schema)) throw new Error(`schema inválido: ${schema}`);
    return schema;
  }
}
