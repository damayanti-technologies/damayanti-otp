import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  // eslint-disable-next-line no-console
  console.log('🌱 Seeding Damayanti OTP database...');

  // 1. Create default Damayanti Applications
  const arroutApp = await prisma.application.upsert({
    where: { appId: 'damayanti_arrout' },
    update: {},
    create: {
      appId: 'damayanti_arrout',
      name: 'ARROUT Platform',
      description: 'Official authentication client for arrout.damayanticrest.online',
      allowedOrigins: JSON.stringify([
        'https://arrout.damayanticrest.online',
        'http://localhost:3000',
        'http://localhost:4000',
      ]),
      isEnabled: true,
      rateLimitPerMin: 60,
    },
  });

  // eslint-disable-next-line no-console
  console.log(`✅ Application configured: ${arroutApp.name} (${arroutApp.appId})`);

  // 2. Generate a seed API key for local development
  // Plaintext secret shown only once at seed time: dmy_live_secret_dev_key_arrout_2026
  const rawDevSecret = 'dmy_live_secret_dev_key_arrout_2026';
  const hashedSecret = await argon2.hash(rawDevSecret, { type: argon2.argon2id });

  const existingKey = await prisma.aPIKey.findFirst({
    where: { applicationId: arroutApp.id, name: 'Default Development Key' },
  });

  if (!existingKey) {
    await prisma.aPIKey.create({
      data: {
        applicationId: arroutApp.id,
        keyPrefix: 'dmy_live_',
        keyHash: hashedSecret,
        name: 'Default Development Key',
      },
    });
    // eslint-disable-next-line no-console
    console.log(`🔑 Seed API Key generated for ARROUT platform.`);
  }

  // 3. Log initial system seed event
  await prisma.auditLog.create({
    data: {
      actorType: 'SYSTEM',
      action: 'DATABASE_SEEDED',
      target: 'PRISMA_INIT',
      metadata: JSON.stringify({ environment: 'development', timestamp: new Date().toISOString() }),
    },
  });

  // eslint-disable-next-line no-console
  console.log('✅ Database seed completed successfully.');
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
