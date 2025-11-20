import { db } from '@/db';
import { marts } from '@/db/schema';

async function main() {
    const sampleMarts = [
        {
            name: 'City Mall',
            type: 'mall',
            size: 'large',
            description: 'Large shopping mall with multiple retail outlets',
            address: 'MG Road, Bangalore, Karnataka 560001',
            latitude: 12.9716,
            longitude: 77.5946,
            storeAdminId: 2,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            name: 'Tech Bazaar',
            type: 'electronics',
            size: 'medium',
            description: 'Electronics and gadget superstore',
            address: 'Indiranagar, Bangalore, Karnataka 560038',
            latitude: 12.9719,
            longitude: 77.6412,
            storeAdminId: 3,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            name: 'Daily Needs Supermarket',
            type: 'supermarket',
            size: 'small',
            description: 'Neighborhood supermarket for daily essentials',
            address: 'Koramangala, Bangalore, Karnataka 560034',
            latitude: 12.9352,
            longitude: 77.6245,
            storeAdminId: 4,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            name: 'Home Decor Paradise',
            type: 'home_essentials',
            size: 'large',
            description: 'Complete home furnishing and decor store',
            address: 'Whitefield, Bangalore, Karnataka 560066',
            latitude: 12.9698,
            longitude: 77.7499,
            storeAdminId: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            name: 'Green Valley Mall',
            type: 'mall',
            size: 'medium',
            description: 'Mid-size shopping complex with food court',
            address: 'Jayanagar, Bangalore, Karnataka 560041',
            latitude: 12.9250,
            longitude: 77.5838,
            storeAdminId: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            name: 'Quick Mart Express',
            type: 'supermarket',
            size: 'small',
            description: 'Quick shopping for groceries and household items',
            address: 'HSR Layout, Bangalore, Karnataka 560102',
            latitude: 12.9121,
            longitude: 77.6446,
            storeAdminId: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            name: 'Electronics Hub',
            type: 'electronics',
            size: 'small',
            description: 'Budget electronics and mobile accessories',
            address: 'Marathahalli, Bangalore, Karnataka 560037',
            latitude: 12.9591,
            longitude: 77.6974,
            storeAdminId: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            name: 'Grand Hypermarket',
            type: 'other',
            size: 'large',
            description: 'One-stop hypermarket for all shopping needs',
            address: 'Rajajinagar, Bangalore, Karnataka 560010',
            latitude: 12.9899,
            longitude: 77.5544,
            storeAdminId: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
    ];

    await db.insert(marts).values(sampleMarts);
    
    console.log('✅ Marts seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});