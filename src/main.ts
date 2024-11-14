import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT ?? 8000;
  await app.listen(port);
  console.log(`Server is running on port http://localhost:${port}`)
}
bootstrap();

