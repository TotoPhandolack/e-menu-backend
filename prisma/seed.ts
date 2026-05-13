import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seeding...');

  // Delete existing data
  console.log('🗑️  Cleaning up existing data...');
  await prisma.orderItem.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.table.deleteMany();
  await prisma.category.deleteMany();
  await prisma.restaurant.deleteMany();

  // Create restaurant
  console.log('🏪 Creating restaurant...');
  const restaurant = await prisma.restaurant.create({
    data: {
      name: 'The Italian Corner',
      address: '123 Main Street, Bangkok, Thailand',
      latitude: 13.736666,
      longitude: 100.523333,
      radius_meters: 2000,
      vat_rate: 7,
      service_charge_rate: 0,
    },
  });
  console.log(`✅ Created restaurant: ${restaurant.name}`);

  // Create categories
  console.log('📁 Creating categories...');
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        restaurant_id: restaurant.id,
        name: 'Breakfast',
        sort_order: 1,
      },
    }),
    prisma.category.create({
      data: {
        restaurant_id: restaurant.id,
        name: 'Lunch',
        sort_order: 2,
      },
    }),
    prisma.category.create({
      data: {
        restaurant_id: restaurant.id,
        name: 'Dinner',
        sort_order: 3,
      },
    }),
  ]);
  console.log(`✅ Created ${categories.length} categories`);

  // Create menu items
  console.log('🍽️  Creating menu items...');
  const breakfastItems = [
    {
      name: 'Breakfast1 - Pancakes',
      description: 'Fluffy pancakes with maple syrup',
      price: 6.99,
    },
    {
      name: 'Breakfast2 - Omelet',
      description: 'Three-egg omelet with cheese',
      price: 7.99,
    },
    {
      name: 'Breakfast3 - French Toast',
      description: 'Golden crispy French toast',
      price: 7.49,
    },
    {
      name: 'Breakfast4 - Bagel',
      description: 'Fresh bagel with cream cheese',
      price: 5.99,
    },
    {
      name: 'Breakfast5 - Cereal',
      description: 'Mixed cereal bowl with milk',
      price: 4.99,
    },
    {
      name: 'Breakfast6 - Yogurt Parfait',
      description: 'Yogurt with granola and berries',
      price: 6.49,
    },
    {
      name: 'Breakfast7 - Eggs Benedict',
      description: 'Poached eggs with hollandaise',
      price: 8.99,
    },
    {
      name: 'Breakfast8 - Smoothie Bowl',
      description: 'Acai smoothie with toppings',
      price: 7.99,
    },
    {
      name: 'Breakfast9 - Bacon Avocado Toast',
      description: 'Toasted bread with bacon and avocado',
      price: 8.49,
    },
    {
      name: 'Breakfast10 - Granola Bowl',
      description: 'Granola with honey and nuts',
      price: 5.99,
    },
  ];

  const lunchItems = [
    {
      name: 'Lunch1 - Caesar Salad',
      description: 'Fresh romaine with Caesar dressing',
      price: 8.99,
    },
    {
      name: 'Lunch2 - Margherita Pasta',
      description: 'Classic pasta with tomato and basil',
      price: 9.99,
    },
    {
      name: 'Lunch3 - Grilled Chicken',
      description: 'Grilled chicken breast with vegetables',
      price: 10.99,
    },
    {
      name: 'Lunch4 - Fish Tacos',
      description: 'Three tacos with grilled fish',
      price: 9.49,
    },
    {
      name: 'Lunch5 - Quinoa Bowl',
      description: 'Nutritious quinoa with roasted veggies',
      price: 8.49,
    },
    {
      name: 'Lunch6 - Beef Burger',
      description: 'Juicy beef burger with fries',
      price: 9.99,
    },
    {
      name: 'Lunch7 - Pad Thai',
      description: 'Traditional Thai noodles',
      price: 8.99,
    },
    {
      name: 'Lunch8 - Caprese Sandwich',
      description: 'Mozzarella, tomato, basil sandwich',
      price: 7.99,
    },
    {
      name: 'Lunch9 - Chicken Curry',
      description: 'Creamy chicken curry rice',
      price: 9.49,
    },
    {
      name: 'Lunch10 - Vegetable Stir Fry',
      description: 'Mixed vegetables in wok',
      price: 7.99,
    },
  ];

  const dinnerItems = [
    {
      name: 'Dinner1 - Ribeye Steak',
      description: 'Prime cut ribeye with sauce',
      price: 24.99,
    },
    {
      name: 'Dinner2 - Salmon Fillet',
      description: 'Grilled salmon with lemon butter',
      price: 19.99,
    },
    {
      name: 'Dinner3 - Lobster Tail',
      description: 'Buttered lobster tail',
      price: 28.99,
    },
    {
      name: 'Dinner4 - Truffle Risotto',
      description: 'Creamy risotto with truffle oil',
      price: 18.99,
    },
    {
      name: 'Dinner5 - Duck Confit',
      description: 'Slow-cooked duck leg',
      price: 21.99,
    },
    {
      name: 'Dinner6 - Lamb Chops',
      description: 'Herb-crusted lamb chops',
      price: 23.99,
    },
    {
      name: 'Dinner7 - Seafood Paella',
      description: 'Spanish paella with mixed seafood',
      price: 22.99,
    },
    {
      name: 'Dinner8 - Beef Wellington',
      description: 'Tender beef with pastry crust',
      price: 25.99,
    },
    {
      name: 'Dinner9 - Scallops',
      description: 'Pan-seared scallops with risotto',
      price: 24.99,
    },
    {
      name: 'Dinner10 - Vegetarian Wellington',
      description: 'Mushroom and lentil Wellington',
      price: 16.99,
    },
  ];

  const allMenuItems = [
    ...breakfastItems.map((item) => ({
      ...item,
      category_id: categories[0].id,
    })),
    ...lunchItems.map((item) => ({ ...item, category_id: categories[1].id })),
    ...dinnerItems.map((item) => ({ ...item, category_id: categories[2].id })),
  ];

  for (const item of allMenuItems) {
    await prisma.menuItem.create({
      data: {
        restaurant_id: restaurant.id,
        category_id: item.category_id,
        name: item.name,
        description: item.description,
        price: item.price,
        is_available: true,
      },
    });
  }
  console.log(`✅ Created ${allMenuItems.length} menu items`);

  // Create tables
  console.log('🪑 Creating tables...');
  const tableNumbers = Array.from(
    { length: 10 },
    (_, i) => `T${String(i + 1).padStart(2, '0')}`,
  );
  for (const tableNumber of tableNumbers) {
    await prisma.table.create({
      data: {
        restaurant_id: restaurant.id,
        table_number: tableNumber,
        qr_code_token: `qr_${tableNumber}_${Date.now()}`,
        capacity: 4,
        is_active: true,
        status: 'AVAILABLE',
      },
    });
  }
  console.log(`✅ Created ${tableNumbers.length} tables`);

  console.log('');
  console.log('✨ Database seeding completed successfully!');
  console.log(`📊 Summary:`);
  console.log(`   - 1 Restaurant`);
  console.log(`   - 3 Categories (Breakfast, Lunch, Dinner)`);
  console.log(`   - 30 Menu Items (10 per category)`);
  console.log(`   - 10 Tables (T01-T10)`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seeding error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
