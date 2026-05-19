import { Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';
import { PrismaClient } from '../../generated/prisma';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 3,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 60000,
      ssl: { rejectUnauthorized: false },
    });

    pool.on('error', (err) => {
      new Logger('PgPool').warn(`Idle client error: ${err.message}`);
    });

    const adapter = new PrismaPg(pool as any);
    super({ adapter });
  }
}
