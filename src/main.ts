// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { INestApplication } from '@nestjs/common';
import { IncomingMessage, ServerResponse } from 'http';
import { join } from 'path';

let cachedApp: INestApplication;

async function createApp(): Promise<INestApplication> {
  if (cachedApp) return cachedApp;

  const expressApp = express();
  expressApp.use('/uploads', express.static(join(process.cwd(), 'uploads')));
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));

  app.enableCors({
    // Allow all origins (true allows reflection of request origin) or specify domains
    origin: true,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.init();
  cachedApp = app;
  return app;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  // --- แก้ไขจุดที่ 2: จัดการ Preflight Request (OPTIONS) ---
  // บางครั้ง Serverless Handler อาจจะบล็อกคำขอ OPTIONS จากเบราว์เซอร์
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.statusCode = 204;
    res.end();
    return;
  }

  const app = await createApp();
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp(req, res);
}

if (process.env.NODE_ENV !== 'production') {
  createApp().then(async (app) => {
    const port = process.env.PORT || 3003;
    await app.listen(port);
    console.log(`🚀 Server running on http://localhost:${port}`);
  });
}