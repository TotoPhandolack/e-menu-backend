// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,       // ตัด field ที่ไม่ได้ประกาศใน DTO ออกอัตโนมัติ
      forbidNonWhitelisted: true, // ถ้าส่ง field แปลกมา จะ error เลย
      transform: true,       // แปลง type อัตโนมัติ เช่น string -> number
    }),
  );

  await app.listen(3000);
}
bootstrap();