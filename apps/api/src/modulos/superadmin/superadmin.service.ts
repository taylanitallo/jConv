import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { BancoService, ClienteMunicipio } from '../../banco/banco.service';

/** Mesma ordem de dependência usada na cópia inicial: pai antes de filho. */
const TABELAS_DE_NEGOCIO = [
  'configuracoes',
  'secretarias',
  'orgaos_concedentes',
  'secretarias_orgaos',
  'empresas_contratadas',
  'usuarios',
  'permissoes_usuario',
  'convenios',
  'observacoes_convenio',
  'aditivos',
  'medicoes',
  'repasses',
  'propostas',
  'cessoes_terreno',
  'limites_custeio',
  'documentos_anexos',
  'alertas',
];

export interface ResumoCliente extends ClienteMunicipio {
  criadoEm: string;
  migracoesAplicadas: number;
  usuarios: number;
  convenios: number;
}

@Injectable()
export class SuperadminService {
  private readonly logger = new Logger(SuperadminService.name);

  constructor(private readonly banco: BancoService) {}

  // ---------------------------------------------------------------- municípios

  async listarClientes(): Promise<ResumoCliente[]> {
    const clientes = await this.banco.consultarMestre<{
      id: string; slug: string; nome_municipio: string; uf: string; schema_nome: string;
      ativo: boolean; criado_em: string; migracoes: string;
    }>(`SELECT c.id, c.slug, c.nome_municipio, c.uf, c.schema_nome, c.ativo, c.criado_em,
               (SELECT count(*) FROM meta.migracoes_tenant m WHERE m.schema_nome = c.schema_nome) AS migracoes
          FROM public.clientes c
         ORDER BY c.nome_municipio`);

    // As contagens vêm de dentro de cada schema, uma consulta por município. São poucos e a tela
    // é de administração — não vale a pena uma view materializada para isto.
    return Promise.all(
      clientes.map(async (c) => {
        let usuarios = 0;
        let convenios = 0;
        try {
          await this.banco.executarComoDono(c.schema_nome, async (executar) => {
            usuarios = Number(((await executar('SELECT count(*)::int n FROM usuarios')).rows[0] as { n: number }).n);
            convenios = Number(((await executar('SELECT count(*)::int n FROM convenios')).rows[0] as { n: number }).n);
          });
        } catch (erro) {
          // Schema pendente de migration ainda não tem as tabelas: mostra zero em vez de derrubar
          // a listagem inteira por causa de um município.
          this.logger.warn(`não foi possível contar ${c.schema_nome}: ${(erro as Error).message}`);
        }

        return {
          id: c.id,
          slug: c.slug,
          nomeMunicipio: c.nome_municipio,
          uf: c.uf,
          schemaNome: c.schema_nome,
          ativo: c.ativo,
          criadoEm: c.criado_em,
          migracoesAplicadas: Number(c.migracoes),
          usuarios,
          convenios,
        };
      }),
    );
  }

  async criarCliente(dados: { slug: string; nomeMunicipio: string; uf: string }) {
    const slug = dados.slug.trim().toLowerCase();
    if (!/^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/.test(slug)) {
      throw new BadRequestException('Identificador inválido: use letras minúsculas, números e hífen');
    }
    const uf = dados.uf.trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(uf)) throw new BadRequestException('UF inválida');
    if (!dados.nomeMunicipio.trim()) throw new BadRequestException('Informe o nome do município');

    const jaExiste = await this.banco.consultarMestre('SELECT 1 FROM public.clientes WHERE slug = $1', [slug]);
    if (jaExiste.length) throw new ConflictException(`Já existe um município com o identificador "${slug}"`);

    const schemaNome = `mun_${slug.replace(/-/g, '_')}`;
    await this.banco.consultarMestre(
      'INSERT INTO public.clientes (slug, nome_municipio, uf, schema_nome) VALUES ($1, $2, $3, $4)',
      [slug, dados.nomeMunicipio.trim(), uf, schemaNome],
    );

