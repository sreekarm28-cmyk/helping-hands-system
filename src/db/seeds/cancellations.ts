import { db } from '@/db';
import { cancellations } from '@/db/schema';

async function main() {
    const sampleCancellations = [
        {
            userId: 6,
            bookingId: 2,
            cancellationDate: '2025-01-16',
            createdAt: new Date('2025-01-16T10:30:00').toISOString(),
        },
        {
            userId: 9,
            bookingId: 5,
            cancellationDate: '2025-01-17',
            createdAt: new Date('2025-01-17T09:15:00').toISOString(),
        },
        {
            userId: 8,
            bookingId: 4,
            cancellationDate: '2025-01-17',
            createdAt: new Date('2025-01-17T14:45:00').toISOString(),
        },
        {
            userId: 12,
            bookingId: 16,
            cancellationDate: '2025-01-18',
            createdAt: new Date('2025-01-18T11:20:00').toISOString(),
        },
        {
            userId: 13,
            bookingId: 17,
            cancellationDate: '2025-01-19',
            createdAt: new Date('2025-01-19T16:00:00').toISOString(),
        },
    ];

    await db.insert(cancellations).values(sampleCancellations);
    
    console.log('✅ Cancellations seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});