import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: true }); // en desarrollo permite cualquier origen; en prod restringir
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