    const aplicadas = await this.aplicarMigracoesTenant(schemaNome);
    this.banco.invalidarCache();
    return { slug, schemaNome, migracoesAplicadas: aplicadas };
  }

  async definirAtivo(slug: string, ativo: boolean) {
    const linhas = await this.banco.consultarMestre(
      'UPDATE public.clientes SET ativo = $2 WHERE slug = $1 RETURNING slug',
      [slug, ativo],
    );
    if (!linhas.length) throw new NotFoundException(`Município "${slug}" não encontrado`);
    // Sem isto o município continuaria atendendo requisições até o cache expirar.
    this.banco.invalidarCache(slug);
    return { slug, ativo };
  }

  /** Aplica em TODOS os municípios o que ainda faltar — é o "alterar o sistema para todos". */
  async migrarTodos() {
    const clientes = await this.banco.consultarMestre<{ slug: string; schema_nome: string }>(
      'SELECT slug, schema_nome FROM public.clientes ORDER BY slug',
    );
    const resultado = [];
    for (const cliente of clientes) {
      const aplicadas = await this.aplicarMigracoesTenant(cliente.schema_nome);
      resultado.push({ slug: cliente.slug, aplicadas });
    }
    return resultado;
  }

  // ---------------------------------------------------------------- usuários

  async listarUsuarios(slug: string) {
    const cliente = await this.banco.obterClientePorSlug(slug);
    return this.banco.executarComoDono(cliente.schemaNome, async (executar) => {
      const { rows } = await executar(
        `SELECT u.id, u.nome, u.email, u.ativo, u.criado_em,
                (SELECT count(*) FROM permissoes_usuario p
                  WHERE p.usuario_id = u.id AND p.nivel <> 'Nenhuma') AS modulos
           FROM usuarios u
          ORDER BY u.nome`,
      );
      return rows;
    });
  }

  async definirUsuarioAtivo(slug: string, usuarioId: string, ativo: boolean) {
    const cliente = await this.banco.obterClientePorSlug(slug);
    return this.banco.executarComoDono(cliente.schemaNome, async (executar) => {
      const { rows } = await executar('UPDATE usuarios SET ativo = $2 WHERE id = $1 RETURNING id, ativo', [
        usuarioId,
        ativo,
      ]);
      if (!rows.length) throw new NotFoundException('Usuário não encontrado neste município');
      return rows[0];
    });
  }

  // ---------------------------------------------------------------- acessos

  async listarAcessos(filtros: { slug?: string; dias?: number; limite?: number }) {
    const dias = Math.min(Math.max(filtros.dias ?? 30, 1), 365);
    const limite = Math.min(Math.max(filtros.limite ?? 200, 1), 1000);
    const condicoes = [`criado_em >= now() - ($1 || ' days')::interval`];
    const params: unknown[] = [String(dias)];
    if (filtros.slug) {
      params.push(filtros.slug);
      condicoes.push(`cliente_slug = $${params.length}`);
    }
    params.push(limite);

    return this.banco.consultarMestre(
      `SELECT id, email, usuario_id, cliente_slug, sucesso, motivo, ip, agente, criado_em
         FROM public.acessos
        WHERE ${condicoes.join(' AND ')}
        ORDER BY criado_em DESC
        LIMIT $${params.length}`,
      params,
    );
  }

  async resumoAcessos(dias = 30) {
    const janela = Math.min(Math.max(dias, 1), 365);
    return this.banco.consultarMestre(
      `SELECT cliente_slug,
              count(*) FILTER (WHERE sucesso) AS entradas,
              count(*) FILTER (WHERE NOT sucesso) AS falhas,
              count(DISTINCT email) FILTER (WHERE sucesso) AS usuarios_distintos,
              max(criado_em) AS ultimo_acesso
         FROM public.acessos
        WHERE criado_em >= now() - ($1 || ' days')::interval
        GROUP BY cliente_slug
        ORDER BY entradas DESC`,
      [String(janela)],
    );
  }

  // ---------------------------------------------------------------- backup

  /** Exporta os dados do município como JSON. Estrutura fica de fora: ela vem das migrations. */
  async gerarBackup(slug: string) {
    const cliente = await this.banco.obterClientePorSlug(slug);
    const tabelas: Record<string, unknown[]> = {};

    await this.banco.executarComoDono(cliente.schemaNome, async (executar) => {
      for (const tabela of TABELAS_DE_NEGOCIO) {
        const { rows } = await executar(`SELECT * FROM "${tabela}"`);
        tabelas[tabela] = rows;
      }
    });

    return {
      versao: 1,
      municipio: { slug: cliente.slug, nome: cliente.nomeMunicipio, uf: cliente.uf },
      geradoEm: new Date().toISOString(),
      totais: Object.fromEntries(Object.entries(tabelas).map(([t, linhas]) => [t, linhas.length])),
      tabelas,
    };
  }

  /**
   * Substitui os dados do município pelos do arquivo. Roda inteiro numa transação: ou o
   * município fica exatamente como no backup, ou não muda nada — não existe estado no meio.
   */
  async restaurarBackup(slug: string, backup: { versao?: number; tabelas?: Record<string, unknown[]> }) {
    if (backup?.versao !== 1 || !backup.tabelas) {
      throw new BadRequestException('Arquivo de backup inválido ou de versão não suportada');
    }
    const cliente = await this.banco.obterClientePorSlug(slug);
    const restaurado: Record<string, number> = {};

    await this.banco.executarComoDono(cliente.schemaNome, async (executar) => {
      // Triggers desligados: os dados já vêm prontos, e recalcular derivadas/auditoria em cima
      // deles reescreveria o que o backup guardou.
      await executar("SET LOCAL session_replication_role = 'replica'");

      // Ordem inversa para apagar: filho antes do pai.
      for (const tabela of [...TABELAS_DE_NEGOCIO].reverse()) {
        await executar(`DELETE FROM "${tabela}"`);
      }

      for (const tabela of TABELAS_DE_NEGOCIO) {
        const linhas = backup.tabelas![tabela] as Record<string, unknown>[] | undefined;
        restaurado[tabela] = 0;
        if (!linhas?.length) continue;

        const colunasValidas = new Set(
          (await executar(
            `SELECT a.attname FROM pg_attribute a
              WHERE a.attrelid = to_regclass($1) AND a.attnum > 0
                AND NOT a.attisdropped AND a.attgenerated = ''`,
            [`"${cliente.schemaNome}"."${tabela}"`],
          )).rows.map((r) => (r as { attname: string }).attname),
        );

        for (const linha of linhas) {
          const colunas = Object.keys(linha).filter((c) => colunasValidas.has(c));
          if (!colunas.length) continue;
          const marcadores = colunas.map((_, i) => `$${i + 1}`);
          await executar(
            `INSERT INTO "${tabela}" (${colunas.map((c) => `"${c}"`).join(', ')})
             OVERRIDING SYSTEM VALUE VALUES (${marcadores.join(', ')})`,
            colunas.map((c) => linha[c]),
          );
          restaurado[tabela] += 1;
        }
      }
    });

    this.logger.log(`backup restaurado em ${cliente.schemaNome}`);
    return { slug, restaurado };
  }

  // ---------------------------------------------------------------- interno

  /** Roda os arquivos de supabase/tenant que ainda não passaram por este schema. */
  private async aplicarMigracoesTenant(schemaNome: string): Promise<number> {
    const pasta = this.pastaDasMigracoesTenant();
    const arquivos = readdirSync(pasta).filter((n) => n.endsWith('.sql')).sort();

    const jaAplicadas = new Set(
      (
        await this.banco.consultarMestre<{ nome_arquivo: string }>(
          'SELECT nome_arquivo FROM meta.migracoes_tenant WHERE schema_nome = $1',
          [schemaNome],
        )
      ).map((l) => l.nome_arquivo),
    );

    const pendentes = arquivos.filter((a) => !jaAplicadas.has(a));
    if (!pendentes.length) return 0;

    await this.banco.executarComoDono(schemaNome, async (executar) => {
      await executar(`CREATE SCHEMA IF NOT EXISTS "${schemaNome}"`);
      await executar(`SET LOCAL search_path = "${schemaNome}", extensions`);
      // Corpos de função não são validados na criação: sem isto, uma função que chama outra
      // ainda não criada (a ordem é alfabética) se amarraria à homônima de public.
      await executar('SET LOCAL check_function_bodies = off');

      for (const arquivo of pendentes) {
        await executar(readFileSync(join(pasta, arquivo), 'utf8'));
        await executar(
          'INSERT INTO meta.migracoes_tenant (schema_nome, nome_arquivo) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [schemaNome, arquivo],
        );
      }

      // Reaplicado a cada rodada porque objetos novos nascem sem privilégio para o papel que a
      // API usa nas requisições de município.
      for (const papel of ['authenticated', 'service_role']) {
        await executar(`GRANT USAGE ON SCHEMA "${schemaNome}" TO ${papel}`);
        await executar(`GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA "${schemaNome}" TO ${papel}`);
        await executar(`GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA "${schemaNome}" TO ${papel}`);
        await executar(`GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA "${schemaNome}" TO ${papel}`);
      }
    });

    return pendentes.length;
  }

  /** O processo sobe da raiz do monorepo em produção e de apps/api em desenvolvimento. */
  private pastaDasMigracoesTenant(): string {
    const candidatos = [resolve(process.cwd(), 'supabase/tenant'), resolve(process.cwd(), '../../supabase/tenant')];
    let diretorio = __dirname;
    for (let i = 0; i < 8; i += 1) {
      candidatos.push(join(diretorio, 'supabase/tenant'));
      diretorio = dirname(diretorio);
    }
    const encontrado = candidatos.find((c) => existsSync(c));
    if (!encontrado) {
      throw new Error('Não encontrei supabase/tenant — sem os arquivos não dá para provisionar um município');
    }
    return encontrado;
  }
}
