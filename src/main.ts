import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      'http://localhost:3001',
      'https://твой-домен.vercel.app'
    ],
    methods: ['GET', 'POST', 'DELETE'],
    credentials: true,
  });

  await app.listen(3000);
}
bootstrap();