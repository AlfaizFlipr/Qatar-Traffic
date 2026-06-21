import { connectDatabase, disconnectDatabase } from '../config/db';
import { violationService } from '../services/violation.service';
import { logger } from '../utils/logger';

/** Seeds a couple of sample inquiries so the DB has browsable data. */
async function run() {
  await connectDatabase();

  const samples = [
    { searchType: 'vehicle' as const, country: 'Qatar', plateType: 'Private', plateNumber: '123456' },
    { searchType: 'personal' as const, country: 'Qatar', personalNumber: '28412345678' },
    { searchType: 'establishment' as const, country: 'Qatar', establishmentId: '12-345-67' },
  ];

  for (const s of samples) {
    const result = await violationService.search(s);
    logger.info(`Seeded ${result.referenceId} -> ${result.totalCount} violations (QAR ${result.totalAmount})`);
  }

  await disconnectDatabase();
  process.exit(0);
}

run().catch((err) => {
  logger.error('Seed failed', err);
  process.exit(1);
});
