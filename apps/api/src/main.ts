import 'reflect-metadata';
import cookieParser from 'cookie-parser';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ConfiguracaoService } from './configuracao/configuracao.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configuracao = app.get(ConfiguracaoService);

  // O padrão é 100 kB, e a restauração de backup manda o município inteiro num corpo só — com
  // 100 convênios isso já passa de 1 MB e voltava 413. O limite continua existindo de
  // propósito: sem ele, um corpo grande vira memória do processo.
  app.useBodyParser('json', { limit: '64mb' });
  app.use(cookieParser());
  app.enableCors({
    origin: configuracao.urlFrontend,
    credentials: true,
  });

  await app.listen(configuracao.porta);
}

bootstrap();
