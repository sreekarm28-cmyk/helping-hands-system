import { db } from '@/db';
import { users } from '@/db/schema';
import bcrypt from 'bcrypt';

async function main() {
    const currentDate = new Date().toISOString();

    // Hash passwords
    const adminPassword = await bcrypt.hash('admin123', 10);
    const storePassword = await bcrypt.hash('store123', 10);
    const userPassword = await bcrypt.hash('user123', 10);

    const sampleUsers = [
        // Main Admin
        {
            email: 'admin@kollabhands.com',
            password: adminPassword,
            name: 'Main Admin',
            phone: '+91-9876543210',
            role: 'main_admin',
            hhpPoints: 0,
            createdAt: currentDate,
            updatedAt: currentDate,
        },
        // Store Admins
        {
            email: 'store1@kollabhands.com',
            password: storePassword,
            name: 'Store Admin 1',
            phone: '+91-9876543211',
            role: 'store_admin',
            hhpPoints: 0,
            createdAt: currentDate,
            updatedAt: currentDate,
        },
        {
            email: 'store2@kollabhands.com',
            password: storePassword,
            name: 'Store Admin 2',
            phone: '+91-9876543212',
            role: 'store_admin',
            hhpPoints: 0,
            createdAt: currentDate,
            updatedAt: currentDate,
        },
        {
            email: 'store3@kollabhands.com',
            password: storePassword,
            name: 'Store Admin 3',
            phone: '+91-9876543213',
            role: 'store_admin',
            hhpPoints: 0,
            createdAt: currentDate,
            updatedAt: currentDate,
        },
        // End Users
        {
            email: 'user1@kollabhands.com',
            password: userPassword,
            name: 'User One',
            phone: '+91-9876543220',
            role: 'end_user',
            hhpPoints: 0,
            createdAt: currentDate,
            updatedAt: currentDate,
        },
        {
            email: 'user2@kollabhands.com',
            password: userPassword,
            name: 'User Two',
            phone: '+91-9876543221',
            role: 'end_user',
            hhpPoints: 50,
            createdAt: currentDate,
            updatedAt: currentDate,
        },
        {
            email: 'user3@kollabhands.com',
            password: userPassword,
            name: 'User Three',
            phone: '+91-9876543222',
            role: 'end_user',
            hhpPoints: 120,
            createdAt: currentDate,
            updatedAt: currentDate,
        },
        {
            email: 'user4@kollabhands.com',
            password: userPassword,
            name: 'User Four',
            phone: '+91-9876543223',
            role: 'end_user',
            hhpPoints: 200,
            createdAt: currentDate,
            updatedAt: currentDate,
        },
        {
            email: 'user5@kollabhands.com',
            password: userPassword,
            name: 'User Five',
            phone: '+91-9876543224',
            role: 'end_user',
            hhpPoints: 350,
            createdAt: currentDate,
            updatedAt: currentDate,
        },
        {
            email: 'user6@kollabhands.com',
            password: userPassword,
            name: 'User Six',
            phone: '+91-9876543225',
            role: 'end_user',
            hhpPoints: 75,
            createdAt: currentDate,
            updatedAt: currentDate,
        },
        {
            email: 'user7@kollabhands.com',
            password: userPassword,
            name: 'User Seven',
            phone: '+91-9876543226',
            role: 'end_user',
            hhpPoints: 180,
            createdAt: currentDate,
            updatedAt: currentDate,
        },
        {
            email: 'user8@kollabhands.com',
            password: userPassword,
            name: 'User Eight',
            phone: '+91-9876543227',
            role: 'end_user',
            hhpPoints: 420,
            createdAt: currentDate,
            updatedAt: currentDate,
        },
        {
            email: 'user9@kollabhands.com',
            password: userPassword,
            name: 'User Nine',
            phone: '+91-9876543228',
            role: 'end_user',
            hhpPoints: 250,
            createdAt: currentDate,
            updatedAt: currentDate,
        },
        {
            email: 'user10@kollabhands.com',
            password: userPassword,
            name: 'User Ten',
            phone: '+91-9876543229',
            role: 'end_user',
            hhpPoints: 480,
            createdAt: currentDate,
            updatedAt: currentDate,
        },
    ];

    await db.insert(users).values(sampleUsers);
    
    console.log('✅ Users seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});