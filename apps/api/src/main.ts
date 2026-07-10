import 'reflect-metadata';
import cookieParser from 'cookie-parser';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfiguracaoService } from './configuracao/configuracao.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configuracao = app.get(ConfiguracaoService);

  app.use(cookieParser());
  app.enableCors({
    origin: configuracao.urlFrontend,
    credentials: true,
  });

  await app.listen(configuracao.porta);
}

bootstrap();
