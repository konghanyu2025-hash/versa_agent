import { PrismaClient } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting database connections due to hot reloading in Next.js/development
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Database notification helper for LISTEN/NOTIFY
export async function setupDatabaseNotifications(channel: string, callback: (payload: string) => void) {
  await prisma.$executeRaw`LISTEN ${channel}`;

  // Note: This requires a dedicated connection for notifications
  // In production, you'd want to use pg-notify or similar
}
