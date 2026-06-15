# AGENT.md — Emenu Backend

## Project Overview

**Emenu** is an online food ordering system for restaurants. This repository is the **backend API only**, built with NestJS. It handles authentication, menu management, order processing, QR code generation, and realtime updates via Socket.io.

---

## Tech Stack

| Layer     | Technology                       |
| --------- | -------------------------------- |
| Framework | NestJS 11                        |
| Language  | TypeScript                       |
| ORM       | Prisma 7                         |
| Database  | PostgreSQL (Neon serverless)     |
| Auth      | JWT + Passport.js                |
| Realtime  | Socket.io (`@nestjs/websockets`) |
| QR Code   | `qrcode`                         |
| Deploy    | Vercel                           |

---

## Folder Structure

```
src/
├── main.ts                 # Entry point
├── app.module.ts           # Root module
└── [feature]/              # Feature modules (e.g. auth, menu, order)
    ├── [feature].module.ts
    ├── [feature].controller.ts
    ├── [feature].service.ts
    ├── [feature].gateway.ts   # Socket.io gateway (if realtime)
    └── dto/
        └── [action]-[feature].dto.ts
```

---

## Environment Variables

```env
DATABASE_URL="postgresql://..."   # Neon PostgreSQL connection string
FRONTEND_URL=http://localhost:3001
JWT_SECRET=your-super-secret-key-change-this
```

- Never hardcode secrets or database URLs
- `FRONTEND_URL` is used for CORS configuration

---

## Database (Prisma)

- Prisma client is generated into `generated/prisma/` (not the default location)
- Always run `npx prisma generate` before building
- After schema changes, run migrations: `npx prisma migrate dev`
- Seed data: `npm run prisma:seed` (uses `prisma/seed.ts`)

```ts
// Import Prisma client from generated path
import { PrismaClient } from '../../generated/prisma';
```

**Build note:** The `build` script copies the generated Prisma client to `dist/` automatically — don't manually copy.

---

## Auth (JWT + Passport)

- Uses `@nestjs/jwt` + `passport-jwt`
- JWT secret is from `JWT_SECRET` env variable
- Passwords are hashed with `bcrypt`
- Protect routes with `@UseGuards(JwtAuthGuard)`

```ts
@UseGuards(JwtAuthGuard)
@Get('profile')
getProfile(@Request() req) {
  return req.user;
}
```

---

## Realtime (Socket.io)

Uses `@nestjs/websockets` with `@nestjs/platform-socket.io`. Create gateways for realtime features:

```ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: { origin: process.env.FRONTEND_URL } })
export class OrderGateway {
  @WebSocketServer()
  server: Server;

  notifyOrder(data: any) {
    this.server.emit('orderUpdate', data);
  }
}
```

---

## Validation (DTOs)

Use `class-validator` + `class-transformer` for all DTOs:

```ts
import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateMenuDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  price: number;
}
```

Enable global validation pipe in `main.ts`:

```ts
app.useGlobalPipes(new ValidationPipe({ transform: true }));
```

---

## QR Code

Uses the `qrcode` package to generate QR codes (e.g. per table):

```ts
import * as QRCode from 'qrcode';

const qrDataUrl = await QRCode.toDataURL(
  `${process.env.FRONTEND_URL}/table/${tableId}`,
);
```

---

## Naming Conventions

Use **camelCase** for all files, variables, and functions. NestJS module/class names use **PascalCase** (standard NestJS convention).

```ts
// ✅ Files — camelCase
orderService.ts;
createOrderDto.ts;
orderGateway.ts;

// ✅ Classes — PascalCase (NestJS standard)
export class OrderService {}
export class CreateOrderDto {}
```

---

## Deploy (Vercel)

- Use `npm run vercel-build` for Vercel deployment (runs `prisma generate` + `nest build` + copies Prisma client)
- Entry point: `dist/src/main`
- Database: Neon PostgreSQL (serverless) via `@prisma/adapter-neon`

---

## Language

**Primary UI-facing language is Lao (ພາສາລາວ).** Error messages and responses that are shown to end users should be in Lao.

```ts
// ✅ Correct
throw new BadRequestException('ບໍ່ພົບລາຍການອາຫານ');

// ❌ Wrong
throw new BadRequestException('Menu item not found');
```
