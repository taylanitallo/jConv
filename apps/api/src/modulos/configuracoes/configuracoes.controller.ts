import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ClienteDados } from '../../banco/cliente-dados';
import { esquemaAtualizarConfiguracao } from '@jconv/compartilhado';
import { ConfiguracoesService } from './configuracoes.service';
import { AutenticacaoGuard } from '../../guardas/autenticacao.guard';
import { PermissoesGuard } from '../../guardas/permissoes.guard';
import { Permissao } from '../../comum/decoradores/permissao.decorator';
import { ClienteSupabase } from '../../comum/decoradores/cliente-supabase.decorator';
import { validarComEsquema } from '../../comum/validar';
import { paraCamelCase } from '../../comum/mapeadores';

@Controller('configuracoes')
@UseGuards(AutenticacaoGuard, PermissoesGuard)
export class ConfiguracoesController {
  constructor(private readonly service: ConfiguracoesService) {}

  // Leitura liberada a qualquer perfil: o nome do município e o layout dos relatórios são
  // usados em telas que todo mundo enxerga.
  @Get()
  async obter(@ClienteSupabase() cliente: ClienteDados) {
    return paraCamelCase(await this.service.obter(cliente));
  }

  @Patch()
  // A linha de configuração cobre as abas Gerais, Município e Layout: basta Total em uma
  // delas. A separação por aba é feita na tela.
  @Permissao(['ConfiguracoesGerais', 'ConfiguracoesMunicipio', 'ConfiguracoesLayout'], 'Total')
  async atualizar(@ClienteSupabase() cliente: ClienteDados, @Body() corpo: unknown) {
    const dados = validarComEsquema(esquemaAtualizarConfiguracao, corpo);
    return paraCamelCase(await this.service.atualizar(cliente, dados));
  }
}
