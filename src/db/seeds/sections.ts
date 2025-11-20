import { db } from '@/db';
import { sections } from '@/db/schema';

async function main() {
    const currentTimestamp = new Date().toISOString();
    
    const sampleSections = [
        // Mart 1 (City Mall) - 5 sections
        {
            martId: 1,
            name: 'Billing Counter',
            manpowerRequired: 4,
            description: 'Main billing and checkout area',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            martId: 1,
            name: 'Customer Support',
            manpowerRequired: 2,
            description: 'Customer service and query resolution',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            martId: 1,
            name: 'Electronics Section',
            manpowerRequired: 3,
            description: 'Electronics department assistance',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            martId: 1,
            name: 'Groceries Section',
            manpowerRequired: 3,
            description: 'Grocery and fresh produce area',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            martId: 1,
            name: 'Home Essentials',
            manpowerRequired: 2,
            description: 'Home and lifestyle products',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        
        // Mart 2 (Tech Bazaar) - 4 sections
        {
            martId: 2,
            name: 'Billing Counter',
            manpowerRequired: 3,
            description: 'Checkout and payment processing',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            martId: 2,
            name: 'Product Demo',
            manpowerRequired: 2,
            description: 'Product demonstrations and trials',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            martId: 2,
            name: 'Customer Support',
            manpowerRequired: 2,
            description: 'Technical support and queries',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            martId: 2,
            name: 'Mobile & Accessories',
            manpowerRequired: 2,
            description: 'Mobile phones and accessories section',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        
        // Mart 3 (Daily Needs Supermarket) - 3 sections
        {
            martId: 3,
            name: 'Billing Counter',
            manpowerRequired: 2,
            description: 'Checkout counter',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            martId: 3,
            name: 'Groceries Section',
            manpowerRequired: 2,
            description: 'Fresh produce and groceries',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            martId: 3,
            name: 'Customer Support',
            manpowerRequired: 1,
            description: 'Customer assistance',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        
        // Mart 4 (Home Decor Paradise) - 5 sections
        {
            martId: 4,
            name: 'Billing Counter',
            manpowerRequired: 3,
            description: 'Payment and billing',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            martId: 4,
            name: 'Furniture Section',
            manpowerRequired: 3,
            description: 'Furniture display and assistance',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            martId: 4,
            name: 'Home Decor',
            manpowerRequired: 2,
            description: 'Decorative items section',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            martId: 4,
            name: 'Kitchen & Dining',
            manpowerRequired: 2,
            description: 'Kitchenware and dining products',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            martId: 4,
            name: 'Customer Support',
            manpowerRequired: 2,
            description: 'Customer service desk',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        
        // Mart 5 (Green Valley Mall) - 4 sections
        {
            martId: 5,
            name: 'Billing Counter',
            manpowerRequired: 3,
            description: 'Central checkout area',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            martId: 5,
            name: 'Food Court',
            manpowerRequired: 4,
            description: 'Food court management',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            martId: 5,
            name: 'Retail Section',
            manpowerRequired: 2,
            description: 'General retail assistance',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            martId: 5,
            name: 'Customer Support',
            manpowerRequired: 2,
            description: 'Information and assistance',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        
        // Mart 6 (Quick Mart Express) - 3 sections
        {
            martId: 6,
            name: 'Billing Counter',
            manpowerRequired: 2,
            description: 'Fast checkout',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            martId: 6,
            name: 'Groceries Section',
            manpowerRequired: 2,
            description: 'Grocery assistance',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            martId: 6,
            name: 'Customer Support',
            manpowerRequired: 1,
            description: 'Quick customer support',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        
        // Mart 7 (Electronics Hub) - 3 sections
        {
            martId: 7,
            name: 'Billing Counter',
            manpowerRequired: 2,
            description: 'Billing and checkout',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            martId: 7,
            name: 'Electronics Section',
            manpowerRequired: 2,
            description: 'Electronics display area',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            martId: 7,
            name: 'Customer Support',
            manpowerRequired: 1,
            description: 'Technical assistance',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        
        // Mart 8 (Grand Hypermarket) - 5 sections
        {
            martId: 8,
            name: 'Billing Counter',
            manpowerRequired: 5,
            description: 'Multiple checkout lanes',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            martId: 8,
            name: 'Groceries Section',
            manpowerRequired: 4,
            description: 'Extensive grocery section',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            martId: 8,
            name: 'Electronics Section',
            manpowerRequired: 3,
            description: 'Electronics department',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            martId: 8,
            name: 'Home Essentials',
            manpowerRequired: 3,
            description: 'Home products section',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
        {
            martId: 8,
            name: 'Customer Support',
            manpowerRequired: 2,
            description: 'Central customer service',
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        },
    ];

    await db.insert(sections).values(sampleSections);
    
    console.log('✅ Sections seeder completed successfully - Created 32 sections across 8 marts');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});