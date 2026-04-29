// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { INestApplication } from '@nestjs/common';
import { IncomingMessage, ServerResponse } from 'http';

// Cache the app instance across serverless invocations (warm starts)
let cachedApp: INestApplication;

async function createApp(): Promise<INestApplication> {
  if (cachedApp) return cachedApp;

  const expressApp = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
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

// Vercel serverless handler
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const app = await createApp();
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp(req, res);
}

// Local development: start a normal HTTP server
if (process.env.NODE_ENV !== 'production') {
  createApp().then(async (app) => {
    await app.listen(process.env.PORT || 3003);
    console.log(`Server running on http://localhost:${process.env.PORT || 3003}`);
  });
}
